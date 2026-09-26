import { describe, it, expect, beforeEach } from "vitest";
import { createStorage } from "../utils/createStorage";
import { createMemoryStorage } from "./memoryStorage";

describe("slide createStorage", () => {
  let backend;
  beforeEach(() => {
    backend = createMemoryStorage();
  });

  it("round-trips JSON values under kho.slide.", () => {
    const s = createStorage("slide", backend);
    s.set("current", { tiles: [1, 2, 0] });
    expect(backend.getItem("kho.slide.current")).not.toBeNull();
    expect(s.get("current")).toEqual({ tiles: [1, 2, 0] });
  });

  it("returns the fallback for missing or corrupt values", () => {
    const s = createStorage("slide", backend);
    expect(s.get("missing", 7)).toBe(7);
    backend.setItem("kho.slide.bad", "{not json");
    expect(s.get("bad", "x")).toBe("x");
  });

  it("never touches another game's keys", () => {
    backend.setItem("kho.sudoku.current", "keep");
    backend.setItem("kho.slide-x.k", "keep");
    const s = createStorage("slide", backend);
    s.set("k", 1);
    s.clear();
    expect(s.get("k")).toBeNull();
    expect(backend.getItem("kho.sudoku.current")).toBe("keep");
    expect(backend.getItem("kho.slide-x.k")).toBe("keep");
  });

  it("reports write failure instead of throwing", () => {
    const s = createStorage("slide", {
      ...backend,
      setItem() {
        throw new Error("QuotaExceeded");
      },
    });
    expect(s.set("k", 1)).toBe(false);
  });
});
