import { PaperRoadStyle } from './PaperRoadStyle.js';

export class RoadCurveFrames {
  constructor() {
    this.style = new PaperRoadStyle();
    this.frames = [];
    this.strengths = { straight: 0, left_gentle: -0.25, left_medium: -0.55, left_hard: -1, right_gentle: 0.25, right_medium: 0.55, right_hard: 1 };
  }

  async load() {
    const image = new Image();
    image.src = new URL('../assets/road/clean/straight-base.png', import.meta.url).href;
    await image.decode();
    const width = 960, height = 540;
    const source = document.createElement('canvas');
    source.width = width;
    source.height = height;
    const ctx = source.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const baseRows = [];
    let horizon = height;
    for (let y = 0; y < height; y++) {
      let left = -1, right = -1;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (pixels[i + 3] > 150 && pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100) {
          if (left < 0) left = x;
          right = x;
        }
      }
      if (right - left < width * 0.008) continue;
      horizon = Math.min(horizon, y);
      baseRows[y] = { left, right };
    }
    if (horizon >= height) throw new Error('La nuova immagine non contiene una sagoma stradale riconoscibile.');
    // Extend any transparent bottom margin using the final visible road edges.
    let lastRow = height - 1;
    while (lastRow > horizon && !baseRows[lastRow]) lastRow--;
    let previousRow = lastRow - 1;
    while (previousRow > horizon && !baseRows[previousRow]) previousRow--;
    const last = baseRows[lastRow];
    const previous = baseRows[previousRow] ?? last;
    const interval = Math.max(1, lastRow - previousRow);
    for (let y = lastRow + 1; y < height; y++) {
      baseRows[y] = {
        left: last.left + (last.left - previous.left) * (y - lastRow) / interval,
        right: last.right + (last.right - previous.right) * (y - lastRow) / interval
      };
    }
    // A solid silhouette deliberately removes any AI-generated white marks.
    for (let index = 0; index < 33; index++) {
      const curvature = (index - 16) / 16;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const draw = canvas.getContext('2d');
      draw.fillStyle = '#000';
      const rows = [];
      for (let y = horizon; y < height; y++) {
        const base = baseRows[y];
        if (!base) continue;
        const depth = (y - horizon) / Math.max(1, height - 1 - horizon);
        const offset = curvature * width * 0.46 * (1 - depth) ** 1.6;
        const left = base.left + offset;
        const right = base.right + offset;
        rows[y] = { left, right, center: (left + right) / 2 };
      }
      this.style.draw(draw, rows, horizon, height);
      this.frames.push({ canvas, rows, horizon, width, height, curvature });
    }
  }

  target(sequence, position) {
    const index = Math.min(sequence.length - 1, Math.floor(position));
    const t = position - index;
    const eased = t * t * (3 - 2 * t);
    const a = this.strengths[sequence[index]] ?? 0;
    const b = this.strengths[sequence[Math.min(index + 1, sequence.length - 1)]] ?? 0;
    return a + (b - a) * eased;
  }

  get(curvature) {
    return this.frames[Math.max(0, Math.min(32, Math.round(curvature * 16 + 16)))];
  }
}
