# cruciverba — rebuild study di sa-m.fr

Sito personale a forma di cruciverba: rebuild study dichiarato di
[sa-m.fr](https://sa-m.fr) di Samuel Dumez. Concept e design originali
© Samuel Dumez; ricostruito a scopo di studio con contenuti personalizzati.

Vanilla HTML/CSS/JS, nessuna dipendenza, deploy su GitHub Pages.

Come l'originale: le lettere sono pre-scritte e nascoste, il click su una cella
rivela la sua lettera; quando una parola è completa il suo indizio sotto "INFO"
sfuma dal grigio al nero. A cruciverba completato la pagina si ricarica dopo 30s.

- `index.html`, `style.css`, `script.js` — il sito.
- `tools/design-notes.md` — valori di design estratti dall'originale (STEP 0).
- `tools/generate-landscape.js` — script Node usa-e-getta che genera e
  verifica il layout landscape (non caricato dalla pagina):
  `node tools/generate-landscape.js`.
- `cruciverba.md` — specifica del progetto.

In dev (`localhost` o `?dev` nell'URL) `validateLayout()` controlla al load
che entrambi i layout siano connessi, senza conflitti di lettere e senza
adiacenze fuori dagli incroci.

