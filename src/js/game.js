import { SunAnimation } from './SunAnimation.js';
import { RoadMotion } from './RoadMotion.js';
import { RoadCurveFrames } from './RoadCurveFrames.js';
import { SceneBackground } from './SceneBackground.js?v=elevation-5';
import { Competitors } from './Competitors.js';
import { Circuit } from './Circuit.js';
import { RoadProjection } from './RoadProjection.js';
import { CarSelection } from './CarSelection.js';
import { CarAnimation } from './CarAnimation.js';
import { PanoramaParallax } from './PanoramaParallax.js';
import { BackgroundMusic } from './BackgroundMusic.js';
import { RaceConfig } from './RaceConfig.js?v=elevation-5';
import { WeatherControl } from './WeatherControl.js';
import { CarPaint } from './CarPaint.js';

const configuration = await new RaceConfig().loadRace();
const mountains = new PanoramaParallax();
mountains.filter = configuration.weather.backgroundFilter;
const circuit = new Circuit(configuration.circuit);
const background = new SceneBackground(configuration.weather);
new WeatherControl(configuration, style => {
  background.style = style;
  mountains.filter = style.backgroundFilter;
});
const curves = new RoadCurveFrames();
const roadMotion = new RoadMotion();
const sun = new SunAnimation();
const canvas = document.getElementById('road');
const ctx = canvas.getContext('2d', { alpha: false });
const music = new BackgroundMusic();

const { definition: carDefinition, sheet: carSheet } = await new CarSelection().load(configuration.carUrl);
await Promise.all([curves.load(), carSheet.decode(), mountains.load(configuration.backgroundUrl).catch(error => {
  console.warn('Montagne non disponibili:', error);
}), sun.load().catch(error => {
  console.warn('Animazione del sole non disponibile:', error);
})]);

const paint = new CarPaint(carSheet, configuration.carColor);
paint.controls();
const competitors = new Competitors(carSheet, carDefinition);
const roadSequence = circuit.sequence;
const keys = new Set();
const game = {
  speed: 0,
  distance: 0,
  routePosition: 0,
  curvature: 0,
  finished: false,
  playerX: 0,
  steer: 0,
  lateralVelocity: 0,
  lastTime: 0
};

addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD'].includes(event.code)) {
    event.preventDefault();
    keys.add(event.code);
  }
});
addEventListener('keyup', (event) => keys.delete(event.code));

const c3Frames = carDefinition.animations.avanti.frames.map((frameId) => carDefinition.frames[frameId].rect);

RoadProjection.carRatio = c3Frames[0].h / c3Frames[0].w;

let width = 0;
let height = 0;
let pixelRatio = 1;

function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = Math.max(1, bounds.width);
  height = Math.max(1, bounds.height);
  pixelRatio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
}

function drawCar(time) {
  const frameId = CarAnimation.frame(carDefinition, game.steer / 0.4, game.speed, time);
  const frame = carDefinition.frames[frameId].rect;
  const drawWidth = Math.min(width * 0.36, 360);
  const drawHeight = drawWidth * frame.h / frame.w;
  const drawX = (width - drawWidth) / 2 + game.playerX * width * 0.2;
  const drawY = height * 0.98 - drawHeight * carDefinition.frames[frameId].anchor.y;
  ctx.drawImage(paint.frame(frame), drawX, drawY, drawWidth, drawHeight);
}

function update(deltaSeconds) {
  if (game.finished) {
    game.speed = 0;
    return;
  }
  const accelerate = keys.has('ArrowUp') || keys.has('KeyW');
  const brake = keys.has('ArrowDown') || keys.has('KeyS');
  const steerLeft = keys.has('ArrowLeft') || keys.has('KeyA');
  const steerRight = keys.has('ArrowRight') || keys.has('KeyD');
  const throttle = accelerate ? 1 : 0;
  const braking = brake ? 1 : 0;
  const steering = (steerRight ? 1 : 0) - (steerLeft ? 1 : 0);

  game.speed += (throttle * 95 - braking * 180 - game.speed * 0.22) * deltaSeconds;
  game.speed = Math.max(0, Math.min(200, game.speed));
  game.steer += (steering * 2.8 - game.steer * 7) * deltaSeconds;
  // Arcade centrifugal drift: opposite the bend, proportional to speed squared.
  const outwardForce = -game.curvature * (game.speed / 200) ** 2 * 2.4;
  game.lateralVelocity += (outwardForce - game.lateralVelocity * 3.5) * deltaSeconds;
  game.playerX += (game.steer * (0.35 + game.speed / 180) + game.lateralVelocity) * deltaSeconds;
  game.playerX = Math.max(-1, Math.min(1, game.playerX));
  game.distance += game.speed / 3.6 * deltaSeconds;
  game.routePosition = (game.distance % circuit.length) / circuit.length * roadSequence.length;
}

function render(time) {
  const deltaSeconds = game.lastTime ? Math.min(0.05, (time - game.lastTime) / 1000) : 0;
  game.lastTime = time;
  update(deltaSeconds);
  competitors.update(deltaSeconds, game.speed, game.finished);
  const targetCurve = curves.target(roadSequence, game.routePosition);
  game.curvature += (targetCurve - game.curvature) * (1 - Math.exp(-game.speed * deltaSeconds / 45));
  const current = curves.get(game.curvature);
  const slope = circuit.grade(game.distance + 25);
  const targetPitch = Math.max(-0.12, Math.min(0.12, -Math.atan(slope) * 0.8));
  RoadProjection.pitch += (targetPitch - RoadProjection.pitch) * (1 - Math.exp(-deltaSeconds * 2.5));

  ctx.globalAlpha = 1;
  background.draw(ctx, width, height, current);
  const heading = circuit.heading(game.distance) + game.steer * 8;
  const panoramaWidth = mountains.ready
    ? Math.min(220, height * 0.23) * mountains.image.naturalWidth / mountains.visibleHeight
    : width * 2;
  if (configuration.weather.showSun) sun.draw(ctx, width, height, time, heading, panoramaWidth);
  mountains.draw(ctx, width, height, current, heading);
  roadMotion.draw(ctx, current, width, height, game.distance * 3.6, game.speed);
  circuit.draw(ctx, current, width, height, game.distance, game.speed);
  competitors.draw(ctx, current, width, height, time);
  drawCar(time);
  competitors.draw(ctx, current, width, height, time, true);

  requestAnimationFrame(render);
}

addEventListener('resize', resize, { passive: true });
window.visualViewport?.addEventListener('resize', resize, { passive: true });
new ResizeObserver(resize).observe(canvas.parentElement);
resize();
requestAnimationFrame(render);
