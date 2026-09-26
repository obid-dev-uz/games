import { EMPTY, geometryOf, candidatesMask, bitCount, lowestDigit } from "./board";

/**
 * Solves as far as possible using only the two techniques a beginner uses:
 *  - naked single:  a cell has exactly one candidate left;
 *  - hidden single: a digit fits in only one cell of a row, column or box.
 * Returns { solved, board, steps }. Used to grade difficulty: easy puzzles
 * must be solvable this way, without guessing. Works for any board size and
 * is much cheaper than a uniqueness search on big boards.
 */
export function solveWithSingles(board) {
  const g = geometryOf(board);
  const { cells, size, units, peers } = g;
  const grid = board.slice();
  const masks = new Int32Array(cells);
  for (let i = 0; i < cells; i++) if (grid[i] === EMPTY) masks[i] = candidatesMask(grid, i, g);

  const place = (i, d) => {
    grid[i] = d;
    masks[i] = 0;
    for (const p of peers[i]) masks[p] &= ~(1 << d);
  };

  let steps = 0;
  let progress = true;
  while (progress) {
    progress = false;

    for (let i = 0; i < cells; i++) {
      if (grid[i] === EMPTY && bitCount(masks[i]) === 1) {
        place(i, lowestDigit(masks[i]));
        steps++;
        progress = true;
      }
    }

    for (const unit of units) {
      for (let d = 1; d <= size; d++) {
        const bit = 1 << d;
        let spot = -1;
        let count = 0;
        for (const i of unit) {
          if (grid[i] === d) {
            count = -1;
            break;
          }
          if (masks[i] & bit) {
            spot = i;
            count++;
          }
        }
        if (count === 1) {
          place(spot, d);
          steps++;
          progress = true;
        }
      }
    }
  }

  return { solved: !grid.includes(EMPTY), board: grid, steps };
}
