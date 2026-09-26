import { CELLS, EMPTY, PEERS } from "./board";

/** True if `value` can go in cell `index` without clashing with a peer. */
export function isValidPlacement(board, index, value) {
  if (value === EMPTY) return true;
  return PEERS[index].every((p) => p === index || board[p] !== value);
}

/** Indices of all filled cells that share a digit with one of their peers. */
export function findConflicts(board) {
  const conflicts = new Set();
  for (let i = 0; i < CELLS; i++) {
    const v = board[i];
    if (v === EMPTY) continue;
    for (const p of PEERS[i]) {
      if (board[p] === v) {
        conflicts.add(i);
        conflicts.add(p);
      }
    }
  }
  return conflicts;
}

/** True when every cell is filled and matches the solution. */
export function isSolved(board, solution) {
  for (let i = 0; i < CELLS; i++) if (board[i] !== solution[i]) return false;
  return true;
}
