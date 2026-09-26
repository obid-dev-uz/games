<script setup>
import { ref, computed } from "vue";
import SlideScreen from "../components/SlideScreen.vue";
import { useSlideStatsStore } from "../stores/stats";
import { SIZES } from "../engine/board";
import { formatTime } from "../utils/format";
import t from "../locales/uz";

const stats = useSlideStatsStore();
const size = ref(4);
const confirming = ref(false);

const dash = (v) => (v === null ? "—" : v);

const tiles = computed(() => {
  const s = stats.get(size.value);
  const p = t.statsPage;
  return [
    { label: p.played, value: s.played },
    { label: p.won, value: s.won },
    { label: p.bestMoves, value: dash(s.bestMoves) },
    { label: p.bestTime, value: formatTime(s.bestTimeMs) },
    { label: p.averageMoves, value: dash(stats.averageMoves(size.value)) },
    { label: p.averageTime, value: formatTime(stats.averageTimeMs(size.value)) },
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
  <SlideScreen :title="t.stats">
    <div class="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-slate-200 p-1 dark:bg-slate-800" role="tablist">
      <button
        v-for="s in SIZES"
        :key="s"
        type="button"
        role="tab"
        :aria-selected="size === s"
        class="rounded-lg py-2 text-sm font-bold tabular-nums transition"
        :class="size === s ? 'bg-white shadow dark:bg-slate-600' : 'text-slate-500 dark:text-slate-400'"
        @click="size = s"
      >
        {{ s }}×{{ s }}
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

    <div class="mt-auto pb-2 pt-6 text-center">
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
  </SlideScreen>
</template>
