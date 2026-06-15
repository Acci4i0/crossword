// Rebuild study of sa-m.fr by Samuel Dumez.
// Original concept and design © Samuel Dumez. Rebuilt for study purposes.

// Layout landscape generato e verificato con tools/generate-landscape.js.
const LAYOUTS = {
  // Forma 10×11 come la griglia mobile di sa-m.fr (~10×13): riempie la
  // larghezza (celle = 100vw/10) e resta in portrait. Generato e verificato
  // con tools/generate-portrait.js.
  portrait: {
    cols: 10,
    rows: 11,
    words: [
      { number: 1, answer: "ANDREA", direction: "across", col: 4, row: 0 },
      { number: 2, answer: "LANDO", direction: "down", col: 6, row: 3 },
      { number: 3, answer: "ACCIAIO", direction: "down", col: 2, row: 1 },
      { number: 4, answer: "ENGINEERING", direction: "down", col: 8, row: 0 },
      { number: 5, answer: "COMPLAIN", direction: "across", col: 2, row: 3 },
      { number: 6, answer: "SPORT", direction: "across", col: 0, row: 7 },
      { number: 7, answer: "ITALY", direction: "down", col: 4, row: 6 },
      { number: 8, answer: "LMINDUSTRY", direction: "down", col: 0, row: 1 },
    ],
  },
  landscape: {
    cols: 15,
    rows: 7,
    words: [
      { number: 1, answer: "ANDREA", direction: "across", col: 9, row: 4 },
      { number: 2, answer: "LANDO", direction: "down", col: 5, row: 0 },
      { number: 3, answer: "ACCIAIO", direction: "down", col: 14, row: 0 },
      { number: 4, answer: "ENGINEERING", direction: "across", col: 1, row: 2 },
      { number: 5, answer: "COMPLAIN", direction: "across", col: 1, row: 0 },
      { number: 6, answer: "SPORT", direction: "across", col: 3, row: 4 },
      { number: 7, answer: "ITALY", direction: "down", col: 9, row: 2 },
      { number: 8, answer: "LMINDUSTRY", direction: "across", col: 0, row: 6 },
    ],
  },
};

const RELOAD_AFTER_COMPLETION_MS = 30000;

// Il layout portrait si usa su tutti i telefoni: in portrait direttamente, in
// landscape il contenuto viene ruotato via CSS (vedi .rotor in style.css).
const MOBILE = window.matchMedia(
  "(max-width: 820px), (orientation: landscape) and (max-height: 500px)"
);

const grid = document.getElementById("grid");

// Stato della partita corrente (ricostruito a ogni cambio di layout).
let cells = new Map(); // "col,row" -> { element, letter, revealed, words }
const solvedNumbers = new Set(); // sopravvive al cambio di layout

main();

function main() {
  applyLayout(selectLayout());
  MOBILE.addEventListener("change", () => applyLayout(selectLayout()));
  grid.addEventListener("click", handleCellClick);
  hideSpinnerAfterLoad();
  if (isDevEnvironment()) runDevValidation();
}

function selectLayout() {
  return MOBILE.matches ? LAYOUTS.portrait : LAYOUTS.landscape;
}

function applyLayout(layout) {
  renderGrid(layout);
  for (const number of solvedNumbers) revealClue(number);
}

// Tutte le lettere sono pre-scritte ma nascoste; la prima cella di ogni
// parola mostra il numero della domanda e la sua lettera già rivelata.
function renderGrid(layout) {
  grid.style.setProperty("--cols", layout.cols);
  grid.style.setProperty("--rows", layout.rows);
  grid.innerHTML = "";
  cells = new Map();

  for (const word of layout.words) {
    word.answer.split("").forEach((letter, index) => {
      const cell = obtainCell(wordCell(word, index), letter);
      cell.words.push(word);
      if (index === 0) {
        addHintNumber(cell, word.number);
        revealCell(cell);
      }
    });
  }
}

function obtainCell({ col, row }, letter) {
  const key = cellKey({ col, row });
  if (cells.has(key)) return cells.get(key);

  const element = document.createElement("div");
  element.className = "square";
  element.dataset.key = key;
  element.style.gridColumn = col + 1;
  element.style.gridRow = row + 1;

  const content = document.createElement("span");
  content.className = "content hidden-letter";
  content.textContent = letter;
  element.appendChild(content);
  grid.appendChild(element);

  const cell = { element, letter, revealed: false, words: [] };
  cells.set(key, cell);
  return cell;
}

