import { loadGames } from "@/shared/games";

// Every folder in src/games/ with a manifest.js is picked up automatically.
export const games = loadGames(
  import.meta.glob("./*/manifest.js", { eager: true, import: "default" }),
);
