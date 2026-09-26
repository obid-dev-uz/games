<script setup>
import SudokuIcon from "./SudokuIcon.vue";
import { useSudokuGameStore } from "../stores/game";
import t from "../locales/uz";

const game = useSudokuGameStore();
</script>

<template>
  <div class="grid grid-cols-4 gap-2">
    <button type="button" class="tool" :disabled="!game.canUndo" @click="game.undo()">
      <SudokuIcon name="undo" class="size-6" />
      <span>{{ t.tools.undo }}</span>
    </button>

    <button type="button" class="tool" @click="game.erase()">
      <SudokuIcon name="erase" class="size-6" />
      <span>{{ t.tools.erase }}</span>
    </button>

    <button
      type="button"
      class="tool relative"
      :class="game.notesMode && 'text-indigo-600 dark:text-indigo-300'"
      :aria-pressed="game.notesMode"
      @click="game.toggleNotesMode()"
    >
      <SudokuIcon name="pencil" class="size-6" />
      <span>{{ t.tools.notes }}</span>
      <span
        class="badge"
        :class="game.notesMode ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-100'"
      >
        {{ game.notesMode ? t.on : t.off }}
      </span>
    </button>

    <button type="button" class="tool relative" :disabled="game.hintsLeft === 0" @click="game.hint()">
      <SudokuIcon name="hint" class="size-6" />
      <span>{{ t.tools.hint }}</span>
      <span class="badge bg-indigo-600 text-white">{{ game.hintsLeft }}</span>
    </button>
  </div>
</template>

<style scoped>
@reference "@/styles/main.css";

.tool {
  @apply flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium text-slate-600 transition active:scale-90 disabled:opacity-40 dark:text-slate-300;
}

.badge {
  @apply absolute top-0 right-[18%] min-w-5 rounded-full px-1 text-[9px] leading-4 font-bold;
}
</style>
