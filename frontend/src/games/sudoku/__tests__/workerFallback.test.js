import { describe, it, expect, afterEach, vi } from "vitest";

// A Web Worker that fails to load, like a module worker on an old WebView.
class BrokenWorker {
  static created = 0;
  constructor() {
    BrokenWorker.created++;
    setTimeout(() => this.onerror?.());
  }
  postMessage() {}
  terminate() {}
}

afterEach(() => {
  delete globalThis.Worker;
  vi.resetModules();
});

describe("generatePuzzleAsync", () => {
  it("falls back to the main thread when the worker fails to load", async () => {
    globalThis.Worker = BrokenWorker;
    const { generatePuzzleAsync } = await import("../engine/index.js");

    const first = await generatePuzzleAsync("easy", 7);
    expect(first).toMatchObject({ difficulty: "easy", seed: 7 });

    const second = await generatePuzzleAsync("medium", 8);
    expect(second.difficulty).toBe("medium");
    expect(BrokenWorker.created).toBe(1); // the broken worker is not retried
  });
});
