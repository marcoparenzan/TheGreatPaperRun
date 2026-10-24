import { RaceConfig } from './RaceConfig.js?v=elevation-5';
import { CarSelection } from './CarSelection.js';
import { CarPaint } from './CarPaint.js';

export class GameSetup {
  constructor() {
    this.config = new RaceConfig();
    this.status = document.getElementById('setup-status');
    document.getElementById('start').onclick = () => { location.hash = 'setup'; };
    document.getElementById('back').onclick = () => { location.hash = ''; };
    window.addEventListener('hashchange', () => this.screen());
    document.getElementById('circuit').onchange = () => this.weather();
    document.getElementById('race-form').onsubmit = event => this.start(event);
    this.screen(); this.load();
  }

  screen() {
    const setup = location.hash === '#setup';
    document.getElementById('title-screen').hidden = setup;
    document.getElementById('setup-screen').hidden = !setup;
  }

  async load() {
    try {
      this.manifest = await this.config.manifest();
      for (const car of this.manifest.cars) {
        const label = document.createElement('label');
        label.className = 'relative block border-2 border-stone-300 bg-white rounded-xl p-5 cursor-pointer';
        if (!car.available) label.classList.add('opacity-50', 'cursor-not-allowed');
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'car'; radio.value = car.id; radio.disabled = !car.available;
        radio.checked = car.id === this.manifest.defaultCar && car.available;
        radio.className = 'mr-2';
        const title = document.createElement('span'); title.textContent = car.name; title.className = 'font-bold';
        const subtitle = document.createElement('p'); subtitle.className = 'text-sm text-stone-500 mt-2';
        subtitle.textContent = car.available ? 'Pronta a partire' : 'In preparazione';
        label.append(radio, title, subtitle);
        radio.onchange = () => this.highlight('car');
        document.getElementById('cars').append(label);
        if (car.available) this.preview(car, label);
      }
      const circuitSelect = document.getElementById('circuit');
      for (const circuit of this.manifest.circuits) {
        const option = document.createElement('option'); option.value = circuit.id; option.textContent = circuit.name; circuitSelect.append(option);
      }
      circuitSelect.value = this.manifest.defaultCircuit;
      const backgrounds = document.getElementById('background');
      const automatic = document.createElement('option'); automatic.value = ''; automatic.textContent = 'Fondale della pista'; backgrounds.append(automatic);
      for (const background of this.manifest.backgrounds) {
        const option = document.createElement('option'); option.value = background.id; option.textContent = background.name; backgrounds.append(option);
      }
      this.highlight('car'); this.weather();
      document.getElementById('race-button').disabled = false;
      this.status.textContent = 'I circuiti sono versioni semplificate. Il clima cambia palette e fondale, non l’aderenza.';
    } catch(error) { this.status.textContent = `Errore di configurazione: ${error.message}`; }
  }

  async preview(car, label) {
    try {
      const { definition, sheet } = await new CarSelection().load(new URL(car.file, this.config.url));
      const rect = definition.frames[definition.animations.ferma.frames[0]].rect;
      const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 200; canvas.className = 'w-full mt-2';
      canvas.setAttribute('aria-label', car.name);
      const scale = Math.min(canvas.width / rect.w, canvas.height / rect.h);
      const paint = new CarPaint(sheet);
      const draw = () => {
        paint.setColor(document.getElementById('car-color').value);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(paint.frame(rect), (320-rect.w*scale)/2, 0, rect.w*scale, rect.h*scale);
      };
      document.getElementById('car-color').addEventListener('input', draw);
      draw();
      label.append(canvas);
    } catch(error) { console.warn('Anteprima auto non disponibile:', error); }
  }

  highlight(name) {
    for (const radio of document.querySelectorAll(`input[name="${name}"]`)) {
      radio.parentElement.classList.toggle('border-orange-600', radio.checked);
      radio.parentElement.classList.toggle('ring-2', radio.checked);
      radio.parentElement.classList.toggle('ring-orange-300', radio.checked);
    }
  }

  weather() {
    const previous = document.querySelector('input[name="weather"]:checked')?.value || this.manifest.defaultWeather;
    const circuit = this.manifest.circuits.find(item => item.id === document.getElementById('circuit').value);
    document.getElementById('circuit-info').textContent = `${circuit.lengthMeters.toLocaleString('it-IT')} metri · circuito chiuso · fondale a 360°`;
    const container = document.getElementById('weather'); container.replaceChildren();
    for (const id of circuit.styles) {
      const label = document.createElement('label'); label.className = 'border-2 border-stone-300 rounded-lg p-3 cursor-pointer';
      const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'weather'; radio.value = id;
      radio.checked = id === previous; radio.className = 'mr-2';
      label.append(radio, this.manifest.styles[id].name); container.append(label);
      radio.onchange = () => this.palette();
    }
    if (!container.querySelector(':checked')) container.querySelector('input').checked = true;
    this.palette();
  }

  palette() {
    this.highlight('weather');
    const id = document.querySelector('input[name="weather"]:checked').value;
    const style = this.manifest.styles[id];
    document.getElementById('palette').style.background = `linear-gradient(to bottom, ${style.sky} 0%, ${style.sky} 59%, ${style.horizon} 59%, ${style.horizon} 62%, ${style.grass} 62%, ${style.grass} 100%)`;
  }

  start(event) {
    event.preventDefault();
    if (!this.manifest) return;
    const car = document.querySelector('input[name="car"]:checked')?.value;
    const weather = document.querySelector('input[name="weather"]:checked')?.value;
    if (!car || !weather) return;
    const query = new URLSearchParams({ car, circuit: document.getElementById('circuit').value, weather, color: document.getElementById('car-color').value });
    const background = document.getElementById('background').value;
    if (background) query.set('background', background);
    location.href = `play.html?${query}`;
  }
}
