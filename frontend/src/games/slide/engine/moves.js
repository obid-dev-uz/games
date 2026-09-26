import { BLANK, sizeOf, rowOf, colOf, indexOf } from "./board";

/**
 * Indices of the tiles that slide when `index` is tapped, nearest to the
 * blank first. Any tile in the blank's row or column can be tapped: it and
 * every tile between it and the blank slide one step towards the blank.
 * Returns [] when the tap does nothing (the blank itself, or another line).
 */
export function slidingTiles(tiles, index) {
  const size = sizeOf(tiles);
  const blank = tiles.indexOf(BLANK);
  if (index === blank || index < 0 || index >= tiles.length) return [];

  const [br, bc] = [rowOf(blank, size), colOf(blank, size)];
  const [tr, tc] = [rowOf(index, size), colOf(index, size)];
  if (br !== tr && bc !== tc) return [];

  const dr = Math.sign(tr - br);
  const dc = Math.sign(tc - bc);
  const moving = [];
  for (let r = br + dr, c = bc + dc; ; r += dr, c += dc) {
    const i = indexOf(r, c, size);
    moving.push(i);
    if (i === index) return moving;
  }
}

/**
 * Taps `index`. Returns { tiles, moved } — a new board and the slides that
 * happened as [{ tile, from, to }] — or null if nothing can move.
 */
export function tap(tiles, index) {
  const moving = slidingTiles(tiles, index);
  if (moving.length === 0) return null;

  const next = tiles.slice();
  const moved = [];
  let to = tiles.indexOf(BLANK);
  for (const from of moving) {
    next[to] = tiles[from];
    moved.push({ tile: tiles[from], from, to });
    to = from;
  }
  next[index] = BLANK;
  return { tiles: next, moved };
}

// A swipe/arrow in a direction moves the tile on the opposite side of the
// blank that way: "up" slides the tile below the blank up into it.
const FROM_BLANK = { up: [1, 0], down: [-1, 0], left: [0, 1], right: [0, -1] };

/** Slides one tile in `direction` ("up" | "down" | "left" | "right"), or null at an edge. */
export function slide(tiles, direction) {
  const step = FROM_BLANK[direction];
  if (!step) throw new Error(`Unknown direction "${direction}"`);
  const size = sizeOf(tiles);
  const blank = tiles.indexOf(BLANK);
  const r = rowOf(blank, size) + step[0];
  const c = colOf(blank, size) + step[1];
  if (r < 0 || r >= size || c < 0 || c >= size) return null;
  return tap(tiles, indexOf(r, c, size));
}
