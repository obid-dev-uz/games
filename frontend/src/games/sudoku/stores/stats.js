import { defineStore } from "pinia";
import { ref } from "vue";
import storage from "../storage";
import { DIFFICULTY_IDS } from "../engine/difficulty";

const STORAGE_KEY = "stats";

const emptyLevel = () => ({
  played: 0,
  won: 0,
  bestTimeMs: null,
  totalWinTimeMs: 0,
  perfectWins: 0, // won without a single mistake
  currentStreak: 0,
  bestStreak: 0,
});

function load() {
  const saved = storage.get(STORAGE_KEY, {});
  return Object.fromEntries(
    DIFFICULTY_IDS.map((id) => [id, { ...emptyLevel(), ...saved?.[id] }]),
  );
}

export const useSudokuStatsStore = defineStore("sudoku/stats", () => {
  const levels = ref(load());

  const save = () => storage.set(STORAGE_KEY, levels.value);

  function recordStart(difficulty) {
    levels.value[difficulty].played++;
    save();
  }

  function recordWin(difficulty, timeMs, mistakes) {
    const s = levels.value[difficulty];
    s.won++;
    s.totalWinTimeMs += timeMs;
    if (s.bestTimeMs === null || timeMs < s.bestTimeMs) s.bestTimeMs = timeMs;
    if (mistakes === 0) s.perfectWins++;
    s.currentStreak++;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    save();
  }

  /** A lost or abandoned game ends the winning streak. */
  function recordLoss(difficulty) {
    levels.value[difficulty].currentStreak = 0;
    save();
  }

  function isBestTime(difficulty, timeMs) {
    return levels.value[difficulty].bestTimeMs === timeMs;
  }

  const winRate = (difficulty) => {
    const s = levels.value[difficulty];
    return s.played ? s.won / s.played : 0;
  };

  const averageTimeMs = (difficulty) => {
    const s = levels.value[difficulty];
    return s.won ? Math.round(s.totalWinTimeMs / s.won) : null;
  };

  function reset() {
    levels.value = Object.fromEntries(DIFFICULTY_IDS.map((id) => [id, emptyLevel()]));
    save();
  }

  return { levels, recordStart, recordWin, recordLoss, isBestTime, winRate, averageTimeMs, reset };
});
