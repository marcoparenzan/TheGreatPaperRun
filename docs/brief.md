# Brief recuperato — 12 settembre 2026

## Identità

- Titolo: **The Great Paper Run**
- Sottotitolo: *Coast to Coast. Any Road. Every Story.*
- Art direction: ritaglio di carta, monocromatico, tratto a pennarello, auto caricaturali e voluminose.
- Struttura: viaggio coast-to-coast con mappa ad albero, 5 stage e scelte di percorso crescenti.

## Engine

### Milestone corrente

- Solo canvas e strada animata.
- Fonte grafica: tavola originale PAPERBALL RUN 1536×1024 recuperata dalla chat.
- Sprite usati: `S0-S4`; nessuna strada procedurale o ridisegnata.
- Auto, montagne, sole, oggetti, testi, punteggi e controlli sono esclusi dalla build corrente.

- Renderer 2D a frame discreti e data-driven.
- Canvas sovrapposti per cielo, parallasse, strada, oggetti, veicoli e HUD.
- Input astratti: otto direzioni più FIRE1/FIRE2, utilizzabili da tastiera, gamepad e touch.
- Prima milestone: guida a vuoto, curve, bivi e parallasse; niente traffico, collisioni o fisica complessa.
- Gli oggetti usano posizione logica lungo la strada e distanza; il renderer calcola posizione e scala sullo schermo.
- I collegamenti fra segmenti e le scelte ai bivi vivono nel JSON.
- Punteggi, chilometri e testi di gioco sono composti da immagini estratte da un charsheet ASCII a celle 16×16.
- Font solo maiuscolo, PETSCII-inspired, disponibile in tre scale discrete; i numeri scorrono come rulli meccanici.

## Atlas futuri

- Un'automobile per atlas 4096x2048, sfondo trasparente e margini generosi.
- Layout standard: 8 viste principali, 5 pose dinamiche, 6 frame di crash.
- Anchor concettuale bottom-center `(0.5, 1.0)`.
- I dati di taglio vivono in JSON separati dalle immagini.
- L'atlas Gran Torino esaminato non è valido: riga 0, colonna 1 e riga 0, colonna 7 sono duplicati.

## Conversazioni di origine

- https://chatgpt.com/c/6aa5264b-06a4-83eb-8bad-42831d91f85b
- https://chatgpt.com/c/6aa52b86-9000-83eb-a3f5-839c813e9520
