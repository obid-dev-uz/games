import { defineStore } from "pinia";
import { ref } from "vue";
import storage from "../storage";
import { SIZES } from "../engine/board";

const STORAGE_KEY = "stats";
const STATS_VERSION = 1;

const emptySize = () => ({
  played: 0,
  won: 0,
  bestMoves: null,
  bestTimeMs: null,
  totalWinMoves: 0,
  totalWinTimeMs: 0,
  currentStreak: 0,
  bestStreak: 0,
});

/** { 3: {...}, 4: {...}, 5: {...}, 6: {...} } keyed by board size. */
function load() {
  const saved = storage.get(STORAGE_KEY, null);
  const sizes = saved?.v === STATS_VERSION ? saved.sizes : {};
  return Object.fromEntries(SIZES.map((size) => [size, { ...emptySize(), ...sizes?.[size] }]));
}

export const useSlideStatsStore = defineStore("slide/stats", () => {
  const sizes = ref(load());

  const save = () => storage.set(STORAGE_KEY, { v: STATS_VERSION, sizes: sizes.value });

  const get = (size) => sizes.value[size];

  function recordStart(size) {
    get(size).played++;
    save();
  }

  function recordWin(size, moves, timeMs) {
    const s = get(size);
    s.won++;
    s.totalWinMoves += moves;
    s.totalWinTimeMs += timeMs;
    if (s.bestMoves === null || moves < s.bestMoves) s.bestMoves = moves;
    if (s.bestTimeMs === null || timeMs < s.bestTimeMs) s.bestTimeMs = timeMs;
    s.currentStreak++;
    s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
    save();
  }

  /** An abandoned or restarted game ends the winning streak. */
  function recordLoss(size) {
    get(size).currentStreak = 0;
    save();
  }

  const isBestMoves = (size, moves) => get(size).bestMoves === moves;
  const isBestTime = (size, timeMs) => get(size).bestTimeMs === timeMs;

  const winRate = (size) => (get(size).played ? get(size).won / get(size).played : 0);
  const averageMoves = (size) => (get(size).won ? Math.round(get(size).totalWinMoves / get(size).won) : null);
  const averageTimeMs = (size) => (get(size).won ? Math.round(get(size).totalWinTimeMs / get(size).won) : null);

  function reset() {
    sizes.value = Object.fromEntries(SIZES.map((size) => [size, emptySize()]));
    save();
  }

  return {
    sizes,
    get,
    recordStart,
    recordWin,
    recordLoss,
    isBestMoves,
    isBestTime,
    winRate,
    averageMoves,
    averageTimeMs,
    reset,
  };
});
