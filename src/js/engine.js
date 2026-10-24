export class InputController {
  constructor() {
    this.keys = new Set();
    this.touch = new Set();
    const block = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
    addEventListener('keydown', (event) => {
      if (block.has(event.code)) event.preventDefault();
      this.keys.add(event.code);
    });
    addEventListener('keyup', (event) => this.keys.delete(event.code));
    document.querySelectorAll('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      const on = (event) => { event.preventDefault(); this.touch.add(control); };
      const off = (event) => { event.preventDefault(); this.touch.delete(control); };
      button.addEventListener('pointerdown', on);
      button.addEventListener('pointerup', off);
      button.addEventListener('pointercancel', off);
      button.addEventListener('pointerleave', off);
    });
  }

  read() {
    const pads = navigator.getGamepads?.() || [];
    const pad = [...pads].find(Boolean);
    const axisX = Math.abs(pad?.axes?.[0] || 0) > .2 ? pad.axes[0] : 0;
    const axisY = Math.abs(pad?.axes?.[1] || 0) > .2 ? pad.axes[1] : 0;
    return {
      left: this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.touch.has('left') || axisX < -.2 || !!pad?.buttons?.[14]?.pressed,
      right: this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.touch.has('right') || axisX > .2 || !!pad?.buttons?.[15]?.pressed,
      accelerate: this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.touch.has('accelerate') || axisY < -.2 || !!pad?.buttons?.[12]?.pressed,
      brake: this.keys.has('ArrowDown') || this.keys.has('KeyS') || this.touch.has('brake') || axisY > .2 || !!pad?.buttons?.[13]?.pressed,
      turbo: this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('Space') || this.touch.has('turbo') || !!pad?.buttons?.[0]?.pressed
    };
  }
}

export class BitmapFont {
  constructor(image, definition) {
    this.image = image;
    this.cellWidth = definition.cellWidth;
    this.cellHeight = definition.cellHeight;
    this.columns = definition.columns;
    this.firstCode = definition.firstCode;
    this.lastCode = definition.lastCode;
  }

  static async load(definitionUrl) {
    const definition = await fetch(definitionUrl).then((response) => response.json());
    const imageUrl = new URL(definition.image, new URL(definitionUrl, location.href));
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    return new BitmapFont(image, definition);
  }

  width(text, scale = 1, spacing = 0) {
    return String(text).length * (this.cellWidth * scale + spacing) - spacing;
  }

  draw(ctx, text, x, y, options = {}) {
    const value = String(text).toUpperCase();
    const scale = options.scale || 1;
    const spacing = options.spacing ?? scale;
    const align = options.align || 'left';
    const mechanical = options.mechanical ?? true;
    const total = this.width(value, scale, spacing);
    let cursor = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    for (let i = 0; i < value.length; i++) {
      const code = Math.max(this.firstCode, Math.min(this.lastCode, value.charCodeAt(i)));
      const index = code - this.firstCode;
      const sx = (index % this.columns) * this.cellWidth;
      const sy = Math.floor(index / this.columns) * this.cellHeight;
      const wobble = mechanical ? (((code * 17 + i * 13) % 7) - 3) * .004 : 0;
      ctx.save();
      ctx.translate(Math.round(cursor + this.cellWidth * scale / 2), Math.round(y + this.cellHeight * scale / 2));
      ctx.rotate(wobble);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.image, sx, sy, this.cellWidth, this.cellHeight, -this.cellWidth * scale / 2, -this.cellHeight * scale / 2, this.cellWidth * scale, this.cellHeight * scale);
      ctx.restore();
      cursor += this.cellWidth * scale + spacing;
    }
  }

  drawRollingNumber(ctx, value, digits, x, y, scale = 1) {
    const height = this.cellHeight * scale;
    const width = this.cellWidth * scale;
    const normalized = Math.max(0, value);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, digits * width, height);
    ctx.clip();
    for (let i = 0; i < digits; i++) {
      const place = 10 ** (digits - i - 1);
      const roll = normalized / place;
      const current = Math.floor(roll) % 10;
      const fraction = roll - Math.floor(roll);
      this.draw(ctx, current, x + i * width, y + fraction * height, { scale, mechanical: false });
      this.draw(ctx, (current + 1) % 10, x + i * width, y - (1 - fraction) * height, { scale, mechanical: false });
    }
    ctx.restore();
  }
}

