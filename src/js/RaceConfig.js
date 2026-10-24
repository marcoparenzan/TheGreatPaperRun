export class RaceConfig {
  constructor() { this.url = new URL('../assets/circuits/manifest.json', import.meta.url); }

  async json(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Configurazione non disponibile: ${response.status}`);
    return response.json();
  }

  async manifest() { return this.json(this.url); }

  async loadRace() {
    const manifest = await this.manifest();
    const params = new URLSearchParams(location.search);
    const circuit = manifest.circuits.find(item => item.id === (params.get('circuit') || manifest.defaultCircuit));
    const car = manifest.cars.find(item => item.id === (params.get('car') || manifest.defaultCar) && item.available);
    const weatherId = params.get('weather') || manifest.defaultWeather;
    const weather = manifest.styles[weatherId];
    const requestedColor = params.get('color') || '#ffffff';
    const carColor = /^#[0-9a-f]{6}$/i.test(requestedColor) ? requestedColor : '#ffffff';
    if (!circuit || !car || !weather || !circuit.styles.includes(weatherId)) throw new Error('Selezione di gara non valida. Torna al menu.');
    const backgroundId = params.get('background');
    const background = backgroundId ? manifest.backgrounds.find(item => item.id === backgroundId) : null;
    if (backgroundId && !background) throw new Error('Ambientazione non valida');
    const definition = await this.json(new URL(circuit.file, this.url));
    return { circuit: definition, carUrl: new URL(car.file, this.url), backgroundUrl: new URL(background?.file || circuit.background, this.url), weather, weatherId, carColor, styles: manifest.styles, allowedStyles: circuit.styles };
  }
}
