// A board is a flat array of size×size numbers, row by row. Tiles are
// 1..size²−1 and 0 is the blank. Solved: 1, 2, …, size²−1, 0.

export const BLANK = 0;
export const SIZES = [3, 4, 5, 6];

/** Board side length from the number of cells (9 → 3, …, 36 → 6). */
export function sizeOf(tiles) {
  const size = Math.round(Math.sqrt(tiles.length));
  if (size * size !== tiles.length || !SIZES.includes(size)) {
    throw new Error(`Not a slide board: ${tiles.length} cells`);
  }
  return size;
}

export const rowOf = (index, size) => Math.floor(index / size);
export const colOf = (index, size) => index % size;
export const indexOf = (row, col, size) => row * size + col;

export function solvedBoard(size) {
  if (!SIZES.includes(size)) throw new Error(`Unsupported size ${size}`);
  const cells = size * size;
  return Array.from({ length: cells }, (_, i) => (i === cells - 1 ? BLANK : i + 1));
}

/** The tile that belongs at `index` when solved. */
export const targetAt = (index, cells) => (index === cells - 1 ? BLANK : index + 1);

/** True when the tile at `index` is the one that belongs there. */
export const isInPlace = (tiles, index) => tiles[index] !== BLANK && tiles[index] === index + 1;

export function isSolved(tiles) {
  for (let i = 0; i < tiles.length; i++) if (tiles[i] !== targetAt(i, tiles.length)) return false;
  return true;
}

/** How many tiles (not counting the blank) are already in place. */
export const countInPlace = (tiles) => tiles.reduce((n, _, i) => n + (isInPlace(tiles, i) ? 1 : 0), 0);
