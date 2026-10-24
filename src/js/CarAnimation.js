export class CarAnimation {
  static frame(definition, steering, speed, time) {
    const direction = steering < -0.08 ? 'sinistra' : steering > 0.08 ? 'destra' : null;
    let animation;
    if (direction) {
      const level = Math.min(3, Math.floor(Math.min(1, Math.abs(steering)) * 4));
      animation = definition.animations[`${direction}_livello_${level}`];
    } else {
      animation = definition.animations[speed > 0.5 ? 'avanti' : 'ferma'];
    }
    const index = speed > 0.5 ? Math.floor(time / animation.frameDurationMs) % animation.frames.length : 0;
    return animation.frames[index];
  }
}
