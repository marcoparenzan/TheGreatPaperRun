export class TitleArtwork {
  constructor() {
    this.canvas = document.getElementById('title-artwork');
    this.button = document.getElementById('download-cover');
    if (!this.canvas) return;
    this.button.addEventListener('click', () => this.download());
    this.load();
  }

  async image(path) {
    const image = new Image(); image.src = new URL(`../assets/${path}`, import.meta.url).href;
    await image.decode(); return image;
  }

  async load() {
    try {
      const [marco, c3, city] = await Promise.all([
        this.image('title/marco.png'), this.image('title/c3.png'), this.image('backgrounds/cybercity-original.png')
      ]);
      this.draw({ marco, c3, city }); this.button.disabled = false;
    } catch (error) { document.getElementById('artwork-status').textContent = 'Copertina non disponibile: ' + error.message; }
  }

  cutout(image) {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) if (pixels[(y * canvas.width + x) * 4 + 3] > 32) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    return right < 0 ? { x: 0, y: 0, w: canvas.width, h: canvas.height } : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  }

  skyline(image) {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let top = canvas.height, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4, r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
      if ((b > r + 18 && g > r + 15 && b > g + 4) || (g > r + 18 && g > b + 18)) data.data[i + 3] = 0;
      if (data.data[i + 3] > 32) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
    }
    ctx.putImageData(data, 0, 0);
    return { canvas, top, height: Math.max(1, bottom - top + 1) };
  }

  draw({ marco, c3, city }) {
    const ctx = this.canvas.getContext('2d'); this.canvas.width = 1600; this.canvas.height = 1000;
    ctx.fillStyle = '#181a24'; ctx.fillRect(0, 0, 1600, 1000);
    const skyline = this.skyline(city);
    ctx.save(); ctx.filter = 'brightness(0.72)';
    ctx.drawImage(skyline.canvas, 0, skyline.top, skyline.canvas.width, skyline.height, -60, 70, 1720, 510);
    ctx.restore();
    ctx.fillStyle = '#172c29'; ctx.fillRect(0, 580, 1600, 420);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 580); ctx.lineTo(1600, 580); ctx.stroke();
    // White paper road leads from the city towards the viewer.
    ctx.beginPath(); ctx.moveTo(852, 567); ctx.lineTo(933, 567); ctx.lineTo(1600, 1000); ctx.lineTo(30, 1000); ctx.closePath();
    ctx.fillStyle = '#f7f3e9';ctx.fill();ctx.strokeStyle='#111';ctx.lineWidth=7;ctx.stroke();
    for (let i = 0; i < 20; i++) {
      const x = 170 + i * 62;
      ctx.fillStyle = i % 2 ? '#111' : '#fff';ctx.fillRect(x, 890, 62, 24);
      ctx.fillStyle = i % 2 ? '#fff' : '#111';ctx.fillRect(x, 914, 62, 24);
    }
    // Corvette is the real spritesheet cutout, not an AI approximation.
    const car = this.cutout(c3);const cw=640,ch=cw*car.h/car.w;
    ctx.save();ctx.shadowColor='#0007';ctx.shadowBlur=16;ctx.shadowOffsetY=12;
    ctx.drawImage(c3,car.x,car.y,car.w,car.h,1020-cw/2,990-ch,cw,ch);ctx.restore();
    // Paper-cut starter body with the supplied portrait as the face.
    ctx.save();ctx.translate(365,545);
    ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(0,399,110,20,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#101014';ctx.lineWidth=7;ctx.lineJoin='round';
    const polygon=(points,color)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.stroke();};
    polygon([[-63,211],[-5,211],[-12,360],[-82,360]],'#eee9df');
    polygon([[7,211],[65,211],[92,360],[20,360]],'#eee9df');
    polygon([[-86,356],[-9,356],[-9,390],[-105,390]],'#19191e');
    polygon([[19,356],[95,356],[117,390],[20,390]],'#19191e');
    polygon([[-72,12],[-117,37],[-144,154],[-113,171],[-70,80]],'#ea580c');
    polygon([[68,12],[98,28],[150,-32],[194,-103],[164,-122],[115,-64],[55,43]],'#ea580c');
    polygon([[-72,16],[64,16],[80,217],[-78,217]],'#fff9ef');
    ctx.fillStyle='#ea580c';ctx.fillRect(-66,54,132,70);ctx.strokeRect(-66,54,132,70);
    ctx.fillStyle='#111';ctx.font='bold 27px sans-serif';ctx.textAlign='center';ctx.fillText('START',0,99);
    ctx.fillStyle='#d6a080';ctx.beginPath();ctx.ellipse(180,-118,22,27,-0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    // Keep the actual source photograph, clipped into a head-shaped paper cutout.
    ctx.save();ctx.beginPath();ctx.ellipse(0,-60,87,101,0,0,Math.PI*2);ctx.clip();
    const faceWidth=marco.naturalWidth*0.72,faceHeight=marco.naturalHeight*0.78;
    ctx.drawImage(marco,(marco.naturalWidth-faceWidth)/2,0,faceWidth,faceHeight,-87,-161,174,202);ctx.restore();
    ctx.strokeStyle='#111';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(0,-60,87,101,0,0,Math.PI*2);ctx.stroke();
    // Flag pole and a slightly waving chequered paper flag.
    ctx.strokeStyle='#111';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(180,-97);ctx.lineTo(218,-349);ctx.stroke();
    ctx.save();ctx.translate(216,-347);ctx.rotate(0.11);
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(110,-22,180,24,278,2);ctx.lineTo(278,172);ctx.bezierCurveTo(178,194,89,147,0,171);ctx.closePath();
    ctx.save();ctx.clip();
    for(let row=0;row<6;row++)for(let col=0;col<10;col++){ctx.fillStyle=(row+col)%2?'#111':'#fff';ctx.fillRect(col*30-5,row*32-12,30,32);}
    ctx.restore();ctx.strokeStyle='#111';ctx.lineWidth=5;ctx.stroke();ctx.restore();ctx.restore();
    ctx.strokeStyle='#eb61bb';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(22,22);ctx.lineTo(1578,22);ctx.lineTo(1578,978);ctx.lineTo(22,978);ctx.closePath();ctx.stroke();
  }

  download() {
    this.canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'paper-run-marco-cyber-start.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
  }
}
