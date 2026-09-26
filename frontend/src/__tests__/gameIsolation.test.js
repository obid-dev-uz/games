// Every game must be fully self-contained: code inside src/games/<id>/ may
// import only files from its own folder and npm packages — never another
// game and never shared app code (src/shared, "@/..."). This keeps games
// independent: one can change or be removed without touching the others.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));
const GAMES = join(SRC, "games");

// import x from "…" · export … from "…" · import "…" · import("…") · new URL("…", import.meta.url)
const SPECIFIERS =
  /\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)|new URL\(\s*["']([^"']+)["']/g;

/** Import specifiers in `source` that leave `gameDir`. */
export function isolationViolations(file, source, gameDir) {
  const problems = [];
  for (const m of source.matchAll(SPECIFIERS)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    let target;
    if (spec.startsWith("@/")) target = join(SRC, spec.slice(2));
    else if (spec.startsWith(".")) target = resolve(dirname(file), spec);
    else continue; // npm package
    if (target !== gameDir && !target.startsWith(gameDir + sep)) {
      problems.push(`${relative(SRC, file)} imports "${spec}"`);
    }
  }
  return problems;
}

function* sourceFiles(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* sourceFiles(path);
    else if (/\.(js|vue)$/.test(name)) yield path;
  }
}

const gameDirs = readdirSync(GAMES)
  .map((name) => join(GAMES, name))
  .filter((dir) => statSync(dir).isDirectory() && existsSync(join(dir, "manifest.js")));

describe("game isolation", () => {
  it("finds at least one game", () => {
    expect(gameDirs.length).toBeGreaterThan(0);
  });

  for (const gameDir of gameDirs) {
    it(`${relative(GAMES, gameDir)} imports nothing outside its own folder`, () => {
      const problems = [...sourceFiles(gameDir)].flatMap((file) =>
        isolationViolations(file, readFileSync(file, "utf8"), gameDir),
      );
      expect(problems).toEqual([]);
    });
  }

  it("detects violations", () => {
    const gameDir = join(GAMES, "demo");
    const file = join(gameDir, "views", "Home.vue");
    const source = `
      import { a } from "@/shared/games";
      import b from "../../other/stores/game";
      import "../../../styles/main.css";
      const c = () => import("@/games/other/views/X.vue");
      export { d } from "../../other/engine";
      import ok1 from "../stores/game";
      import ok2 from "vue";
      const ok3 = () => import("./Play.vue");
      const ok4 = new URL("../engine/worker.js", import.meta.url);
    `;
    expect(isolationViolations(file, source, gameDir)).toHaveLength(5);
  });
});
