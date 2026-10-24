# The Great Paper Run — Development Log

Questo documento raccoglie in ordine le decisioni progettuali e le modifiche richieste durante lo sviluppo. Va aggiornato insieme agli asset e al codice.

## Direzione artistica consolidata

- Grafica 2D monocromatica, bianco e nero, con tratto pulito da comic strip e fumetto dinamico italiano.
- Effetto fisico da carta ritagliata: bordo leggermente irregolare, ombra sottile e livelli visivamente sovrapposti.
- Auto caricaturali, corte, larghe e compresse lungo l'asse Z verso il punto di fuga.
- Asset PNG ad alta risoluzione con alpha reale, pensati per il superscaling arcade.
- Anchor convenzionale degli sprite: bottom-center `(0.5, 1.0)`.

## Spritesheet delle automobili

- Atlas separati 4096×4096 per Corvette C3, Dino 246 GT e Ford Gran Torino.
- Layout fisso: cinque animazioni, una per riga, quattro frame per animazione.
- Ordine delle righe: `avanti`, `destra`, `sinistra`, `incidente_dx`, `incidente_sx`.
- Le tre animazioni di guida hanno un piccolo ciclo verticale: neutra, compressa, neutra, sollevata.
- Ogni atlas è accompagnato dal proprio JSON di taglio.

## Sistema della strada

- Ogni step della mappa corrisponde alla key di un'immagine in `assets/road`.
- Vocabolario iniziale: `straight`, `left_gentle`, `left_medium`, `left_hard`, `right_gentle`, `right_medium`, `right_hard`.
- I frame hanno camera e scala comuni, risoluzione 1600×900 e sfondo trasparente.
- Il punto di fuga resta alto e la strada occupa quasi tutta la base dell'immagine.
- Il ritmo non è memorizzato nei frame: `framesPerSecond = carSpeed / stepDistance`.
- Una sequenza come `straight-straight-left-left-straight-right` diventa una lista JSON di key ripetute.
- Il file `assets/road/manifest.json` associa ogni key al relativo PNG.

## Linearizzazione delle mappe disegnate

- Linguaggio scelto: Python, come strumento offline indipendente dal motore di gioco.
- La classe `RoadMapLinearizer` legge una linea scura su fondo chiaro o trasparente.
- Il disegno viene assottigliato a una centerline, orientato dal punto di partenza, campionato a distanza regolare e classificato per direzione e intensità della curva.
- Il JSON risultante contiene sia la sequenza completa degli step sia i segmenti compressi `{ key, count }`.
- Per mappe ramificate servirà una seconda fase che conservi bivi e nodi; la prima versione estrae il percorso principale.

## Stato di `map0`

Il file non era presente nel workspace temporaneo, ma è stato poi individuato nel progetto principale. La traccia reale è stata linearizzata dal punto START verso ARRIVE e salvata come `map0.json`.
