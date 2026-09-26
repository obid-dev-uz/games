<script setup>
import { computed } from "vue";
import SudokuCell from "./SudokuCell.vue";
import { useSudokuGameStore } from "../stores/game";
import { useSudokuSettingsStore } from "../stores/settings";
import { WAVE_STEP_MS } from "../composables/useSudokuFeedback";
import { rowOf, colOf, boxOf, CELLS } from "../engine/board";
import t from "../locales/uz";

const props = defineProps({
  flash: { type: Set, default: () => new Set() },
  shake: { type: Number, default: null },
  wave: { type: Number, default: null },
});

const game = useSudokuGameStore();
const prefs = useSudokuSettingsStore();

const cells = [...Array(CELLS).keys()];

const selectedValue = computed(() =>
  game.selected === null ? 0 : game.board[game.selected] || 0,
);

function isRelated(i) {
  const s = game.selected;
  if (s === null || s === i) return false;
  return rowOf(i) === rowOf(s) || colOf(i) === colOf(s) || boxOf(i) === boxOf(s);
}

function isSameValue(i) {
  return prefs.settings.highlightSame && selectedValue.value !== 0 && game.board[i] === selectedValue.value && game.selected !== i;
}

/** Win ripple: cells further from the winning cell start later. */
function waveDelay(i) {
  const w = props.wave;
  if (w === null) return -1;
  return (Math.abs(rowOf(i) - rowOf(w)) + Math.abs(colOf(i) - colOf(w))) * WAVE_STEP_MS;
}

// Thick lines between 3×3 boxes, thin lines between cells.
function borders(i) {
  const r = rowOf(i);
  const c = colOf(i);
  return [
    c === 8 ? "" : c % 3 === 2 ? "border-r-2" : "border-r",
    r === 8 ? "" : r % 3 === 2 ? "border-b-2" : "border-b",
    c % 3 === 2 && c !== 8 ? "border-r-slate-800 dark:border-r-slate-300" : "border-r-slate-300 dark:border-r-slate-700",
    r % 3 === 2 && r !== 8 ? "border-b-slate-800 dark:border-b-slate-300" : "border-b-slate-300 dark:border-b-slate-700",
  ];
}

function label(i) {
  const v = game.board[i];
  const state = !v ? t.cell.empty : game.isGiven(i) ? t.cell.given : game.isWrong(i) ? t.cell.wrong : "";
  return `${rowOf(i) + 1}-${t.cell.row}, ${colOf(i) + 1}-${t.cell.col}: ${v || ""} ${state}`.trim();
}
</script>

<template>
  <div
    class="grid aspect-square w-full grid-cols-9 grid-rows-9 overflow-hidden rounded-lg border-2 border-slate-800 dark:border-slate-300"
    role="grid"
  >
    <SudokuCell
      v-for="i in cells"
      :key="i"
      :class="borders(i)"
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
</template>
