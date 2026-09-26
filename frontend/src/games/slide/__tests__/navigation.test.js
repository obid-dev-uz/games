import { describe, it, expect, afterEach, vi } from "vitest";
import { goBack } from "../utils/navigation";

const router = () => ({ back: vi.fn(), replace: vi.fn() });

afterEach(() => {
  delete globalThis.window;
});

describe("slide goBack", () => {
  it("goes back when there is a previous in-app screen", () => {
    globalThis.window = { history: { state: { back: "/slide" } } };
    const r = router();
    goBack(r, "/");
    expect(r.back).toHaveBeenCalled();
    expect(r.replace).not.toHaveBeenCalled();
  });

  it("replaces with the fallback when opened directly", () => {
    globalThis.window = { history: { state: null } };
    const r = router();
    goBack(r, { name: "slide-home" });
    expect(r.replace).toHaveBeenCalledWith({ name: "slide-home" });
  });
});
