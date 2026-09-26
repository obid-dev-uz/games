import { describe, it, expect, afterEach, vi } from "vitest";
import { goBack } from "../navigation";

const router = () => ({ back: vi.fn(), replace: vi.fn() });

afterEach(() => {
  delete globalThis.window;
});

describe("goBack", () => {
  it("goes back when there is a previous in-app screen", () => {
    globalThis.window = { history: { state: { back: "/sudoku" } } };
    const r = router();
    goBack(r, "/");
    expect(r.back).toHaveBeenCalled();
    expect(r.replace).not.toHaveBeenCalled();
  });

  it("replaces with the fallback when opened directly", () => {
    globalThis.window = { history: { state: null } };
    const r = router();
    goBack(r, "/");
    expect(r.replace).toHaveBeenCalledWith("/");
    expect(r.back).not.toHaveBeenCalled();
  });
});
