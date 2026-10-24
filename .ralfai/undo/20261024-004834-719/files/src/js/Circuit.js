import { RoadProjection } from './RoadProjection.js';

export class Circuit {
  constructor(definition) {
    this.name = definition.name;
    this.markerSpacing = definition.markerSpacingMeters;
    this.sections = definition.sections.map(section => [section.name, section.weight, section.curve]);
    const originalLength = this.sections.reduce((sum, section) => sum + section[1], 0);
    this.sequence = this.sections.flatMap(section => Array(Math.max(1, Math.round(section[1] / 10))).fill(section[2]));
    this.length = definition.lengthMeters;
    this.sections = this.sections.map(([name, length, curve]) => [name, length * this.length / originalLength, curve]);
  }

  heading(distance) {
    // Approximate circuit bearings; normalize net right-hand turn to 360° per lap.
    const strength = { straight: 0, left_gentle: -0.25, left_medium: -0.55, left_hard: -1, right_gentle: 0.25, right_medium: 0.55, right_hard: 1 };
    const total = this.sections.reduce((sum, [, length, curve]) => sum + length * strength[curve], 0);
    let remaining = ((distance % this.length) + this.length) % this.length;
    let turn = 0;
    for (const [, length, curve] of this.sections) {
      const traveled = Math.min(length, remaining);
      turn += traveled * strength[curve];
      remaining -= traveled;
      if (remaining <= 0) break;
    }
    return turn / total * 360;
  }

  draw(ctx, road, width, height, distance, speed) {
    const position = distance % this.length;
    const lap = Math.floor(distance / this.length) + 1;
    const spacing = this.markerSpacing;
    const markers = [];
    const lapStart = Math.floor(distance / this.length) * this.length;
    for (let nextLap = 0; nextLap <= 1; nextLap++) {
      for (let meters = spacing; meters < this.length; meters += spacing) {
        const ahead = lapStart + nextLap * this.length + meters - distance;
        if (ahead > 0 && ahead <= 1300) markers.push({ ahead, meters });
      }
      const ahead = lapStart + (nextLap + 1) * this.length - distance;
      if (ahead > 0 && ahead <= 1300) markers.push({ ahead, meters: this.length });
    }
    markers.sort((a, b) => b.ahead - a.ahead);
    ctx.save();
    for (const { ahead, meters } of markers) {
      const depth = 1 / (1 + ahead / 90);
      const sourceY = Math.min(road.height - 1, Math.round(road.horizon + depth * (road.height - 1 - road.horizon)));
      const row = road.rows[sourceY];
      if (!row) continue;
      const y = RoadProjection.top(width, height, road) + sourceY / road.height * RoadProjection.span(width, height, road);
      const size = Math.max(14, Math.min(110, width * 0.12) * depth);
      const done = `${meters} m fatti`;
      const left = `${this.length - meters} m restano`;
      for (const edge of [row.left, row.right]) {
        const outward = edge === row.left ? -1 : 1;
        const x = edge / road.width * width + outward * size * 0.85;
        ctx.strokeStyle = '#111';
        ctx.lineWidth = Math.max(1, depth * 3);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - size * 1.4); ctx.stroke();
        ctx.fillStyle = '#fff';
        const boardWidth = size * 2.4;
        ctx.fillRect(x - boardWidth / 2, y - size * 1.7, boardWidth, size);
        ctx.strokeRect(x - boardWidth / 2, y - size * 1.7, boardWidth, size);
        ctx.fillStyle = '#111';
        ctx.font = `bold ${Math.max(5, size * 0.25)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(done, x, y - size * 1.4, boardWidth - 4);
        ctx.fillText(left, x, y - size * 1.0, boardWidth - 4);
      }
    }
    let remaining = position;
    let sectionName = this.sections[0][0];
    for (const [name, length] of this.sections) {
      if (remaining < length) { sectionName = name; break; }
      remaining -= length;
    }
    const panelWidth = Math.min(width - 24, 390);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fillRect(12, 12, panelWidth, 112);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, panelWidth, 112);
    ctx.fillStyle = '#111'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(`${this.name.toUpperCase()} · GIRO ${lap}`, 24, 38);
    ctx.font = '14px sans-serif';
    ctx.fillText(`${Math.round(speed)} km/h · ${sectionName}`, 24, 61, panelWidth - 24);
    ctx.fillText(`${Math.floor(position)} m fatti · ${Math.ceil(this.length - position)} m mancanti`, 24, 82, panelWidth - 24);
    ctx.fillStyle = '#ddd'; ctx.fillRect(24, 96, panelWidth - 24, 12);
    ctx.fillStyle = '#111'; ctx.fillRect(24, 96, (panelWidth - 24) * position / this.length, 12);
    ctx.restore();
  }
}
