# Rebuild study sa-m.fr (versione Andrea Lando)



\---

## CONTESTO

Stai costruendo un progetto standalone (vanilla HTML/CSS/JS, deploy su GitHub Pages). È un rebuild study dichiarato del sito https://sa-m.fr di Samuel Dumez: replica 1:1 di estetica, layout, animazioni e interazioni, ma con contenuti personalizzati. Crea il progetto in una nuova directory dedicata con il suo repository. Inserisci nell'HTML un commento di attribuzione: `<!-- Rebuild study of sa-m.fr by Samuel Dumez. Original concept and design © Samuel Dumez. Rebuilt for study purposes. -->`

## STEP 0 — ANALISI DELL'ORIGINALE (obbligatorio, prima di scrivere codice)

Fai fetch di https://sa-m.fr e dei suoi CSS/JS. Estrai e documenta i valori esatti prima di iniziare:

* font-family, font-size e font-weight di: lettere nelle celle, numerini, indizi INFO, link CONTACT
* dimensione celle, spessore e colore bordi (1px nero su sfondo bianco)
* colori: grigio degli indizi non risolti, verde dei link, nero del testo
* durate e easing delle transizioni (reveal degli indizi, focus cella)
* comportamento responsive (la griglia scala su mobile)

Se il fetch fallisce, usa: font sans-serif tipo Helvetica/Arial, celle quadrate con bordo 1px solid #000, sfondo bianco, indizi non risolti in #ccc, link in verde (#2e7d32 circa) sottolineati.

## COMPORTAMENTO DEL SITO (osservato dall'originale — replicare tutto)

