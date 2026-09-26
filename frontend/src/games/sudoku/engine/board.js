// A board is a flat array of 81 numbers, row by row; 0 means an empty cell.

export const SIZE = 9;
export const BOX = 3;
export const CELLS = SIZE * SIZE;
export const EMPTY = 0;
export const ALL_DIGITS = 0b1111111110; // bits 1..9 set

export const rowOf = (i) => Math.floor(i / SIZE);
export const colOf = (i) => i % SIZE;
export const boxOf = (i) => Math.floor(rowOf(i) / BOX) * BOX + Math.floor(colOf(i) / BOX);
export const indexOf = (row, col) => row * SIZE + col;

/** PEERS[i]: the 20 other cells sharing a row, column or box with cell i. */
export const PEERS = Array.from({ length: CELLS }, (_, i) => {
  const peers = [];
  for (let j = 0; j < CELLS; j++) {
    if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) {
      peers.push(j);
    }
  }
  return peers;
});

/** UNITS: the 27 groups of 9 cells (9 rows, 9 columns, 9 boxes). */
export const UNITS = [
  ...Array.from({ length: SIZE }, (_, r) => Array.from({ length: SIZE }, (_, c) => indexOf(r, c))),
  ...Array.from({ length: SIZE }, (_, c) => Array.from({ length: SIZE }, (_, r) => indexOf(r, c))),
  ...Array.from({ length: SIZE }, (_, b) =>
    Array.from({ length: SIZE }, (_, k) =>
      indexOf(Math.floor(b / BOX) * BOX + Math.floor(k / BOX), (b % BOX) * BOX + (k % BOX)),
    ),
  ),
];

/** UNITS_OF_CELL[i]: the 3 units (row, column, box) that contain cell i. */
export const UNITS_OF_CELL = Array.from({ length: CELLS }, (_, i) =>
  UNITS.filter((unit) => unit.includes(i)),
);

export const createEmptyBoard = () => new Array(CELLS).fill(EMPTY);

export const countClues = (board) => board.reduce((n, v) => n + (v !== EMPTY ? 1 : 0), 0);

/** "53..7...." (or with 0s) → board. Whitespace is ignored. */
export function parseBoard(text) {
  const chars = text.replace(/\s+/g, "");
  if (chars.length !== CELLS || !/^[0-9.]+$/.test(chars)) {
    throw new Error("parseBoard: expected 81 characters of 1-9, 0 or .");
  }
  return [...chars].map((ch) => (ch === "." ? EMPTY : Number(ch)));
}

/** board → 81-char string with 0 for empty cells (compact storage format). */
export const serializeBoard = (board) => board.join("");

/** Bitmask of the digits still allowed in cell i. */
export function candidatesMask(board, i) {
  let used = 0;
  for (const p of PEERS[i]) used |= 1 << board[p];
  return ALL_DIGITS & ~used;
}

export function maskToDigits(mask) {
  const digits = [];
  for (let d = 1; d <= SIZE; d++) if (mask & (1 << d)) digits.push(d);
  return digits;
}

export function bitCount(mask) {
  let n = 0;
  while (mask) {
    mask &= mask - 1;
    n++;
  }
  return n;
}
