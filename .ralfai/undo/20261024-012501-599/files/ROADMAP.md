# Stato e roadmap

## Implementato

### Gioco

- [x] Titolo e schermata di preparazione della gara.
- [x] Copertina con Marco starter, bandiera a scacchi, Corvette e Cybercity, esportabile in PNG.
- [x] Selezioni tramite manifest e parametri URL.
- [x] C3 con frame ferma, avanti e coppie di sterzata A/B.
- [x] Colore del giocatore in preparazione e in pista.
- [x] Concorrenti colorati, prospettiva e sorpassi.
- [x] Guida da tastiera, accelerazione, frenata e deriva centrifuga arcade.
- [x] Monza e Montecarlo in JSON, circuiti chiusi e giri continui.
- [x] Distanza fisica, HUD e cartelli ogni 100 metri.
- [x] Strada bianca cartacea, 33 curvature e bolli animati.
- [x] Giorno/notte/nuvoloso e cambio clima durante la gara.
- [x] Quattro ambientazioni selezionabili, panorama legato all’orientamento a 360°.
- [x] Sole animato e collegato all’orientamento.
- [x] Quote illustrative su Montecarlo; Monza piatta.
- [x] Effetto salita/discesa mediante variazione filtrata del punto di fuga.
- [x] Musica in loop con avvio su gesto, pausa e volume.

### Strumenti

- [x] Editor circuiti SVG con step, join, quote e distanze.
- [x] Tab JSON con Monaco, validazione e textarea di ripiego.
- [x] Importazione JSON ed esportazione di alternative.
- [x] Confronto sprite con guide, ingombri alpha, anchor e origin.
- [x] Modifica ritagli JSON e spostamento di righe/colonne PNG.
- [x] Esportazione PNG/JSON con scelta file o download.
- [x] Pagine in `src/editor/`, JavaScript dedicato in `src/js/editor/`.
- [x] Documentazione corrente nella radice del progetto.

## Da verificare, non da considerare collaudato

- [ ] Flusso completo titolo → configurazione → gara sui browser target.
- [ ] Animazioni, tinta e appoggio della C3 in tutti i livelli di sterzata.
- [ ] Prospettiva dei concorrenti e ordine di disegno durante il sorpasso.
- [ ] Allineamento inferiore strada e fondale a diverse risoluzioni.
- [ ] Continuità dei panorami, bordi del chroma key e resa del mare/deserto/cybercity.
- [ ] Sensazione di velocità, forza centrifuga e salite/discese su Montecarlo.
- [ ] Continuità dell’orientamento e delle quote al passaggio del traguardo.
- [ ] Monaco Editor, worker JSON e funzionamento del fallback senza CDN.
- [ ] Salvataggi e download multipli nei browser con/senza File System Access API.
- [ ] Memoria e reattività degli editor con PNG 8192.
- [ ] Comportamento quando la scheda perde focus o viene sospesa.

L’implementazione è stata controllata attraverso il codice; non è stata eseguita una suite di test o una verifica visiva completa durante questi interventi.

## Priorità consigliate

### 1. Consolidare gli asset

- Sistemare appoggio e frame di Dino e Gran Torino, poi riabilitarle nel manifest.
- Controllare e ritoccare manualmente i battistrada A/B.
- Creare maschere di carrozzeria per non tingere altri dettagli chiari.
- Rifinire le giunzioni dei panorami e preparare veri fondali ciclici.
- Riallineare o dismettere lo SpriteWorkshop con layout precedente.

### 2. Consolidare gioco e dati

- Test automatici per normalizzazione lunghezze, giri, quote e selezioni.
- Validazione uniforme dei JSON, anche fuori dall’editor.
- Taratura della fisica e del comportamento ai bordi della carreggiata.
- Gestione di blur/focus, pausa e riavvio senza ricaricare.
- Controlli touch e gamepad.
- Cronometro e tempi sul giro.

### 3. Rafforzare gli editor

- Anteprima della pista modificata in gara senza registrazione manuale nel manifest.
- Salvataggio progetto e recupero delle modifiche in memoria.
- Migliore gestione delle modifiche non salvate quando si cambia circuito/modello.
- Undo/redo anche per metadati e testo; storico PNG più ampio.
- Profili altimetrici, zoom/pan e più strumenti sui join.
- Modifica/gestione dei tratti senza passare necessariamente dal JSON.

### 4. Evoluzione del renderer

- Proiezione coerente della geometria del circuito, oltre i tipi discreti di curva.
- Dossi e occlusioni, tunnel e fondali urbani dedicati.
- Collisioni, traffico più evoluto ed effetti sonori.
- Clima con pioggia e aderenza, se desiderato come meccanica di gioco.

## Limiti attuali ed esclusioni

- Monza e Montecarlo non sono riproduzioni ufficiali o millimetriche.
- Le quote di Montecarlo sono illustrative, non dati topografici.
- Non c’è una simulazione 3D, un modello realistico di pneumatici o una dinamica verticale.
- Notte e nuvoloso sono stili visivi; non modificano le prestazioni.
- I concorrenti non collidono con il giocatore.
- Nessun multiplayer, account, backend o persistenza delle gare.
- Nessun requisito di build, npm o bundler.
- Funzionamento completamente offline non garantito: Tailwind e Monaco arrivano da CDN.

## Aggiornare la documentazione

Dopo ogni modifica significativa:

1. Riallineare **README.md** per stato e accesso alle pagine.
2. Aggiornare **USAGE.md** per controlli, editor e formati dati.
3. Aggiornare **ARCHITECTURE.md** se cambia il runtime o il contratto degli asset.
4. Aggiornare questa roadmap distinguendo implementazione e collaudo.

Non modificare manualmente `PROMPTS.md`, che è gestito automaticamente. Evitare nuovi documenti correnti nella vecchia cartella `docs/`.
