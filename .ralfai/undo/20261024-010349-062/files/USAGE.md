# Uso dell'applicazione

Servire `src/` con un server HTTP locale: non aprire i file con `file://`.

## Avvio della gara

1. Aprire `/index.html`: schermata del titolo.
2. Premere **Prepariamo la gara**.
3. Scegliere macchina, circuito e cielo.
4. Premere **In pista**.

Attualmente è disponibile solo la C3; Dino e Gran Torino sono in preparazione. Il circuito disponibile è Monza, lungo 5793 metri, con geometria semplificata.

Giorno, notte e nuvoloso cambiano colori di cielo/erba, visibilità del sole e luminosità del panorama. Non modificano aderenza o fisica.

Frecce o WASD: accelerazione, frenata e sterzata. Il pulsante Menu torna alla configurazione. La musica parte al primo gesto di guida ed è controllabile in alto a destra.

## Configurazione

- `src/assets/circuits/manifest.json`: elenco circuiti e auto, disponibilità, fondali, palette e impostazioni predefinite. I percorsi degli asset sono relativi al manifest.
- `src/assets/circuits/monza.json`: nome, lunghezza, paletti e sequenza dei tratti. Il campo `weight` determina la proporzione della lunghezza totale assegnata a ciascun tratto, non una misura ufficiale in metri.

Per aggiungere un circuito, creare il suo JSON e registrarlo nel manifest. Usare i tipi di curva esistenti: `straight`, `left_gentle`, `left_medium`, `left_hard` e corrispondenti `right_*`.

## Editor

- `/editor/circuits.html`: vista schematica dall’alto, join trascinabili, step e distanze. Carica anche JSON alternativi. Esporta un file `*-alternative.json` con coordinate, lunghezze normalizzate e tipi di curva ricavati dal poligono. Per usarlo in gara occorre salvarlo in `src/assets/circuits/` e registrarlo nel manifest. La strada in gioco usa ancora i tipi di curva discreti: non riproduce esattamente il poligono dell’editor.

- `/editor/frame-compare.html`: confronto sprite, rettangoli JSON, spostamento di righe/colonne PNG e salvataggio.
- `/editor/sprites.html`: strumento precedente per le varianti del battistrada, con layout originale 1024 × 819.
- `/editor/frames.html`: anteprima e download delle curvature stradali.

I salvataggi richiedono la scelta del file o il download di una copia; non sovrascrivono automaticamente gli asset.
