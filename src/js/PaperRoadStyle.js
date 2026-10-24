export class PaperRoadStyle {
  draw(ctx, rows, horizon, height) {
    const points = [];
    for (let y = horizon; y < height; y++) {
      const row = rows[y];
      if (!row) continue;
      const depth = (y - horizon) / Math.max(1, height - horizon);
      // Fixed irregularities stay coherent between curvature frames.
      const grain = (Math.sin(y * 0.31) + 0.45 * Math.sin(y * 0.89)) * (0.25 + depth * 1.1);
      points.push({ y, left: row.left + grain, right: row.right - grain * 0.75, depth });
    }
    if (!points.length) return;
    // Close the paper outside the canvas, avoiding a subpixel gap at the bottom.
    const bottom = points[points.length - 1];
    points.push({ ...bottom, y: height + 2, depth: 1 });
    const outline = new Path2D();
    outline.moveTo(points[0].left, points[0].y);
    for (const p of points) outline.lineTo(p.left, p.y);
    for (let i = points.length - 1; i >= 0; i--) outline.lineTo(points[i].right, points[i].y);
    outline.closePath();
    ctx.save();
    ctx.translate(3, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fill(outline);
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.fill(outline);
    ctx.strokeStyle = '#151515';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    // Only the long cut edges get ink; no horizontal seam at the bottom.
    for (const side of ['left', 'right']) {
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        ctx.lineWidth = 0.7 + b.depth * 2.5 + Math.sin(b.y * 0.13) * b.depth * 0.35;
        ctx.beginPath();
        ctx.moveTo(a[side], a.y);
        ctx.lineTo(b[side], b.y);
        ctx.stroke();
      }
    }
  }
}