1. **Due layout fissi, scelti per breakpoint/orientamento.** L'originale usa una disposizione per mobile portrait (iPhone) e una diversa per landscape/desktop (iPad). Le disposizioni sono statiche: a parità di viewport il layout è sempre identico. Niente generazione a runtime: i layout vanno hardcodati come dati statici in `script.js`.

   * **Layout portrait (mobile)**: usa esattamente la griglia fornita nella sezione GRIGLIA qui sotto — è già verificata.
   * **Layout landscape (desktop/tablet)**: progettalo tu scrivendo uno script usa-e-getta (Node) che dispone le 8 parole con questi vincoli e ne verifica la validità, poi hardcoda il risultato: ogni parola incrocia almeno un'altra; nessuna cella condivisa con lettere diverse; nessuna adiacenza laterale tra parole parallele (celle di parole diverse si toccano solo negli incroci); griglia connessa; le parole lunghe (ENGINEERING, LMINDUSTRY) preferibilmente orizzontali per sfruttare la larghezza. Lo script di verifica resta nel repo (`tools/`), ma non viene caricato dalla pagina.
   * Mostra uno **spinner di caricamento** breve al load della pagina (l'originale lo fa al reload).
2. **Celle hint**: la prima cella di ogni parola mostra il numero della domanda (piccolo, in alto a sinistra) e la prima lettera già scritta.
3. **Input**: tap/click su una cella la mette a fuoco; si digita una lettera maiuscola e il focus avanza automaticamente alla cella successiva della parola; Backspace cancella e torna indietro; frecce per muoversi. Su mobile serve un input nascosto per far comparire la tastiera (testato su iOS Safari).
4. **Validazione e reveal**: gli 8 indizi sotto "INFO" partono grigi/sbiaditi. Quando una parola viene completata correttamente, il suo indizio diventa nero con una transizione di fade. Se la parola completata è sbagliata resta grigio (non c'è feedback d'errore aggressivo nell'originale: niente rosso, niente shake).
5. **Footer**: due blocchi in basso. A sinistra "INFO" con la lista numerata degli indizi su due colonne; a destra "CONTACT" con i link.
6. Niente altro nella pagina: sfondo bianco, nessun header, nessun menu.

## CONTENUTI PERSONALIZZATI

Indizi (in inglese, identici all'originale) e risposte:

|#|Indizio|Risposta|
|-|-|-|
|1|My name|ANDREA|
|2|My surname|LANDO|
|3|People call me|ACCIAIO|
|4|What i mainly do|ENGINEERING|
|5|But i also do|COMPLAIN|
|6|Principal hobbie|SPORT|
|7|Where i come from|ITALY|
|8|Where i work|LMINDUSTRY|

Le risposte vanno gestite tutte in maiuscolo.

## GRIGLIA — LAYOUT PORTRAIT (già verificato, usare così com'è)

Coordinate (colonna, riga), origine in alto a sinistra. Griglia 10 colonne × 11 righe — stessa forma della griglia mobile dell'originale (~10×13): riempie la larghezza (celle = `100vw/10`) e resta in portrait. Generata con `tools/generate-portrait.js`. Formato: parola, direzione, cella iniziale.

|#|Parola|Direzione|Start (col, riga)|
|-|-|-|-|
|1|ANDREA|across|(4, 0)|
|2|LANDO|down|(6, 3)|
|3|ACCIAIO|down|(2, 1)|
|4|ENGINEERING|down|(8, 0)|
|5|COMPLAIN|across|(2, 3)|
|6|SPORT|across|(0, 7)|
|7|ITALY|down|(4, 6)|
|8|LMINDUSTRY|down|(0, 1)|

Incroci risultanti (da usare come test di verifica nel codice):

* ANDREA × ENGINEERING su E in (8,0)
* COMPLAIN × ACCIAIO su C in (2,3); COMPLAIN × LANDO su L in (6,3); COMPLAIN × ENGINEERING su I in (8,3)
* SPORT × LMINDUSTRY su S in (0,7); SPORT × ACCIAIO su O in (2,7); SPORT × ITALY su T in (4,7)

Ogni parola ha almeno un incrocio, la griglia è connessa, non ci sono conflitti di lettere né adiacenze tra parole parallele. Scrivi comunque una funzione di validazione che lo verifichi al load in dev (rimossa o disattivata in produzione).

Blocco CONTACT (stesso formato dell'originale — prefisso, punto, link verde sottolineato):

```
m.  lando.andrea04@gmail.com   → mailto:lando.andrea04@gmail.com
t.  +39(0)3337216052           → tel:+393337216052
i.  @andrelndo                 → https://instagram.com/andrelndo
©   2026                       → nessun link, oppure link alla repo del progetto
```

## VINCOLI TECNICI

* Vanilla HTML/CSS/JS. Nessuna libreria, nessun framework, nessun build step. File: `index.html`, `style.css`, `script.js`.
* Deve funzionare su GitHub Pages (solo file statici).
* Responsive: desktop e mobile (riferimento: iPhone in portrait, la griglia scala per stare nella larghezza dello schermo).
* Rendering griglia: CSS Grid o posizionamento assoluto con coordinate prese dai dati di layout hardcodati; celle quadrate.

## REGOLE DI CODICE (s4.codes — vincolanti)

Nomi intention-revealing e onesti; se devi leggere l'implementazione per capire il nome, il nome è sbagliato. Funzioni piccole, una funzione = una cosa, niente mix di livelli di astrazione, pochi argomenti, Do XOR Answer. Niente side effect nascosti. try/catch invece di codici d'errore. DRY. Funzioni top-level in alto, definizioni sotto i chiamanti. Variabili vicine all'uso.

Struttura suggerita per `script.js`: `LAYOUTS` (dati statici: portrait e landscape), `selectLayout()` (viewport → layout), `renderGrid(layout)`, `handleInput(event)`, `checkWordCompletion(word)`, `revealClue(number)`, `validateLayout(layout)` (solo dev).

## CRITERI DI ACCETTAZIONE

1. A parità di viewport il layout è sempre identico tra un reload e l'altro. Ruotando il device (o ridimensionando la finestra oltre il breakpoint) compare l'altro layout. Entrambi i layout passano `validateLayout()`: connessi, nessun conflitto di lettere, nessuna parola parallela adiacente.
2. Compilando tutte le 8 risposte corrette, tutti gli indizi diventano neri.
3. Su iPhone la tastiera compare al tap su una cella e l'input funziona.
4. Lighthouse: nessun errore console, pagina < 100KB totali.
5. Affiancato a sa-m.fr, un osservatore non distingue stile, spaziature e animazioni (a parte i contenuti).












