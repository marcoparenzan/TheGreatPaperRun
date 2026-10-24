export class CarSelection {
  async load(url = new URL('../assets/cars/c3_spritesheet_8192_wheelanim.json', import.meta.url)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Auto non disponibile: ${response.status}`);
    const definition = await response.json();
    const sheet = new Image();
    sheet.src = new URL(definition.meta.image, url).href;
    await sheet.decode();
    if (sheet.naturalWidth !== definition.meta.size.w || sheet.naturalHeight !== definition.meta.size.h) throw new Error('Dimensioni sprite non coerenti con il JSON');
    return { definition, sheet };
  }

  async loadRandom() { return this.load(); }
}
