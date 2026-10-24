# The Great Paper Run

Prototipo corrente: solo effetto di avanzamento della strada in canvas.

## Avvio locale

Servire la cartella `dist` con un server HTTP statico. Non sono richieste dipendenze o build.

Il runtime usa `dist/assets/road-straight-hires-atlas-4096x2048.png`: due frame
16:9 ad alta risoluzione, ricostruiti dalla `S0` della tavola originale
`dist/assets/paperball-run-road-sheet-original.png`. Non sono presenti auto,
paesaggio, oggetti, testi o HUD.

La strada occupa la metà inferiore dello schermo. Il canvas applica una resa
strettamente bicromatica: fondo bianco, asfalto e contorni neri, segnaletica bianca.

L'atlas della Gran Torino non è incluso: `riga 0 / colonna 1` e
`riga 0 / colonna 7` sono duplicati e quindi lo sheet è da rigenerare.
