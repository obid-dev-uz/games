import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";

vi.mock("../storage", async () => {
  const { createStorage } = await import("@/shared/createStorage");
  const { createMemoryStorage } = await import("@/shared/memoryStorage");
  const backend = createMemoryStorage();
  return { default: createStorage("sudoku", backend), backend };
});

// Lets a test make the next puzzle generation fail.
const engineControl = vi.hoisted(() => ({ fail: false }));
vi.mock("../engine", async (importOriginal) => {
  const engine = await importOriginal();
  return {
    ...engine,
    generatePuzzleAsync: (...args) =>
      engineControl.fail
        ? Promise.reject(new Error("generation failed"))
        : engine.generatePuzzleAsync(...args),
  };
});

import storage, { backend } from "../storage";
import { useSudokuGameStore, MAX_MISTAKES, MAX_HINTS } from "../stores/game";
import { useSudokuStatsStore } from "../stores/stats";
import { useSudokuSettingsStore } from "../stores/settings";
import { geometry } from "../engine/board";

const PEERS = geometry(3).peers;

const SEED = 12345;

async function startGame(level = "easy") {
  const game = useSudokuGameStore();
  await game.newGame(level, SEED);
  return game;
}

const emptyCells = (game) => game.board.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
const wrongDigit = (game, i) => (game.solution[i] % 9) + 1;

function solveAll(game) {
  for (const i of emptyCells(game)) {
    game.select(i);
    game.input(game.solution[i]);
  }
}

/** Simulates closing and reopening the app. */
function reopenApp() {
  setActivePinia(createPinia());
  return useSudokuGameStore();
}

