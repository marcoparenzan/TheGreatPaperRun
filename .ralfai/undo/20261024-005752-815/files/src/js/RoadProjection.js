export class RoadProjection {
  static carRatio = 0.5;

  static top(width, height, road) {
    const carHeight = Math.min(width * 0.36, 360) * this.carRatio;
    const horizon = height * 0.98 - carHeight * (880 / 1024 - 0.5);
    const fraction = road.horizon / road.height;
    return (horizon - height * fraction) / (1 - fraction);
  }

  static span(width, height, road) {
    return height - this.top(width, height, road);
  }
}
