// Usa-e-getta: genera e verifica il layout PORTRAIT (mobile) del cruciverba.
// Non viene caricato dalla pagina. Uso: node tools/generate-portrait.js
//
// Obiettivo: replicare la forma della griglia mobile di sa-m.fr, che è
// stretta e alta (~10 colonne, molte righe). Una forma del genere fa sì che
// le celle, dimensionate su `100vw / colonne`, restino grandi come
// nell'originale invece di rimpicciolirsi.
//
// Vincoli verificati (identici a script.js / generate-landscape.js):
// - ogni parola incrocia almeno un'altra
// - nessuna cella condivisa con lettere diverse
// - nessuna adiacenza laterale tra parole parallele
// - griglia connessa
// - le parole lunghe (ENGINEERING, LMINDUSTRY) verticali, per sfruttare
//   l'altezza e tenere stretta la larghezza

const WORDS = [
  { number: 1, answer: "ANDREA" },
  { number: 2, answer: "LANDO" },
  { number: 3, answer: "ACCIAIO" },
  { number: 4, answer: "ENGINEERING", forcedDirection: "down" },
  { number: 5, answer: "COMPLAIN" },
  { number: 6, answer: "SPORT" },
  { number: 7, answer: "ITALY" },
  { number: 8, answer: "LMINDUSTRY", forcedDirection: "down" },
];

const MAX_WIDTH = 10;
const MAX_HEIGHT = 16;

main();

function main() {
  const best = searchBestLayout();
  if (!best) throw new Error("Nessun layout valido trovato");
  const layout = normalize(best);
  const problems = validate(layout);
  if (problems.length > 0) throw new Error("Layout non valido: " + problems.join("; "));
  printLayout(layout);
}

function searchBestLayout() {
  const order = [...WORDS].sort((a, b) => b.answer.length - a.answer.length);
  let best = null;
  let bestScore = Infinity;
  const seenStates = new Set();

  const first = order[0];
  const firstDirection = first.forcedDirection || "down";
  const placed = [{ ...first, direction: firstDirection, col: 0, row: 0 }];
  extend(order.slice(1), placed);
  return best;

  function extend(remaining, placed) {
    if (remaining.length === 0) {
      const score = scoreLayout(placed);
      if (score < bestScore) {
        bestScore = score;
        best = placed.map((p) => ({ ...p }));
      }
      return;
    }
    const state = stateKey(placed);
    if (seenStates.has(state)) return;
    seenStates.add(state);

    for (const word of remaining) {
      const rest = remaining.filter((w) => w !== word);
      for (const placement of crossingPlacements(word, placed)) {
        const candidate = [...placed, placement];
        if (!fitsBounds(candidate)) continue;
        if (validate(normalize(candidate)).length > 0) continue;
        extend(rest, candidate);
      }
    }
  }
}

function stateKey(placed) {
  return normalize(placed)
    .map((p) => `${p.number}:${p.direction}:${p.col},${p.row}`)
    .sort()
    .join("|");
}

function crossingPlacements(word, placed) {
  const placements = [];
  const directions = word.forcedDirection ? [word.forcedDirection] : ["across", "down"];
  for (const direction of directions) {
    for (const other of placed) {
      if (other.direction === direction) continue;
      for (let i = 0; i < word.answer.length; i++) {
        for (let j = 0; j < other.answer.length; j++) {
          if (word.answer[i] !== other.answer[j]) continue;
          const cross = cellAt(other, j);
          const col = direction === "across" ? cross.col - i : cross.col;
          const row = direction === "down" ? cross.row - i : cross.row;
          const startsOnExistingStart = placed.some((p) => p.col === col && p.row === row);
          if (!startsOnExistingStart) placements.push({ ...word, direction, col, row });
        }
      }
    }
  }
  return placements;
}

// Come la griglia mobile di sa-m.fr: portrait (più alto che largo) ma che
// riempie bene la larghezza. Restiamo in portrait (penalità se width > height)
// e poi minimizziamo l'altezza, così la griglia si allarga il più possibile
// invece di diventare un nastro stretto.
function scoreLayout(placed) {
  const { width, height } = boundingBox(placed);
  const landscapePenalty = width > height ? 1000 : 0;
  return landscapePenalty + height * 100 + width;
}

