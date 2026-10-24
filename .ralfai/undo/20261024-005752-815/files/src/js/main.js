document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('loading');
  try {
    await import('./game.js?v=backgrounds-4');
    status.remove();
  } catch (error) {
    status.textContent = `Impossibile avviare la gara: ${error.message}. Torna al menu.`;
    console.error(error);
  }
});
