import { RoadProjection } from './RoadProjection.js';
import { CarAnimation } from './CarAnimation.js';

export class Competitors {
  constructor(sheet, definition) {
    this.cars = [];
    this.countdown = 2;
    this.nextColor = 0;
    this.definition = definition;
    this.frameIndices = {};
    const rects = [];
    for (const direction of ['ferma', 'avanti', 'sinistra', 'destra']) {
      for (const id of definition.animations[direction].frames) {
        this.frameIndices[id] = rects.length;
        rects.push(definition.frames[id].rect);
      }
    }
    const colors = [[255, 213, 0], [235, 42, 37], [255, 132, 0]];
    // Recolor light pixels only; alpha and dark ink stay intact.
    this.sprites = colors.map(color => rects.map(rect => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = Math.round(480 * rect.h / rect.w);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(sheet, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < image.data.length; i += 4) {
        if (!image.data[i + 3]) continue;
        const brightness = (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3;
        const amount = Math.max(0, Math.min(1, (brightness - 35) / 220));
        image.data[i] = Math.round(color[0] * amount);
        image.data[i + 1] = Math.round(color[1] * amount);
        image.data[i + 2] = Math.round(color[2] * amount);
      }
      ctx.putImageData(image, 0, 0);
      return canvas;
    }));
  }

  update(delta, playerSpeed, finished) {
    if (finished) return;
    if (playerSpeed > 15) {
      this.countdown -= delta;
      if (this.countdown <= 0 && this.cars.length < 5) {
        this.cars.push({
          distance: 240 + Math.random() * 100,
          speed: 65 + Math.random() * 45,
          lane: [0.3, 0.5, 0.7][Math.floor(Math.random() * 3)],
          color: this.nextColor++ % 3,
          offset: Math.random() * 600
        });
        this.countdown = 5 + Math.random() * 4;
      }
    }
    for (const car of this.cars) car.distance += (car.speed - playerSpeed) / 3.6 * delta;
    this.cars = this.cars.filter(car => car.distance > -40 && car.distance < 1000);
  }

  draw(ctx, road, width, height, time, foreground = false) {
    const horizon = RoadProjection.top(width, height, road) + road.horizon / road.height * RoadProjection.span(width, height, road);
    const sorted = [...this.cars].sort((a, b) => b.distance - a.distance);
    for (const car of sorted) {
      if ((car.distance < 8) !== foreground) continue;
      const depth = 1 / (1 + car.distance / 100);
      const y = horizon + (height * 0.98 - horizon) * depth;
      const sourceY = Math.max(road.horizon, Math.min(road.height - 1,
        Math.round(((y - RoadProjection.top(width, height, road)) / RoadProjection.span(width, height, road)) * road.height)));
      const row = road.rows[sourceY];
      if (!row) continue;
      const frameId = CarAnimation.frame(this.definition, road.curvature, car.speed, time + car.offset);
      const sprite = this.sprites[car.color][this.frameIndices[frameId]];
      const drawWidth = Math.min(width * 0.36, 360) * depth;
      const drawHeight = drawWidth * sprite.height / sprite.width;
      const x = (row.left + (row.right - row.left) * car.lane) / road.width * width;
      ctx.drawImage(sprite, x - drawWidth / 2, y - drawHeight * this.definition.frames[frameId].anchor.y, drawWidth, drawHeight);
    }
  }
}
