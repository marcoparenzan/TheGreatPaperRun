import { RoadCurveFrames } from '../RoadCurveFrames.js';

export class FrameGallery {
  constructor() {
    this.curves = new RoadCurveFrames();
    this.canvas = document.getElementById('preview');
    this.slider = document.getElementById('curvature');
    this.button = document.getElementById('download');
    this.status = document.getElementById('status');
  }

  async start() {
    try {
      await this.curves.load();
      this.slider.disabled = this.button.disabled = false;
      this.slider.addEventListener('input', () => this.draw());
      this.button.addEventListener('click', () => this.download());
      this.status.textContent = '33 frame disponibili. Sposta il cursore per confrontarli.';
      this.draw();
    } catch (error) {
      this.status.textContent = `Impossibile preparare i frame: ${error.message}`;
    }
  }

  draw() {
    this.frame = this.curves.get(Number(this.slider.value) / 16);
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.frame.canvas, 0, 0);
    document.getElementById('value').textContent = `${this.slider.value} / 16`;
  }

  download() {
    this.frame.canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `road-clean-${Number(this.slider.value) < 0 ? 'left' : 'right'}-${Math.abs(Number(this.slider.value))}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, 'image/png');
  }
}
