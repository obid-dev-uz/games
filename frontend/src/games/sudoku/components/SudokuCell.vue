<script setup>
import { computed } from "vue";

const props = defineProps({
  value: { type: Number, required: true },
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

const noteDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
      class="text-[clamp(1.1rem,6.2vw,1.75rem)] leading-none"
      :class="[textColor, given ? 'font-semibold' : 'font-medium']"
    >
      {{ value }}
    </span>

    <span v-else-if="notes" class="grid size-full grid-cols-3 grid-rows-3 p-px">
      <span
        v-for="d in noteDigits"
        :key="d"
        class="flex items-center justify-center text-[clamp(0.5rem,2.3vw,0.7rem)] leading-none"
        :class="
          d === highlightDigit
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
