# STEP 0 — Valori estratti da sa-m.fr (2026-06-12)

Analisi di https://sa-m.fr, style.css, queries.css, script.js.
Valori fattuali usati come riferimento per il rebuild; tutto il codice
di questo repo è scritto da zero.

## Tipografia

| Elemento            | Valore                                            |
|---------------------|---------------------------------------------------|
| font-family         | `Arial, Helvetica, sans-serif`                    |
| font-weight globale | `100`                                             |
| lettera nella cella | `3.5vw` desktop · `5vw` mobile (centrata, flex)   |
| numerino hint       | `1vw` desktop (margin `0.75vw`) · `2.5vw` mobile (margin `0.5vw`), assoluto in alto a sinistra |
| footer (INFO/CONTACT)| `1vw` desktop · `2.5vw` mobile (vedi nota ≥1513px sotto) |

## Colori

| Cosa                  | Valore                                   |
|-----------------------|------------------------------------------|
| sfondo                | bianco (default body)                    |
| testo / bordi celle   | nero (colore corrente, nessun override)  |
| indizi non risolti    | testo nero con `opacity: 0.075`          |
| indizi risolti        | `opacity: 1` (classe `.reveal`)          |
| link                  | `color: green` (keyword CSS, `#008000`), sottolineati |

## Griglia

- Celle quadrate: trucco `padding-top: 100%` su `::before`, contenuto in overlay assoluto.
- Bordi: `outline: 1px solid` con `outline-offset: -0.5px` (bordi condivisi da 1px, niente doppi bordi).
- Contenitore: flex con wrap; desktop 15 colonne (`flex-basis: calc(100%/15)`), mobile ≤820px 10 colonne (`calc(100%/10)`).
- Desktop: margini laterali `4vh`, offset verticale `top: -5vh`; mobile: `margin-top: 10vh`.
- Breakpoint principale: `max-width: 820px` (portrait mobile) + media query dedicata iPad landscape 768–1024px.

## Transizioni

- Unica transizione dichiarata nell'originale: `0.2s ease-in-out` (sul video easter-egg).
- Il reveal degli indizi nell'originale è un cambio di `opacity` via classe; nel rebuild
  viene reso come fade con `transition: opacity 0.2s ease-in-out`.

## Footer

- `position: fixed; bottom: 0`, larghezza 98% (95% mobile), `justify-content: space-between`.
- L'originale ha una media query `≥1513px` che riduce il footer a `0.75vw`; di fatto
  l'aspetto di riferimento (registrazione schermo, zoom/scaling reali) è quello a `1vw`.
  Deviazione intenzionale del rebuild: footer sempre `1vw` su desktop, regola ≥1513px omessa.
- Tre blocchi `div`, ciascuno con due `ul` affiancate: colonna numeri ("1." …) + colonna testi.
- Etichetta "INFO" / "CONTACT" come prima voce in `position: absolute` (classe head-list);
  uno spaziatore invisibile (`opacity: 0` / `visibility: hidden`) tiene il posto sotto.
- `ul { padding-left: 1vh }`, prima `ul` a 0; `li { list-style: none }`.

## Comportamento (originale — verificato su registrazione schermo del 2026-06-12)

- Tutte le lettere sono pre-scritte e nascoste (`visibility: hidden`); il click su una
  cella rivela la sua lettera (immediato, senza transizione).
- La prima cella di ogni parola mostra numero e lettera già rivelata.
- Quando tutte le celle di una parola sono rivelate, l'indizio in basso passa da
  `opacity: 0.075` a `opacity: 1` (fade sottile). Non esiste digitazione né validazione.
- Al completamento di tutto il cruciverba l'originale fa `location.reload()` dopo 30s
  (da cui lo spinner al load). Il rebuild replica questo comportamento.
- Viewport meta: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0`.
