<script setup>
import { ref, computed, watch, onBeforeUnmount } from "vue";
import SudokuIcon from "./SudokuIcon.vue";
import { useSudokuGameStore } from "../stores/game";
import { useSudokuSettingsStore } from "../stores/settings";
import { DIFFICULTIES, DIFFICULTY_IDS } from "../engine/difficulty";
import { formatTime } from "../utils/format";
import t from "../locales/uz";

// Level badge, mistakes counter and a tappable timer/pause capsule, right above the board.

const game = useSudokuGameStore();
const prefs = useSudokuSettingsStore();

// Full class strings so Tailwind can find them.
const LEVEL_STYLES = {
  easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  hard: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  expert: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
};
const BAR_HEIGHTS = ["h-1.5", "h-2", "h-2.5", "h-3"];

const levelLabel = computed(() => DIFFICULTIES[game.difficulty]?.label ?? "");
const levelRank = computed(() => DIFFICULTY_IDS.indexOf(game.difficulty) + 1); // 1..4
const isPaused = computed(() => game.status === "paused");
const canToggle = computed(() => game.status === "playing" || isPaused.value);

// "0/3" when the game ends at the limit, just "0" when mistakes are only counted.
const hasLimit = computed(() => Number.isFinite(game.mistakeLimit));
const mistakesText = computed(() =>
  hasLimit.value ? `${game.mistakes}/${game.mistakeLimit}` : `${game.mistakes}`,
);

// The counter "pops" when a mistake is made.
const bump = ref(false);
let bumpTimer = null;
watch(
  () => game.mistakes,
  (now, before) => {
    if (now <= before) return;
    bump.value = false;
    clearTimeout(bumpTimer);
    // Re-add the class on the next frame so the animation restarts, and only
    // then schedule its removal (a late frame must not leave it stuck on).
    requestAnimationFrame(() => {
      bump.value = true;
      bumpTimer = setTimeout(() => (bump.value = false), 500);
    });
  },
);
onBeforeUnmount(() => clearTimeout(bumpTimer));

const capsuleLabel = computed(() => {
  const action = isPaused.value ? t.resume : t.paused;
  return prefs.settings.showTimer ? `${action}. ${t.time}: ${formatTime(game.elapsedMs)}` : action;
});

function toggle() {
  if (isPaused.value) game.resume();
  else game.pause();
}
</script>

<template>
  <!-- 1fr | auto | 1fr keeps the counter exactly centred whatever the side widths -->
  <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
    <!-- Level: coloured badge with signal bars -->
    <div
      class="flex items-center gap-1.5 justify-self-start rounded-full py-1 pl-2.5 pr-3 text-xs font-bold"
      :class="LEVEL_STYLES[game.difficulty] ?? LEVEL_STYLES.easy"
      :aria-label="`${t.level}: ${levelLabel}`"
    >
      <span class="flex items-end gap-0.5" aria-hidden="true">
        <span
          v-for="(height, k) in BAR_HEIGHTS"
          :key="k"
          class="w-1 rounded-sm bg-current"
          :class="[height, k < levelRank ? '' : 'opacity-25']"
        />
      </span>
      {{ levelLabel }}
    </div>

    <!-- Mistakes: "0/3" (the game ends at the limit) or "0" (only counted) -->
    <div class="flex items-baseline gap-1.5" :aria-label="`${t.mistakes}: ${mistakesText}`" aria-live="polite">
      <span class="text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">{{ t.mistakes }}</span>
      <span
        class="inline-block text-base font-bold tabular-nums text-slate-700 dark:text-slate-200"
        :class="bump && 'mistake-bump'"
        aria-hidden="true"
      >
        {{ mistakesText }}
      </span>
    </div>

    <!-- Timer + pause: the whole capsule is one button -->
    <button
      type="button"
      class="flex items-center gap-2 justify-self-end rounded-full py-1 pr-1 shadow-sm ring-1 transition active:scale-95 disabled:opacity-40"
      :class="[
        prefs.settings.showTimer ? 'pl-3' : 'pl-1',
        isPaused
          ? 'bg-indigo-600 text-white ring-indigo-600'
          : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
      ]"
      :disabled="!canToggle"
      :aria-label="capsuleLabel"
      @click="toggle"
    >
      <template v-if="prefs.settings.showTimer">
        <SudokuIcon name="clock" class="size-4" :class="isPaused ? 'text-indigo-200' : 'text-indigo-500'" />
        <span class="text-sm font-semibold tabular-nums">{{ formatTime(game.elapsedMs) }}</span>
      </template>
      <span
        class="flex size-7 items-center justify-center rounded-full"
        :class="isPaused ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'"
        aria-hidden="true"
      >
        <SudokuIcon :name="isPaused ? 'play' : 'pause'" class="size-4" :class="isPaused && 'translate-x-px'" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.mistake-bump {
  animation: mistake-bump 0.45s ease-out;
}
@keyframes mistake-bump {
  35% {
    transform: scale(1.4);
  }
}
@media (prefers-reduced-motion: reduce) {
  .mistake-bump {
    animation: none;
  }
}
</style>
