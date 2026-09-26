import { describe, it, expect } from "vitest";
import { loadGames } from "../games";

const route = { path: "", component: {} };

describe("loadGames", () => {
  it("accepts manifests whose id matches the folder", () => {
    const games = loadGames({
      "../games/sudoku/manifest.js": { id: "sudoku", name: "Sudoku", routes: [route] },
    });
    expect(games.map((g) => g.id)).toEqual(["sudoku"]);
  });

  it("rejects an id that does not match the folder", () => {
    expect(() =>
      loadGames({ "../games/sudoku/manifest.js": { id: "chess", name: "X", routes: [route] } }),
    ).toThrow(/must match folder/);
  });

  it("rejects a manifest without routes", () => {
    expect(() =>
      loadGames({ "../games/sudoku/manifest.js": { id: "sudoku", name: "X", routes: [] } }),
    ).toThrow(/at least one route/);
  });
});
