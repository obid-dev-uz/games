import { BLANK, SIZES, sizeOf, rowOf, solvedBoard, countInPlace } from "./board";
import { createRng, randomSeed, shuffleArray } from "./random";

/** Pairs of tiles in the wrong order, reading the board row by row (blank ignored). */
export function countInversions(tiles) {
  const values = tiles.filter((v) => v !== BLANK);
  let inversions = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) if (values[i] > values[j]) inversions++;
  }
  return inversions;
}

/**
 * Whether the solved order can be reached by sliding. Half of all
 * arrangements cannot. Odd sides: solvable iff the inversions are even.
 * Even sides: solvable iff inversions + (blank's row counted from the
 * bottom, starting at 1) is odd.
 */
export function isSolvable(tiles) {
  const size = sizeOf(tiles);
  const inversions = countInversions(tiles);
  if (size % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = size - rowOf(tiles.indexOf(BLANK), size);
  return (inversions + blankRowFromBottom) % 2 === 1;
}

/**
 * A uniformly random, always solvable, clearly scrambled board.
 *
 * A random permutation is solvable half the time; when it is not, swapping
 * two tiles flips its parity and makes it solvable. Boards that are solved
 * or too close to solved (at most a third of the tiles out of place) are
 * drawn again. Deterministic for a seed.
 *
 * @returns {{ size: number, tiles: number[], seed: number }}
 */
export function generatePuzzle(size = 4, seed = randomSeed()) {
  if (!SIZES.includes(size)) throw new Error(`Unsupported size ${size}`);
  const rng = createRng(seed);
  const tilesCount = size * size - 1;
  const maxInPlace = Math.floor(tilesCount / 3);

  for (;;) {
    const tiles = shuffleArray(solvedBoard(size), rng);
    if (!isSolvable(tiles)) {
      // Swap the first two tiles that are not the blank.
      const [a, b] = [0, 1, 2].filter((i) => tiles[i] !== BLANK);
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
    if (countInPlace(tiles) <= maxInPlace) return { size, tiles, seed };
  }
}
