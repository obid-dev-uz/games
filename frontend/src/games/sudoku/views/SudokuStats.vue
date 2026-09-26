<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { goBack } from "../utils/navigation";
import SudokuIcon from "../components/SudokuIcon.vue";
import { useSudokuStatsStore } from "../stores/stats";
import { DIFFICULTIES } from "../engine/difficulty";
import { BOX_SIZES } from "../engine/board";
import { formatTime, formatPercent } from "../utils/format";
import t from "../locales/uz";

const router = useRouter();
const stats = useSudokuStatsStore();
const box = ref(3);
const level = ref("easy");
const confirming = ref(false);

const tiles = computed(() => {
  const s = stats.get(box.value, level.value);
  const p = t.statsPage;
  return [
    { label: p.played, value: s.played },
    { label: p.won, value: s.won },
    { label: p.winRate, value: formatPercent(stats.winRate(box.value, level.value)) },
    { label: p.perfect, value: s.perfectWins },
    { label: p.bestTime, value: formatTime(s.bestTimeMs) },
    { label: p.averageTime, value: formatTime(stats.averageTimeMs(box.value, level.value)) },
    { label: p.streak, value: s.currentStreak },
    { label: p.bestStreak, value: s.bestStreak },
  ];
});

function reset() {
  stats.reset();
  confirming.value = false;
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
    <header class="flex items-center gap-2">
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800"
        :aria-label="t.back"
        @click="goBack(router, { name: 'sudoku-home' })"
      >
        <SudokuIcon name="back" class="size-6" />
      </button>
      <h1 class="text-2xl font-bold">{{ t.stats }}</h1>
    </header>

    <!-- Board size -->
    <div class="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-800" role="tablist">
      <button
        v-for="b in BOX_SIZES"
        :key="b"
        type="button"
        role="tab"
        :aria-selected="box === b"
        class="rounded-lg py-2 text-sm font-bold tabular-nums transition"
        :class="box === b ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500 dark:text-slate-400'"
        @click="box = b"
      >
        {{ b * b }}×{{ b * b }}
      </button>
    </div>

    <!-- Difficulty -->
    <div class="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-800" role="tablist">
      <button
        v-for="l in DIFFICULTIES"
        :key="l.id"
        type="button"
        role="tab"
        :aria-selected="level === l.id"
        class="rounded-lg py-2 text-sm font-semibold transition"
        :class="level === l.id ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500 dark:text-slate-400'"
        @click="level = l.id"
      >
        {{ l.label }}
      </button>
    </div>

    <dl class="mt-4 grid grid-cols-2 gap-3">
      <div
        v-for="tile in tiles"
        :key="tile.label"
        class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
      >
        <dt class="text-xs text-slate-500 dark:text-slate-400">{{ tile.label }}</dt>
        <dd class="mt-1 text-2xl font-bold tabular-nums">{{ tile.value }}</dd>
      </div>
    </dl>

    <div class="mt-auto pt-6 pb-2 text-center">
      <div v-if="confirming" class="flex flex-col gap-2">
        <p class="text-sm text-slate-600 dark:text-slate-300">{{ t.statsPage.resetConfirm }}</p>
        <button type="button" class="rounded-2xl bg-rose-600 py-3 font-semibold text-white" @click="reset">
          {{ t.statsPage.yes }}
        </button>
        <button type="button" class="py-2 text-sm text-slate-500" @click="confirming = false">
          {{ t.statsPage.no }}
        </button>
      </div>
      <button v-else type="button" class="text-sm text-rose-600 dark:text-rose-400" @click="confirming = true">
        {{ t.statsPage.reset }}
      </button>
    </div>
  </main>
</template>
