// Generatore di layout del cruciverba — fonte UNICA dell'algoritmo (prima
// duplicato in tools/generate-portrait.js e tools/generate-landscape.js).
//
// Deterministico ed esaustivo: a parita di parole produce sempre lo stesso
// layout (ricerca backtracking che tiene il migliore secondo il punteggio
// dell'orientamento). Espone due globali: generateLayout() e validateLayout().
//
// generateLayout(words, "portrait" | "landscape")
//   words: [{ number, answer }]  (answer in MAIUSCOLO, solo A-Z)
//   -> { cols, rows, words: [{ number, answer, direction, col, row }] }  oppure null

const CrosswordGenerator = (() => {
  // Le parole lunghe vengono forzate sull'asse dominante dell'orientamento
  // (verticali in portrait, orizzontali in landscape) per sfruttare lo spazio.
  const LONG_WORD_LENGTH = 7;

  // Rete di sicurezza: se la ricerca esplode (set di parole ostico), ci si
  // ferma sul miglior layout trovato finora invece di bloccare il browser.
  const MAX_STATES = 200000;

  const ORIENTATIONS = {
    // Portrait (mobile): stretto e alto. Penalizza il largo e minimizza l'altezza.
    portrait: {
      firstDirection: "down",
      longWordDirection: "down",
      maxWidth: 10,
      maxHeight: 16,
      score: ({ width, height }) => (width > height ? 1000 : 0) + height * 100 + width,
    },
    // Landscape (desktop/tablet): largo e basso. Penalizza l'alto e minimizza l'area.
    landscape: {
      firstDirection: "across",
      longWordDirection: "across",
      maxWidth: 19,
      maxHeight: 8,
      score: ({ width, height }) => (height >= width ? 1000 : 0) + height * 50 + width * height,
    },
  };

  function generateLayout(words, orientationName) {
    const orientation = ORIENTATIONS[orientationName];
    if (!orientation) throw new Error(`Orientamento sconosciuto: ${orientationName}`);

    const prepared = prepareWords(words, orientation);
    const best = searchBestLayout(prepared, orientation);
    if (!best) return null;

    const layout = normalize(best);
    if (validate(layout).length > 0) return null;
    const { width, height } = boundingBox(layout);
    return { cols: width, rows: height, words: layout };
  }

  // Forza le parole lunghe sull'asse dominante; le altre restano libere.
  function prepareWords(words, orientation) {
    return words.map((word) => ({
      number: word.number,
      answer: word.answer,
      forcedDirection:
        word.answer.length >= LONG_WORD_LENGTH ? orientation.longWordDirection : undefined,
    }));
  }

  function searchBestLayout(words, orientation) {
    const order = [...words].sort((a, b) => b.answer.length - a.answer.length);
    let best = null;
    let bestScore = Infinity;
    const seenStates = new Set();

    const first = order[0];
    const firstDirection = first.forcedDirection || orientation.firstDirection;
    const placed = [{ ...first, direction: firstDirection, col: 0, row: 0 }];
    extend(order.slice(1), placed);
    return best;

    // A ogni passo prova qualunque parola rimanente: l'ordine di piazzamento
    // conta (una parola forzata orizzontale ha bisogno di una verticale gia
    // piazzata da incrociare), quindi non si segue un ordine fisso.
    function extend(remaining, placed) {
      if (seenStates.size > MAX_STATES) return; // rete di sicurezza
      if (remaining.length === 0) {
        const score = orientation.score(boundingBox(placed));
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
          if (!fitsBounds(candidate, orientation)) continue;
          if (validate(normalize(candidate)).length > 0) continue;
          extend(rest, candidate);
        }
      }
    }
  }

  // Identifica un insieme di piazzamenti a meno di traslazioni: evita di
  // riesplorare lo stesso stato raggiunto da un ordine diverso.
  function stateKey(placed) {
    return normalize(placed)
      .map((p) => `${p.number}:${p.direction}:${p.col},${p.row}`)
      .sort()
      .join("|");
  }

  // Tutte le posizioni in cui `word` incrocia una parola gia piazzata.
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

  function fitsBounds(placed, orientation) {
    const { width, height } = boundingBox(placed);
    return width <= orientation.maxWidth && height <= orientation.maxHeight;
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

  // Vincoli: lettere coerenti negli incroci, ogni parola incrocia, niente due
  // parole dalla stessa cella, niente adiacenze fuori incrocio, griglia connessa.
  function validate(words) {
    const problems = [];
    const lettersByCell = new Map();
    const wordsByCell = new Map();

    for (const word of words) {
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

    const startKeys = words.map((w) => cellKey({ col: w.col, row: w.row }));
    if (new Set(startKeys).size !== startKeys.length) {
      problems.push("due parole partono dalla stessa cella (numerini sovrapposti)");
    }

    for (const word of words) {
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

    if (!isConnected(words)) problems.push("griglia non connessa");
    return problems;
  }

  function isConnected(words) {
    const adjacency = new Map(words.map((w) => [w.number, new Set()]));
    const wordsByCell = new Map();
    for (const word of words) {
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
    const queue = [words[0].number];
    while (queue.length > 0) {
      const current = queue.pop();
      if (visited.has(current)) continue;
      visited.add(current);
      queue.push(...adjacency.get(current));
    }
    return visited.size === words.length;
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

  // Valida un layout gia generato ({ cols, rows, words }). Usato in dev da script.js.
  function validateLayout(layout) {
    return validate(layout.words);
  }

  return { generateLayout, validateLayout };
})();

const generateLayout = CrosswordGenerator.generateLayout;
const validateLayout = CrosswordGenerator.validateLayout;
