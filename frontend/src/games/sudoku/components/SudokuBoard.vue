<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import SudokuCell from "./SudokuCell.vue";
import { useSudokuGameStore } from "../stores/game";
import { useSudokuSettingsStore } from "../stores/settings";
import { waveStepMs } from "../composables/useSudokuFeedback";
import t from "../locales/uz";

const props = defineProps({
  flash: { type: Set, default: () => new Set() },
  shake: { type: Number, default: null },
  wave: { type: Number, default: null },
  // Big cells in a scrollable viewport instead of fitting the whole board.
  zoomed: Boolean,
});

// Finger-friendly cell size when zoomed (16×16 → 640px, 25×25 → 1000px board).
const ZOOMED_CELL_PX = 40;

const game = useSudokuGameStore();
const prefs = useSudokuSettingsStore();

const cells = computed(() => [...Array(game.geo.cells).keys()]);

// The viewport is always a square as wide as the screen allows; its width
// decides the cell size, which in turn sets every font size on the board.
const viewport = ref(null);
const viewportPx = ref(0);
let observer = null;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => (viewportPx.value = entry.contentRect.width));
  observer.observe(viewport.value);
});
onBeforeUnmount(() => observer?.disconnect());

const cellPx = computed(() =>
  props.zoomed ? ZOOMED_CELL_PX : viewportPx.value / game.size,
);

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${game.size}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${game.size}, minmax(0, 1fr))`,
  width: props.zoomed ? `${ZOOMED_CELL_PX * game.size}px` : "100%",
  height: props.zoomed ? `${ZOOMED_CELL_PX * game.size}px` : "100%",
}));

// Keep the selected cell visible when zoomed (keyboard arrows, hints).
watch(
  () => game.selected,
  async (i) => {
    if (!props.zoomed || i === null) return;
    await nextTick();
    viewport.value?.querySelectorAll("[data-cell]")[i]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  },
);

const selectedValue = computed(() =>
  game.selected === null ? 0 : game.board[game.selected] || 0,
);

function isRelated(i) {
  const s = game.selected;
  if (s === null || s === i) return false;
  const { ROW, COL, BOX } = game.geo;
  return ROW[i] === ROW[s] || COL[i] === COL[s] || BOX[i] === BOX[s];
}

function isSameValue(i) {
  return prefs.settings.highlightSame && selectedValue.value !== 0 && game.board[i] === selectedValue.value && game.selected !== i;
}

/** Win ripple: cells further from the winning cell start later. */
function waveDelay(i) {
  const w = props.wave;
  if (w === null) return -1;
  const { ROW, COL } = game.geo;
  return (Math.abs(ROW[i] - ROW[w]) + Math.abs(COL[i] - COL[w])) * waveStepMs(game.size);
}

// Thick lines between boxes, thin lines between cells.
function borders(i) {
  const { ROW, COL, box, size } = game.geo;
  const r = ROW[i];
  const c = COL[i];
  const last = size - 1;
  const boxRight = c % box === box - 1 && c !== last;
  const boxBottom = r % box === box - 1 && r !== last;
  return [
    c === last ? "" : boxRight ? "border-r-2" : "border-r",
    r === last ? "" : boxBottom ? "border-b-2" : "border-b",
    boxRight ? "border-r-slate-800 dark:border-r-slate-300" : "border-r-slate-300 dark:border-r-slate-700",
    boxBottom ? "border-b-slate-800 dark:border-b-slate-300" : "border-b-slate-300 dark:border-b-slate-700",
  ];
}

function label(i) {
  const v = game.board[i];
  const { ROW, COL } = game.geo;
  const state = !v ? t.cell.empty : game.isGiven(i) ? t.cell.given : game.isWrong(i) ? t.cell.wrong : "";
  return `${ROW[i] + 1}-${t.cell.row}, ${COL[i] + 1}-${t.cell.col}: ${v || ""} ${state}`.trim();
}
</script>

<template>
  <div
    ref="viewport"
    class="aspect-square w-full rounded-lg border-2 border-slate-800 dark:border-slate-300"
    :class="zoomed ? 'overflow-auto overscroll-contain' : 'overflow-hidden'"
  >
    <div class="grid" :style="gridStyle" role="grid">
      <SudokuCell
        v-for="i in cells"
        :key="i"
        data-cell
        :class="borders(i)"
        :cell-px="cellPx"
        :box="game.geo.box"
        :value="game.board[i]"
        :notes="game.notes[i]"
        :given="game.isGiven(i)"
        :wrong="game.isWrong(i)"
        :selected="game.selected === i"
        :related="isRelated(i)"
        :same-value="isSameValue(i)"
        :highlight-digit="prefs.settings.highlightSame ? selectedValue : 0"
        :flash="flash.has(i)"
        :shake="shake === i"
        :wave-delay="waveDelay(i)"
        :label="label(i)"
        @select="game.select(i)"
      />
    </div>
  </div>
</template>
