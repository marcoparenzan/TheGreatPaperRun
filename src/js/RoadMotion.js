import { RoadMarkings } from './RoadMarkings.js';

import { RoadProjection } from './RoadProjection.js';

export class RoadMotion {
  constructor() {
    this.markings = new RoadMarkings();
  }

  draw(ctx, frame, width, height, distance) {
    ctx.drawImage(frame.canvas, 0, RoadProjection.top(width, height, frame), width, RoadProjection.span(width, height, frame));
    this.markings.draw(ctx, frame, width, height, distance);
  }
}
