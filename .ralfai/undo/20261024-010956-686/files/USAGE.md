# Uso e configurazione

## 1. Avviare una gara

Aprire `/index.html` tramite il server HTTP che serve `src/`.

La pagina iniziale mostra una copertina composta nel browser con l’immagine fornita di Marco e ritagli delle tre auto. **Scarica copertina PNG** esporta un’immagine 1600 × 1000. Gli originali restano invariati.

1. Premere **Prepariamo la gara**.
2. Scegliere macchina e colore. Per ora è disponibile solo la C3.
3. Scegliere **Monza** o **Montecarlo**.
4. Scegliere **Giorno**, **Notte** o **Nuvoloso**.
5. Scegliere l’ambientazione oppure lasciare **Fondale della pista**.
6. Premere **In pista**.

La notte usa cielo `#181a1c` ed erba `#123524`, nasconde il sole e oscura il panorama. Il nuvoloso usa toni grigi e un fondale meno luminoso. Non cambiano aderenza, frenata o accelerazione.

In gara: frecce/WASD, selettore clima, selettore colore, musica con pausa/volume e pulsante Menu. Il colore scelto tinge le superfici chiare dello sprite, non usa una maschera dedicata della carrozzeria: anche alcuni dettagli chiari possono ricevere la tinta. I concorrenti mantengono i loro colori.

La musica parte al primo click sul gioco o comando di guida, secondo le regole di autoplay del browser. Se non parte, usare **Attiva musica**.

### URL diretto

Esempio:

```text
/play.html?car=c3&circuit=montecarlo&weather=night&background=cybercity&color=%23ff8800
```

Parametri:

| Parametro | Valori correnti |
| --- | --- |
| `car` | `c3` |
| `circuit` | `monza`, `montecarlo` |
| `weather` | `day`, `night`, `cloudy` |
| `background` | `mountains-city`, `cybercity`, `sea`, `desert`; omesso = fondale della pista |
| `color` | Colore esadecimale `#RRGGBB`; nell’URL codificare `#` come `%23` |

Parametri omessi usano i valori predefiniti del manifest. Selezioni non valide impediscono l’avvio e mostrano un messaggio. Il colore non valido torna al bianco.

## 2. Circuiti e manifest

`src/assets/circuits/manifest.json` elenca circuiti, auto, fondali e stili. **I percorsi in questo file sono relativi al manifest**, non alla pagina HTML.

Esempio di registrazione di un circuito alternativo:

```json
{
  "id": "monza-alternative",
  "name": "Monza alternativa",
  "file": "monza-alternative.json",
  "lengthMeters": 5793,
  "background": "../backgrounds/desert-4096.png",
  "styles": ["day", "night", "cloudy"]
}
```

Inserire questa voce nell’array `circuits`, mantenendo valido il JSON. Il `lengthMeters` nel manifest serve al menu: mantenerlo coerente con il file della pista.

### File della pista

```json
{
  "id": "esempio",
  "name": "Esempio",
  "lengthMeters": 3000,
  "closed": true,
  "markerSpacingMeters": 100,
  "sections": [
    {"name": "Rettilineo", "weight": 1000, "curve": "straight", "z": 0},
    {"name": "Salita", "weight": 1000, "curve": "right_medium", "z": 10},
    {"name": "Ritorno", "weight": 1000, "curve": "right_hard", "z": 30}
  ]
}
```

Questo è un esempio di struttura, non una pista geometricamente realistica.

- `weight`: proporzione della lunghezza totale assegnata al tratto. La somma viene normalizzata a `lengthMeters`.
- `curve`: `straight`, `left_gentle`, `left_medium`, `left_hard` oppure le varianti `right_*`.
- `z`: quota del **join iniziale del tratto**, in metri. La quota successiva determina la pendenza; l’ultimo tratto si raccorda al primo.
- `closed`: il runtime corrente è progettato per circuiti chiusi.
- `geometry.joins`: coordinate opzionali `x`, `y`, `z`, con un join per ogni tratto. Se presenti, le quote dei join hanno priorità sulle `z` dei tratti.

Per una pista piatta tenere tutte le quote uguali. Monza usa Z=0 ovunque; Montecarlo ha un profilo illustrativo da 0 a 48 m.

## 3. Editor circuiti

Aprire `/editor/circuits.html`.

### Vista dall’alto