function addHintNumber(cell, number) {
  const mini = document.createElement("span");
  mini.className = "mini";
  mini.textContent = number;
  cell.element.appendChild(mini);
}

// ---- Interazione: il click su una cella rivela la sua lettera ----

function handleCellClick(event) {
  const square = event.target.closest(".square");
  if (!square) return;
  const cell = cells.get(square.dataset.key);
  if (cell.revealed) return;
  revealCell(cell);
  cell.words.forEach(checkWordCompletion);
}

function revealCell(cell) {
  cell.revealed = true;
  cell.element.querySelector(".content").classList.remove("hidden-letter");
}

// ---- Completamento e reveal degli indizi ----

function checkWordCompletion(word) {
  if (solvedNumbers.has(word.number)) return;
  const complete = word.answer
    .split("")
    .every((_, index) => cells.get(cellKey(wordCell(word, index))).revealed);
  if (!complete) return;
  solvedNumbers.add(word.number);
  revealClue(word.number);
  if (solvedNumbers.size === currentWordCount()) scheduleReload();
}

function revealClue(number) {
  document
    .querySelectorAll(`[data-clue="${number}"]`)
    .forEach((clue) => clue.classList.add("reveal"));
}

function currentWordCount() {
  return selectLayout().words.length;
}

// Come l'originale: a cruciverba completo la pagina si ricarica poco dopo
// (ed è per questo che al load compare lo spinner).
function scheduleReload() {
  setTimeout(() => location.reload(), RELOAD_AFTER_COMPLETION_MS);
}

// ---- Spinner ----

function hideSpinnerAfterLoad() {
  const spinner = document.getElementById("spinner");
  window.addEventListener("load", () => {
    setTimeout(() => spinner.classList.add("hidden"), 400);
  });
}

// ---- Geometria condivisa ----

function wordCell(word, index) {
  return word.direction === "across"
    ? { col: word.col + index, row: word.row }
    : { col: word.col, row: word.row + index };
}

function cellKey({ col, row }) {
  return `${col},${row}`;
}

// ---- Validazione dei layout (solo dev: ?dev oppure localhost) ----

function isDevEnvironment() {
  return location.search.includes("dev")
    || location.hostname === "localhost"
    || location.hostname === "127.0.0.1";
}

function runDevValidation() {
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    const problems = validateLayout(layout);
    if (problems.length > 0) {
      console.error(`Layout ${name} non valido:`, problems);
    } else {
      console.info(`Layout ${name}: OK`);
    }
  }
}

// Stessa logica di tools/generate-landscape.js: lettere coerenti negli
// incroci, ogni parola incrocia, niente adiacenze fuori incrocio, connessa.
function validateLayout(layout) {
  const problems = [];
  const letters = new Map();
  const wordsAt = new Map();

  for (const word of layout.words) {
    word.answer.split("").forEach((letter, index) => {
      const key = cellKey(wordCell(word, index));
      if (letters.has(key) && letters.get(key) !== letter) {
        problems.push(`conflitto di lettere in ${key}`);
      }
      letters.set(key, letter);
      if (!wordsAt.has(key)) wordsAt.set(key, new Set());
      wordsAt.get(key).add(word.number);
    });
  }

  for (const word of layout.words) {
    const crosses = word.answer
      .split("")
      .some((_, index) => wordsAt.get(cellKey(wordCell(word, index))).size > 1);
    if (!crosses) problems.push(`${word.answer} non incrocia nessuna parola`);
  }

  for (const key of wordsAt.keys()) {
    const [col, row] = key.split(",").map(Number);
    for (const neighborKey of [cellKey({ col: col + 1, row }), cellKey({ col, row: row + 1 })]) {
      if (!wordsAt.has(neighborKey)) continue;
      const shared = [...wordsAt.get(key)].some((n) => wordsAt.get(neighborKey).has(n));
      if (!shared) problems.push(`adiacenza non valida tra ${key} e ${neighborKey}`);
    }
  }

  if (!isLayoutConnected(layout, wordsAt)) problems.push("griglia non connessa");
  return problems;
}

function isLayoutConnected(layout, wordsAt) {
  const links = new Map(layout.words.map((w) => [w.number, new Set()]));
  for (const numbers of wordsAt.values()) {
    for (const a of numbers) for (const b of numbers) {
      if (a !== b) links.get(a).add(b);
    }
  }
  const visited = new Set();
  const queue = [layout.words[0].number];
  while (queue.length > 0) {
    const current = queue.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...links.get(current));
  }
  return visited.size === layout.words.length;
}
