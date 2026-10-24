export class CarPaint {
  constructor(sheet, color = '#ffffff') {
    this.sheet = sheet;
    this.cache = new Map();
    this.setColor(color);
  }

  setColor(color) {
    this.color = /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffffff';
    this.cache.clear();
  }

  frame(rect) {
    const key = `${rect.x},${rect.y},${rect.w},${rect.h}`;
    if (this.cache.has(key)) return this.cache.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = rect.w; canvas.height = rect.h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(this.sheet, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
    if (this.color.toLowerCase() !== '#ffffff') {
      const rgb = [1, 3, 5].map(index => parseInt(this.color.slice(index, index + 2), 16));
      const image = ctx.getImageData(0, 0, rect.w, rect.h);
      for (let i = 0; i < image.data.length; i += 4) {
        if (!image.data[i + 3]) continue;
        const brightness = (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3;
        // Keep dark ink intact; tint the light paper surfaces and their shading.
        const amount = Math.max(0, Math.min(1, (brightness - 45) / 160));
        for (let c = 0; c < 3; c++) {
          const tinted = rgb[c] * brightness / 255;
          image.data[i + c] = Math.round(image.data[i + c] * (1 - amount) + tinted * amount);
        }
      }
      ctx.putImageData(image, 0, 0);
    }
    this.cache.set(key, canvas);
    return canvas;
  }

  controls() {
    const label = document.createElement('label');
    label.className = 'fixed bottom-20 left-3 z-20 flex items-center gap-2 rounded border-2 border-black bg-white px-3 py-2 font-bold text-black';
    label.textContent = 'Colore auto';
    const input = document.createElement('input');
    input.type = 'color'; input.value = this.color;
    input.className = 'h-8 w-12 cursor-pointer';
    input.setAttribute('aria-label', 'Colore della macchina');
    input.addEventListener('change', () => {
      this.setColor(input.value);
      const url = new URL(location.href); url.searchParams.set('color', this.color); history.replaceState(null, '', url);
    });
    label.append(input); document.body.append(label);
  }
}
