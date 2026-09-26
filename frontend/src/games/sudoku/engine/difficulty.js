/**
 * clues:        how many givens the puzzle keeps (inclusive range).
 * singlesOnly:  the puzzle must be solvable with naked/hidden singles alone,
 *               i.e. without guessing. Required for the beginner levels.
 */
export const DIFFICULTIES = {
  easy: { id: "easy", label: "Oson", clues: [36, 40], singlesOnly: true },
  medium: { id: "medium", label: "O'rta", clues: [30, 35], singlesOnly: true },
  hard: { id: "hard", label: "Qiyin", clues: [26, 29], singlesOnly: false },
  expert: { id: "expert", label: "Ekspert", clues: [22, 25], singlesOnly: false },
};

export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES);

export function getDifficulty(id) {
  const level = DIFFICULTIES[id];
  if (!level) throw new Error(`Unknown difficulty "${id}"`);
  return level;
}
