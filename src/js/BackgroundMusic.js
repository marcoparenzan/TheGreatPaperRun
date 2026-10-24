export class BackgroundMusic {
  constructor() {
    this.audio = new Audio(new URL('../assets/audio/The Cannonball Run.mp3', import.meta.url).href);
    this.audio.loop = true;
    this.audio.volume = 0.25;
    this.audio.preload = 'metadata';
    this.started = false;
    this.pending = false;
    const panel = document.createElement('aside');
    panel.className = 'fixed top-3 right-3 z-20 flex flex-wrap items-center gap-2 rounded border-2 border-black bg-white/95 p-2 text-black shadow-sm';
    panel.setAttribute('aria-label', 'Musica di sottofondo');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'rounded bg-black px-3 py-2 text-sm font-bold text-white';
    button.textContent = '♪ Attiva musica';
    button.setAttribute('aria-pressed', 'false');
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 text-xs';
    label.textContent = 'Volume';
    const volume = document.createElement('input');
    volume.type = 'range'; volume.min = '0'; volume.max = '100'; volume.value = '25';
    volume.className = 'w-20'; volume.setAttribute('aria-label', 'Volume musica');
    label.append(volume);
    const status = document.createElement('span');
    status.className = 'sr-only'; status.setAttribute('role', 'status');
    panel.append(button, label, status); document.body.append(panel);
    this.button = button; this.status = status;
    volume.addEventListener('input', () => { this.audio.volume = Number(volume.value) / 100; });
    button.addEventListener('click', () => {
      this.started = true;
      if (this.audio.paused) this.play();
      else this.audio.pause();
    });
    this.audio.addEventListener('play', () => this.refresh());
    this.audio.addEventListener('pause', () => this.refresh());
    this.audio.addEventListener('error', () => { this.status.textContent = 'Impossibile caricare la musica.'; button.textContent = 'Musica non disponibile'; });
    const start = () => { if (!this.started) this.play(); };
    document.getElementById('road').addEventListener('pointerdown', start);
    window.addEventListener('keydown', event => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(event.code)) start();
    });
  }

  async play() {
    if (this.pending) return;
    this.pending = true;
    try {
      await this.audio.play();
      this.started = true;
      this.status.textContent = 'Musica attiva.';
    } catch (error) {
      this.status.textContent = 'Premi Attiva musica per avviare l’audio.';
      this.refresh();
    } finally { this.pending = false; }
  }

  refresh() {
    this.button.textContent = this.audio.paused ? '♪ Attiva musica' : '♪ Pausa musica';
    this.button.setAttribute('aria-pressed', String(!this.audio.paused));
  }
}
