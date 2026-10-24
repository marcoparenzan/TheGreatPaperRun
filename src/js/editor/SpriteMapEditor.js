export class SpriteMapEditor {
  constructor(comparator) {
    this.comparator = comparator; this.map = document.getElementById('sprite-map'); this.dirty = false;
    document.addEventListener('frames-loaded', () => { this.dirty = false; this.sync(); });
    for(const radio of document.querySelectorAll('[name="target"]')) radio.onchange = () => this.sync();
    this.map.style.touchAction = 'none';
    for(const side of ['a','b']) document.getElementById(`target-${side}`).onclick=()=>{
      document.querySelector(`[name="target"][value="${side}"]`).checked=true;
      for(const s of ['a','b']) {const button=document.getElementById(`target-${s}`);button.setAttribute('aria-pressed',String(s===side));button.classList.toggle('ring-4',s===side);button.classList.toggle('ring-white',s===side);}
      this.sync();
    };
    this.map.onclick = event => this.pick(event);
    this.map.onkeydown = event => {
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)||!this.comparator.ready)return;
      event.preventDefault();
      const c=this.comparator,id=document.getElementById(`frame-${this.target()}`).value,r=c.definition.frames[id].rect;
      const step=event.shiftKey?10:1;
      document.getElementById('rect-x').value=Math.max(0,Math.min(c.sheet.naturalWidth-r.w,r.x+(event.key==='ArrowRight'?step:event.key==='ArrowLeft'?-step:0)));
      document.getElementById('rect-y').value=Math.max(0,Math.min(c.sheet.naturalHeight-r.h,r.y+(event.key==='ArrowDown'?step:event.key==='ArrowUp'?-step:0)));
      this.apply();
    };
    document.getElementById('apply-rect').onclick = () => this.apply();
    document.getElementById('save-json').onclick = () => this.save();
    document.getElementById('download-json').onclick = () => this.download();
    document.getElementById('model').addEventListener('change', () => {
      document.getElementById('edit-status').textContent = 'Caricamento: le modifiche non salvate del modello precedente vengono scartate.';
    });
    window.addEventListener('beforeunload', event => { if(this.dirty) {event.preventDefault();event.returnValue='';} });
  }
  target() { return document.querySelector('[name="target"]:checked').value; }
  point(event) {
    const bounds=this.map.getBoundingClientRect(),c=this.comparator;
    return {x:(event.clientX-bounds.left)/bounds.width*c.sheet.naturalWidth,y:(event.clientY-bounds.top)/bounds.height*c.sheet.naturalHeight};
  }
  beginDrag(event) {
    const c=this.comparator;if(!c.ready || (event.button!==0 && event.button!==2))return;
    const point=this.point(event),side=this.target(),id=document.getElementById(`frame-${side}`).value,r=c.definition.frames[id].rect;
    if(point.x>=r.x&&point.x<=r.x+r.w&&point.y>=r.y&&point.y<=r.y+r.h) {
      this.drag={id,start:point,x:r.x,y:r.y,moved:false};this.map.setPointerCapture(event.pointerId);this.map.style.cursor='grabbing';
    }else this.drag={pick:true,moved:false,start:point};
  }
  moveDrag(event) {
    if(!this.drag)return;
    const point=this.point(event),drag=this.drag;
    if(Math.abs(point.x-drag.start.x)+Math.abs(point.y-drag.start.y)>8)drag.moved=true;
    if(drag.pick||!drag.moved)return;
    const c=this.comparator,r=c.definition.frames[drag.id].rect;
    const x=Math.max(0,Math.min(c.sheet.naturalWidth-r.w,Math.round(drag.x+point.x-drag.start.x)));
    const y=Math.max(0,Math.min(c.sheet.naturalHeight-r.h,Math.round(drag.y+point.y-drag.start.y)));
    if(x===r.x&&y===r.y)return;
    r.x=x;r.y=y;this.dirty=true;c.cache.delete(drag.id);
    if(!this.pendingRender)this.pendingRender=requestAnimationFrame(()=>{this.pendingRender=null;c.render();this.sync();});
    document.getElementById('edit-status').textContent=`Ritaglio spostato: X ${x}, Y ${y}. Modifiche da salvare.`;
  }
  endDrag(event) {
    if(!this.drag)return;
    const drag=this.drag;this.drag=null;this.map.style.cursor='crosshair';
    if(this.map.hasPointerCapture(event.pointerId))this.map.releasePointerCapture(event.pointerId);
    if(!drag.moved)this.pick(event);
  }
  sync() {
    const c=this.comparator;if(!c.ready)return;
    const a=document.getElementById('frame-a').value,b=document.getElementById('frame-b').value;
    document.getElementById('selected-frames').textContent=`A: ${a}\nB: ${b}`;
    document.getElementById('selected-frames').classList.add('whitespace-pre-line');
    const id=this.target()==='a'?a:b;const r=c.definition.frames[id].rect;
    document.getElementById('editing-frame').textContent=`${this.target().toUpperCase()}: ${id} (${r.w} × ${r.h})`;
    document.getElementById('rect-x').value=r.x;document.getElementById('rect-y').value=r.y;
    document.getElementById('rect-x').max=c.sheet.naturalWidth-r.w;
    document.getElementById('rect-y').max=c.sheet.naturalHeight-r.h;
    const ctx=this.map.getContext('2d');ctx.fillStyle='#d4d4d4';ctx.fillRect(0,0,1024,1024);ctx.drawImage(c.sheet,0,0,1024,1024);
    const sx=1024/c.sheet.naturalWidth,sy=1024/c.sheet.naturalHeight;
    ctx.lineWidth=1;ctx.strokeStyle='rgba(20,20,20,0.45)';
    ctx.beginPath();
    for(let x=0;x<=c.sheet.naturalWidth;x+=1024){ctx.moveTo(x*sx,0);ctx.lineTo(x*sx,1024);}
    for(let y=0;y<=c.sheet.naturalHeight;y+=1024){ctx.moveTo(0,y*sy);ctx.lineTo(1024,y*sy);}
    ctx.stroke();
    ctx.font='12px sans-serif';ctx.fillStyle='#555';
    for(let row=0;row<8;row++)for(let col=0;col<8;col++)ctx.fillText(`${col},${row}`,col*1024*sx+4,row*1024*sy+14);
    for(const [side,frameId,color] of [['A',a,'#00bfff'],['B',b,'#ff8c00']]){
      const rect=c.definition.frames[frameId].rect;ctx.strokeStyle=color;ctx.lineWidth=5;ctx.setLineDash(side==='B'?[10,5]:[]);ctx.strokeRect(rect.x*sx,rect.y*sy,rect.w*sx,rect.h*sy);ctx.setLineDash([]);ctx.fillStyle=color;ctx.font='bold 24px sans-serif';ctx.fillText(side,rect.x*sx+8,rect.y*sy+(side==='A'?28:54));
    }
  }
  pick(event) {
    const c=this.comparator;if(!c.ready)return;
    const bounds=this.map.getBoundingClientRect();const x=(event.clientX-bounds.left)/bounds.width*c.sheet.naturalWidth,y=(event.clientY-bounds.top)/bounds.height*c.sheet.naturalHeight;
    const cellX=Math.min(7168,Math.max(0,Math.floor(x/1024)*1024));
    const cellY=Math.min(7168,Math.max(0,Math.floor(y/1024)*1024));
    let id=Object.keys(c.definition.frames).find(key=>{const r=c.definition.frames[key].rect;return r.x===cellX&&r.y===cellY;});
    if(!id){
      id=`cella_${cellX/1024}_${cellY/1024}`;
      c.definition.frames[id]={rect:{x:cellX,y:cellY,w:1024,h:1024},anchor:{x:0.5,y:880/1024},originPx:{x:512,y:880},editorOnly:true};
      for(const side of ['a','b']){const option=document.createElement('option');option.value=id;option.textContent=id;document.getElementById(`frame-${side}`).append(option);}
    }
    document.getElementById(`frame-${this.target()}`).value=id;c.render();this.sync();
  }
  apply() {
    const c=this.comparator;if(!c.ready)return;
    const id=document.getElementById(`frame-${this.target()}`).value,r=c.definition.frames[id].rect;
    const x=Number(document.getElementById('rect-x').value),y=Number(document.getElementById('rect-y').value);
    if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x+r.w>c.sheet.naturalWidth||y+r.h>c.sheet.naturalHeight){document.getElementById('edit-status').textContent='Coordinate non valide: il rettangolo deve restare dentro il PNG.';return;}
    r.x=x;r.y=y;c.cache.delete(id);this.dirty=true;c.render();this.sync();
    document.getElementById('edit-status').textContent='X/Y aggiornati nell’anteprima. Salva il JSON per conservarli.';
  }
  filename(){return this.comparator.definition.meta.image.replace(/\.png$/i,'.json');}
  blob(){const definition=structuredClone(this.comparator.definition);for(const [id,frame] of Object.entries(definition.frames))if(frame.editorOnly)delete definition.frames[id];return new Blob([JSON.stringify(definition,null,2)],{type:'application/json'});}
  download(){
    if(!this.comparator.ready)return;
    const url=URL.createObjectURL(this.blob());const a=document.createElement('a');a.href=url;a.download=this.filename();a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    document.getElementById('edit-status').textContent='Copia scaricata: sostituisci il JSON in src/assets/cars/ per applicarla al gioco.';
  }
  async save(){
    if(!this.comparator.ready)return;
    if(!window.showSaveFilePicker){this.download();return;}
    try{
      const handle=await window.showSaveFilePicker({suggestedName:this.filename(),types:[{description:'JSON animazioni',accept:{'application/json':['.json']}}]});
      const writable=await handle.createWritable();await writable.write(this.blob());await writable.close();this.dirty=false;
      document.getElementById('edit-status').textContent='JSON salvato nel file scelto. Se è quello in src/assets/cars/, ricarica il gioco per applicarlo.';
    }catch(error){document.getElementById('edit-status').textContent=error.name==='AbortError'?'Salvataggio annullato.':`Salvataggio fallito: ${error.message}`;}
  }
}
