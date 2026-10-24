# The Great Paper Run

Prototipo di guida 2D monocromatico, in HTML e JavaScript senza build. Servire `src/` via HTTP statico; non usare file://.

## Pagine e controlli
- `/`: guida con frecce o WASD. Ricaricare la pagina per ripartire dopo l'arrivo.
- `/frames.html`: visualizza le 33 curvature con un cursore e scarica il singolo frame PNG trasparente, senza segnaletica.

## Nuova strada pulita
La base AI è `src/assets/road/clean/straight-base.png` (1792×1024). `RoadCurveFrames` legge la sagoma, ne rende solido l'interno per eliminare eventuali dettagli bianchi, e prepara 33 canvas 960×540 con curvature da -1 a +1. I frame derivati sono generati nel browser, non 33 PNG già salvati nel repository. La galleria permette di esportarli singolarmente.

Le vecchie immagini stradali sono conservate, ma non caricate dalla guida attuale. `map0.json` rimane il percorso: i sette valori originali diventano intensità interpolate, con smorzamento legato alla distanza. Le curve spostano la parte lontana della sagoma, lasciando stabile quella vicina; non simulano ancora fisica o aderenza.

`PaperRoadStyle` rende la strada bianca, con bordi neri irregolari e una sottile ombra di carta ritagliata. Il filtro di contrasto estremo è stato rimosso per conservare l'ombra. Anche i PNG esportati dalla galleria usano questo stile.

`RoadMarkings` disegna due file di bolli neri piatti al 17% e 83% della larghezza della carreggiata. Posizione e scala sono prospettiche; la fase deriva dalla distanza percorsa. Non ci sono più paletti o strisce continue nel renderer attivo. I bolli non sono inclusi negli asset esportati.

## Concorrenti
`Competitors` usa i frame avanti della C3, ricolorati su canvas in giallo, rosso e arancione. La trasparenza e i tratti scuri sono mantenuti; le aree chiare ricevono il colore pieno. Il primo concorrente compare dopo circa due secondi di guida sopra velocità 15; gli altri ogni 5–9 secondi, fino a cinque presenti. Viaggiano a velocità diverse, seguono la carreggiata in prospettiva e possono essere superati. Non ci sono collisioni. Le varianti sono derivate nel browser e non alterano lo spritesheet originale.

## Sfondo
`SceneBackground` allinea l'orizzonte al punto di fuga del frame stradale: cielo azzurro sopra, terreno verde sotto. La strada bianca copre il terreno, lasciandolo visibile ai lati. Il filtro globale grayscale è stato rimosso per mostrare i colori dello sfondo.

## Sole
Sette PNG ruotati più l'originale formano un ciclo di 3,6 secondi. Con prefers-reduced-motion il sole resta statico.

## Verifica
Il codice e i riferimenti sono stati controllati; resa delle curvature, scorrimento e download vanno ancora collaudati nel browser. La base AI e la deformazione per righe possono richiedere affinamenti artistici.
