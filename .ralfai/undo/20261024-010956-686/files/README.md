# The Great Paper Run

Prototipo di guida arcade 2D in un mondo di carta: strada bianca con bordi neri irregolari, auto animate, concorrenti e fondali panoramici. HTML, JavaScript ES modules e Tailwind via CDN, senza framework o compilazione.

## Anteprima

Servire **`src/` come radice di un server HTTP statico** e aprire l’indirizzo restituito dal server. Non aprire `index.html` con doppio clic: gli import ES modules e i caricamenti JSON non funzionano correttamente su `file://`.

L’URL locale cambia se il server viene riavviato su un’altra porta. Le pagine sono:

| Percorso | Funzione |
| --- | --- |
| `/index.html` | Titolo e preparazione della gara |
| `/play.html` | Gioco, con selezioni nei parametri URL |
| `/editor/circuits.html` | Circuiti dall’alto, join, quote e JSON/Monaco |
| `/editor/frame-compare.html` | Confronto sprite, ritagli JSON e spostamento di righe/colonne PNG |
| `/editor/frames.html` | Anteprima e download delle 33 curvature stradali |
| `/editor/sprites.html` | Strumento precedente per varianti del battistrada, ancora basato sul layout 1024 × 819 |

## Stato attuale

- Flusso **titolo → configurazione → gara**, con copertina composta dalla foto fornita, tre auto e paesaggio cartaceo; download PNG disponibile.
- **Corvette C3** disponibile; Dino 246 GT e Gran Torino presenti ma disabilitate mentre gli asset vengono sistemati.
- Colore dell’auto selezionabile, anche durante la gara.
- **Monza: 5.793 m**, piatta; **Montecarlo: 3.337 m**, con quote illustrative fino a 48 m.
- Percorsi chiusi, contatore giri, avanzamento e cartelli ogni 100 m con distanza fatta e restante.
- Accelerazione/frenata, sterzata e deriva centrifuga arcade; velocità massima 200 km/h.
- Concorrenti gialli, rossi e arancioni; sorpassi senza collisioni.
- Giorno, notte e nuvoloso, modificabili anche in pista.
- Fondali: montagne/città, Cybercity, mare e deserto, legati all’orientamento a 360°.
- Musica in loop, attivata dal primo gesto dell’utente, con pausa e volume.

## Controlli

- **↑ / W**: accelera.
- **↓ / S**: frena.
- **← → / A D**: sterza.
- **Menu**: torna alla preparazione.

Ricaricare la pagina avvia una nuova gara. I controlli touch di guida e gamepad non sono integrati.

## Dati principali

- `src/assets/circuits/manifest.json`: circuiti, auto disponibili, fondali e palette.
- `src/assets/circuits/monza.json` e `montecarlo.json`: tratti, lunghezza, quote e spaziatura dei cartelli.
- `src/assets/cars/*_spritesheet_8192_wheelanim.json/.png`: asset correnti delle auto.
- `src/assets/cars/old/`: versioni precedenti conservate.

Le immagini delle auto sono 8192 × 8192; i ritagli correnti sono 1024 × 1024 con appoggio locale **(512, 880)**. Non tutte le celle del foglio sono occupate.

## Documentazione

- [USAGE.md](USAGE.md): uso del gioco e degli editor, esempi e configurazione JSON.
- [ARCHITECTURE.md](ARCHITECTURE.md): struttura tecnica, rendering e dati.
- [ROADMAP.md](ROADMAP.md): completato, da verificare, prossimi interventi e limiti.

Gli eventuali documenti nella vecchia cartella `docs/` sono materiale storico: per lo stato corrente usare questi file nella radice. `PROMPTS.md` è gestito automaticamente e non viene modificato manualmente.

## Limiti e verifica

I circuiti sono **interpretazioni schematiche**, non riproduzioni geometriche ufficiali. Le quote muovono il punto di fuga, ma non generano una strada 3D con dossi o tunnel. Il clima cambia la resa visiva, non l’aderenza.

Non è presente una suite di test automatizzati. I collegamenti sono stati controllati attraverso il codice; il collaudo visivo completo, le giunzioni dei panorami e i salvataggi nei diversi browser restano da verificare. Tailwind e Monaco richiedono rete; Monaco dispone di un editor testuale di ripiego.
