import { describe, it, expect } from "vitest";
import {
  CELLS,
  PEERS,
  UNITS,
  parseBoard,
  serializeBoard,
  countClues,
  boxOf,
  indexOf,
} from "../engine/board";
import { solve, countSolutions, hasUniqueSolution } from "../engine/solver";
import { solveWithSingles } from "../engine/logic";
import { isValidPlacement, findConflicts, isSolved } from "../engine/validator";
import { generatePuzzle, generateSolution } from "../engine/generator";
import { DIFFICULTIES, DIFFICULTY_IDS } from "../engine/difficulty";
import { createRng } from "../engine/random";

// Classic example puzzle (Wikipedia "Sudoku" article) and its solution.
const PUZZLE = parseBoard(`
  53..7....
  6..195...
  .98....6.
  8...6...3
  4..8.3..1
  7...2...6
  .6....28.
  ...419..5
  ....8..79`);
const SOLUTION = parseBoard(`
  534678912
  672195348
  198342567
  859761423
  426853791
  713924856
  961537284
  287419635
  345286179`);

function isValidSolution(board) {
  return UNITS.every((unit) => new Set(unit.map((i) => board[i])).size === 9 && !board.includes(0));
}

describe("board", () => {
  it("has 20 peers per cell and 27 units", () => {
    expect(PEERS.every((p) => p.length === 20)).toBe(true);
    expect(UNITS).toHaveLength(27);
  });

  it("maps cells to boxes", () => {
    expect(boxOf(indexOf(0, 0))).toBe(0);
    expect(boxOf(indexOf(4, 4))).toBe(4);
    expect(boxOf(indexOf(8, 8))).toBe(8);
    expect(boxOf(indexOf(3, 8))).toBe(5);
  });

  it("parses and serializes", () => {
    expect(countClues(PUZZLE)).toBe(30);
    expect(parseBoard(serializeBoard(PUZZLE))).toEqual(PUZZLE);
    expect(() => parseBoard("123")).toThrow();
  });
});

describe("solver", () => {
  it("solves the classic puzzle", () => {
    expect(solve(PUZZLE)).toEqual(SOLUTION);
  });

  it("does not mutate its input", () => {
    const copy = PUZZLE.slice();
    solve(PUZZLE);
    expect(PUZZLE).toEqual(copy);
  });

  it("counts solutions with an early stop", () => {
    expect(countSolutions(PUZZLE)).toBe(1);
    expect(countSolutions(new Array(CELLS).fill(0))).toBe(2);
    expect(hasUniqueSolution(PUZZLE)).toBe(true);
  });

  it("returns null / 0 for contradictory givens", () => {
    const broken = PUZZLE.slice();
    broken[2] = 5; // second 5 in the first row
    expect(solve(broken)).toBeNull();
    expect(countSolutions(broken)).toBe(0);
  });
});

describe("logic (singles)", () => {
  it("solves the classic puzzle without guessing", () => {
    const { solved, board } = solveWithSingles(PUZZLE);
    expect(solved).toBe(true);
    expect(board).toEqual(SOLUTION);
  });
});

describe("validator", () => {
  it("checks placements against peers", () => {
    expect(isValidPlacement(PUZZLE, 2, 4)).toBe(true);
    expect(isValidPlacement(PUZZLE, 2, 5)).toBe(false); // row
    expect(isValidPlacement(PUZZLE, 2, 8)).toBe(false); // column
    expect(isValidPlacement(PUZZLE, 2, 9)).toBe(false); // box
  });

  it("finds both cells of a conflict", () => {
    const board = PUZZLE.slice();
    board[2] = 5;
    expect([...findConflicts(board)].sort((a, b) => a - b)).toEqual([0, 2]);
    expect(findConflicts(PUZZLE).size).toBe(0);
  });

  it("detects a solved board", () => {
    expect(isSolved(SOLUTION, SOLUTION)).toBe(true);
    expect(isSolved(PUZZLE, SOLUTION)).toBe(false);
  });
});

describe("generator", () => {
  it("builds a valid random solution", () => {
    expect(isValidSolution(generateSolution(createRng(1)))).toBe(true);
  });

  it("is deterministic for a seed", () => {
    expect(generatePuzzle("medium", 42)).toEqual(generatePuzzle("medium", 42));
    expect(generatePuzzle("medium", 42).puzzle).not.toEqual(generatePuzzle("medium", 43).puzzle);
  });

  for (const id of DIFFICULTY_IDS) {
    it(`generates unique ${id} puzzles in the clue range`, () => {
      const [min, max] = DIFFICULTIES[id].clues;
      for (let seed = 1; seed <= 5; seed++) {
        const { puzzle, solution, clues, difficulty } = generatePuzzle(id, seed);
        expect(difficulty).toBe(id);
        expect(isValidSolution(solution)).toBe(true);
        expect(clues).toBe(countClues(puzzle));
        expect(clues).toBeGreaterThanOrEqual(min);
        expect(clues).toBeLessThanOrEqual(max);
        expect(puzzle.every((v, i) => v === 0 || v === solution[i])).toBe(true);
        expect(hasUniqueSolution(puzzle)).toBe(true);
        if (DIFFICULTIES[id].singlesOnly) expect(solveWithSingles(puzzle).solved).toBe(true);
      }
    });
  }
});
