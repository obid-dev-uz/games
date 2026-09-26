import { EMPTY, geometryOf, bitCount } from "./board";
import { shuffle } from "./random";

/**
 * Backtracking search with bitmasks and "most constrained cell first".
 * Calls onSolution(board) for every solution found; stops when it returns true.
 * Returns false if the givens already contradict each other.
 */
function search(board, onSolution, rng = null) {
  const g = geometryOf(board);
  const { size, cells, ROW, COL, BOX, allDigits } = g;
  const grid = board.slice();
  const rows = new Int32Array(size);
  const cols = new Int32Array(size);
  const boxes = new Int32Array(size);

  for (let i = 0; i < cells; i++) {
    const v = grid[i];
    if (v === EMPTY) continue;
    const bit = 1 << v;
    if ((rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]) & bit) return false;
    rows[ROW[i]] |= bit;
    cols[COL[i]] |= bit;
    boxes[BOX[i]] |= bit;
  }

  const empties = [];
  for (let i = 0; i < cells; i++) if (grid[i] === EMPTY) empties.push(i);

  function step(depth) {
    if (depth === empties.length) return onSolution(grid.slice());

    // Pick the empty cell with the fewest candidates (MRV).
    let best = -1;
    let bestMask = 0;
    let bestCount = size + 1;
    for (let k = depth; k < empties.length; k++) {
      const i = empties[k];
      const mask = allDigits & ~(rows[ROW[i]] | cols[COL[i]] | boxes[BOX[i]]);
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
    const r = ROW[i];
    const c = COL[i];
    const b = BOX[i];

    const digits = [];
    for (let d = 1; d <= size; d++) if (bestMask & (1 << d)) digits.push(d);
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
