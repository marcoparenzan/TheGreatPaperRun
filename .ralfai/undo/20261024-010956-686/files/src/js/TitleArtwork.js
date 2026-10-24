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
      const [marco, c3, dino, torino, mountains, sun] = await Promise.all([
        this.image('title/marco.png'), this.image('title/c3.png'), this.image('title/dino.png'),
        this.image('title/torino.png'), this.image('mountains-parallax-4096x512.png'), this.image('sun-parallax-512x512.png')
      ]);
      this.draw({ marco, c3, dino, torino, mountains, sun });
      this.button.disabled = false;
    } catch (error) {
      document.getElementById('artwork-status').textContent = 'Copertina non disponibile: ' + error.message;
    }
  }

  cutout(image) {
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 32) {
        left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
    return right < 0 ? { x: 0, y: 0, w: canvas.width, h: canvas.height } : { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  }

  draw(images) {
    const ctx = this.canvas.getContext('2d'); this.canvas.width = 1600; this.canvas.height = 1000;
    ctx.fillStyle = '#f5f0e5'; ctx.fillRect(0, 0, 1600, 1000);
    ctx.save(); ctx.beginPath(); ctx.rect(22, 22, 1556, 956); ctx.clip();
    ctx.fillStyle = '#99d8f2'; ctx.fillRect(22, 22, 1556, 535);
    ctx.fillStyle = '#8abc72'; ctx.fillRect(22, 557, 1556, 421);
    ctx.drawImage(images.sun, 1265, 75, 180, 180);
    ctx.drawImage(images.mountains, 370, 337, 1900, 237.5);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(22, 557); ctx.lineTo(1578, 557); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(930, 540); ctx.bezierCurveTo(920, 635, 505, 770, 180, 1000);
    ctx.lineTo(1660, 1000); ctx.bezierCurveTo(1380, 800, 1060, 675, 985, 540); ctx.closePath();
    ctx.save(); ctx.shadowColor = '#0005'; ctx.shadowOffsetX = 8; ctx.shadowOffsetY = 8; ctx.shadowBlur = 0;
    ctx.fillStyle = '#fffdf7'; ctx.fill(); ctx.restore(); ctx.strokeStyle = '#151515'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#111';
    for (const depth of [0.12, 0.2, 0.32, 0.5, 0.72, 0.95]) {
      const y = 557 + depth * 420, spread = depth * depth * 560;
      for (const side of [-1, 1]) {ctx.beginPath();ctx.ellipse(958 + side * spread, y, 2 + depth * 9, 1 + depth * depth * 13, 0, 0, Math.PI * 2);ctx.fill();}
    }
    // A paper photograph uses the actual supplied image, without AI reinterpreting it.
    ctx.save(); ctx.translate(283, 337); ctx.rotate(-0.085);
    ctx.shadowColor = '#0004'; ctx.shadowOffsetX = 10; ctx.shadowOffsetY = 12;
    ctx.fillStyle = '#fff'; ctx.fillRect(-220, -225, 440, 490); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.strokeRect(-220, -225, 440, 490);
    ctx.drawImage(images.marco, -200, -205, 400, 400 * images.marco.naturalHeight / images.marco.naturalWidth);
    ctx.fillStyle = '#111';ctx.font = 'bold 23px sans-serif';ctx.textAlign = 'center';ctx.fillText('READY TO RUN', 0, 238);ctx.restore();
    const car = (image, x, y, width) => {
      const rect = this.cutout(image); const height = width * rect.h / rect.w;
      ctx.save();ctx.shadowColor = '#0004';ctx.shadowBlur = 4;ctx.shadowOffsetY = 8;
      ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, x - width / 2, y - height, width, height);ctx.restore();
    };
    car(images.dino, 652, 807, 330);car(images.torino, 1258, 806, 335);car(images.c3, 966, 958, 550);
    ctx.save();ctx.translate(82, 720);ctx.rotate(-0.09);ctx.fillStyle = '#fff';ctx.strokeStyle = '#111';ctx.lineWidth = 4;ctx.fillRect(0, 0, 340, 130);ctx.strokeRect(0, 0, 340, 130);
    ctx.fillStyle = '#ea580c';ctx.font = '900 43px sans-serif';ctx.fillText('PAPER', 25, 55);ctx.fillStyle = '#111';ctx.fillText('RUN!', 25, 108);ctx.restore();
    ctx.restore();ctx.strokeStyle = '#111';ctx.lineWidth = 6;ctx.strokeRect(22, 22, 1556, 956);
  }

  download() {
    this.canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'the-great-paper-run-cover.png'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }, 'image/png');
  }
}
