# Architettura

## Stack e struttura

Applicazione statica: HTML, Tailwind Play CDN, JavaScript ES modules, Canvas 2D e SVG. Nessun framework, npm, bundler o build. Serve un server HTTP con `src/` come radice. Non esiste attualmente una configurazione di distribuzione in `ops/`.

```text
src/
  index.html                 titolo e configurazione
  play.html                  canvas della gara
  styles.css                 layout del gioco a tutta finestra
  assets/
    circuits/                manifest, Monza, Montecarlo
    cars/                    fogli e JSON correnti; old/ per versioni precedenti
    road/                    base e risorse stradali
    backgrounds/             panorami AI aggiuntivi
    audio/                   musica
    sun/                     frame ruotati del sole
  editor/                    pagine degli strumenti
  js/                        runtime e moduli condivisi
    editor/                  classi e entry point degli strumenti
```

La documentazione corrente è nella radice. I vecchi documenti sotto `docs/` non sono stati riallineati e vanno considerati storici.

## Avvio e selezioni

`setup-main.js` crea `GameSetup` dopo `DOMContentLoaded`. La copertina è ora un elemento img che carica `assets/title/Cut-paper Corvette desert dash.png` (1672 × 941), fornito dall’utente, con download diretto. `TitleArtwork` e gli asset della precedente composizione rimangono conservati ma non vengono caricati dalla pagina. La classe mostra titolo e preparazione mediante il frammento `#setup`, legge il manifest, presenta auto/clima/fondali e genera l’URL di `play.html`.

`main.js` importa dinamicamente `game.js` e mostra gli errori di avvio. `game.js` usa top-level await per caricare configurazione e asset, poi gestisce input, aggiornamento e rendering con `requestAnimationFrame`.

`RaceConfig` legge i JSON senza cache, valida le selezioni e risolve i percorsi relativi al manifest. I parametri URL sono `car`, `circuit`, `weather`, `background`, `color`. Il colore viene validato come `#RRGGBB`.

`CarSelection` carica il modello selezionato e controlla la coerenza delle dimensioni con il JSON. Il menu filtra la disponibilità attraverso `cars[].available`; attualmente solo la C3 è attiva.

## Circuiti

`Circuit` riceve un JSON, non contiene più la sequenza hardcoded di Monza.

- Normalizza i pesi dei tratti alla lunghezza del giro.
- Espande i tipi di curva in una sequenza di campioni usata dal renderer.
- Calcola giro, posizione e riferimenti laterali.
- Disegna cartelli con metri percorsi/restanti e HUD.
- Calcola orientamento e pendenza.

`sections[].weight` è un peso relativo; `lengthMeters` è la lunghezza fisica del giro. Il movimento usa `speed / 3.6 * deltaSeconds`, quindi a 200 km/h costanti Monza richiede 104,274 secondi, senza considerare accelerazione iniziale.

La distanza totale continua a crescere; la posizione sul circuito è il modulo della lunghezza. La gara non si ferma al traguardo.

### Orientamento

Senza `geometry.joins`, l’orientamento deriva dai tipi di curva e viene normalizzato a una rotazione netta di 360° per giro. Non è una geometria ufficiale del circuito.

Con i join, vengono usati gli angoli dei segmenti del poligono, con interpolazione verso la direzione successiva. La sagoma stradale rimane comunque basata sui tipi di curva discreti, non su una proiezione 3D del poligono.

### Quote Z

La quota iniziale di ciascun tratto viene letta da `geometry.joins[index].z`, se presente, oppure da `sections[index].z`, altrimenti zero.

La pendenza è la differenza fra quota successiva e attuale divisa per la lunghezza normalizzata del tratto. L’ultimo tratto torna alla quota del primo. Il runtime anticipa la pendenza di circa 25 m e filtra nel tempo l’inclinazione visuale.

`RoadProjection.pitch` sposta il punto di fuga; strada, terreno, panorama e riferimenti prospettici condividono la proiezione. La variazione è limitata al 12% dell’altezza dello schermo. Non ci sono occlusioni da dossi, tunnel 3D o effetti della gravità sulla velocità.

## Strada e prospettiva

`RoadCurveFrames` legge la sagoma della base `assets/road/clean/straight-base.png` e produce nel browser **33 canvas 960 × 540**. Le curvature deformano le righe dell’immagine, con spostamento laterale più ampio vicino all’orizzonte. Non sono 33 file PNG precalcolati.

Il margine inferiore della sagoma viene esteso usando gli ultimi bordi visibili. `PaperRoadStyle` riempie la strada di bianco, aggiunge bordi neri irregolari e ombra; la chiusura della forma prosegue oltre il canvas per evitare una fessura inferiore.

