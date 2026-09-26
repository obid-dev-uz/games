import { describe, it, expect, beforeEach } from "vitest";
import { createStorage } from "../createStorage";
import { createMemoryStorage } from "../memoryStorage";

describe("createStorage", () => {
  let backend;
  beforeEach(() => {
    backend = createMemoryStorage();
  });

  it("round-trips JSON values under its own prefix", () => {
    const s = createStorage("sudoku", backend);
    s.set("current", { a: [1, 2] });
    expect(backend.getItem("kho.sudoku.current")).not.toBeNull();
    expect(s.get("current")).toEqual({ a: [1, 2] });
  });

  it("returns the fallback for missing or corrupt values", () => {
    const s = createStorage("sudoku", backend);
    expect(s.get("missing", 7)).toBe(7);
    backend.setItem("kho.sudoku.bad", "{not json");
    expect(s.get("bad", "x")).toBe("x");
  });

  it("keeps namespaces isolated, including clear()", () => {
    const sudoku = createStorage("sudoku", backend);
    const other = createStorage("sudoku-x", backend);
    sudoku.set("k", 1);
    other.set("k", 2);
    sudoku.clear();
    expect(sudoku.get("k")).toBeNull();
    expect(other.get("k")).toBe(2);
  });

  it("reports write failure instead of throwing", () => {
    const s = createStorage("sudoku", {
      ...backend,
      setItem() {
        throw new Error("QuotaExceeded");
      },
    });
    expect(s.set("k", 1)).toBe(false);
  });
});
