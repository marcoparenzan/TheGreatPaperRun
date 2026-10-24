
lo spritesheet della Dino non è trasparente.

Hai ragione: il primo sheet della Dino ha uno sfondo scuro/grigio incorporato, quindi non è utilizzabile come vero atlas trasparente.

Posso rigenerarlo mantenendo lo stesso design caricaturale della Dino, ma con alpha reale, senza etichette né pannelli, solo gli sprite isolati. Così diventa anche molto più facile produrre il JSON pixel-perfect con anchor (0.5, 1.0).

E servirebbe allora la Pontiac Trans Am sia quella di supercar che quella del bandito e la madama


Attenzione che gli spritesheet non sono sufficienti alla distanza. quando ci sono i 3/4 si sovrappongono.
Forse devi usare una 4096x2048

Esatto. Il problema non è solo la risoluzione: stiamo mettendo troppi sprite nello stesso sheet e il generatore tende a farli invadere l'uno nell'altro, soprattutto nei 3/4.

Cambierei standard da ora:

4096×2048 per UNA SOLA automobile, non tre modelli insieme. 8 viste principali molto distanziate nella prima fascia, 5 pose dinamiche nella seconda, 6 frame di crash nella terza. Niente testi vicino agli sprite, niente decorazioni, alpha reale e margine abbondante intorno a ogni elemento.

Inoltre farei le viste principali più sistematiche:

REAR → REAR 3/4 L → SIDE L → FRONT 3/4 L → FRONT → FRONT 3/4 R → SIDE R → REAR 3/4 R

Poi sotto:

TURN L → STRAIGHT → TURN R → JUMP → LAND

e infine:

IMPACT → SPIN 1 → SPIN 2 → SIDEWAYS → ROLL → REST

Tutti con anchor concettuale bottom-center (0.5, 1.0), anche se nel crash potremo poi prevedere un anchor specifico.

E soprattutto: non metterei più tre Trans Am nello stesso sheet. Farei tre sheet 4096×2048 separati. Così abbiamo anche spazio sufficiente perché la vista laterale e i 3/4 siano grandi e realmente utilizzabili dal superscaling.

Partirei rifacendo KITT da sola in 4096×2048 con questo nuovo standard, e se viene bene quello diventa il template definitivo per tutte le automobili.

le pontiac. Sempre in bianco e nero, non nere. E in fogli separati. con sempre le stesse posizioni e etichette.
file json di taglio
4096x2048


The Great Paper Run! bellissima

The Great Paper Run è decisamente quello. 😄

Ha anche il vantaggio di non sembrare la parodia di un singolo gioco: racconta già tutto il concept — grande corsa, viaggio, carta — e può diventare il nome della serie.

Io fisserei:

THE GREAT PAPER RUN
Coast to Coast. Any Road. Every Story.

E graficamente il logo lo vedo come un pezzo di carta strappato, lettering a pennarello, una piccola bandiera a scacchi disegnata a mano. Coerentissimo con strada e auto.

A questo punto abbiamo praticamente tre regole di art direction: paper-cut + monocromatico, auto cicciotte/caricaturali, sprite atlas 4096×2048 con layout standardizzato. E la mappa ad albero può essere proprio il cuore di The Great Paper Run: 5 stage, sempre più alternative, fino alla costa opposta.

Questo nome me lo terrei stretto. 😄

Puoi rispaziare gli spritesheet generati con questo nuovo formato?

Sì. Avevo proposto Work perché qui non posso riprocessare in modo affidabile tutti i PNG già generati come veri atlas pixel-perfect, ma hai scelto di restare in chat.

Possiamo comunque rigenerarli uno alla volta direttamente qui nel nuovo standard 4096×2048, mantenendo layout identico, bianco/nero, alpha reale e poi creando il JSON di taglio per ciascuno.

Partirei dalla Dino, che è anche quella da correggere per prima.




7