<script setup>
import { useSudokuGameStore } from "../stores/game";

const game = useSudokuGameStore();
const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
</script>

<template>
  <div class="grid grid-cols-9 gap-1">
    <button
      v-for="d in digits"
      :key="d"
      type="button"
      class="flex h-18 flex-col items-center justify-center rounded-lg transition active:scale-90 disabled:opacity-0"
      :class="
        game.notesMode
          ? 'text-slate-500 dark:text-slate-400'
          : 'text-indigo-600 dark:text-indigo-300'
      "
      :disabled="game.remaining(d) === 0"
      :aria-label="`${d}`"
      @click="game.input(d)"
    >
      <span class="text-[2rem] leading-none font-medium">{{ d }}</span>
      <span class="mt-1.5 text-[11px] leading-none text-slate-400">{{ game.remaining(d) }}</span>
    </button>
  </div>
</template>
