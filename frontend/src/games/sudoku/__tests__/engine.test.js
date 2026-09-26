import { describe, it, expect } from "vitest";
import { geometry, geometryOf, parseBoard, countClues, BOX_SIZES } from "../engine/board";
import { solve, countSolutions, hasUniqueSolution } from "../engine/solver";
import { solveWithSingles } from "../engine/logic";
import { isValidPlacement, findConflicts, isSolved } from "../engine/validator";
import { generatePuzzle, generateSolution } from "../engine/generator";
import { DIFFICULTY_IDS, getDifficulty } from "../engine/difficulty";
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
  const { units, size } = geometryOf(board);
  return !board.includes(0) && units.every((unit) => new Set(unit.map((i) => board[i])).size === size);
}

describe("board", () => {
  it("has the right peers and units for every size", () => {
    for (const box of BOX_SIZES) {
      const g = geometry(box);
      const peerCount = 3 * (g.size - 1) - 2 * (box - 1); // row + col + box, minus overlaps
      expect(g.cells).toBe(g.size * g.size);
      expect(g.peers.every((p) => p.length === peerCount)).toBe(true);
      expect(g.units).toHaveLength(3 * g.size);
      expect(g.units.every((u) => new Set(u).size === g.size)).toBe(true);
    }
    expect(geometry(3).peers[0]).toHaveLength(20);
  });

  it("maps cells to boxes", () => {
    const { boxOf, indexOf } = geometry(3);
    expect(boxOf(indexOf(0, 0))).toBe(0);
    expect(boxOf(indexOf(4, 4))).toBe(4);
    expect(boxOf(indexOf(8, 8))).toBe(8);
    expect(boxOf(indexOf(3, 8))).toBe(5);
    const g4 = geometry(4);
    expect(g4.boxOf(g4.indexOf(15, 15))).toBe(15);
    expect(g4.boxOf(g4.indexOf(4, 0))).toBe(4);
  });

  it("infers the size from the board length", () => {
    expect(geometryOf(new Array(81)).box).toBe(3);
    expect(geometryOf(new Array(256)).box).toBe(4);
    expect(geometryOf(new Array(625)).box).toBe(5);
    expect(() => geometryOf(new Array(100))).toThrow();
  });

  it("parses boards", () => {
    expect(countClues(PUZZLE)).toBe(30);
    expect(parseBoard(PUZZLE.join(" "))).toEqual(PUZZLE);
    expect(() => parseBoard("123")).toThrow();
    const big = parseBoard(new Array(256).fill(16).join(","));
    expect(big).toHaveLength(256);
    expect(() => parseBoard(new Array(256).fill(17).join(","))).toThrow();
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
    expect(countSolutions(new Array(81).fill(0))).toBe(2);
    expect(hasUniqueSolution(PUZZLE)).toBe(true);
  });

  it("solves a 16×16 board", () => {
    const solution = generateSolution(createRng(3), 4);
    const puzzle = solution.map((v, i) => (i % 3 === 0 ? 0 : v));
    expect(solve(puzzle)).toEqual(solution);
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
  for (const box of BOX_SIZES) {
    it(`builds a valid random ${box * box}×${box * box} solution`, () => {
      const solution = generateSolution(createRng(1), box);
      expect(geometryOf(solution).box).toBe(box);
      expect(isValidSolution(solution)).toBe(true);
    });
  }

  it("is deterministic for a seed", () => {
    expect(generatePuzzle("medium", 42)).toEqual(generatePuzzle("medium", 42));
    expect(generatePuzzle("medium", 42).puzzle).not.toEqual(generatePuzzle("medium", 43).puzzle);
    expect(generatePuzzle("hard", 7, 4)).toEqual(generatePuzzle("hard", 7, 4));
  });

  const SEEDS = { 3: 5, 4: 3, 5: 2 }; // big boards are slower to check
  for (const box of BOX_SIZES) {
    for (const id of DIFFICULTY_IDS) {
      it(`generates unique ${box * box}×${box * box} ${id} puzzles in the clue range`, () => {
        const level = getDifficulty(id, box);
        const [min, max] = level.clues;
        for (let seed = 1; seed <= SEEDS[box]; seed++) {
          const { puzzle, solution, clues, difficulty } = generatePuzzle(id, seed, box);
          expect(difficulty).toBe(id);
          expect(puzzle).toHaveLength(geometry(box).cells);
          expect(isValidSolution(solution)).toBe(true);
          expect(clues).toBe(countClues(puzzle));
          expect(clues).toBeGreaterThanOrEqual(min);
          expect(clues).toBeLessThanOrEqual(max);
          expect(puzzle.every((v, i) => v === 0 || v === solution[i])).toBe(true);
          if (level.singlesOnly) {
            // Solvable by pure logic ⇒ the solution is unique, and it is ours.
            const logic = solveWithSingles(puzzle);
            expect(logic.solved).toBe(true);
            expect(logic.board).toEqual(solution);
          } else {
            expect(hasUniqueSolution(puzzle)).toBe(true);
          }
        }
      });
    }
  }
});
