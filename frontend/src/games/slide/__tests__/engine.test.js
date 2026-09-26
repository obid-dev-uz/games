import { describe, it, expect } from "vitest";
import { BLANK, SIZES, sizeOf, solvedBoard, isSolved, isInPlace, countInPlace } from "../engine/board";
import { slidingTiles, tap, slide } from "../engine/moves";
import { countInversions, isSolvable, generatePuzzle } from "../engine/shuffle";
import { createRng } from "../engine/random";

//  1 2 3
//  4 0 5
//  6 7 8
const MIDDLE_BLANK = [1, 2, 3, 4, 0, 5, 6, 7, 8];

const isPermutation = (tiles) =>
  [...tiles].sort((a, b) => a - b).every((v, i) => v === i);

describe("board", () => {
  it("builds solved boards for every size", () => {
    expect(solvedBoard(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0]);
    for (const size of SIZES) {
      const b = solvedBoard(size);
      expect(b).toHaveLength(size * size);
      expect(isSolved(b)).toBe(true);
      expect(countInPlace(b)).toBe(size * size - 1);
    }
    expect(() => solvedBoard(7)).toThrow();
  });

  it("knows the size and which tiles are in place", () => {
    expect(sizeOf(new Array(36))).toBe(6);
    expect(() => sizeOf(new Array(10))).toThrow();
    expect(isSolved(MIDDLE_BLANK)).toBe(false);
    expect(isInPlace(MIDDLE_BLANK, 0)).toBe(true);
    expect(isInPlace(MIDDLE_BLANK, 4)).toBe(false); // blank
    expect(isInPlace(MIDDLE_BLANK, 5)).toBe(false); // 5 sits where 6 belongs
  });
});

describe("moves", () => {
  it("moves a neighbour of the blank", () => {
    const result = tap(MIDDLE_BLANK, 1); // tile 2, above the blank
    expect(result.tiles).toEqual([1, 0, 3, 4, 2, 5, 6, 7, 8]);
    expect(result.moved).toEqual([{ tile: 2, from: 1, to: 4 }]);
  });

  it("slides every tile between the tapped one and the blank", () => {
    //  0 1 2
    //  3 4 5
    //  6 7 8   (blank top-left)
    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(slidingTiles(board, 2)).toEqual([1, 2]);
    const row = tap(board, 2);
    expect(row.tiles).toEqual([1, 2, 0, 3, 4, 5, 6, 7, 8]);
    expect(row.moved).toEqual([
      { tile: 1, from: 1, to: 0 },
      { tile: 2, from: 2, to: 1 },
    ]);

    const column = tap(board, 6); // tiles 3 and 6 slide up
    expect(column.tiles).toEqual([3, 1, 2, 6, 4, 5, 0, 7, 8]);
    expect(column.moved.map((m) => m.tile)).toEqual([3, 6]);
  });

  it("ignores taps on the blank or outside its row and column", () => {
    expect(tap(MIDDLE_BLANK, 4)).toBeNull();
    expect(tap(MIDDLE_BLANK, 0)).toBeNull(); // diagonal
    expect(tap(MIDDLE_BLANK, 99)).toBeNull();
    expect(slidingTiles(MIDDLE_BLANK, 8)).toEqual([]);
  });

  it("slides by direction and stops at the edges", () => {
    expect(slide(MIDDLE_BLANK, "up").tiles).toEqual([1, 2, 3, 4, 7, 5, 6, 0, 8]); // 7 moves up
    expect(slide(MIDDLE_BLANK, "left").tiles).toEqual([1, 2, 3, 4, 5, 0, 6, 7, 8]); // 5 moves left
    const corner = solvedBoard(3); // blank bottom-right
    expect(slide(corner, "up")).toBeNull();
    expect(slide(corner, "left")).toBeNull();
    expect(slide(corner, "down").moved[0].tile).toBe(6);
    expect(() => slide(corner, "diagonal")).toThrow();
  });

  it("keeps the board a permutation and the puzzle solvable", () => {
    const rng = createRng(5);
    for (const size of SIZES) {
      let tiles = solvedBoard(size);
      for (let k = 0; k < 500; k++) {
        const next = tap(tiles, Math.floor(rng() * tiles.length));
        if (next) tiles = next.tiles;
      }
      expect(isPermutation(tiles)).toBe(true);
      expect(isSolvable(tiles)).toBe(true);
    }
  });
});

describe("solvability", () => {
  it("counts inversions ignoring the blank", () => {
    expect(countInversions(solvedBoard(4))).toBe(0);
    expect(countInversions([2, 1, 3, 4, 5, 6, 7, 8, 0])).toBe(1);
  });

  it("rejects the classic unsolvable 14–15 swap on every size", () => {
    for (const size of SIZES) {
      const tiles = solvedBoard(size);
      const n = tiles.length;
      [tiles[n - 3], tiles[n - 2]] = [tiles[n - 2], tiles[n - 3]];
      expect(isSolvable(tiles)).toBe(false);
    }
  });

  it("matches exactly the states reachable by sliding (3×3, exhaustive)", () => {
    // Breadth-first search over every position reachable from solved.
    const start = solvedBoard(3);
    const seen = new Set([start.join("")]);
    const queue = [start];
    while (queue.length) {
      const tiles = queue.pop();
      for (const dir of ["up", "down", "left", "right"]) {
        const next = slide(tiles, dir);
        if (!next) continue;
        const key = next.tiles.join("");
        if (!seen.has(key)) {
          seen.add(key);
          queue.push(next.tiles);
        }
      }
    }
    expect(seen.size).toBe(181440); // 9! / 2

    // isSolvable agrees with reachability for all 9! arrangements.
    let solvable = 0;
    const permute = (prefix, rest) => {
      if (rest.length === 0) {
        const reachable = seen.has(prefix.join(""));
        expect(isSolvable(prefix)).toBe(reachable);
        if (reachable) solvable++;
        return;
      }
      for (let i = 0; i < rest.length; i++) {
        permute([...prefix, rest[i]], [...rest.slice(0, i), ...rest.slice(i + 1)]);
      }
    };
    permute([], [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(solvable).toBe(181440);
  }, 60000);
});

describe("generatePuzzle", () => {
  for (const size of SIZES) {
    it(`makes scrambled, solvable ${size}×${size} boards`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const { tiles } = generatePuzzle(size, seed);
        expect(tiles).toHaveLength(size * size);
        expect(isPermutation(tiles)).toBe(true);
        expect(isSolvable(tiles)).toBe(true);
        expect(isSolved(tiles)).toBe(false);
        expect(countInPlace(tiles)).toBeLessThanOrEqual(Math.floor((size * size - 1) / 3));
      }
    });
  }

  it("is deterministic for a seed", () => {
    expect(generatePuzzle(4, 42)).toEqual(generatePuzzle(4, 42));
    expect(generatePuzzle(4, 42).tiles).not.toEqual(generatePuzzle(4, 43).tiles);
  });

  it("puts the blank anywhere (not always in the corner)", () => {
    const blanks = new Set();
    for (let seed = 1; seed <= 100; seed++) blanks.add(generatePuzzle(3, seed).tiles.indexOf(BLANK));
    expect(blanks.size).toBe(9);
  });

  it("rejects unsupported sizes", () => {
    expect(() => generatePuzzle(2)).toThrow();
  });
});
