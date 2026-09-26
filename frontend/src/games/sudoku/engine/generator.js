import { CELLS, EMPTY, createEmptyBoard, countClues } from "./board";
import { createRng, randomSeed, shuffle } from "./random";
import { solve, hasUniqueSolution } from "./solver";
import { solveWithSingles } from "./logic";
import { getDifficulty } from "./difficulty";

const MAX_ATTEMPTS = 50;

/** A random, fully solved board. */
export function generateSolution(rng) {
  return solve(createEmptyBoard(), rng);
}

/**
 * Digs holes in a solved board, keeping the solution unique, until `target`
 * givens remain or no more cells can be removed.
 */
function carve(solution, target, rng, singlesOnly) {
  const puzzle = solution.slice();
  let clues = CELLS;
  const order = shuffle([...Array(CELLS).keys()], rng);

  for (const i of order) {
    if (clues <= target) break;
    const value = puzzle[i];
    puzzle[i] = EMPTY;
    const ok = singlesOnly ? solveWithSingles(puzzle).solved : hasUniqueSolution(puzzle);
    if (ok) clues--;
    else puzzle[i] = value;
  }
  return puzzle;
}

/**
 * Creates a puzzle with exactly one solution for the given difficulty.
 * Deterministic for a given seed.
 *
 * @returns {{ puzzle: number[], solution: number[], difficulty: string, seed: number, clues: number }}
 */
export function generatePuzzle(difficultyId = "easy", seed = randomSeed()) {
  const level = getDifficulty(difficultyId);
  const [minClues, maxClues] = level.clues;
  const rng = createRng(seed);

  let best = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateSolution(rng);
    const target = minClues + Math.floor(rng() * (maxClues - minClues + 1));
    const puzzle = carve(solution, target, rng, level.singlesOnly);
    const clues = countClues(puzzle);

    if (clues <= maxClues) {
      return { puzzle, solution, difficulty: level.id, seed, clues };
    }
    // Keep the closest result in case no attempt reaches the range.
    if (!best || clues < best.clues) best = { puzzle, solution, clues };
  }

  return { ...best, difficulty: level.id, seed };
}
