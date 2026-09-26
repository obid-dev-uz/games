<script setup>
import { useSudokuGameStore } from "../stores/game";
import { DIFFICULTIES } from "../engine/difficulty";
import { formatTime } from "../utils/format";
import t from "../locales/uz";

defineProps({
  open: Boolean,
});
defineEmits(["new-game", "restart", "home"]);

const game = useSudokuGameStore();
</script>

<template>
  <Transition
    enter-from-class="opacity-0 scale-95"
    enter-active-class="transition duration-200"
    leave-to-class="opacity-0"
    leave-active-class="transition duration-150"
  >
    <div
      v-if="open && game.lastResult"
      class="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/60 p-6"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-xl dark:bg-slate-800">
        <div class="text-6xl" aria-hidden="true">{{ game.lastResult.won ? "🏆" : "😔" }}</div>
        <h2 class="mt-3 text-2xl font-bold">
          {{ game.lastResult.won ? t.won.title : t.lost.title }}
        </h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ game.lastResult.won ? t.won.subtitle : t.lost.subtitle }}
        </p>
        <p
          v-if="game.lastResult.isBestTime"
          class="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
        >
          {{ t.won.bestTime }}
        </p>

        <dl class="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-3 text-sm dark:bg-slate-900">
          <div>
            <dt class="text-slate-500 dark:text-slate-400">Daraja</dt>
            <dd class="font-semibold">{{ DIFFICULTIES[game.difficulty]?.label }}</dd>
            <dd class="text-xs text-slate-500 tabular-nums dark:text-slate-400">{{ game.size }}×{{ game.size }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">{{ t.time }}</dt>
            <dd class="font-mono font-semibold tabular-nums">{{ formatTime(game.lastResult.timeMs) }}</dd>
          </div>
          <div>
            <dt class="text-slate-500 dark:text-slate-400">{{ t.mistakes }}</dt>
            <dd class="font-semibold">{{ game.lastResult.mistakes }}</dd>
          </div>
        </dl>

        <div class="mt-6 flex flex-col gap-2">
          <button type="button" class="btn-primary" @click="$emit('new-game')">{{ t.newGame }}</button>
          <button v-if="!game.lastResult.won" type="button" class="btn-secondary" @click="$emit('restart')">
            {{ t.restart }}
          </button>
          <button type="button" class="btn-secondary" @click="$emit('home')">{{ t.home }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.btn-primary {
  @apply rounded-2xl bg-indigo-600 py-3 font-semibold text-white transition active:scale-95;
}
.btn-secondary {
  @apply rounded-2xl bg-slate-100 py-3 font-semibold text-slate-700 transition active:scale-95 dark:bg-slate-700 dark:text-slate-100;
}
</style>
