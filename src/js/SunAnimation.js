export class SunAnimation {
  constructor() {
    this.frames = [];
    this.parallaxOffset = 0;
    this.parallaxVelocity = 0;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  }

  async load() {
    const paths = ['sun-parallax-512x512.png', ...Array.from({ length: 7 }, (_, i) => `sun/frame-${String(i + 1).padStart(2, '0')}.png`)];
    this.frames = await Promise.all(paths.map(async path => {
      const image = new Image();
      image.src = `./assets/${path}`;
      await image.decode();
      return image;
    }));
  }

  update(delta, speed, curvature) {
    const target = speed * (0.005 + curvature * 0.14);
    this.parallaxVelocity += (target - this.parallaxVelocity) * (1 - Math.exp(-delta * 3));
    if (speed < 0.5) this.parallaxVelocity = 0;
    this.parallaxOffset += this.parallaxVelocity * delta;
  }

  draw(ctx, width, height, time, headingDegrees = null, panoramaWidth = null) {
    if (!this.frames.length) return;
    const index = this.reducedMotion.matches ? 0 : Math.floor(time / 450) % this.frames.length;
    const image = this.frames[index];
    const size = Math.min(width * 0.17, height * 0.22, 160);
    // Rotated PNGs have expanded bounds: preserve the scale of the source artwork.
    const w = size * image.naturalWidth / 512;
    const h = size * image.naturalHeight / 512;
    const cycle = panoramaWidth ?? (width + size * 2);
    const offset = headingDegrees === null ? this.parallaxOffset : headingDegrees / 360 * cycle;
    const x = ((width * 0.76 - offset + size) % cycle + cycle) % cycle - size;
    const y = height * 0.20;
    ctx.drawImage(image, x - w / 2, y - h / 2, w, h);
  }
}