export function setBitmapText(element, text, size = null) {
  const value = String(text ?? '').toUpperCase();
  if (size) element.dataset.bitmap = size;
  if (element.dataset.bitmapValue === value && element.children.length) return;
  element.dataset.bitmapValue = value;
  element.setAttribute('aria-label', value);
  element.replaceChildren();
  const line = document.createElement('span');
  line.className = 'bitmap-line';
  line.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < value.length; i++) {
    const code = Math.max(32, Math.min(126, value.charCodeAt(i)));
    const index = code - 32;
    const glyph = document.createElement('span');
    glyph.className = 'bitmap-glyph';
    glyph.style.backgroundPosition = `${(index % 16) / 15 * 100}% ${Math.floor(index / 16) / 5 * 100}%`;
    glyph.style.setProperty('--glyph-tilt', `${(((code * 17 + i * 13) % 7) - 3) * .12}deg`);
    line.append(glyph);
  }
  element.append(line);
}

export function hydrateBitmapText(root = document) {
  root.querySelectorAll('[data-bitmap]').forEach((element) => setBitmapText(element, element.textContent, element.dataset.bitmap));
}

export class LayeredRenderer {
  constructor(stack, font) {
    this.stack = stack;
    this.font = font;
    this.layers = {};
    for (const id of ['skyLayer','sceneryLayer','roadLayer','objectLayer','vehicleLayer','hudLayer']) {
      const canvas = document.getElementById(id);
      this.layers[id] = { canvas, ctx: canvas.getContext('2d') };
    }
    this.width = 0;
    this.height = 0;
    this.pixelRatio = 1;
    this.seed = Array.from({ length: 48 }, (_, i) => ((i * 47) % 101) / 101);
    new ResizeObserver(() => this.resize()).observe(stack);
    this.resize();
  }

  resize() {
    const bounds = this.stack.getBoundingClientRect();
    this.pixelRatio = Math.min(devicePixelRatio || 1, 2);
    this.width = Math.max(320, Math.round(bounds.width));
    this.height = Math.max(240, Math.round(bounds.height));
    for (const { canvas, ctx } of Object.values(this.layers)) {
      canvas.width = this.width * this.pixelRatio;
      canvas.height = this.height * this.pixelRatio;
      ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      ctx.imageSmoothingEnabled = true;
    }
  }

  clear(ctx) { ctx.clearRect(0, 0, this.width, this.height); }

  render(game) {
    const curve = game.curve;
    this.drawSky(game);
    this.drawScenery(game, curve);
    this.drawRoad(game, curve);
    this.drawObjects(game, curve);
    this.drawVehicle(game);
    this.drawHud(game);
  }

