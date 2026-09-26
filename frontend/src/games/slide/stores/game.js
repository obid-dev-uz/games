import { defineStore } from "pinia";
import { ref, computed } from "vue";
import storage from "../storage";
import { useSlideStatsStore } from "./stats";
import { SIZES, BLANK, isSolved, isInPlace as tileInPlace } from "../engine/board";
import { tap as tapTile, slide as slideTile } from "../engine/moves";
import { generatePuzzle, isSolvable } from "../engine/shuffle";

const SAVE_KEY = "current";
const SAVE_VERSION = 1;
const AUTOSAVE_EVERY_TICKS = 5;

/**
 * status:
 *   idle     no game loaded
 *   playing  input accepted; the clock runs once the first tile has moved
 *   paused   clock stopped, board hidden
 *   won      solved; the saved game is removed
 *
 * Moves count tiles: one tap that slides three tiles is three moves.
 *
 * tap() and slide() return an outcome for sounds and animations, or null
 * when nothing moved:
 *   { type: "move" | "won", moved: [{ tile, from, to }] }
 */
export const useSlideGameStore = defineStore("slide/game", () => {
  const stats = useSlideStatsStore();

  const status = ref("idle");
  const size = ref(4);
  const seed = ref(null);
  const start = ref([]); // the scrambled board this game began with (for restart)
  const tiles = ref([]);
  const moves = ref(0);
  const elapsedMs = ref(0);
  const lastResult = ref(null); // { moves, timeMs, isBestMoves, isBestTime }
  const hasSavedGame = ref(Boolean(storage.get(SAVE_KEY)));

  let clock = null;
  let lastTick = 0;
  let ticks = 0;

  // ---- derived state -------------------------------------------------------

  const isPlaying = computed(() => status.value === "playing");
  const isPaused = computed(() => status.value === "paused");
  const isActive = computed(() => isPlaying.value || isPaused.value);
  const blankIndex = computed(() => tiles.value.indexOf(BLANK));
  const isInPlace = (index) => tileInPlace(tiles.value, index);
  const inPlaceCount = computed(() => tiles.value.filter((_, i) => isInPlace(i)).length);

  // ---- clock ---------------------------------------------------------------

  function tick() {
    const now = Date.now();
    elapsedMs.value += now - lastTick;
    lastTick = now;
    if (++ticks % AUTOSAVE_EVERY_TICKS === 0) save();
  }

  function startClock() {
    if (clock) return;
    lastTick = Date.now();
    clock = setInterval(tick, 1000);
  }

  function stopClock() {
    if (!clock) return;
    clearInterval(clock);
    clock = null;
    const now = Date.now();
    elapsedMs.value += now - lastTick;
    lastTick = now;
  }

  // ---- persistence ---------------------------------------------------------

  function save() {
    if (!isActive.value) return;
    storage.set(SAVE_KEY, {
      v: SAVE_VERSION,
      size: size.value,
      seed: seed.value,
      start: start.value,
      tiles: tiles.value,
      moves: moves.value,
      elapsedMs: elapsedMs.value,
    });
    hasSavedGame.value = true;
  }

  function clearSave() {
    storage.remove(SAVE_KEY);
    hasSavedGame.value = false;
  }

  function isValidBoard(board, n) {
    if (!Array.isArray(board) || board.length !== n * n) return false;
    const sorted = [...board].sort((a, b) => a - b);
    return sorted.every((v, i) => v === i) && isSolvable(board);
  }

  function readSave() {
    const data = storage.get(SAVE_KEY);
    if (!data || data.v !== SAVE_VERSION || !SIZES.includes(data.size)) return null;
    if (!isValidBoard(data.tiles, data.size) || !isValidBoard(data.start, data.size)) return null;
    if (isSolved(data.tiles)) return null;
    return data;
  }

  /** Loads the saved game (paused). Returns false if there is none or it is corrupt. */
  function restore() {
    const data = readSave();
    if (!data) {
      clearSave();
      return false;
    }
    stopClock();
    size.value = data.size;
    seed.value = data.seed;
    start.value = data.start;
    tiles.value = data.tiles;
    moves.value = Number.isInteger(data.moves) ? data.moves : 0;
    elapsedMs.value = Number.isFinite(data.elapsedMs) ? data.elapsedMs : 0;
    lastResult.value = null;
    status.value = "paused";
    return true;
  }

  // ---- game lifecycle ------------------------------------------------------

  /** Size of an unfinished game, in memory or on disk, if any. */
  function unfinishedSize() {
    if (isActive.value) return size.value;
    return readSave()?.size ?? null;
  }

  function begin(board) {
    stopClock();
    tiles.value = board.slice();
    moves.value = 0;
    elapsedMs.value = 0;
    lastResult.value = null;
    status.value = "playing"; // the clock starts with the first move
    save();
  }

  /** Starts a new scrambled board of `boardSize` (3–6). */
  function newGame(boardSize = size.value, gameSeed) {
    const puzzle = generatePuzzle(boardSize, gameSeed); // throws on an unsupported size
    const abandoned = unfinishedSize();
    if (abandoned) stats.recordLoss(abandoned);

    size.value = puzzle.size;
    seed.value = puzzle.seed;
    start.value = puzzle.tiles;
    stats.recordStart(boardSize);
    begin(puzzle.tiles);
  }

  /** The same scramble from the beginning; counts as a new attempt. */
  function restart() {
    if (!isActive.value) return;
    stats.recordLoss(size.value);
    stats.recordStart(size.value);
    begin(start.value);
  }

  function pause() {
    if (!isPlaying.value) return;
    stopClock();
    status.value = "paused";
    save();
  }

  function resume() {
    if (status.value === "idle" && !restore()) return false;
    if (!isPaused.value) return isPlaying.value;
    status.value = "playing";
    if (moves.value > 0) startClock();
    return true;
  }

  function finish() {
    stopClock();
    status.value = "won";
    stats.recordWin(size.value, moves.value, elapsedMs.value);
    lastResult.value = {
      moves: moves.value,
      timeMs: elapsedMs.value,
      isBestMoves: stats.isBestMoves(size.value, moves.value),
      isBestTime: stats.isBestTime(size.value, elapsedMs.value),
    };
    clearSave();
  }

  // ---- moves ---------------------------------------------------------------

  function apply(result) {
    if (!isPlaying.value || !result) return null;
    tiles.value = result.tiles;
    moves.value += result.moved.length;
    startClock();
    if (isSolved(tiles.value)) {
      finish();
      return { type: "won", moved: result.moved };
    }
    save();
    return { type: "move", moved: result.moved };
  }

  /** Taps a tile: it and every tile between it and the blank slide. */
  const tap = (index) => (isPlaying.value ? apply(tapTile(tiles.value, index)) : null);

  /** Slides one tile in a direction ("up" | "down" | "left" | "right"). */
  const slide = (direction) => (isPlaying.value ? apply(slideTile(tiles.value, direction)) : null);

  return {
    // state
    status,
    size,
    seed,
    start,
    tiles,
    moves,
    elapsedMs,
    lastResult,
    hasSavedGame,
    // getters
    isPlaying,
    isPaused,
    isActive,
    blankIndex,
    inPlaceCount,
    isInPlace,
    // actions
    newGame,
    restore,
    resume,
    pause,
    restart,
    tap,
    slide,
  };
});
