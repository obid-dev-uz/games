import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";

vi.mock("../storage", async () => {
  const { createStorage } = await import("../utils/createStorage");
  const { createMemoryStorage } = await import("./memoryStorage");
  const backend = createMemoryStorage();
  return { default: createStorage("slide", backend), backend };
});

import storage, { backend } from "../storage";
import { useSlideGameStore } from "../stores/game";
import { useSlideStatsStore } from "../stores/stats";
import { useSlideSettingsStore, DEFAULT_SETTINGS } from "../stores/settings";
import { solvedBoard, BLANK } from "../engine/board";
import { slidingTiles } from "../engine/moves";

const SEED = 2024;

/** A board one move from solved: …, 7, 0, 8 on 3×3 (tile 8 slides left). */
const oneMoveLeft = (size) => {
  const b = solvedBoard(size);
  const n = b.length;
  [b[n - 2], b[n - 1]] = [BLANK, b[n - 2]];
  return b;
};

/** Index of any tile that can be tapped. */
const tappable = (game) => game.tiles.findIndex((_, i) => slidingTiles(game.tiles, i).length > 0);

function reopenApp() {
  setActivePinia(createPinia());
  return useSlideGameStore();
}

beforeEach(() => {
  vi.useFakeTimers();
  storage.clear();
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("slide/game: new game", () => {
  it("starts a scrambled board of the chosen size", () => {
    const game = useSlideGameStore();
    game.newGame(5, SEED);
    expect(game.status).toBe("playing");
    expect(game.size).toBe(5);
    expect(game.tiles).toHaveLength(25);
    expect(game.tiles).toEqual(game.start);
    expect(game.moves).toBe(0);
    expect(game.hasSavedGame).toBe(true);
    expect(useSlideStatsStore().get(5).played).toBe(1);
  });

  it("rejects unsupported sizes without touching stats", () => {
    const game = useSlideGameStore();
    expect(() => game.newGame(7)).toThrow();
    expect(game.status).toBe("idle");
  });
});

describe("slide/game: moves", () => {
  it("counts every tile that slides as a move", () => {
    const game = useSlideGameStore();
    game.newGame(4, SEED);
    game.tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // blank top-left
    const outcome = game.tap(3); // tiles 1, 2, 3 slide left
    expect(outcome.type).toBe("move");
    expect(outcome.moved.map((m) => m.tile)).toEqual([1, 2, 3]);
    expect(game.moves).toBe(3);
    expect(game.blankIndex).toBe(3);
  });

  it("ignores taps that cannot move anything", () => {
    const game = useSlideGameStore();
    game.newGame(3, SEED);
    expect(game.tap(game.blankIndex)).toBeNull();
    expect(game.moves).toBe(0);
  });

  it("slides by direction", () => {
    const game = useSlideGameStore();
    game.newGame(3, SEED);
    game.tiles = [1, 2, 3, 4, 0, 5, 6, 7, 8];
    expect(game.slide("up").moved[0].tile).toBe(7);
    expect(game.blankIndex).toBe(7);
  });

  it("wins when the last tile is placed and records stats", () => {
    const game = useSlideGameStore();
    game.newGame(3, SEED);
    game.tiles = oneMoveLeft(3);
    vi.advanceTimersByTime(3_000); // clock not started yet
    const outcome = game.slide("left");
    expect(outcome.type).toBe("won");
    expect(game.status).toBe("won");
    expect(game.lastResult).toMatchObject({ moves: 1, isBestMoves: true, isBestTime: true });
    expect(useSlideStatsStore().get(3)).toMatchObject({ played: 1, won: 1, bestMoves: 1, currentStreak: 1 });
    expect(game.hasSavedGame).toBe(false);
    expect(game.tap(0)).toBeNull(); // game over
  });

  it("marks tiles that are in place", () => {
    const game = useSlideGameStore();
    game.newGame(3, SEED);
    game.tiles = oneMoveLeft(3);
    expect(game.isInPlace(0)).toBe(true);
    expect(game.isInPlace(7)).toBe(false); // blank
    expect(game.inPlaceCount).toBe(7);
  });
});

describe("slide/game: clock", () => {
  it("starts with the first move and stops while paused", () => {
    const game = useSlideGameStore();
    game.newGame(4, SEED);
    vi.advanceTimersByTime(10_000);
    expect(game.elapsedMs).toBe(0); // looking at the board is free

    game.tap(tappable(game));
    vi.advanceTimersByTime(4_000);
    expect(game.elapsedMs).toBe(4_000);

    game.pause();
    vi.advanceTimersByTime(20_000);
    expect(game.tap(tappable(game))).toBeNull(); // no moves while paused
    game.resume();
    vi.advanceTimersByTime(1_000);
    expect(game.elapsedMs).toBe(5_000);
  });

  it("does not start the clock on resume before the first move", () => {
    const game = useSlideGameStore();
    game.newGame(4, SEED);
    game.pause();
    game.resume();
    vi.advanceTimersByTime(5_000);
    expect(game.elapsedMs).toBe(0);
  });
});

describe("slide/game: restart and abandon", () => {
  it("restarts the same scramble as a new attempt", () => {
    const game = useSlideGameStore();
    game.newGame(4, SEED);
    const start = [...game.tiles];
    game.tap(tappable(game));
    vi.advanceTimersByTime(2_000);
    game.restart();
    expect(game.tiles).toEqual(start);
    expect(game.moves).toBe(0);
    expect(game.elapsedMs).toBe(0);
    expect(useSlideStatsStore().get(4).played).toBe(2);
  });

  it("ends the streak when an unfinished game is abandoned, also after reopening", () => {
    const game = useSlideGameStore();
    game.newGame(3, SEED);
    game.tiles = oneMoveLeft(3);
    game.slide("left"); // win → streak 1
    game.newGame(3, SEED + 1); // unfinished
    expect(useSlideStatsStore().get(3).currentStreak).toBe(1);

    const reopened = reopenApp();
    reopened.newGame(3, SEED + 2); // the unfinished one is only on disk
    expect(useSlideStatsStore().get(3)).toMatchObject({ played: 3, won: 1, currentStreak: 0, bestStreak: 1 });
  });
});

describe("slide/game: persistence", () => {
  it("restores an unfinished game after the app is reopened", () => {
    const game = useSlideGameStore();
    game.newGame(6, SEED);
    game.tap(tappable(game));
    vi.advanceTimersByTime(3_000);
    game.pause();
    const snapshot = { tiles: [...game.tiles], moves: game.moves, elapsedMs: game.elapsedMs, start: [...game.start] };

    const reopened = reopenApp();
    expect(reopened.status).toBe("idle");
    expect(reopened.hasSavedGame).toBe(true);
    expect(reopened.resume()).toBe(true);
    expect(reopened.size).toBe(6);
    expect(reopened.tiles).toEqual(snapshot.tiles);
    expect(reopened.start).toEqual(snapshot.start);
    expect(reopened.moves).toBe(snapshot.moves);
    expect(reopened.elapsedMs).toBe(snapshot.elapsedMs);
  });

  it("drops corrupt or unsolvable saves", () => {
    storage.set("current", { v: 1, size: 3, tiles: [1, 2, 3], start: [1, 2, 3], moves: 0 });
    expect(reopenApp().restore()).toBe(false);

    const unsolvable = [2, 1, 3, 4, 5, 6, 7, 8, 0];
    storage.set("current", { v: 1, size: 3, tiles: unsolvable, start: unsolvable, moves: 0 });
    const game = reopenApp();
    expect(game.restore()).toBe(false);
    expect(game.hasSavedGame).toBe(false);
  });

  it("keeps stats per size and stores only kho.slide.* keys", () => {
    const game = useSlideGameStore();
    game.newGame(3, SEED);
    game.newGame(5, SEED);
    const stats = useSlideStatsStore();
    expect(stats.get(3).played).toBe(1);
    expect(stats.get(5).played).toBe(1);
    expect(stats.get(4).played).toBe(0);

    const keys = Array.from({ length: backend.length }, (_, k) => backend.key(k));
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith("kho.slide."))).toBe(true);
  });
});

describe("slide/stats", () => {
  it("tracks best and average results", () => {
    const stats = useSlideStatsStore();
    stats.recordStart(4);
    stats.recordWin(4, 120, 90_000);
    stats.recordStart(4);
    stats.recordWin(4, 80, 150_000);
    expect(stats.get(4)).toMatchObject({ bestMoves: 80, bestTimeMs: 90_000, won: 2, bestStreak: 2 });
    expect(stats.averageMoves(4)).toBe(100);
    expect(stats.averageTimeMs(4)).toBe(120_000);
    expect(stats.winRate(4)).toBe(1);
    stats.reset();
    expect(stats.get(4).won).toBe(0);
  });
});

describe("slide/settings", () => {
  it("starts with defaults, persists toggles and ignores unknown keys", async () => {
    const prefs = useSlideSettingsStore();
    expect(prefs.settings).toEqual(DEFAULT_SETTINGS);
    prefs.toggle("highlightInPlace");
    prefs.toggle("nope");
    await nextTick();
    expect(storage.get("settings").highlightInPlace).toBe(false);

    setActivePinia(createPinia());
    expect(useSlideSettingsStore().settings.highlightInPlace).toBe(false);
  });
});
