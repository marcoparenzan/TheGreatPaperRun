import { RoadProjection } from './RoadProjection.js';

export class SceneBackground {
  constructor(style = { sky: '#99d8f2', grass: '#8abc72', horizon: '#000' }) { this.style = style; }

  draw(ctx, width, height, roadFrame) {
    const horizon = RoadProjection.top(width, height, roadFrame) + roadFrame.horizon / roadFrame.height * RoadProjection.span(width, height, roadFrame);
    ctx.fillStyle = this.style.sky;
    ctx.fillRect(0, 0, width, horizon);
    ctx.fillStyle = this.style.grass;
    ctx.fillRect(0, horizon, width, height - horizon);
    ctx.save();
    ctx.strokeStyle = this.style.horizon;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(width, horizon); ctx.stroke();
    ctx.restore();
  }
}
