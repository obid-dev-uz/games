/**
 * Difficulty per board size (box 3 = 9×9, 4 = 16×16, 5 = 25×25).
 *
 * clues:       how many givens the puzzle keeps (inclusive range).
 * singlesOnly: the puzzle must be solvable with naked/hidden singles alone,
 *              i.e. without guessing (this also proves the solution unique).
 *
 * 16×16 and 25×25 always use singlesOnly: proving uniqueness by search is far
 * too slow there (an expert 16×16 took up to 41 s), while the singles check
 * carves a 25×25 in well under a second. Their levels differ by clue count;
 * the ranges sit above the measured singles-only minimum (16×16 ≈ 90–94,
 * 25×25 ≈ 263–265 clues) so every level is reachable.
 */
export const DIFFICULTIES = {
  easy: { id: "easy", label: "Oson" },
  medium: { id: "medium", label: "O'rta" },
  hard: { id: "hard", label: "Qiyin" },
  expert: { id: "expert", label: "Ekspert" },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES);

const RULES = {
  3: {
    easy: { clues: [36, 40], singlesOnly: true },
    medium: { clues: [30, 35], singlesOnly: true },
    hard: { clues: [26, 29], singlesOnly: false },
    expert: { clues: [22, 25], singlesOnly: false },
  },
  4: {
    easy: { clues: [130, 140], singlesOnly: true },
    medium: { clues: [115, 129], singlesOnly: true },
    hard: { clues: [106, 114], singlesOnly: true },
    expert: { clues: [97, 105], singlesOnly: true },
  },
  5: {
    easy: { clues: [340, 360], singlesOnly: true },
    medium: { clues: [310, 339], singlesOnly: true },
    hard: { clues: [290, 309], singlesOnly: true },
    expert: { clues: [272, 289], singlesOnly: true },
  },
};

/** Generation rules for a difficulty on a given board size. */
export function getDifficulty(id, box = 3) {
  const level = DIFFICULTIES[id];
  const rules = RULES[box]?.[id];
  if (!level || !rules) throw new Error(`Unknown difficulty "${id}" for box ${box}`);
  return { ...level, box, ...rules };
}
