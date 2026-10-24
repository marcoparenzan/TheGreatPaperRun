export class AtlasImageEditor {
  constructor(comparator,mapEditor){
    this.c=comparator;this.mapEditor=mapEditor;this.undo=null;this.changed=false;
    document.getElementById('move-strip').onclick=()=>this.move();
    document.getElementById('undo-strip').onclick=()=>this.restore();
    document.getElementById('save-png').onclick=()=>this.save();
    document.addEventListener('frames-loaded',()=>{this.undo=null;this.changed=false;document.getElementById('png-status').textContent='PNG originale caricato.';});
    window.addEventListener('beforeunload',e=>{if(this.changed){e.preventDefault();e.returnValue='';}});
  }
  message(text){document.getElementById('png-status').textContent=text;}
  working(){
    if(this.c.sheet instanceof HTMLCanvasElement)return this.c.sheet;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=8192;
    canvas.getContext('2d').drawImage(this.c.sheet,0,0);
    canvas.naturalWidth=8192;canvas.naturalHeight=8192;this.c.sheet=canvas;return canvas;
  }
  refresh(){this.c.cache.clear();this.c.render();this.mapEditor.sync();}
  move(){
    if(!this.c.ready)return;
    const index=Number(document.getElementById('strip-index').value),dx=Number(document.getElementById('strip-dx').value),dy=Number(document.getElementById('strip-dy').value);
    if(![index,dx,dy].every(Number.isInteger)||index<0||index>7){this.message('Inserisci indice 0–7 e spostamenti interi in pixel.');return;}
    if(!dx&&!dy){this.message('Inserisci uno spostamento diverso da zero.');return;}
    const row=document.getElementById('strip-type').value==='row';
    const source={x:row?0:index*1024,y:row?index*1024:0,w:row?8192:1024,h:row?1024:8192};
    const target={x:source.x+dx,y:source.y+dy,w:source.w,h:source.h};
    if((target.x<0||target.y<0||target.x+target.w>8192||target.y+target.h>8192)&&!confirm('Parte della riga/colonna finirà fuori dal PNG e verrà tagliata. Continuare?'))return;
    try{
      const canvas=this.working(),ctx=canvas.getContext('2d');
      const original=ctx.getImageData(source.x,source.y,source.w,source.h);
      const clipped={x:Math.max(0,target.x),y:Math.max(0,target.y)};
      clipped.w=Math.max(0,Math.min(8192,target.x+target.w)-clipped.x);clipped.h=Math.max(0,Math.min(8192,target.y+target.h)-clipped.y);
      const destination=clipped.w&&clipped.h?ctx.getImageData(clipped.x,clipped.y,clipped.w,clipped.h):null;
      this.undo={source,original,clipped,destination};
      const strip=document.createElement('canvas');strip.width=source.w;strip.height=source.h;strip.getContext('2d').putImageData(original,0,0);
      ctx.clearRect(source.x,source.y,source.w,source.h);ctx.clearRect(target.x,target.y,target.w,target.h);ctx.drawImage(strip,target.x,target.y);
      this.changed=true;this.refresh();this.message(`${row?'Riga':'Colonna'} ${index} spostata di (${dx}, ${dy}) px. PNG da salvare. JSON invariato.`);
    }catch(error){this.message(`Operazione fallita: ${error.message}`);}
  }
  restore(){
    if(!this.undo){this.message('Nessuno spostamento da annullare.');return;}
    const ctx=this.working().getContext('2d'),u=this.undo;
    if(u.destination)ctx.putImageData(u.destination,u.clipped.x,u.clipped.y);
    ctx.putImageData(u.original,u.source.x,u.source.y);this.undo=null;this.refresh();this.message('Ultimo spostamento annullato.');
  }
  async save(){
    if(!this.c.ready)return;
    try{
      const name=this.c.definition.meta.image;
      const handle=window.showSaveFilePicker?await window.showSaveFilePicker({suggestedName:name,types:[{description:'Spritesheet PNG',accept:{'image/png':['.png']}}]}):null;
      this.message('Codifica PNG 8192 × 8192…');
      const blob=await new Promise(resolve=>this.working().toBlob(resolve,'image/png'));
      if(!blob)throw new Error('Memoria insufficiente per esportare il PNG');
      if(handle){const writable=await handle.createWritable();await writable.write(blob);await writable.close();this.changed=false;this.message('PNG salvato nel file scelto. Ricarica il gioco se hai sostituito l’asset.');}
      else {const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);this.message('PNG scaricato. Sostituisci manualmente il file in src/assets/cars/.');}
    }catch(error){this.message(error.name==='AbortError'?'Salvataggio annullato.':error.message);}
  }
}
