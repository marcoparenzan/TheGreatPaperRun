import { RoadProjection } from './RoadProjection.js';

export class RoadMarkings {
  draw(ctx, road, width, height, distance) {
    const scaleX = width / road.width;
    const scaleY = RoadProjection.span(width, height, road) / road.height;
    const top = RoadProjection.top(width, height, road);
    const phase = distance / 22;
    // Small flat black lozenges on white paper, not upright posts.
    const depths = Array.from({ length: 26 }, (_, i) => {
      const z = ((i - phase) % 26 + 26) % 26;
      return 1 / (1 + z * 0.60);
    }).sort((a, b) => a - b);
    ctx.fillStyle = '#111';
    for (const depth of depths) {
      const sourceY = Math.min(road.height - 1, Math.round(road.horizon + depth * (road.height - 1 - road.horizon)));
      const row = road.rows[sourceY];
      if (!row) continue;
      const y = top + sourceY * scaleY;
      const roadWidth = (row.right - row.left) * scaleX;
      const rx = Math.max(0.6, roadWidth * 0.012);
      const ry = Math.max(0.3, height * 0.025 * depth * depth);
      // Use the same lateral reference as the sign poles, then move inward.
      const poleSize = Math.max(14, Math.min(110, width * 0.12) * depth);
      for (const side of [-1, 1]) {
        const edgeX = (side < 0 ? row.left : row.right) * scaleX;
        const poleX = edgeX + side * poleSize * 0.85;
        const x = poleX - side * (poleSize * 0.85 + roadWidth * 0.04);
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
