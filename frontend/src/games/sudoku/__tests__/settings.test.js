import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";

vi.mock("../storage", async () => {
  const { createStorage } = await import("../utils/createStorage");
  const { createMemoryStorage } = await import("./memoryStorage");
  return { default: createStorage("sudoku", createMemoryStorage()) };
});

import storage from "../storage";
import { useSudokuSettingsStore, DEFAULT_SETTINGS } from "../stores/settings";

beforeEach(() => {
  storage.clear();
  setActivePinia(createPinia());
});

describe("sudoku/settings", () => {
  it("starts with defaults", () => {
    expect(useSudokuSettingsStore().settings).toEqual(DEFAULT_SETTINGS);
  });

  it("persists toggles and restores them", async () => {
    useSudokuSettingsStore().toggle("sound");
    await nextTick();
    expect(storage.get("settings").sound).toBe(false);

    setActivePinia(createPinia());
    expect(useSudokuSettingsStore().settings.sound).toBe(false);
  });

  it("ignores unknown keys", () => {
    const prefs = useSudokuSettingsStore();
    prefs.toggle("nope");
    expect(prefs.settings).toEqual(DEFAULT_SETTINGS);
  });
});
