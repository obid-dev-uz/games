<script setup>
import { computed } from "vue";
import SlideIcon from "./SlideIcon.vue";
import { useSlideGameStore } from "../stores/game";
import { useSlideSettingsStore } from "../stores/settings";
import { formatTime } from "../utils/format";
import t from "../locales/uz";

// Moves on the left, one tappable timer/pause capsule on the right.

const game = useSlideGameStore();
const prefs = useSlideSettingsStore();

const capsuleLabel = computed(() => {
  const action = game.isPaused ? t.resume : t.paused;
  return prefs.settings.showTimer ? `${action}. ${t.time}: ${formatTime(game.elapsedMs)}` : action;
});

function toggle() {
  if (game.isPaused) game.resume();
  else game.pause();
}
</script>

<template>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-baseline gap-1.5" :aria-label="`${t.moves}: ${game.moves}`" aria-live="polite">
      <span class="text-xs text-slate-500 dark:text-slate-400" aria-hidden="true">{{ t.moves }}</span>
      <span class="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100" aria-hidden="true">
        {{ game.moves }}
      </span>
    </div>

    <button
      type="button"
      class="flex items-center gap-2 rounded-full py-1 pr-1 shadow-sm ring-1 transition active:scale-95 disabled:opacity-40"
      :class="[
        prefs.settings.showTimer ? 'pl-3' : 'pl-1',
        game.isPaused
          ? 'bg-amber-600 text-white ring-amber-600'
          : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
      ]"
      :disabled="!game.isActive"
      :aria-label="capsuleLabel"
      @click="toggle"
    >
      <template v-if="prefs.settings.showTimer">
        <SlideIcon name="clock" class="size-4" :class="game.isPaused ? 'text-amber-100' : 'text-amber-600'" />
        <span class="text-sm font-semibold tabular-nums">{{ formatTime(game.elapsedMs) }}</span>
      </template>
      <span
        class="flex size-7 items-center justify-center rounded-full"
        :class="game.isPaused ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'"
        aria-hidden="true"
      >
        <SlideIcon :name="game.isPaused ? 'play' : 'pause'" class="size-4" :class="game.isPaused && 'translate-x-px'" />
      </span>
    </button>
  </div>
</template>