- Caricare una pista dal menu o aprire un JSON locale.
- I nodi sono i join; il nodo 1 è partenza/arrivo.
- Trascinare un nodo per modificare X/Y.
- Modificare **X, Y e Z** nel pannello e premere **Applica posizione**.
- Usare le frecce nella mappa per spostare il nodo: 1 m, oppure 10 m con Shift.
- **Adatta vista** ricentra la mappa; **Annulla** ripristina l’ultima modifica delle posizioni.

Gli step mostrano distanze, avanzamento e pendenza. Se il circuito non contiene coordinate, viene ricostruita una mappa schematica: non è una planimetria ufficiale.

### JSON · Monaco Editor

- Aprire la tab del codice.
- Modificare `sections` per aggiungere o rimuovere tratti, cambiare nomi, pesi, curve e quote.
- Premere **Applica JSON alla mappa**.
- Se il numero di step non corrisponde ai join, la geometria viene rimossa e la mappa rigenerata dai tratti.
- Per conservare la geometria manuale, aggiornare anche `geometry.joins` e le relative quote.
- **Formatta** rende leggibile il JSON; **Riprendi dalla mappa** sostituisce il codice con lo stato visuale.

Monaco viene caricato via CDN. Senza rete resta il textarea con validazione al momento dell’applicazione. Le modifiche del codice non vengono applicate automaticamente passando alla tab visuale.

### Due esportazioni diverse

- **Scarica alternativa JSON** nella vista visuale: genera `*-alternative.json`, normalizza la geometria alla lunghezza scelta e ricava i tipi di curva dal poligono. Questo può cambiare le curve originali.
- **Scarica questo JSON** nella tab del codice: esporta i dati testuali validati; se i join non corrispondono agli step, la geometria viene omessa.

Per usare il risultato in gara, salvare il file in `src/assets/circuits/` e registrarlo nel manifest. Nessun download sovrascrive automaticamente il progetto.

## 4. Editor sprite

Aprire `/editor/frame-compare.html`.

- Mappa a sinistra; confronto grande a destra.
- Premere il pulsante grande **A blu** o **B arancione**, poi cliccare sulla mappa.
- Il click seleziona sempre una cella 1024 × 1024, anche vuota.
- Confrontare frame sovrapposti, alternati o singoli; regolare l’opacità di B.
- Rosso: ritaglio JSON; verde: pixel visibili; croce gialla: anchor; cerchio fucsia: origin.
- Modificare X/Y del ritaglio e premere **Applica X/Y JSON**. L’offset di prova di B non viene salvato nel JSON.

I ritagli correnti sono 1024 × 1024; appoggio (512,880), equivalente all’anchor normalizzato (0.5,0.859375).

### Spostare il PNG

Scegliere riga o colonna, indice 0–7 e ΔX/ΔY in pixel, quindi **Sposta riga / colonna**. Si muovono i pixel di tutta la striscia, non le coordinate del JSON.

La zona originale viene svuotata; la destinazione viene sostituita anche nelle aree trasparenti. Uno spostamento oltre il foglio taglia i pixel e richiede conferma. È disponibile un annullamento dell’ultimo spostamento. Il PNG resta 8192 × 8192.

### Salvare

**Salva JSON… / Salva PNG 8192…** aprono il selettore del file nei browser compatibili; altrimenti scaricano una copia. Per applicare al gioco, scegliere o sostituire il file corretto in `src/assets/cars/`, poi ricaricare la gara. Conservare una copia prima di sovrascrivere gli asset.

Cambiare modello scarta le modifiche in memoria. L’editor del battistrada in `/editor/sprites.html` è uno strumento precedente con layout 1024 × 819: non usarlo per sostituire alla cieca i fogli correnti 1024 × 1024.

## 5. Problemi comuni

- **Vedo ancora la vecchia versione:** ricaricare con Ctrl+F5; verificare la pagina e i parametri URL.
- **La notte non è visibile:** verificare `weather=night` oppure usare Clima in gara.
- **Auto che si alza sterzando:** confrontare margine trasparente inferiore, ritaglio e anchor dei frame.
- **Fondale con giunzioni o residui di colore:** i panorami AI vengono ritagliati nel browser e ripetuti; possono richiedere ritocco degli asset.
- **Salvataggio non disponibile:** usare il download della copia e sostituire manualmente il file.
- **Editor PNG lento:** i fogli 8192 consumano molta memoria; evitare più editor aperti contemporaneamente.
