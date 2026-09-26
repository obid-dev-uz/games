import { CELLS, SIZE, EMPTY, ALL_DIGITS, rowOf, colOf, boxOf, bitCount } from "./board";
import { shuffle } from "./random";

/**
 * Backtracking search with bitmasks and "most constrained cell first".
 * Calls onSolution(board) for every solution found; stops when it returns true.
 * Returns false if the givens already contradict each other.
 */
function search(board, onSolution, rng) {
  const grid = board.slice();
  const rows = new Array(SIZE).fill(0);
  const cols = new Array(SIZE).fill(0);
  const boxes = new Array(SIZE).fill(0);

  for (let i = 0; i < CELLS; i++) {
    const v = grid[i];
    if (v === EMPTY) continue;
    const bit = 1 << v;
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);
    if ((rows[r] | cols[c] | boxes[b]) & bit) return false;
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;
  }

  const empties = [];
  for (let i = 0; i < CELLS; i++) if (grid[i] === EMPTY) empties.push(i);

  function step(depth) {
    if (depth === empties.length) return onSolution(grid.slice());

    // Pick the empty cell with the fewest candidates (MRV).
    let best = -1;
    let bestMask = 0;
    let bestCount = SIZE + 1;
    for (let k = depth; k < empties.length; k++) {
      const i = empties[k];
      const mask = ALL_DIGITS & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const count = bitCount(mask);
      if (count < bestCount) {
        best = k;
        bestMask = mask;
        bestCount = count;
        if (count <= 1) break;
      }
    }
    if (bestCount === 0) return false;

    [empties[depth], empties[best]] = [empties[best], empties[depth]];
    const i = empties[depth];
    const r = rowOf(i);
    const c = colOf(i);
    const b = boxOf(i);

    const digits = [];
    for (let d = 1; d <= SIZE; d++) if (bestMask & (1 << d)) digits.push(d);
    if (rng) shuffle(digits, rng);

    for (const d of digits) {
      const bit = 1 << d;
      grid[i] = d;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      if (step(depth + 1)) return true;
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
    }
    grid[i] = EMPTY;
    [empties[depth], empties[best]] = [empties[best], empties[depth]];
    return false;
  }

  step(0);
  return true;
}

/** Returns a solved copy of the board, or null if it has no solution. */
export function solve(board, rng) {
  let result = null;
  search(
    board,
    (solution) => {
      result = solution;
      return true;
    },
    rng,
  );
  return result;
}

/** Counts solutions, stopping early at `limit` (2 is enough to test uniqueness). */
export function countSolutions(board, limit = 2) {
  let count = 0;
  search(board, () => ++count >= limit);
  return count;
}

export const hasUniqueSolution = (board) => countSolutions(board, 2) === 1;