  drawSky(game) {
    const { ctx } = this.layers.skyLayer;
    this.clear(ctx);
    ctx.fillStyle = '#f8f6ef';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.strokeStyle = 'rgba(23,23,23,.13)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 44; i++) {
      const x = this.seed[i] * this.width;
      const y = this.seed[(i + 11) % this.seed.length] * this.height * .62;
      ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + 2, y + 1); ctx.stroke();
    }
    const sunX = this.width * .74 - game.distance * .012 % (this.width * .1);
    const sunY = this.height * .18;
    ctx.beginPath(); ctx.arc(sunX, sunY, this.height * .065, 0, Math.PI * 2);
    ctx.fillStyle = '#dedbd2'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#171717'; ctx.stroke();
  }

  drawScenery(game, curve) {
    const { ctx } = this.layers.sceneryLayer;
    this.clear(ctx);
    const horizon = this.height * .38;
    const offset = -(game.distance * .05 + curve * 80) % (this.width * .46);
    ctx.fillStyle = '#d8d5cd'; ctx.strokeStyle = '#171717'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, horizon + 36);
    for (let x = -this.width * .5 + offset; x < this.width * 1.5; x += this.width * .18) {
      ctx.lineTo(x, horizon + 20); ctx.lineTo(x + this.width * .09, horizon - 50 - ((x / 7) % 42)); ctx.lineTo(x + this.width * .18, horizon + 22);
    }
    ctx.lineTo(this.width, this.height); ctx.lineTo(0, this.height); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#efede6';
    ctx.beginPath(); ctx.moveTo(0, horizon + 40);
    for (let x = -80 - offset * .35; x < this.width + 100; x += 120) {
      ctx.quadraticCurveTo(x + 58, horizon - 5, x + 120, horizon + 38);
    }
    ctx.lineTo(this.width, this.height); ctx.lineTo(0, this.height); ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  roadCenterAt(t, curve, playerX = 0) {
    const sway = curve * Math.pow(1 - t, 2) * this.width * .52;
    return this.width / 2 + sway - playerX * (1 - t) * this.width * .07;
  }

  drawRoad(game, curve) {
    const { ctx } = this.layers.roadLayer;
    this.clear(ctx);
    const horizon = this.height * .405;
    const bottom = this.height * 1.04;
    const strips = 34;
    for (let i = strips - 1; i >= 0; i--) {
      const t1 = i / strips, t2 = (i + 1) / strips;
      const y1 = horizon + Math.pow(t1, 1.65) * (bottom - horizon);
      const y2 = horizon + Math.pow(t2, 1.65) * (bottom - horizon);
      const half1 = (12 + Math.pow(t1, 1.5) * this.width * .42);
      const half2 = (12 + Math.pow(t2, 1.5) * this.width * .42);
      const c1 = this.roadCenterAt(t1, curve, game.playerX);
      const c2 = this.roadCenterAt(t2, curve, game.playerX);
      const stripe = (Math.floor(i + game.distance * .08) % 2) === 0;
      ctx.fillStyle = stripe ? '#363636' : '#2b2b2b';
      ctx.beginPath(); ctx.moveTo(c1-half1,y1); ctx.lineTo(c1+half1,y1); ctx.lineTo(c2+half2,y2); ctx.lineTo(c2-half2,y2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = stripe ? '#f7f4eb' : '#c7c3ba'; ctx.lineWidth = Math.max(1, t2 * 7);
      ctx.beginPath(); ctx.moveTo(c1-half1,y1); ctx.lineTo(c2-half2,y2); ctx.moveTo(c1+half1,y1); ctx.lineTo(c2+half2,y2); ctx.stroke();
      if (stripe) {
        ctx.strokeStyle = '#f3f0e8'; ctx.lineWidth = Math.max(1, t2 * 4);
        ctx.beginPath(); ctx.moveTo(c1,y1); ctx.lineTo(c2,y2); ctx.stroke();
      }
    }
    ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(23,23,23,.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, horizon); ctx.lineTo(this.width, horizon); ctx.stroke(); ctx.setLineDash([]);
  }

  drawObjects(game, curve) {
    const { ctx } = this.layers.objectLayer;
    this.clear(ctx);
    const horizon = this.height * .405;
    const objects = game.stage.objects;
    for (let i = 0; i < 18; i++) {
      const phase = ((i / 18 + game.distance * .0008) % 1 + 1) % 1;
      const t = .08 + phase * .9;
      const y = horizon + Math.pow(t, 1.65) * (this.height * .64);
      const roadHalf = 16 + Math.pow(t, 1.5) * this.width * .42;
      const side = i % 2 ? 1 : -1;
      const x = this.roadCenterAt(t, curve, game.playerX) + side * (roadHalf + 20 + t * 62);
      const scale = .25 + t * 1.15;
      this.drawRoadside(ctx, objects[i % objects.length], x, y, scale, side);
    }
  }

  drawRoadside(ctx, type, x, y, scale, side) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * side, scale); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#171717'; ctx.lineWidth = 3 / scale;
    if (type === 'sign') {
      ctx.fillStyle = '#f8f6ef'; ctx.fillRect(-19,-57,38,28); ctx.strokeRect(-19,-57,38,28); ctx.beginPath(); ctx.moveTo(0,-29); ctx.lineTo(0,0); ctx.stroke();
      ctx.translate(-14, -51); ctx.scale(side, 1); this.font.draw(ctx, 'RUN', 0, 0, { scale: .6, mechanical: false });
    } else if (type === 'rock') {
      ctx.fillStyle='#bcb9b1'; ctx.beginPath(); ctx.moveTo(-28,0);ctx.lineTo(-17,-25);ctx.lineTo(7,-32);ctx.lineTo(30,-7);ctx.lineTo(24,0);ctx.closePath();ctx.fill();ctx.stroke();
    } else if (type === 'barn') {
      ctx.fillStyle='#dad7cf'; ctx.beginPath();ctx.moveTo(-29,0);ctx.lineTo(-29,-34);ctx.lineTo(0,-57);ctx.lineTo(29,-34);ctx.lineTo(29,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeRect(-8,-24,16,24);
    } else if (type === 'lighthouse') {
      ctx.fillStyle='#f8f6ef';ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(-9,-64);ctx.lineTo(9,-64);ctx.lineTo(14,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#171717';ctx.fillRect(-16,-77,32,13);ctx.strokeRect(-16,-77,32,13);
    } else if (type === 'cactus') {
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-58);ctx.moveTo(0,-35);ctx.lineTo(-13,-35);ctx.lineTo(-13,-47);ctx.moveTo(0,-22);ctx.lineTo(15,-22);ctx.lineTo(15,-38);ctx.stroke();
    } else if (type === 'palm') {
      ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(8,-38,0,-70);ctx.moveTo(0,-70);for(let a=-2.7;a<.3;a+=.6){ctx.moveTo(0,-70);ctx.lineTo(Math.cos(a)*34, -70+Math.sin(a)*18);}ctx.stroke();
    } else {
      const pine = type === 'pine'; ctx.fillStyle='#c9c6be';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-54);ctx.stroke();
      if(pine){for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(-22+k*4,-18-k*15);ctx.lineTo(0,-55-k*5);ctx.lineTo(22-k*4,-18-k*15);ctx.closePath();ctx.fill();ctx.stroke();}}
      else {ctx.beginPath();ctx.arc(0,-52,25,0,Math.PI*2);ctx.fill();ctx.stroke();}
    }
    ctx.restore();
  }

  drawVehicle(game) {
    const { ctx } = this.layers.vehicleLayer;
    this.clear(ctx);
    const x = this.width / 2 + game.playerX * this.width * .21;
    const y = this.height * .84 + Math.sin(game.clock * .012) * Math.min(2, game.speed / 70);
    const s = Math.max(.7, Math.min(1.2, this.width / 900));
    ctx.save(); ctx.translate(x, y); ctx.rotate(game.steer * -.035); ctx.scale(s,s); ctx.lineJoin='round'; ctx.strokeStyle='#171717'; ctx.lineWidth=4;
    ctx.fillStyle='rgba(23,23,23,.18)';ctx.beginPath();ctx.ellipse(0,9,76,15,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f6f3eb';ctx.beginPath();ctx.moveTo(-70,0);ctx.lineTo(-57,-42);ctx.lineTo(-30,-61);ctx.lineTo(32,-61);ctx.lineTo(60,-40);ctx.lineTo(70,0);ctx.lineTo(54,13);ctx.lineTo(-54,13);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#313131';ctx.beginPath();ctx.moveTo(-34,-55);ctx.lineTo(-22,-76);ctx.lineTo(22,-76);ctx.lineTo(36,-55);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#171717';ctx.fillRect(-48,-15,96,18);ctx.fillStyle='#f6f3eb';ctx.fillRect(-22,-10,44,7);
    ctx.fillStyle='#171717';ctx.beginPath();ctx.arc(-52,9,13,0,Math.PI*2);ctx.arc(52,9,13,0,Math.PI*2);ctx.fill();
    if(game.turbo && game.speed > 30){ctx.strokeStyle='#171717';ctx.lineWidth=3;for(let i=-1;i<=1;i+=2){ctx.beginPath();ctx.moveTo(i*23,16);ctx.lineTo(i*18,35+Math.random()*11);ctx.stroke();}}
    ctx.restore();
  }

  drawHud(game) {
    const { ctx } = this.layers.hudLayer;
    this.clear(ctx);
    ctx.fillStyle='rgba(248,246,239,.88)';ctx.strokeStyle='#171717';ctx.lineWidth=2;
    ctx.fillRect(14,14,135,62);ctx.strokeRect(14,14,135,62);
    ctx.fillStyle='#171717';
    this.font.draw(ctx, 'KM/H', 23, 23, { scale: .72 });
    this.font.drawRollingNumber(ctx, game.displaySpeed, 3, 22, 45, 1.55);
    const progress = Math.min(1, game.stageDistance / game.stage.miles);
    const w = Math.min(260, this.width * .34);const x=this.width-w-16;
    ctx.fillStyle='rgba(248,246,239,.88)';ctx.fillRect(x,14,w,32);ctx.strokeRect(x,14,w,32);ctx.fillStyle='#171717';ctx.fillRect(x+6,20,(w-12)*progress,20);
    if (progress > .45) ctx.globalCompositeOperation = 'difference';
    this.font.draw(ctx, `STAGE ${game.stageNumber}/5`, x + w / 2, 22, { scale: .72, align: 'center' });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle='rgba(248,246,239,.88)';ctx.fillRect(14,84,205,39);ctx.strokeRect(14,84,205,39);
    this.font.draw(ctx, 'SCORE', 22, 95, { scale: .62 });
    this.font.drawRollingNumber(ctx, game.displayScore, 7, 88, 92, .92);
    if(game.turbo && game.speed > game.baseMaxSpeed){ctx.save();ctx.translate(this.width/2,this.height*.16);ctx.rotate(-.035);this.font.draw(ctx,'PAPER BOOST!',0,0,{scale:1.35,align:'center'});ctx.restore();}
  }
}
