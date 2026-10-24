import { MountainParallax } from './MountainParallax.js';

export class PanoramaParallax extends MountainParallax {
  async load(url = new URL('../assets/panorama-mountains-city-4096.png', import.meta.url)) {
    const source = new Image();
    source.src = url;
    await source.decode();
    const buffer = document.createElement('canvas');
    buffer.width = source.naturalWidth;
    buffer.height = source.naturalHeight;
    const ctx = buffer.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(source, 0, 0);
    const data = ctx.getImageData(0, 0, buffer.width, buffer.height);
    let top = buffer.height, bottom = -1;
    // The generated sky/ground are chroma keys. Keep the monochrome paper scenery.
    for (let y = 0; y < buffer.height; y++) {
      for (let x = 0; x < buffer.width; x++) {
        const i = (y * buffer.width + x) * 4;
        const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
        const sky = b > r + 18 && g > r + 15 && b > g + 4;
        const ground = g > r + 18 && g > b + 18;
        if (sky || ground) data.data[i + 3] = 0;
        if (data.data[i + 3] > 32) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
    }
    if (bottom < top) throw new Error('Panorama privo di elementi visibili');
    ctx.putImageData(data, 0, 0);
    const strip = document.createElement('canvas');
    strip.width = buffer.width;
    strip.height = bottom - top + 1;
    strip.getContext('2d').drawImage(buffer, 0, top, buffer.width, strip.height, 0, 0, strip.width, strip.height);
    strip.naturalWidth = strip.width;
    strip.naturalHeight = strip.height;
    this.image = strip;
    this.visibleHeight = strip.height;
    this.ready = true;
  }
}
