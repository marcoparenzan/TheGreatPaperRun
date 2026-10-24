export class SpriteWorkshop {
  constructor() {
    this.w = 1024; this.h = 819; this.regions = {}; this.sheet = null;
    this.source = document.getElementById('source'); this.preview = document.getElementById('preview');
    for (const canvas of [this.source, this.preview]) { canvas.width = this.w; canvas.height = this.h; }
    this.status = document.getElementById('status');
    for (const id of ['model', 'direction', 'pose']) document.getElementById(id).addEventListener('change', () => id === 'model' ? this.load() : this.refresh());
    document.getElementById('clear').onclick = () => { this.regions[this.key()] = []; this.refresh(); };
    document.getElementById('export').onclick = () => this.export();
    const point = event => { const r = this.source.getBoundingClientRect(); return { x: (event.clientX-r.left)*this.w/r.width, y: (event.clientY-r.top)*this.h/r.height }; };
    this.source.onpointerdown = event => { this.start = point(event); this.source.setPointerCapture(event.pointerId); };
    this.source.onpointerup = event => {
      if (!this.start) return;
      const end = point(event); const a = this.start; this.start = null;
      const rect = { x: Math.max(0, Math.round(Math.min(a.x,end.x))), y: Math.max(0,Math.round(Math.min(a.y,end.y))), w: Math.round(Math.abs(a.x-end.x)), h: Math.round(Math.abs(a.y-end.y)) };
      rect.w = Math.min(rect.w,this.w-rect.x); rect.h = Math.min(rect.h,this.h-rect.y);
      if (rect.w > 3 && rect.h > 3) (this.regions[this.key()] ??= []).push(rect);
      this.refresh();
    };
    this.load();
    this.timer = setInterval(() => this.animate(), 130);
  }
  key() { return `${document.getElementById('direction').value}-${document.getElementById('pose').value}`; }
  async image(url) { const image = new Image(); image.src = url; await image.decode(); return image; }
  async load() {
    document.getElementById('export').disabled = true;
    this.status.textContent = 'Preparazione foglio 8192…';
    this.sheet = null; this.regions = {};
    try {
      this.model = document.getElementById('model').value;
      const response = await fetch(`../assets/cars/old/${this.model}_spritesheet_4096.json`);
      if (!response.ok) throw new Error('JSON non disponibile');
      this.definition = await response.json();
      this.sheet = document.createElement('canvas'); this.sheet.width = this.sheet.height = 8192;
      const ctx = this.sheet.getContext('2d');
      if (this.model === 'c3') {
        const image = await this.image('../assets/cars/c3_spritesheet_8192_wheelanim.png');
        if (image.width !== 8192 || image.height !== 8192) throw new Error('Dimensioni C3 inattese');
        ctx.drawImage(image,0,0);
      } else {
        const image = await this.image(`../assets/cars/old/${this.definition.meta.image}`);
        for (const [row,name] of [[0,'avanti'],[1,'avanti'],[2,'destra'],[3,'sinistra']]) {
          this.definition.animations[name].frames.forEach((id,i) => { const r = this.definition.frames[id].rect; ctx.drawImage(image,r.x,r.y,r.w,r.h,(row<2?i:i*2)*this.w,row*this.h,r.w,r.h); });
        }
      }
      this.status.textContent = 'Seleziona le ruote per ciascuna delle 8 pose. Nessun ridimensionamento del foglio.';
      document.getElementById('export').disabled = false; this.refresh();
    } catch(error) { this.status.textContent = error.message; this.sheet = null; }
  }
  variant(original, regions) {
    const canvas = document.createElement('canvas'); canvas.width = this.w; canvas.height = this.h;
    const ctx = canvas.getContext('2d'); ctx.drawImage(original,0,0);
    for (const r of regions) {
      const data = ctx.getImageData(r.x,r.y,r.w,r.h);
      const original = new Uint8ClampedArray(data.data);
      const shift = Math.max(2, Math.round(r.h * 0.08));
      for (let y=0;y<r.h;y++) for(let x=0;x<r.w;x++) {
        const i=(y*r.w+x)*4;
        if (!original[i+3]) continue;
        const sourceY = (y + shift) % r.h;
        const j = (sourceY*r.w+x)*4;
        if (!original[j+3]) continue;
        const blend = Math.min(1, x/3, (r.w-1-x)/3, y/3, (r.h-1-y)/3);
        for(let c=0;c<3;c++) data.data[i+c]=Math.round(original[i+c]*(1-blend)+original[j+c]*blend);
      }
      ctx.putImageData(data,r.x,r.y);
    }
    return canvas;
  }
  refresh() {
    if(!this.sheet) return;
    const row=document.getElementById('direction').value==='destra'?2:3;
    const pose=Number(document.getElementById('pose').value);
    this.original=document.createElement('canvas'); this.original.width=this.w; this.original.height=this.h;
    this.original.getContext('2d').drawImage(this.sheet,pose*2*this.w,row*this.h,this.w,this.h,0,0,this.w,this.h);
    this.alternate=this.variant(this.original,this.regions[this.key()]??[]);
    const ctx=this.source.getContext('2d'); ctx.clearRect(0,0,this.w,this.h); ctx.drawImage(this.original,0,0);
    ctx.strokeStyle='#e11d48'; ctx.lineWidth=3;
    for(const r of this.regions[this.key()]??[]) ctx.strokeRect(r.x,r.y,r.w,r.h);
    this.animate();
  }
  animate() {
    if(!this.original) return;
    this.phase=!this.phase; const ctx=this.preview.getContext('2d'); ctx.clearRect(0,0,this.w,this.h); ctx.drawImage(this.phase?this.original:this.alternate,0,0);
  }
  download(blob,name) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),60000); }
  async export() {
    if(!this.sheet) return;
    if(['destra','sinistra'].some(d=>[0,1,2,3].some(p=>!(this.regions[`${d}-${p}`]?.length)))) {
      this.status.textContent='Prima seleziona le ruote in tutti e quattro i livelli, a destra e a sinistra.'; return;
    }
    this.status.textContent='Esportazione PNG 8192: attendi…';
    const ctx=this.sheet.getContext('2d');
    const result={meta:{...this.definition.meta,image:`${this.model}_spritesheet_8192.png`,size:{w:8192,h:8192},layout:{columns:8,rows:10,cellWidth:this.w,cellHeight:this.h}},animations:{},frames:{}};
    for(const [row,name] of [[0,'ferma'],[1,'avanti'],[2,'destra'],[3,'sinistra']]) {
      const count=row<2?4:8; const frames=[];
      for(let i=0;i<count;i++) {
        const id=`${name}_${String(i).padStart(2,'0')}`; frames.push(id);
        result.frames[id]={rect:{x:i*this.w,y:row*this.h,w:this.w,h:this.h},anchor:{x:0.5,y:1},originPx:{x:this.w/2,y:this.h}};
        if(row>=2 && i%2===1) {
          const original=document.createElement('canvas'); original.width=this.w; original.height=this.h;
          original.getContext('2d').drawImage(this.sheet,(i-1)*this.w,row*this.h,this.w,this.h,0,0,this.w,this.h);
          const variant=this.variant(original,this.regions[`${name}-${(i-1)/2}`]);
          ctx.clearRect(i*this.w,row*this.h,this.w,this.h); ctx.drawImage(variant,i*this.w,row*this.h);
        }
      }
      result.animations[name]={frames,frameDurationMs:130,loop:name!=='ferma'};
      if(row>=2) result.animations[name].levels=Array.from({length:4},(_,i)=>[frames[i*2],frames[i*2+1]]);
    }
    const blob=await new Promise(resolve=>this.sheet.toBlob(resolve,'image/png'));
    if(!blob) {this.status.textContent='Esportazione fallita: memoria browser insufficiente.';return;}
    this.download(blob,result.meta.image);
    this.download(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}),`${this.model}_spritesheet_8192.json`);
    this.status.textContent='PNG e JSON esportati. Se il browser blocca il secondo download, abilita i download multipli. Il gioco usa ancora gli originali 4096.';
  }
}
