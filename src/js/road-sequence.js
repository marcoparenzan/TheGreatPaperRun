export class RoadSequencePlayer {
  constructor(map, options = {}) {
    if (!Array.isArray(map?.sequence) || map.sequence.length === 0) {
      throw new TypeError('Road map must contain a non-empty sequence array.');
    }
    this.sequence = map.sequence;
    this.stepDistance = options.stepDistance ?? map.stepDistance ?? 1;
    this.loop = options.loop ?? false;
    this.position = 0;
  }

  get index() {
    return Math.min(this.sequence.length - 1, Math.floor(this.position));
  }

  get key() {
    return this.sequence[this.index];
  }

  get finished() {
    return !this.loop && this.position >= this.sequence.length - 1;
  }

  reset(position = 0) {
    this.position = Math.max(0, Math.min(position, this.sequence.length - 1));
    return this.key;
  }

  update(deltaSeconds, carSpeed) {
    const distance = Math.max(0, carSpeed) * Math.max(0, deltaSeconds);
    this.position += distance / this.stepDistance;
    if (this.loop) {
      this.position %= this.sequence.length;
    } else {
      this.position = Math.min(this.position, this.sequence.length - 1);
    }
    return this.key;
  }
}

export async function loadRoadSequence(url, options) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Cannot load road map: ${response.status}`);
  return new RoadSequencePlayer(await response.json(), options);
}
