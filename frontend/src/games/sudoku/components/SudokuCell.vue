<script setup>
import { computed } from "vue";

const props = defineProps({
  value: { type: Number, required: true },
  cellPx: { type: Number, default: 40 }, // rendered cell size; all fonts scale from it
  box: { type: Number, default: 3 }, // notes are drawn as a box×box mini grid
  notes: { type: Number, default: 0 }, // bitmask, bit d = digit d
  given: Boolean,
  wrong: Boolean,
  selected: Boolean,
  related: Boolean, // same row, column or box as the selected cell
  sameValue: Boolean, // same digit as the selected cell
  highlightDigit: { type: Number, default: 0 }, // emphasise this digit in the notes
  flash: Boolean, // part of a row/column/box that was just completed
  shake: Boolean, // just received a wrong digit
  waveDelay: { type: Number, default: -1 }, // ms; >= 0 plays the win ripple
  label: { type: String, default: "" },
});

defineEmits(["select"]);

const noteDigits = computed(() => Array.from({ length: props.box * props.box }, (_, k) => k + 1));

// Two-digit values (10–25) get a smaller font so they fit the cell.
const valueStyle = computed(() => ({
  fontSize: `${props.cellPx * (props.value >= 10 ? 0.46 : 0.6)}px`,
}));
const notesStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.box}, minmax(0, 1fr))`,
  gridTemplateRows: `repeat(${props.box}, minmax(0, 1fr))`,
  // Big boards: notes are only readable zoomed in (40px cell → ~9px text).
  fontSize: `${(props.cellPx / props.box) * (props.box > 3 ? 0.9 : 0.8)}px`,
}));

const background = computed(() => {
  if (props.selected) return "bg-indigo-200 dark:bg-indigo-700";
  if (props.wrong && props.value) return "bg-rose-100 dark:bg-rose-900/60";
  if (props.sameValue) return "bg-indigo-100 dark:bg-indigo-900/70";
  if (props.related) return "bg-slate-100 dark:bg-slate-800";
  return "bg-white dark:bg-slate-900";
});

const textColor = computed(() => {
  if (props.wrong) return "text-rose-600 dark:text-rose-400";
  if (props.given) return "text-slate-900 dark:text-slate-100";
  return "text-indigo-600 dark:text-indigo-300";
});
</script>

<template>
  <button
    type="button"
    class="relative flex items-center justify-center transition-colors duration-100 outline-none"
    :class="[background, { 'cell-flash': flash, 'cell-shake': shake, 'cell-wave': waveDelay >= 0 }]"
    :style="waveDelay >= 0 ? { animationDelay: `${waveDelay}ms` } : undefined"
    :aria-label="label"
    :aria-pressed="selected"
    @click="$emit('select')"
  >
    <span
      v-if="value"
      class="leading-none tabular-nums"
      :class="[textColor, given ? 'font-semibold' : 'font-medium']"
      :style="valueStyle"
    >
      {{ value }}
    </span>

    <span v-else-if="notes" class="grid size-full p-px" :style="notesStyle">
      <span
        v-for="d in noteDigits"
        :key="d"
        class="flex items-center justify-center leading-none"
        :class="
          d === highlightDigit && notes & (1 << d)
            ? 'rounded-sm bg-indigo-500 font-bold text-white'
            : 'text-slate-500 dark:text-slate-400'
        "
      >
        {{ notes & (1 << d) ? d : "" }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.cell-flash {
  animation: cell-flash 0.7s ease-out;
}
.cell-shake {
  animation: cell-shake 0.4s ease-in-out;
}
.cell-wave {
  animation: cell-wave 0.5s ease-out both;
}

@keyframes cell-flash {
  0% {
    background-color: rgb(165 180 252);
  }
}
@keyframes cell-shake {
  20%,
  60% {
    transform: translateX(-3px);
  }
  40%,
  80% {
    transform: translateX(3px);
  }
}
@keyframes cell-wave {
  40% {
    transform: scale(1.18);
    background-color: rgb(165 180 252);
    z-index: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cell-flash,
  .cell-shake,
  .cell-wave {
    animation: none;
  }
}
</style>