function fitsBounds(placed) {
  const { width, height } = boundingBox(placed);
  return width <= MAX_WIDTH && height <= MAX_HEIGHT;
}

function boundingBox(placed) {
  const cells = placed.flatMap(wordCells);
  const cols = cells.map((c) => c.col);
  const rows = cells.map((c) => c.row);
  return {
    minCol: Math.min(...cols),
    minRow: Math.min(...rows),
    width: Math.max(...cols) - Math.min(...cols) + 1,
    height: Math.max(...rows) - Math.min(...rows) + 1,
  };
}

function normalize(placed) {
  const { minCol, minRow } = boundingBox(placed);
  return placed.map((p) => ({ ...p, col: p.col - minCol, row: p.row - minRow }));
}

function validate(layout) {
  const problems = [];
  const lettersByCell = new Map();
  const wordsByCell = new Map();

  for (const word of layout) {
    for (let i = 0; i < word.answer.length; i++) {
      const key = cellKey(cellAt(word, i));
      const existing = lettersByCell.get(key);
      if (existing !== undefined && existing !== word.answer[i]) {
        problems.push(`conflitto di lettere in ${key}`);
      }
      lettersByCell.set(key, word.answer[i]);
      if (!wordsByCell.has(key)) wordsByCell.set(key, new Set());
      wordsByCell.get(key).add(word.number);
    }
  }

  const startKeys = layout.map((w) => cellKey({ col: w.col, row: w.row }));
  if (new Set(startKeys).size !== startKeys.length) {
    problems.push("due parole partono dalla stessa cella (numerini sovrapposti)");
  }

  for (const word of layout) {
    const crossesAnother = wordCells(word).some(
      (cell) => wordsByCell.get(cellKey(cell)).size > 1
    );
    if (!crossesAnother) problems.push(`la parola ${word.answer} non incrocia nessuno`);
  }

  for (const key of wordsByCell.keys()) {
    const [col, row] = key.split(",").map(Number);
    for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const neighborKey = cellKey({ col: col + dc, row: row + dr });
      if (!wordsByCell.has(neighborKey)) continue;
      const shared = [...wordsByCell.get(key)].some((n) =>
        wordsByCell.get(neighborKey).has(n)
      );
      if (!shared) problems.push(`adiacenza non valida tra ${key} e ${neighborKey}`);
    }
  }

  if (!isConnected(layout)) problems.push("griglia non connessa");
  return problems;
}

function isConnected(layout) {
  const adjacency = new Map(layout.map((w) => [w.number, new Set()]));
  const wordsByCell = new Map();
  for (const word of layout) {
    for (const cell of wordCells(word)) {
      const key = cellKey(cell);
      if (!wordsByCell.has(key)) wordsByCell.set(key, []);
      wordsByCell.get(key).push(word.number);
    }
  }
  for (const numbers of wordsByCell.values()) {
    for (const a of numbers) for (const b of numbers) {
      if (a !== b) adjacency.get(a).add(b);
    }
  }
  const visited = new Set();
  const queue = [layout[0].number];
  while (queue.length > 0) {
    const current = queue.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...adjacency.get(current));
  }
  return visited.size === layout.length;
}

function wordCells(word) {
  return [...word.answer].map((_, i) => cellAt(word, i));
}

function cellAt(word, index) {
  return word.direction === "across"
    ? { col: word.col + index, row: word.row }
    : { col: word.col, row: word.row + index };
}

function cellKey({ col, row }) {
  return `${col},${row}`;
}

function printLayout(layout) {
  const { width, height } = boundingBox(layout);
  console.log(`Layout portrait ${width} colonne x ${height} righe\n`);

  const grid = Array.from({ length: height }, () => Array(width).fill("."));
  for (const word of layout) {
    [...word.answer].forEach((letter, i) => {
      const { col, row } = cellAt(word, i);
      grid[row][col] = letter;
    });
  }
  console.log(grid.map((row) => row.join(" ")).join("\n"));

  console.log("\nDa hardcodare in script.js:\n");
  const sorted = [...layout].sort((a, b) => a.number - b.number);
  for (const { number, answer, direction, col, row } of sorted) {
    console.log(
      `  { number: ${number}, answer: "${answer}", direction: "${direction}", col: ${col}, row: ${row} },`
    );
  }
}
