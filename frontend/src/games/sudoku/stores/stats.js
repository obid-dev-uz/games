import { defineStore } from "pinia";
import { ref } from "vue";
import storage from "../storage";
import { DIFFICULTY_IDS } from "../engine/difficulty";
import { BOX_SIZES } from "../engine/board";

const STORAGE_KEY = "stats";
const STATS_VERSION = 2; // v2: stats per board size; v1 (9×9 only) had difficulties at the top level

const emptyLevel = () => ({
  played: 0,
  won: 0,
  bestTimeMs: null,
  totalWinTimeMs: 0,
  perfectWins: 0, // won without a single mistake
  currentStreak: 0,
  bestStreak: 0,
});

const emptySize = (saved = {}) =>
  Object.fromEntries(DIFFICULTY_IDS.map((id) => [id, { ...emptyLevel(), ...saved?.[id] }]));

/** { 3: { easy: {...}, ... }, 4: {...}, 5: {...} } keyed by box size. */
function load() {
  const saved = storage.get(STORAGE_KEY, {}) ?? {};
  const sizes = saved.v === STATS_VERSION ? saved.sizes : { 3: saved }; // v1 → the 9×9 stats
  return Object.fromEntries(BOX_SIZES.map((box) => [box, emptySize(sizes?.[box])]));
}

export const useSudokuStatsStore = defineStore("sudoku/stats", () => {
  const sizes = ref(load());

  const save = () => storage.set(STORAGE_KEY, { v: STATS_VERSION, sizes: sizes.value });

  /** Stats of one board size and difficulty. */
  const get = (box, difficulty) => sizes.value[box][difficulty];

  function recordStart(box, difficulty) {
    get(box, difficulty).played++;
    save();
  }

  function recordWin(box, difficulty, timeMs, mistakes) {
    const s = get(box, difficulty);
    s.won++;
    s.totalWinTimeMs += timeMs;
    if (s.bestTimeMs === null || timeMs < s.bestTimeMs) s.bestTimeMs = timeMs;
    if (mistakes === 0) s.perfectWins++;
    s.currentStreak++;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    save();
  }

  /** A lost or abandoned game ends the winning streak. */
  function recordLoss(box, difficulty) {
    get(box, difficulty).currentStreak = 0;
    save();
  }

  const isBestTime = (box, difficulty, timeMs) => get(box, difficulty).bestTimeMs === timeMs;

  const winRate = (box, difficulty) => {
    const s = get(box, difficulty);
    return s.played ? s.won / s.played : 0;
  };

  const averageTimeMs = (box, difficulty) => {
    const s = get(box, difficulty);
    return s.won ? Math.round(s.totalWinTimeMs / s.won) : null;
  };

  function reset() {
    sizes.value = Object.fromEntries(BOX_SIZES.map((box) => [box, emptySize()]));
    save();
  }

  return { sizes, get, recordStart, recordWin, recordLoss, isBestTime, winRate, averageTimeMs, reset };
});
