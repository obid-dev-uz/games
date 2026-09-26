<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useSlideGameStore } from "../stores/game";
import { useSlideSettingsStore } from "../stores/settings";
import t from "../locales/uz";

// Flat tray with sliding tiles. Tiles are keyed by their number, so a move
// only changes a tile's transform and the browser animates the slide.

const GAP_RATIO = 0.06; // gap between tiles, relative to a tile

const game = useSlideGameStore();
const prefs = useSlideSettingsStore();

const tray = ref(null);
const trayPx = ref(0);
let observer = null;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => (trayPx.value = entry.contentRect.width));
  observer.observe(tray.value);
});
onBeforeUnmount(() => observer?.disconnect());

const cellPx = computed(() => trayPx.value / game.size);

/** [{ tile, index }] for every numbered tile, in a stable order (by number). */
const pieces = computed(() => {
  const at = new Map(game.tiles.map((tile, index) => [tile, index]));
  return Array.from({ length: game.size * game.size - 1 }, (_, k) => ({ tile: k + 1, index: at.get(k + 1) }));
});

function pieceStyle(index) {
  const cell = cellPx.value;
  const gap = cell * GAP_RATIO;
  const row = Math.floor(index / game.size);
  const col = index % game.size;
  return {
    width: `${cell - gap}px`,
    height: `${cell - gap}px`,
    transform: `translate(${col * cell + gap / 2}px, ${row * cell + gap / 2}px)`,
    fontSize: `${cell * (game.size >= 6 ? 0.36 : 0.42)}px`,
  };
}

const inPlace = (index) => prefs.settings.highlightInPlace && game.isInPlace(index);
</script>

<template>
  <div class="rounded-2xl bg-amber-900 p-2 dark:bg-amber-950">
    <div ref="tray" class="relative aspect-square w-full rounded-xl bg-amber-950/60" role="grid">
      <button
        v-for="{ tile, index } in pieces"
        :key="tile"
        type="button"
        class="tile absolute left-0 top-0 flex items-center justify-center rounded-lg font-bold tabular-nums"
        :class="inPlace(index) ? 'tile-in-place' : 'tile-default'"
        :style="pieceStyle(index)"
        :aria-label="`${t.tile} ${tile}`"
        @click="game.tap(index)"
      >
        {{ tile }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.tile {
  transition:
    transform 0.12s ease-out,
    background-color 0.25s;
  will-change: transform;
  -webkit-user-select: none;
}
.tile:active {
  filter: brightness(0.95);
}
/* Flat 2D tiles: solid colour, no gradient or shadow. */
.tile-default {
  @apply bg-amber-200 text-amber-900;
}
.tile-in-place {
  @apply bg-lime-200 text-lime-900;
}
@media (prefers-reduced-motion: reduce) {
  .tile {
    transition: none;
  }
}
</style>
