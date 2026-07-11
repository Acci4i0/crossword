# crossword — rebuild study

Sito personale a forma di cruciverba: studio di ricostruzione dichiarato di
[sa-m.fr](https://sa-m.fr) di Samuel Dumez, con contenuti personalizzati.

Come l'originale: le lettere sono pre-scritte e nascoste, il click su una cella
rivela la sua lettera; quando una parola è completa il suo indizio sotto "INFO"
sfuma dal grigio al nero. A cruciverba completato la pagina si ricarica dopo 30s.

## Stack

Vanilla HTML/CSS/JS, nessuna dipendenza, nessun build step.

## Sviluppo

Non serve alcun tool: apri `index.html` nel browser (o servi la cartella con un
server statico qualsiasi). Con `?dev` nell'URL — o su localhost — al load gira
la validazione dei layout (incroci coerenti, griglia connessa) con esito in
console.

## Struttura

```
index.html                    la pagina: griglia + footer INFO/CONTACT
style.css                     stili (griglia, spinner, footer, avviso rotazione)
script.js                     layout hardcodati, reveal delle celle, validazione dev
tools/
  design-notes.md             valori di design estratti dall'originale
  generate-portrait.js        script Node usa-e-getta: genera e verifica il
  generate-landscape.js       layout portrait/landscape (non caricati dalla
                              pagina): node tools/generate-<nome>.js
```

## Deploy

Ogni push su `main` esegue il workflow
[deploy.yml](.github/workflows/deploy.yml) che pubblica i file statici su
GitHub Pages: https://acci4i0.github.io/crossword/

## Disclaimer

Questo è uno **studio didattico di ricostruzione**, non affiliato all'autore
del sito originale. Concept e design originali © Samuel Dumez. Nessun asset
dell'originale è incluso: i contenuti (indizi, risposte, contatti) sono
personali.

## Licenza

[MIT](LICENSE) © ANDREA ([Acci4i0](https://github.com/Acci4i0))
