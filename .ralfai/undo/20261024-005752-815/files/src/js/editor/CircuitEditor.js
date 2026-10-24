import { RaceConfig } from '../RaceConfig.js';

export class CircuitEditor {
  constructor() {
    this.svg=document.getElementById('map');this.selected=0;this.history=[];this.dirty=false;
    this.config=new RaceConfig();
    document.getElementById('track').onchange=()=>this.load();
    document.getElementById('fit').onclick=()=>this.fit();
    document.getElementById('undo').onclick=()=>this.undo();
    document.getElementById('apply').onclick=()=>this.apply();
    document.getElementById('download').onclick=()=>this.download();
    document.getElementById('open').onchange=e=>this.open(e.target.files[0]);
    document.getElementById('length').onchange=()=>{if(this.definition){this.dirty=true;this.render();}};
    document.getElementById('name').oninput=()=>{this.dirty=true;};
    this.svg.onpointerdown=e=>this.begin(e);
    this.svg.onpointermove=e=>this.move(e);
    this.svg.onpointerup=e=>this.end(e);
    this.svg.onpointercancel=e=>this.end(e);
    this.svg.onkeydown=e=>this.key(e);
    window.addEventListener('beforeunload',e=>{if(this.dirty){e.preventDefault();e.returnValue='';}});
    this.initialize();
  }
  message(text){document.getElementById('status').textContent=text;}
  async initialize(){try{
    this.manifest=await this.config.manifest();const select=document.getElementById('track');
    for(const circuit of this.manifest.circuits){const option=document.createElement('option');option.value=circuit.id;option.textContent=circuit.name;select.append(option);}
    await this.load();
  }catch(error){this.message(error.message);}}
  async load(){
    if(this.dirty&&!confirm('Scartare le modifiche non scaricate?'))return;
    try{const circuit=this.manifest.circuits.find(c=>c.id===document.getElementById('track').value);
      const data=await this.config.json(new URL(circuit.file,this.config.url));this.use(data);
    }catch(error){this.message(`Caricamento fallito: ${error.message}`);}
  }
  use(data){
    if(!Array.isArray(data.sections)||data.sections.length<3||!Number.isFinite(data.lengthMeters)||data.lengthMeters<=0)throw new Error('Circuito non valido');
    const strengths={straight:0,left_gentle:-0.25,left_medium:-0.55,left_hard:-1,right_gentle:0.25,right_medium:0.55,right_hard:1};
    if(data.sections.some(s=>!Number.isFinite(s.weight)||s.weight<=0||!(s.curve in strengths)))throw new Error('Step non validi');
    this.definition=structuredClone(data);
    const saved=data.geometry?.joins;
    if(saved&&saved.length===data.sections.length&&saved.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))){this.points=structuredClone(saved);this.message('Coordinate salvate caricate.');}
    else{
      const total=data.sections.reduce((sum,s)=>sum+s.weight,0);
      const turn=data.sections.reduce((sum,s)=>sum+s.weight*strengths[s.curve],0);
      let angle=-Math.PI/2,x=0,y=0,progress=0;const points=[];
      for(const section of data.sections){points.push({x,y});const length=section.weight/total*data.lengthMeters;
        const delta=Math.abs(turn)>1e-6?section.weight*strengths[section.curve]/turn*Math.PI*2:Math.PI*2/data.sections.length;
        x+=Math.cos(angle+delta/2)*length;y+=Math.sin(angle+delta/2)*length;angle+=delta;progress+=length;
      }
      let cumulative=0;
      this.points=points.map((p,i)=>{const result={x:Math.round(p.x-x*cumulative/data.lengthMeters),y:Math.round(p.y-y*cumulative/data.lengthMeters)};cumulative+=data.sections[i].weight/total*data.lengthMeters;return result;});
      this.message('Mappa schematica ricostruita dai tratti: non è una planimetria ufficiale. Trascina i join per modificarla.');
    }
    this.history=[];this.selected=0;this.dirty=false;document.getElementById('name').value=data.name;document.getElementById('length').value=data.lengthMeters;this.fit();
    document.dispatchEvent(new Event('circuit-loaded'));
  }
  lengths(){return this.points.map((p,i)=>{const next=this.points[(i+1)%this.points.length];return Math.hypot(next.x-p.x,next.y-p.y);});}
  lapLength(){return Math.max(100,Math.min(100000,Number(document.getElementById('length').value)||this.definition.lengthMeters));}
  fit(){if(!this.points)return;const xs=this.points.map(p=>p.x),ys=this.points.map(p=>p.y);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const width=Math.max(100,maxX-minX),height=Math.max(100,maxY-minY);const pad=Math.max(width,height)*0.12;this.box={x:minX-pad,y:minY-pad,w:width+pad*2,h:height+pad*2};this.svg.setAttribute('viewBox',`${this.box.x} ${this.box.y} ${this.box.w} ${this.box.h}`);this.render();}
  element(name,attributes={}){const node=document.createElementNS('http://www.w3.org/2000/svg',name);for(const [key,value]of Object.entries(attributes))node.setAttribute(key,value);return node;}
  render(){
    if(!this.points)return;this.svg.replaceChildren();const size=Math.max(this.box.w,this.box.h)/100;
    const lengths=this.lengths(),total=lengths.reduce((a,b)=>a+b,0),scale=this.lapLength()/Math.max(1,total);let distance=0;
    const steps=document.getElementById('steps');steps.replaceChildren();
    for(let i=0;i<this.points.length;i++){
      const p=this.points[i],q=this.points[(i+1)%this.points.length];
      const color=i===this.selected?'#ffad33':`hsl(${i/this.points.length*300} 75% 65%)`;
      const line=this.element('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,stroke:color,'stroke-width':size*0.65,'stroke-linecap':'round'});this.svg.append(line);
      const middle=this.element('text',{x:(p.x+q.x)/2,y:(p.y+q.y)/2-size,fill:color,'font-size':size*1.3,'text-anchor':'middle'});middle.textContent=`${i+1} · ${Math.round(lengths[i]*scale)} m`;this.svg.append(middle);
      const item=document.createElement('li');const button=document.createElement('button');button.className='w-full text-left bg-slate-800 rounded p-3 hover:bg-slate-700';button.textContent=`${i+1}. ${this.definition.sections[i].name} · ${Math.round(lengths[i]*scale)} m · ${Math.round(distance)} → ${Math.round(distance+lengths[i]*scale)} m`;button.onclick=()=>{this.selected=i;this.render();};item.append(button);steps.append(item);distance+=lengths[i]*scale;
    }
    for(let i=0;i<this.points.length;i++){
      const p=this.points[i];const node=this.element('circle',{cx:p.x,cy:p.y,r:size*1.3,fill:i===this.selected?'#ffad33':i===0?'#34d399':'#fff',stroke:'#111','stroke-width':size*0.3,'data-node':i,style:'cursor:grab'});this.svg.append(node);
      const text=this.element('text',{x:p.x,y:p.y-size*2,fill:'#fff','font-size':size*1.7,'text-anchor':'middle','pointer-events':'none'});text.textContent=i===0?'1 · START':i+1;this.svg.append(text);
    }
    const p=this.points[this.selected];document.getElementById('selected').textContent=`Join ${this.selected+1} · ${this.definition.sections[this.selected].name}`;
    document.getElementById('x').value=Math.round(p.x);document.getElementById('y').value=Math.round(p.y);
    document.getElementById('summary').textContent=`${this.points.length} step · giro ${this.lapLength()} m · poligono attuale ${Math.round(total)} m. Le distanze vengono normalizzate alla lunghezza del giro durante l’esportazione.`;
  }
  snapshot(){this.history.push(structuredClone(this.points));if(this.history.length>40)this.history.shift();}
  position(event){const point=new DOMPoint(event.clientX,event.clientY);return point.matrixTransform(this.svg.getScreenCTM().inverse());}
  begin(event){const index=event.target.getAttribute('data-node');if(index===null||event.button!==0)return;event.preventDefault();this.selected=Number(index);this.snapshot();this.drag={index:this.selected};this.svg.setPointerCapture(event.pointerId);this.render();}
  move(event){if(!this.drag)return;const point=this.position(event);this.points[this.drag.index]={x:Math.round(point.x),y:Math.round(point.y)};this.dirty=true;this.render();}
  end(event){if(!this.drag)return;this.drag=null;if(this.svg.hasPointerCapture(event.pointerId))this.svg.releasePointerCapture(event.pointerId);this.message('Join modificati in memoria. Scarica l’alternativa per conservarli.');}
  key(event){if(!this.points||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();this.snapshot();const p=this.points[this.selected],step=event.shiftKey?10:1;p.x+=(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0);p.y+=(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0);this.dirty=true;this.render();}
  apply(){if(!this.points)return;const x=Number(document.getElementById('x').value),y=Number(document.getElementById('y').value);if(!Number.isFinite(x)||!Number.isFinite(y)){this.message('Coordinate non valide');return;}this.snapshot();this.points[this.selected]={x,y};this.dirty=true;this.render();}
  undo(){if(!this.history.length)return;this.points=this.history.pop();this.dirty=true;this.render();this.message('Ultima modifica annullata.');}
  async open(file){if(!file)return;if(this.dirty&&!confirm('Scartare le modifiche?'))return;try{this.use(JSON.parse(await file.text()));}catch(error){this.message(`JSON non valido: ${error.message}`);}}
  buildDefinition(){
    if(!this.points)throw new Error('Carica prima un circuito');const lengths=this.lengths();if(lengths.some(length=>length<1))throw new Error('Due join sono sovrapposti o troppo vicini. Separali prima di esportare.');
    const total=lengths.reduce((a,b)=>a+b,0),scale=this.lapLength()/total;
    const output=structuredClone(this.definition);output.id=`${this.definition.id.replace(/-alternative$/,'')}-alternative`;output.name=document.getElementById('name').value.trim()||this.definition.name;output.lengthMeters=this.lapLength();output.closed=true;
    output.sections=this.points.map((p,i)=>{
      const q=this.points[(i+1)%this.points.length],next=this.points[(i+2)%this.points.length];const a=Math.atan2(q.y-p.y,q.x-p.x),b=Math.atan2(next.y-q.y,next.x-q.x);const angle=Math.atan2(Math.sin(b-a),Math.cos(b-a))*180/Math.PI;
      const strength=Math.abs(angle)<8?'straight':`${angle>0?'right':'left'}_${Math.abs(angle)<25?'gentle':Math.abs(angle)<65?'medium':'hard'}`;
      return {name:this.definition.sections[i].name,weight:Number((lengths[i]*scale).toFixed(3)),curve:strength};
    });
    const origin=this.points[0];output.geometry={version:1,units:'meters',closed:true,joins:this.points.map(p=>({x:Number(((p.x-origin.x)*scale).toFixed(3)),y:Number(((p.y-origin.y)*scale).toFixed(3))}))};
    output.description='Alternativa modificata nell’editor; geometria poligonale schematica.';
    return output;
  }
  download(){
    let output;try{output=this.buildDefinition();}catch(error){this.message(error.message);return;}
    const url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`${output.id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    this.message(`Scaricato ${output.id}.json. Salvalo in assets/circuits e aggiungi una voce nel manifest con il suo id, file, fondale e styles.`);
  }
}