beforeEach(() => {
  engineControl.fail = false;
  vi.useFakeTimers();
  storage.clear();
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("sudoku/game: new game", () => {
  it("starts playing with the generated puzzle", async () => {
    const game = await startGame("medium");
    expect(game.status).toBe("playing");
    expect(game.difficulty).toBe("medium");
    expect(game.board).toEqual(game.puzzle);
    expect(game.mistakes).toBe(0);
    expect(game.hasSavedGame).toBe(true);
    expect(useSudokuStatsStore().get(3, "medium").played).toBe(1);
  });

  it("rejects an unknown difficulty", async () => {
    await expect(useSudokuGameStore().newGame("impossible")).rejects.toThrow();
  });
});

describe("sudoku/game: moves", () => {
  it("places a correct digit, locks it and clears peer notes", async () => {
    const game = await startGame();
    const [i] = emptyCells(game);
    const digit = game.solution[i];
    const peer = PEERS[i].find((p) => game.board[p] === 0);

    game.toggleNotesMode();
    game.select(peer);
    game.input(digit);
    expect(game.hasNote(peer, digit)).toBe(true);
    game.toggleNotesMode();

    game.select(i);
    game.input(digit);
    expect(game.board[i]).toBe(digit);
    expect(game.isLocked(i)).toBe(true);
    expect(game.hasNote(peer, digit)).toBe(false);

    game.input(wrongDigit(game, i)); // locked: ignored
    expect(game.board[i]).toBe(digit);
  });

  it("counts mistakes and loses after the limit", async () => {
    const game = await startGame();
    const cells = emptyCells(game);
    for (let k = 0; k < MAX_MISTAKES; k++) {
      game.select(cells[k]);
      game.input(wrongDigit(game, cells[k]));
      expect(game.isWrong(cells[k]) || game.status === "lost").toBe(true);
    }
    expect(game.mistakes).toBe(MAX_MISTAKES);
    expect(game.status).toBe("lost");
    expect(game.lastResult.won).toBe(false);
    expect(game.hasSavedGame).toBe(false);

    game.select(cells[5]);
    game.input(game.solution[cells[5]]); // game over: ignored
    expect(game.board[cells[5]]).toBe(0);

    game.restart(); // a retry counts as a new attempt
    expect(game.status).toBe("playing");
    expect(game.mistakes).toBe(0);
    expect(game.board).toEqual(game.puzzle);
    expect(useSudokuStatsStore().get(3, "easy").played).toBe(2);
  });

  it("erases wrong digits and notes but never givens", async () => {
    const game = await startGame();
    const [i] = emptyCells(game);
    game.select(i);
    game.input(wrongDigit(game, i));
    game.erase();
    expect(game.board[i]).toBe(0);

    const given = game.puzzle.findIndex((v) => v !== 0);
    game.select(given);
    game.erase();
    expect(game.board[given]).toBe(game.puzzle[given]);
  });

  it("toggles notes only on empty cells", async () => {
    const game = await startGame();
    const [i] = emptyCells(game);
    game.select(i);
    game.toggleNotesMode();
    game.input(3);
    game.input(5);
    expect(game.hasNote(i, 3) && game.hasNote(i, 5)).toBe(true);
    game.input(3);
    expect(game.hasNote(i, 3)).toBe(false);
  });

  it("undoes moves, including cleared peer notes", async () => {
    const game = await startGame();
    const [i] = emptyCells(game);
    const digit = game.solution[i];
    const peer = PEERS[i].find((p) => game.board[p] === 0);

    game.toggleNotesMode();
    game.select(peer);
    game.input(digit);
    game.toggleNotesMode();
    game.select(i);
    game.input(digit);

    game.undo();
    expect(game.board[i]).toBe(0);
    expect(game.hasNote(peer, digit)).toBe(true);
    game.undo();
    expect(game.hasNote(peer, digit)).toBe(false);
    expect(game.canUndo).toBe(false);
  });

  it("limits hints and fills the selected cell", async () => {
    const game = await startGame();
    const cells = emptyCells(game);
    for (let k = 0; k < MAX_HINTS; k++) {
      game.select(cells[k]);
      game.hint();
      expect(game.board[cells[k]]).toBe(game.solution[cells[k]]);
    }
    expect(game.hintsLeft).toBe(0);
    game.select(cells[MAX_HINTS]);
    game.hint();
    expect(game.board[cells[MAX_HINTS]]).toBe(0);
  });

  it("hints a random open cell when nothing is selected", async () => {
    const game = await startGame();
    const before = emptyCells(game).length;
    game.hint();
    expect(emptyCells(game).length).toBe(before - 1);
  });

  it("wins when the board is complete and records stats", async () => {
    const game = await startGame("hard");
    vi.advanceTimersByTime(65_000);
    solveAll(game);
    expect(game.status).toBe("won");
    expect(game.lastResult).toMatchObject({ won: true, mistakes: 0, isBestTime: true });
    expect(game.lastResult.timeMs).toBeGreaterThanOrEqual(65_000);
    const stats = useSudokuStatsStore().get(3, "hard");
    expect(stats).toMatchObject({ played: 1, won: 1, perfectWins: 1, currentStreak: 1 });
    expect(game.hasSavedGame).toBe(false);
  });

  it("returns move outcomes for sounds and animations", async () => {
    const game = await startGame();
    const [i, j] = emptyCells(game);
    game.select(i);
    expect(game.input(wrongDigit(game, i))).toEqual({ type: "wrong", cell: i });
    expect(game.input(wrongDigit(game, i))).toBeNull(); // same digit again: ignored
    expect(game.erase()).toEqual({ type: "erase", cell: i });
    expect(game.undo()).toEqual({ type: "undo" });
    expect(game.input(game.solution[i])).toMatchObject({ type: "correct", cell: i });
    game.select(j);
    game.toggleNotesMode();
    expect(game.input(1)).toEqual({ type: "note", cell: j });
    game.toggleNotesMode();
    expect(game.hint()).toMatchObject({ type: "correct", cell: j, hint: true });
  });

  it("reports rows, columns and boxes completed by a move", async () => {
    const game = await startGame();
    // Fill the first row except its last empty cell, then place that one.
    const rowEmpties = emptyCells(game).filter((i) => i < 9);
    for (const i of rowEmpties.slice(0, -1)) {
      game.select(i);
      game.input(game.solution[i]);
    }
    const last = rowEmpties.at(-1);
    game.select(last);
    const outcome = game.input(game.solution[last]);
    expect(outcome.units.some((u) => u.join() === "0,1,2,3,4,5,6,7,8")).toBe(true);
  });

  it("reports the winning move", async () => {
    const game = await startGame();
    const cells = emptyCells(game);
    for (const i of cells.slice(0, -1)) {
      game.select(i);
      game.input(game.solution[i]);
    }
    game.select(cells.at(-1));
    const outcome = game.input(game.solution[cells.at(-1)]);
    expect(outcome.type).toBe("won");
    expect(outcome.units).toHaveLength(3); // last cell completes its row, column and box
  });

  it("tracks remaining digits", async () => {
    const game = await startGame();
    const i = emptyCells(game)[0];
    const digit = game.solution[i];
    const before = game.remaining(digit);
    game.select(i);
    game.input(digit);
    expect(game.remaining(digit)).toBe(before - 1);
  });
});

describe("sudoku/game: mistake limit setting", () => {
  it("only counts mistakes when the limit is off", async () => {
    useSudokuSettingsStore().toggle("mistakeLimit"); // off
    const game = await startGame();
    expect(game.mistakeLimit).toBe(Infinity);
    for (const i of emptyCells(game).slice(0, MAX_MISTAKES + 2)) {
      game.select(i);
      game.input(wrongDigit(game, i));
    }
    expect(game.mistakes).toBe(MAX_MISTAKES + 2);
    expect(game.status).toBe("playing");
  });

  it("turning the limit off mid-game lets the game go on", async () => {
    const game = await startGame();
    const cells = emptyCells(game);
    for (const i of cells.slice(0, MAX_MISTAKES - 1)) {
      game.select(i);
      game.input(wrongDigit(game, i));
    }
    useSudokuSettingsStore().toggle("mistakeLimit"); // off, mid-game
    expect(game.mistakeLimit).toBe(Infinity);

    for (const i of cells.slice(MAX_MISTAKES - 1, MAX_MISTAKES + 1)) {
      game.select(i);
      game.input(wrongDigit(game, i));
    }
    expect(game.mistakes).toBe(MAX_MISTAKES + 1);
    expect(game.status).toBe("playing");
  });

  it("turning the limit on below it keeps playing until the limit", async () => {
    useSudokuSettingsStore().toggle("mistakeLimit"); // off
    const game = await startGame();
    const [a, b, c] = emptyCells(game);
    game.select(a);
    game.input(wrongDigit(game, a));

    useSudokuSettingsStore().toggle("mistakeLimit"); // on, 1 mistake so far
    await nextTick();
    expect(game.status).toBe("playing");
    for (const i of [b, c]) {
      game.select(i);
      game.input(wrongDigit(game, i));
    }
    expect(game.status).toBe("lost");
  });

  it("turning the limit on at or past it ends the game", async () => {
    useSudokuSettingsStore().toggle("mistakeLimit"); // off
    const game = await startGame();
    for (const i of emptyCells(game).slice(0, MAX_MISTAKES + 1)) {
      game.select(i);
      game.input(wrongDigit(game, i));
    }
    game.pause(); // e.g. the player is on the settings screen

    useSudokuSettingsStore().toggle("mistakeLimit"); // on
    await nextTick();
    expect(game.status).toBe("lost");
    expect(game.lastResult.won).toBe(false);
    expect(game.hasSavedGame).toBe(false);
  });
});

describe("sudoku/game: loading", () => {
  it("starts paused if the player left the game screen while loading", async () => {
    const game = useSudokuGameStore();
    const loading = game.newGame("easy", SEED);
    expect(game.status).toBe("loading");
    game.pause(); // route leave / app hidden during generation
    await loading;
    expect(game.status).toBe("paused");
    vi.advanceTimersByTime(5_000);
    expect(game.elapsedMs).toBe(0);
  });

  it("plays normally if the player came back before the puzzle arrived", async () => {
    const game = useSudokuGameStore();
    const loading = game.newGame("easy", SEED);
    game.pause();
    expect(game.resume()).toBe(true);
    await loading;
    expect(game.status).toBe("playing");
  });

  it("reports a failed generation", async () => {
    const game = useSudokuGameStore();
    engineControl.fail = true;
    await expect(game.newGame("easy")).rejects.toThrow();
    expect(game.status).toBe("idle");
    expect(game.loadError).toBe(true);

    engineControl.fail = false;
    await game.newGame("easy", SEED);
    expect(game.loadError).toBe(false);
  });

  it("ignores restart after a win", async () => {
    const game = await startGame();
    solveAll(game);
    game.restart();
    expect(game.status).toBe("won");
    expect(useSudokuStatsStore().get(3, "easy").played).toBe(1);
  });
});

describe("sudoku/game: clock", () => {
  it("runs only while playing", async () => {
    const game = await startGame();
    vi.advanceTimersByTime(10_000);
    expect(game.elapsedMs).toBe(10_000);
    game.pause();
    vi.advanceTimersByTime(30_000);
    expect(game.elapsedMs).toBe(10_000);
    game.select(0);
    expect(game.selected).toBeNull(); // no input while paused
    game.resume();
    vi.advanceTimersByTime(5_000);
    expect(game.elapsedMs).toBe(15_000);
  });
});

describe("sudoku/game: board sizes", () => {
  it("plays and wins a 16×16 game", async () => {
    const game = useSudokuGameStore();
    await game.newGame("easy", SEED, 4);
    expect(game.box).toBe(4);
    expect(game.size).toBe(16);
    expect(game.board).toHaveLength(256);
    expect(game.notes).toHaveLength(256);

    const [i] = emptyCells(game);
    game.select(i);
    game.toggleNotesMode();
    game.input(16); // notes up to the largest digit
    expect(game.hasNote(i, 16)).toBe(true);
    game.toggleNotesMode();
    expect(game.input(17)).toBeNull(); // out of range

    const digit = game.solution[i];
    const before = game.remaining(digit);
    game.input(digit);
    expect(game.remaining(digit)).toBe(before - 1);

    solveAll(game);
    expect(game.status).toBe("won");
    expect(useSudokuStatsStore().get(4, "easy")).toMatchObject({ played: 1, won: 1 });
    expect(useSudokuStatsStore().get(3, "easy").played).toBe(0); // sizes are separate
  });

  it("restores a 25×25 game after the app is reopened", async () => {
    const game = useSudokuGameStore();
    await game.newGame("easy", SEED, 5);
    const [i] = emptyCells(game);
    game.select(i);
    game.input(wrongDigit(game, i));
    game.pause();

    const reopened = reopenApp();
    expect(reopened.resume()).toBe(true);
    expect(reopened.box).toBe(5);
    expect(reopened.board).toHaveLength(625);
    expect(reopened.board[i]).toBe(wrongDigit(game, i));
  });

  it("reads a 9×9 game saved by the previous version", () => {
    const board = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const solution = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
    storage.set("current", {
      v: 1,
      difficulty: "medium",
      seed: 1,
      puzzle: board,
      solution,
      board,
      notes: new Array(81).fill(0),
      mistakes: 1,
      hintsUsed: 0,
      elapsedMs: 5000,
      history: [],
    });
    const game = reopenApp();
    expect(game.resume()).toBe(true);
    expect(game.box).toBe(3);
    expect(game.board.slice(0, 3)).toEqual([5, 3, 0]);
    expect(game.mistakes).toBe(1);
  });

  it("moves 9×9 stats saved by the previous version", () => {
    storage.set("stats", { easy: { played: 4, won: 3, bestTimeMs: 60000 } });
    setActivePinia(createPinia());
    const stats = useSudokuStatsStore();
    expect(stats.get(3, "easy")).toMatchObject({ played: 4, won: 3, bestTimeMs: 60000, perfectWins: 0 });
    expect(stats.get(4, "easy").played).toBe(0);
  });
});

describe("sudoku/game: persistence", () => {
  it("restores an unfinished game after the app is reopened", async () => {
    const game = await startGame();
    const [i, j] = emptyCells(game);
    game.select(i);
    game.input(game.solution[i]);
    game.select(j);
    game.input(wrongDigit(game, j));
    vi.advanceTimersByTime(7_000);
    game.pause();
    const snapshot = { board: [...game.board], mistakes: game.mistakes, elapsed: game.elapsedMs };

    const reopened = reopenApp();
    expect(reopened.status).toBe("idle");
    expect(reopened.hasSavedGame).toBe(true);
    expect(reopened.resume()).toBe(true);
    expect(reopened.status).toBe("playing");
    expect(reopened.board).toEqual(snapshot.board);
    expect(reopened.mistakes).toBe(snapshot.mistakes);
    expect(reopened.elapsedMs).toBe(snapshot.elapsed);
    reopened.undo();
    expect(reopened.board[j]).toBe(0);
  });

  it("drops a corrupt save", () => {
    storage.set("current", { v: 1, difficulty: "easy", puzzle: "123" });
    const game = reopenApp();
    expect(game.restore()).toBe(false);
    expect(game.hasSavedGame).toBe(false);
  });

  it("ends the streak when an unfinished game is abandoned", async () => {
    const game = await startGame();
    solveAll(game);
    await game.newGame("easy", SEED + 1);
    expect(useSudokuStatsStore().get(3, "easy").currentStreak).toBe(1);

    const reopened = reopenApp(); // unfinished game only on disk
    await reopened.newGame("easy", SEED + 2);
    const stats = useSudokuStatsStore().get(3, "easy");
    expect(stats).toMatchObject({ played: 3, won: 1, currentStreak: 0, bestStreak: 1 });
  });

  it("stores everything under the kho.sudoku. prefix", async () => {
    await startGame();
    const keys = Array.from({ length: backend.length }, (_, k) => backend.key(k));
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith("kho.sudoku."))).toBe(true);
  });
});
