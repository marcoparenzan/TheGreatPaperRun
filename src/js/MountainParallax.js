import { RoadProjection } from './RoadProjection.js';

export class MountainParallax {
  constructor() {
    this.image = new Image();
    this.offset = 0;
    this.ready = false;
    this.velocity = 0;
  }

  async load() {
    this.image.src = './assets/mountains-parallax-4096x512.png?v=horizon-aligned-2';
    await this.image.decode();
    const probe = document.createElement('canvas');
    probe.width = this.image.naturalWidth;
    probe.height = this.image.naturalHeight;
    const context = probe.getContext('2d', { willReadFrequently: true });
    context.drawImage(this.image, 0, 0);
    const pixels = context.getImageData(0, 0, probe.width, probe.height).data;
    this.visibleHeight = probe.height;
    outer: for (let y = probe.height - 1; y >= 0; y--) {
      for (let x = 0; x < probe.width; x++) {
        if (pixels[(y * probe.width + x) * 4 + 3] > 32) {
          this.visibleHeight = y + 1;
          break outer;
        }
      }
    }
    this.ready = true;
  }

  update(delta, speed, curvature) {
    // Distant scenery moves far less than the road, and sweeps opposite the bend.
    const target = speed * (0.025 + curvature * 0.65);
    this.velocity += (target - this.velocity) * (1 - Math.exp(-delta * 3));
    if (speed < 0.5) this.velocity = 0;
    this.offset += this.velocity * delta;
    this.offset %= 100000;
  }

  draw(ctx, width, height, road, headingDegrees = null) {
    if (!this.ready) return;
    const horizon = RoadProjection.top(width, height, road) + road.horizon / road.height * RoadProjection.span(width, height, road);
    const drawHeight = Math.min(220, height * 0.23);
    const drawWidth = drawHeight * this.image.naturalWidth / this.visibleHeight;
    const sourceOffset = headingDegrees === null ? this.offset : headingDegrees * (4096 / 360) * (drawWidth / 4096);
    const offset = ((sourceOffset % drawWidth) + drawWidth) % drawWidth;
    ctx.save();
    ctx.filter = this.filter ?? 'none';
    ctx.beginPath(); ctx.rect(0, 0, width, Math.max(0, horizon)); ctx.clip();
    for (let x = -offset - drawWidth; x < width; x += drawWidth) {
      ctx.drawImage(this.image, 0, 0, this.image.naturalWidth, this.visibleHeight,
        x, horizon - drawHeight, drawWidth, drawHeight);
    }
    ctx.restore();
  }
}
