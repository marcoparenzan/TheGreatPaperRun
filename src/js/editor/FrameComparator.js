export class FrameComparator {
  constructor() {
    this.canvas = document.getElementById('compare'); this.ctx = this.canvas.getContext('2d');
    this.cache = new Map(); this.phase = false; this.ready = false; this.token = 0;
    document.getElementById('model').addEventListener('change', () => this.load());
    for (const id of ['frame-a','frame-b','mode','opacity','anchor','boxes','offset']) document.getElementById(id).addEventListener('input', () => this.render());
    for (const side of ['a','b']) for (const [action,delta] of [['prev',-1],['next',1]]) {
      document.getElementById(`${action}-${side}`).onclick = () => {
        const select = document.getElementById(`frame-${side}`);
        if(!select.options.length) return;
        select.selectedIndex = (select.selectedIndex + delta + select.options.length) % select.options.length; this.render();
      };
    }
    setInterval(() => { this.phase = !this.phase; if(document.getElementById('mode').value === 'blink') this.render(); },220);
    this.load();
  }
  async load() {
    const token = ++this.token; this.ready = false; this.cache.clear();
    const status = document.getElementById('status'); status.textContent = 'Caricamento dello sprite…';
    try {
      const model = document.getElementById('model').value;
      const response = await fetch(`../assets/cars/${model}_spritesheet_8192_wheelanim.json`);
      if(!response.ok) throw new Error(`JSON non disponibile (${response.status})`);
      const definition = await response.json(); const sheet = new Image(); sheet.src = `../assets/cars/${definition.meta.image}`; await sheet.decode();
      if(token !== this.token) return;
      this.definition = definition; this.sheet = sheet;
      for(const side of ['a','b']) {
        const select = document.getElementById(`frame-${side}`); select.replaceChildren();
        for(const id of Object.keys(definition.frames)) { const option = document.createElement('option'); option.value=id; option.textContent=id; select.append(option); }
      }
      document.getElementById('frame-a').value = definition.animations.avanti.frames[0];
      document.getElementById('frame-b').value = definition.animations.sinistra.frames[0];
      this.ready = true; status.textContent = `${sheet.naturalWidth} × ${sheet.naturalHeight} — PNG originale invariato`; this.render();
      document.dispatchEvent(new Event('frames-loaded'));
    } catch(error) { if(token === this.token) status.textContent = error.message; }
  }
  frame(id) {
    if(this.cache.has(id)) return this.cache.get(id);
    const definition = this.definition.frames[id]; const r = definition.rect;
    const canvas = document.createElement('canvas'); canvas.width=r.w; canvas.height=r.h;
    const ctx = canvas.getContext('2d', {willReadFrequently:true}); ctx.drawImage(this.sheet,r.x,r.y,r.w,r.h,0,0,r.w,r.h);
    const pixels = ctx.getImageData(0,0,r.w,r.h).data;
    let left=r.w, top=r.h, right=-1, bottom=-1;
    for(let y=0;y<r.h;y++) for(let x=0;x<r.w;x++) if(pixels[(y*r.w+x)*4+3]>32) {
      left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
    }
    const frame = {id,definition,canvas,bounds:right<0?null:{left,top,right,bottom}}; this.cache.set(id,frame); return frame;
  }
  placement(frame, side) {
    const r=frame.definition.rect; const a=frame.definition.anchor ?? {x:0.5,y:1};
    const anchored=document.getElementById('anchor').checked;
    const offset=side==='b' ? Math.max(-1024,Math.min(1024,Number(document.getElementById('offset').value)||0)) : 0;
    return {x:anchored?512-r.w*a.x:0,y:(anchored?1000-r.h*a.y:0)+offset};
  }
  draw(frame,side,opacity) {
    const ctx=this.ctx; const p=this.placement(frame,side); ctx.save(); ctx.globalAlpha=opacity; ctx.drawImage(frame.canvas,p.x,p.y); ctx.restore();
  }
  guides(frame,side) {
    const ctx=this.ctx; const p=this.placement(frame,side); const r=frame.definition.rect; const a=frame.definition.anchor??{x:0.5,y:1};
    ctx.save(); ctx.lineWidth=3; ctx.setLineDash(side==='b'?[12,8]:[]); ctx.strokeStyle='#ff3333'; ctx.strokeRect(p.x,p.y,r.w,r.h);
    const b=frame.bounds; if(b) {ctx.strokeStyle='#26ee91';ctx.strokeRect(p.x+b.left,p.y+b.top,b.right-b.left+1,b.bottom-b.top+1);}
    const origin=frame.definition.originPx??{x:r.w*a.x,y:r.h*a.y};
    const ax=p.x+r.w*a.x, ay=p.y+r.h*a.y, ox=p.x+origin.x, oy=p.y+origin.y;
    ctx.setLineDash([]);ctx.strokeStyle='#ff20cb';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(ox,oy,21,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#ffe45e';ctx.beginPath();ctx.moveTo(ax-15,ay);ctx.lineTo(ax+15,ay);ctx.moveTo(ax,ay-15);ctx.lineTo(ax,ay+15);ctx.stroke();
    ctx.font='bold 16px sans-serif';ctx.textAlign='left';
    const labelX=Math.max(8,Math.min(740,ax+28));
    const labelY=Math.max(42,Math.min(960,ay-48))-(side==='b'?42:0);
    ctx.fillStyle='#111';ctx.fillRect(labelX-4,labelY-18,270,42);
    ctx.fillStyle='#ffe45e';ctx.fillText(`${side.toUpperCase()} anchor: (${r.w*a.x}, ${r.h*a.y})`,labelX,labelY);
    ctx.fillStyle='#ff20cb';ctx.fillText(`${side.toUpperCase()} origin: (${origin.x}, ${origin.y})`,labelX,labelY+20);
    ctx.setLineDash([]); ctx.fillStyle='#ff5555';ctx.font='bold 20px sans-serif';ctx.fillText(side.toUpperCase(),Math.max(6,p.x+8),Math.max(24,p.y+26));ctx.restore();
  }
  render() {
    if(!this.ready) return;
    const ctx=this.ctx;ctx.clearRect(0,0,1024,1024);
    for(let y=0;y<1024;y+=32) for(let x=0;x<1024;x+=32) {ctx.fillStyle=(x/32+y/32)%2?'#ddd':'#eee';ctx.fillRect(x,y,32,32);}
    ctx.strokeStyle='#6997ce';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(512,0);ctx.lineTo(512,1024);ctx.moveTo(0,1000);ctx.lineTo(1024,1000);ctx.stroke();
    const a=this.frame(document.getElementById('frame-a').value), b=this.frame(document.getElementById('frame-b').value);
    const mode=document.getElementById('mode').value;
    const showA=mode==='overlay'||mode==='a'||(mode==='blink'&&!this.phase);
    const showB=mode==='overlay'||mode==='b'||(mode==='blink'&&this.phase);
    if(showA)this.draw(a,'a',1);
    if(showB)this.draw(b,'b',mode==='overlay'?Number(document.getElementById('opacity').value)/100:1);
    if(document.getElementById('boxes').checked) {if(showA)this.guides(a,'a');if(showB)this.guides(b,'b');}
    const report=(frame,side)=>{
      const r=frame.definition.rect,p=this.placement(frame,side),bounds=frame.bounds;
      return `${side.toUpperCase()}: ${frame.id}\nJSON: x=${r.x}, y=${r.y}\nRitaglio: ${r.w} × ${r.h}\n${bounds?`Pixel visibili Y: ${bounds.top}…${bounds.bottom}\nMargine sotto: ${r.h-1-bounds.bottom} px\nBase visibile sul canvas: ${(p.y+bounds.bottom).toFixed(1)} px`:'Frame trasparente'}`;
    };
    let delta=''; if(a.bounds&&b.bounds){ const difference=this.placement(b,'b').y+b.bounds.bottom-this.placement(a,'a').y-a.bounds.bottom; delta=`\n\nDifferenza base B − A: ${difference.toFixed(1)} px\n${difference<0?'B risulta più alto':difference>0?'B risulta più basso':'Basi allineate'}`; }
    document.getElementById('metrics').textContent=report(a,'a')+'\n\n'+report(b,'b')+delta+'\n\nSoglia alpha: 32/255.\nA: linee continue; B: tratteggiate.';
  }
}
