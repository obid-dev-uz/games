import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import storage from "../storage";
import { useSudokuStatsStore } from "./stats";
import { useSudokuSettingsStore } from "./settings";
import {
  EMPTY,
  BOX_SIZES,
  geometry,
  parseBoard,
  generatePuzzleAsync,
  isSolved,
  getDifficulty,
} from "../engine";

export const MAX_MISTAKES = 3;
export const MAX_HINTS = 3;
const MAX_HISTORY = 500;
const SAVE_KEY = "current";
// v1: 9×9 only, boards as 81-char strings. v2: any size, boards as arrays + box.
const SAVE_VERSION = 2;
const AUTOSAVE_EVERY_TICKS = 5;

/**
 * status:
 *   idle     no game loaded
 *   loading  a new puzzle is being generated
 *   playing  clock running, input accepted
 *   paused   clock stopped, board hidden
 *   won/lost game over; the saved game is removed
 *
 * Move actions (input, erase, undo, hint) return an outcome object, or null
 * when the move was ignored, so the UI can play sounds and animations:
 *   { type: "correct" | "won", cell, units }   units: rows/columns/boxes just completed
 *   { type: "wrong", cell } | { type: "lost", cell } | { type: "note" | "erase" | "undo" }
 */
export const useSudokuGameStore = defineStore("sudoku/game", () => {
  const stats = useSudokuStatsStore();
  const prefs = useSudokuSettingsStore();

  const status = ref("idle");
  const difficulty = ref(null);
  const box = ref(3); // 3 = 9×9, 4 = 16×16, 5 = 25×25
  const seed = ref(null);
  const puzzle = ref([]); // givens, never change during a game
  const solution = ref([]);
  const board = ref([]); // givens + player's digits
  const notes = ref([]); // per cell bitmask of pencil marks (bit d = digit d)
  const selected = ref(null);
  const notesMode = ref(false);
  const mistakes = ref(0);
  const hintsUsed = ref(0);
  const elapsedMs = ref(0);
  const history = ref([]);
  const lastResult = ref(null); // { won, timeMs, mistakes, isBestTime }
  const loadError = ref(false); // the last newGame() failed to generate a puzzle
  const hasSavedGame = ref(Boolean(storage.get(SAVE_KEY)));

  let clock = null;
  let lastTick = 0;
  let ticks = 0;
  let loadToken = 0;
  let pauseAfterLoad = false; // the player left the game screen while it was loading

  // ---- derived state -------------------------------------------------------

  const geo = computed(() => geometry(box.value));
  const size = computed(() => geo.value.size); // 9, 16 or 25

  const isPlaying = computed(() => status.value === "playing");
  const isGameOver = computed(() => status.value === "won" || status.value === "lost");
  const hintsLeft = computed(() => MAX_HINTS - hintsUsed.value);
  /**
   * Mistakes allowed before the game is lost; Infinity = unlimited (never lost,
   * mistakes are still counted and shown). Follows the setting live, also
   * during a game.
   */
  const mistakeLimit = computed(() => (prefs.settings.mistakeLimit ? MAX_MISTAKES : Infinity));
  const canUndo = computed(() => isPlaying.value && history.value.length > 0);

  const isGiven = (i) => puzzle.value[i] !== EMPTY;
  /** Givens and correctly placed digits can no longer be changed. */
  const isLocked = (i) => board.value[i] !== EMPTY && board.value[i] === solution.value[i];
  const isWrong = (i) => board.value[i] !== EMPTY && board.value[i] !== solution.value[i];
  const hasNote = (i, digit) => (notes.value[i] & (1 << digit)) !== 0;

  /** digitCounts[d]: how many d's are correctly on the board (index 0 unused). */
  const digitCounts = computed(() => {
    const counts = new Array(size.value + 1).fill(0);
    board.value.forEach((v, i) => {
      if (v !== EMPTY && v === solution.value[i]) counts[v]++;
    });
    return counts;
  });
  const remaining = (digit) => size.value - (digitCounts.value[digit] ?? 0);

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
    if (status.value !== "playing" && status.value !== "paused") return;
    storage.set(SAVE_KEY, {
      v: SAVE_VERSION,
      box: box.value,
      difficulty: difficulty.value,
      seed: seed.value,
      puzzle: puzzle.value,
      solution: solution.value,
      board: board.value,
      notes: notes.value,
      mistakes: mistakes.value,
      hintsUsed: hintsUsed.value,
      elapsedMs: elapsedMs.value,
      history: history.value,
    });
    hasSavedGame.value = true;
  }

  function clearSave() {
    storage.remove(SAVE_KEY);
    hasSavedGame.value = false;
  }

  function readSave() {
    const data = storage.get(SAVE_KEY);
    if (!data) return null;
    try {
      let parsed;
      if (data.v === 1) {
        // Older 9×9 save: boards were 81-character strings.
        parsed = {
          ...data,
          box: 3,
          puzzle: parseBoard(data.puzzle),
          solution: parseBoard(data.solution),
          board: parseBoard(data.board),
        };
      } else if (data.v === SAVE_VERSION && BOX_SIZES.includes(data.box)) {
        parsed = data;
      } else {
        return null;
      }
      getDifficulty(parsed.difficulty, parsed.box);
      const { cells, size: n } = geometry(parsed.box);
      const valid = (b) =>
        Array.isArray(b) && b.length === cells && b.every((v) => Number.isInteger(v) && v >= 0 && v <= n);
      if (![parsed.puzzle, parsed.solution, parsed.board].every(valid)) return null;
      if (!Array.isArray(parsed.notes) || parsed.notes.length !== cells) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  /** Loads the saved game (paused). Returns false if there is none or it is corrupt. */
  function restore() {
    const data = readSave();
    if (!data) {
      clearSave();
      return false;
    }
    stopClock();
    box.value = data.box;
    difficulty.value = data.difficulty;
    seed.value = data.seed;
    puzzle.value = data.puzzle;
    solution.value = data.solution;
    board.value = data.board;
    notes.value = data.notes;
    mistakes.value = data.mistakes ?? 0;
    hintsUsed.value = data.hintsUsed ?? 0;
    elapsedMs.value = data.elapsedMs ?? 0;
    history.value = Array.isArray(data.history) ? data.history : [];
    selected.value = null;
    notesMode.value = false;
    lastResult.value = null;
    status.value = "paused";
    return true;
  }

  // ---- game lifecycle ------------------------------------------------------

  /** { box, difficulty } of an unfinished game, in memory or on disk, if any. */
  function unfinishedGame() {
    if (status.value === "playing" || status.value === "paused") {
      return { box: box.value, difficulty: difficulty.value };
    }
    const saved = readSave();
    return saved ? { box: saved.box, difficulty: saved.difficulty } : null;
  }

  /** Starts a new puzzle; boxSize 3 = 9×9, 4 = 16×16, 5 = 25×25. */
  async function newGame(level, gameSeed, boxSize = 3) {
    getDifficulty(level, boxSize);
    const abandoned = unfinishedGame();
    if (abandoned) stats.recordLoss(abandoned.box, abandoned.difficulty);

    stopClock();
    clearSave();
    status.value = "loading";
    loadError.value = false;
    pauseAfterLoad = false;
    const token = ++loadToken;

    let result;
    try {
      result = await generatePuzzleAsync(level, gameSeed, boxSize);
    } catch (error) {
      if (token === loadToken) {
        status.value = "idle";
        loadError.value = true;
      }
      throw error;
    }
    if (token !== loadToken) return; // a newer newGame() call won

    box.value = boxSize;
    difficulty.value = result.difficulty;
    seed.value = result.seed;
    puzzle.value = result.puzzle;
    solution.value = result.solution;
    board.value = result.puzzle.slice();
    notes.value = new Array(geo.value.cells).fill(0);
    selected.value = null;
    notesMode.value = false;
    mistakes.value = 0;
    hintsUsed.value = 0;
    elapsedMs.value = 0;
    history.value = [];
    lastResult.value = null;

    stats.recordStart(boxSize, level);
    if (pauseAfterLoad) {
      status.value = "paused";
    } else {
      status.value = "playing";
      startClock();
    }
    save();
  }

  function pause() {
    if (status.value === "loading") pauseAfterLoad = true;
    if (status.value !== "playing") return;
    stopClock();
    status.value = "paused";
    save();
  }

  function resume() {
    if (status.value === "loading") {
      pauseAfterLoad = false; // back on the game screen before the puzzle arrived
      return true;
    }
    if (status.value === "idle" && !restore()) return false;
    if (status.value !== "paused") return status.value === "playing";
    status.value = "playing";
    startClock();
    return true;
  }

  /** Same puzzle from the beginning. */
  function restart() {
    if (!["playing", "paused", "lost"].includes(status.value)) return;
    // Retrying a lost game is a new attempt.
    if (status.value === "lost") stats.recordStart(box.value, difficulty.value);
    stopClock();
    board.value = puzzle.value.slice();
    notes.value = new Array(geo.value.cells).fill(0);
    selected.value = null;
    mistakes.value = 0;
    hintsUsed.value = 0;
    elapsedMs.value = 0;
    history.value = [];
    lastResult.value = null;
    status.value = "playing";
    startClock();
    save();
  }

  function finish(won) {
    stopClock();
    status.value = won ? "won" : "lost";
    if (won) stats.recordWin(box.value, difficulty.value, elapsedMs.value, mistakes.value);
    else stats.recordLoss(box.value, difficulty.value);
    lastResult.value = {
      won,
      timeMs: elapsedMs.value,
      mistakes: mistakes.value,
      isBestTime: won && stats.isBestTime(box.value, difficulty.value, elapsedMs.value),
    };
    selected.value = null;
    clearSave();
  }

  // ---- moves ---------------------------------------------------------------

  /** Snapshots the given cells so the next change can be undone. */
  function record(indices) {
    history.value.push({
      selected: selected.value,
      cells: indices.map((i) => [i, board.value[i], notes.value[i]]),
    });
    if (history.value.length > MAX_HISTORY) history.value.shift();
  }

  /** Peers of cell i that carry a pencil mark for `digit`. */
  const peersWithNote = (i, digit) => geo.value.peers[i].filter((p) => hasNote(p, digit));

  function placeCorrect(i, digit) {
    board.value[i] = digit;
    notes.value[i] = 0;
    for (const p of geo.value.peers[i]) notes.value[p] &= ~(1 << digit);

    // Rows, columns and boxes this move just completed.
    const units = geo.value.unitsOfCell[i].filter((unit) =>
      unit.every((k) => board.value[k] === solution.value[k]),
    );
    if (isSolved(board.value, solution.value)) {
      finish(true);
      return { type: "won", cell: i, units };
    }
    return { type: "correct", cell: i, units };
  }

  // Turning the limit on mid-game when the player is already at or past it
  // ends the game, just as reaching the limit would.
  watch(mistakeLimit, (limit) => {
    const active = status.value === "playing" || status.value === "paused";
    if (active && mistakes.value >= limit) finish(false);
  });

  function select(i) {
    if (!isPlaying.value) return;
    selected.value = i === null || (i >= 0 && i < geo.value.cells) ? i : null;
  }

  function toggleNotesMode() {
    notesMode.value = !notesMode.value;
  }

  function input(digit) {
    const i = selected.value;
    if (!isPlaying.value || i === null || isLocked(i) || digit < 1 || digit > size.value) return null;

    if (notesMode.value) {
      if (board.value[i] !== EMPTY) return null;
      record([i]);
      notes.value[i] ^= 1 << digit;
      save();
      return { type: "note", cell: i };
    }

    if (board.value[i] === digit) return null;

    let outcome;
    if (digit === solution.value[i]) {
      record([i, ...peersWithNote(i, digit)]);
      outcome = placeCorrect(i, digit);
    } else {
      record([i]);
      board.value[i] = digit;
      notes.value[i] = 0;
      mistakes.value++;
      const lost = mistakes.value >= mistakeLimit.value;
      if (lost) finish(false);
      outcome = { type: lost ? "lost" : "wrong", cell: i };
    }
    save();
    return outcome;
  }

  function erase() {
    const i = selected.value;
    if (!isPlaying.value || i === null || isLocked(i)) return null;
    if (board.value[i] === EMPTY && notes.value[i] === 0) return null;
    record([i]);
    board.value[i] = EMPTY;
    notes.value[i] = 0;
    save();
    return { type: "erase", cell: i };
  }

  function undo() {
    if (!canUndo.value) return null;
    const entry = history.value.pop();
    for (const [i, value, mask] of entry.cells) {
      board.value[i] = value;
      notes.value[i] = mask;
    }
    selected.value = entry.selected;
    save();
    return { type: "undo" };
  }

  /** Reveals the selected cell, or a random unsolved one if none is selected. */
  function hint() {
    if (!isPlaying.value || hintsLeft.value <= 0) return null;

    let i = selected.value;
    if (i === null || isLocked(i)) {
      const open = [];
      for (let k = 0; k < geo.value.cells; k++) if (!isLocked(k)) open.push(k);
      if (open.length === 0) return null;
      i = open[Math.floor(Math.random() * open.length)];
    }

    const digit = solution.value[i];
    record([i, ...peersWithNote(i, digit)]);
    hintsUsed.value++;
    selected.value = i;
    const outcome = placeCorrect(i, digit);
    save();
    return { ...outcome, hint: true };
  }

  return {
    // state
    status,
    difficulty,
    box,
    seed,
    puzzle,
    solution,
    board,
    notes,
    selected,
    notesMode,
    mistakes,
    hintsUsed,
    elapsedMs,
    history,
    lastResult,
    loadError,
    hasSavedGame,
    // getters
    geo,
    size,
    isPlaying,
    isGameOver,
    hintsLeft,
    mistakeLimit,
    canUndo,
    digitCounts,
    isGiven,
    isLocked,
    isWrong,
    hasNote,
    remaining,
    // actions
    newGame,
    restore,
    resume,
    pause,
    restart,
    select,
    toggleNotesMode,
    input,
    erase,
    undo,
    hint,
  };
});
