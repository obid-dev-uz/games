const ID_PATTERN = /^[a-z][a-z0-9-]*$/;

/**
 * Turns the result of `import.meta.glob("../games/*\/manifest.js")` into a
 * validated list of game manifests.
 *
 * A game's `id` must equal its folder name; it is the namespace for the
 * game's routes (/<id>), Pinia stores (<id>/...) and storage keys (kho.<id>.*),
 * which keeps every game's data isolated from the others.
 */
export function loadGames(modules) {
  const games = Object.entries(modules).map(([path, manifest]) => {
    const parts = path.split("/");
    const folder = parts[parts.length - 2]; // no Array#at(): Chrome 92+
    if (!manifest || manifest.id !== folder) {
      throw new Error(`${path}: manifest id "${manifest?.id}" must match folder "${folder}"`);
    }
    if (!ID_PATTERN.test(manifest.id)) {
      throw new Error(`${path}: id "${manifest.id}" must be lowercase kebab-case`);
    }
    if (!manifest.name || !Array.isArray(manifest.routes) || manifest.routes.length === 0) {
      throw new Error(`${path}: manifest needs a name and at least one route`);
    }
    return manifest;
  });

  return games.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
}
