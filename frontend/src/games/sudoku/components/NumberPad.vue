<script setup>
import { computed } from "vue";
import { useSudokuGameStore } from "../stores/game";

const game = useSudokuGameStore();

const digits = computed(() => Array.from({ length: game.size }, (_, k) => k + 1));

// 9 → one row of 9, 16 → two rows of 8, 25 → three rows of 9.
// Full class strings so Tailwind can find them.
const LAYOUT = {
  9: { grid: "grid-cols-9", button: "h-[4.5rem]", digit: "text-[2rem]" },
  16: { grid: "grid-cols-8", button: "h-14", digit: "text-2xl" },
  25: { grid: "grid-cols-9", button: "h-12", digit: "text-xl" },
};
const layout = computed(() => LAYOUT[game.size] ?? LAYOUT[9]);
</script>

<template>
  <div class="grid gap-1" :class="layout.grid">
    <button
      v-for="d in digits"
      :key="d"
      type="button"
      class="flex flex-col items-center justify-center rounded-lg transition active:scale-90 disabled:opacity-0"
      :class="[
        layout.button,
        game.notesMode ? 'text-slate-500 dark:text-slate-400' : 'text-indigo-600 dark:text-indigo-300',
      ]"
      :disabled="game.remaining(d) === 0"
      :aria-label="`${d}`"
      @click="game.input(d)"
    >
      <span class="font-medium leading-none tabular-nums" :class="layout.digit">{{ d }}</span>
      <span class="mt-1 text-[11px] leading-none text-slate-400">{{ game.remaining(d) }}</span>
    </button>
  </div>
</template>