`RoadProjection` centralizza il posizionamento verticale. Il riferimento piano segue la metà del rettangolo dell’auto, usando appoggio (512,880) e base dell’auto al 98% dell’altezza della finestra.

`RoadMotion` disegna la strada e delega i bolli a `RoadMarkings`. I bolli scorrono con la distanza, rimangono appena dentro i bordi e sono indipendenti dal PNG. Il loro movimento usa un fattore visuale separato dalla distanza fisica del circuito.

## Auto, sterzata e concorrenti

`CarAnimation` sceglie:

- frame `ferma` quando la velocità è prossima a zero;
- ciclo `avanti` sui rettilinei;
- una delle quattro coppie A/B di sterzata, alternando solo i due frame del livello scelto.

`game.js` disegna il giocatore; `Competitors` usa la stessa scelta dei frame, guidata dalla curvatura. I concorrenti sono ricolorati in giallo, rosso e arancione, seguono corsie prospettiche e avanzano con velocità relativa. Non hanno collisioni.

La sterzata del giocatore è smorzata. La deriva verso l’esterno dipende dalla curvatura e dal quadrato della velocità normalizzata. È una fisica arcade: nessun modello di pneumatici o vincolo completo alla carreggiata.

`CarPaint` ricolora i ritagli del giocatore su canvas e li memorizza per evitare un’elaborazione pixel a ogni frame. Cambiare tinta svuota la cache. La tinta usa la luminosità dei pixel, non una maschera dedicata della carrozzeria.

### Contratto degli sprite correnti

- Foglio PNG: 8192 × 8192.
- Ritagli JSON: 1024 × 1024.
- `originPx`: (512,880).
- `anchor`: (0.5,0.859375), normalizzato rispetto al ritaglio.
- Sterzate: quattro livelli, due fasi A/B per livello; durata indicata nel JSON.

## Fondali, clima e audio

`SceneBackground` disegna cielo, terreno e linea nera usando lo stile scelto. `WeatherControl` può sostituire lo stile durante la gara.

`PanoramaParallax` estende `MountainParallax`: carica il fondale indicato dalla configurazione, elimina nel browser il cielo/terreno colorati usati come chiave e taglia i margini verticali. I panorami correnti sono larghi 4096 pixel; quelli nuovi derivano da immagini AI ingrandite mantenendo il rapporto d’aspetto.

Il panorama viene ripetuto orizzontalmente e spostato secondo l’orientamento: 4096/360 pixel sorgente per grado, con successiva scala alla dimensione disegnata. Il sole usa lo stesso ciclo panoramico. `SunAnimation` conserva anche l’animazione di otto frame ruotati; `prefers-reduced-motion` ne ferma il ciclo, non tutti gli altri movimenti del gioco.

Il manifest determina colori, presenza del sole e filtro di luminosità del fondale. Il clima non modifica la fisica.

`BackgroundMusic` carica `The Cannonball Run.mp3`, in loop con volume iniziale 25%. L’avvio richiede un gesto dell’utente. Il pannello offre pausa e volume; non ci sono effetti sonori o gestione dedicata dell’audio a scheda nascosta.

## Editor

### Circuiti

`CircuitEditor`: SVG dall’alto, mappa ricostruita o join salvati, trascinamento, quote, storico posizioni ed esportazione poligonale. `CircuitJsonEditor`: tab codice con Monaco da CDN, schema JSON e validazione applicativa; textarea di ripiego se il caricamento fallisce.

L’esportazione visuale ricalcola le curve dal poligono. L’esportazione del codice mantiene i dati testuali validati. Non esiste sincronizzazione automatica bidirezionale a ogni modifica: usare Applica o Riprendi dalla mappa.

### Sprite e strada

- `FrameComparator`: ritagli A/B, sovrapposizione, ingombri alpha e guide anchor/origin.
- `SpriteMapEditor`: mappa 8 × 8, selezione anche di celle vuote, modifica X/Y e JSON.
- `AtlasImageEditor`: canvas modificabile, spostamento di righe/colonne, un annullamento PNG ed esportazione.
- `FrameGallery`: esportazione dei canvas stradali generati.
- `SpriteWorkshop`: precedente strumento battistrada con layout 1024 × 819; non riallineato al contratto corrente.

I salvataggi usano File System Access API dove disponibile oppure download. Non c’è un backend che scriva direttamente nel progetto.

## Componenti storici e operazioni

`engine.js`, `road-sequence.js` e la vecchia `assets/road/map0.json` non guidano il runtime corrente. Gli asset precedenti restano conservati.

Non ci sono test automatici, telemetria, salvataggio delle gare o configurazione hosting. Le operazioni sui PNG 8192 e la lettura pixel dei panorami hanno un costo significativo in memoria e vanno collaudate sui dispositivi target.
