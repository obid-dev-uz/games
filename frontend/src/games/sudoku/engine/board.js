// A board is a flat array of size×size numbers, row by row; 0 means an empty cell.
// size = box × box: 9×9 (box 3), 16×16 (box 4) or 25×25 (box 5).
// Digits are 1..size and are stored as bit d in 32-bit masks (fits up to 25).

export const EMPTY = 0;
export const BOX_SIZES = [3, 4, 5];

const cache = new Map();

/**
 * Everything that depends on the board size, computed once per box size:
 * size, cells, row/col/box lookups, peers and units.
 */
export function geometry(box = 3) {
  if (cache.has(box)) return cache.get(box);
  if (!BOX_SIZES.includes(box)) throw new Error(`Unsupported box size ${box}`);

  const size = box * box;
  const cells = size * size;
  const rowOf = (i) => Math.floor(i / size);
  const colOf = (i) => i % size;
  const boxOf = (i) => Math.floor(rowOf(i) / box) * box + Math.floor(colOf(i) / box);
  const indexOf = (row, col) => row * size + col;

  const ROW = Int16Array.from({ length: cells }, (_, i) => rowOf(i));
  const COL = Int16Array.from({ length: cells }, (_, i) => colOf(i));
  const BOXI = Int16Array.from({ length: cells }, (_, i) => boxOf(i));

  /** units: rows, then columns, then boxes; each a list of `size` cells. */
  const units = [
    ...Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => indexOf(r, c))),
    ...Array.from({ length: size }, (_, c) => Array.from({ length: size }, (_, r) => indexOf(r, c))),
    ...Array.from({ length: size }, (_, b) =>
      Array.from({ length: size }, (_, k) =>
        indexOf(Math.floor(b / box) * box + Math.floor(k / box), (b % box) * box + (k % box)),
      ),
    ),
  ];
  /** unitsOfCell[i]: the row, column and box that contain cell i. */
  const unitsOfCell = Array.from({ length: cells }, (_, i) => [
    units[ROW[i]],
    units[size + COL[i]],
    units[2 * size + BOXI[i]],
  ]);
  /** peers[i]: the other cells sharing a row, column or box with cell i. */
  const peers = Array.from({ length: cells }, (_, i) => [
    ...new Set(unitsOfCell[i].flat().filter((j) => j !== i)),
  ]);

  // Frozen: never changes, and Vue skips non-extensible objects, so the hot
  // lookups below are not wrapped in reactive proxies when read via a store.
  const g = Object.freeze({
    box,
    size,
    cells,
    allDigits: (2 ** (size + 1) - 1) & ~1, // bits 1..size
    ROW,
    COL,
    BOX: BOXI,
    rowOf,
    colOf,
    boxOf,
    indexOf,
    units,
    unitsOfCell,
    peers,
  });
  cache.set(box, g);
  return g;
}

/** Geometry of an existing board, from its length (81 → box 3, 256 → 4, 625 → 5). */
export function geometryOf(board) {
  const box = Math.round(Math.sqrt(Math.sqrt(board.length)));
  if (box ** 4 !== board.length) throw new Error(`Not a sudoku board: ${board.length} cells`);
  return geometry(box);
}

export const createEmptyBoard = (box = 3) => new Array(geometry(box).cells).fill(EMPTY);

export const countClues = (board) => board.reduce((n, v) => n + (v !== EMPTY ? 1 : 0), 0);

/**
 * Text → board. 9×9 accepts the classic 81-character form ("53..7....", 0 or .
 * for empty); any size accepts numbers separated by spaces/commas/newlines.
 */
export function parseBoard(text) {
  const compact = text.replace(/\s+/g, "");
  if (compact.length === 81 && /^[0-9.]+$/.test(compact)) {
    return [...compact].map((ch) => (ch === "." ? EMPTY : Number(ch)));
  }
  const values = text
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((v) => (v === "." ? EMPTY : Number(v)));
  const g = geometryOf(values);
  if (values.some((v) => !Number.isInteger(v) || v < 0 || v > g.size)) {
    throw new Error(`parseBoard: values must be 0..${g.size}`);
  }
  return values;
}

/** Bitmask of the digits still allowed in cell i. */
export function candidatesMask(board, i, g = geometryOf(board)) {
  let used = 0;
  for (const p of g.peers[i]) used |= 1 << board[p];
  return g.allDigits & ~used;
}

export function bitCount(mask) {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}

/** Index of the single set bit (the digit) in a one-bit mask. */
export const lowestDigit = (mask) => 31 - Math.clz32(mask & -mask);
