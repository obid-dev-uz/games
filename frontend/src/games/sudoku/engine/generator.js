import { EMPTY, geometry, countClues } from "./board";
import { createRng, randomSeed, shuffle } from "./random";
import { hasUniqueSolution } from "./solver";
import { solveWithSingles } from "./logic";
import { getDifficulty } from "./difficulty";

const MAX_ATTEMPTS = 30;

/**
 * A random, fully solved board of the given box size.
 *
 * Starts from a valid pattern and shuffles band order, rows within bands,
 * stack order, columns within stacks and the digits themselves; every step
 * keeps the grid valid. Unlike backtracking this is instant even for 25×25.
 */
export function generateSolution(rng, box = 3) {
  const { size, cells } = geometry(box);
  const base = [...Array(box).keys()];
  const lines = () => shuffle(base.slice(), rng).flatMap((band) => shuffle(base.slice(), rng).map((k) => band * box + k));
  const rows = lines();
  const cols = lines();
  const digits = shuffle(Array.from({ length: size }, (_, k) => k + 1), rng);
  const pattern = (r, c) => (box * (r % box) + Math.floor(r / box) + c) % size;

  const board = new Array(cells);
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) board[r * size + c] = digits[pattern(rows[r], cols[c])];
  }
  return board;
}

/**
 * Digs holes in a solved board, keeping the solution unique, until `target`
 * givens remain or no more cells can be removed.
 */
function carve(solution, target, rng, level) {
  const puzzle = solution.slice();
  let clues = puzzle.length;
  const order = shuffle([...Array(puzzle.length).keys()], rng);

  for (const i of order) {
    if (clues <= target) break;
    const value = puzzle[i];
    puzzle[i] = EMPTY;
    const ok = level.singlesOnly
      ? solveWithSingles(puzzle).solved
      : hasUniqueSolution(puzzle);
    if (ok) clues--;
    else puzzle[i] = value;
  }
  return puzzle;
}

/**
 * Creates a puzzle with exactly one solution for the given difficulty and
 * board size (box 3 = 9×9, 4 = 16×16, 5 = 25×25). Deterministic for a seed.
 *
 * @returns {{ puzzle: number[], solution: number[], difficulty: string, box: number, seed: number, clues: number }}
 */
export function generatePuzzle(difficultyId = "easy", seed = randomSeed(), box = 3) {
  const level = getDifficulty(difficultyId, box);
  const [minClues, maxClues] = level.clues;
  const rng = createRng(seed);

  let best = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateSolution(rng, box);
    const target = minClues + Math.floor(rng() * (maxClues - minClues + 1));
    const puzzle = carve(solution, target, rng, level);
    const clues = countClues(puzzle);

    if (clues <= maxClues) {
      return { puzzle, solution, difficulty: level.id, box, seed, clues };
    }
    // Keep the closest result in case no attempt reaches the range.
    if (!best || clues < best.clues) best = { puzzle, solution, clues };
  }

  return { ...best, difficulty: level.id, box, seed };
}
