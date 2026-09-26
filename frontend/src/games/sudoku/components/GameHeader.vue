<script setup>
import { computed } from "vue";
import SudokuIcon from "./SudokuIcon.vue";
import { useSudokuGameStore, MAX_MISTAKES } from "../stores/game";
import { useSudokuSettingsStore } from "../stores/settings";
import { DIFFICULTIES } from "../engine/difficulty";
import { formatTime } from "../utils/format";
import t from "../locales/uz";

defineEmits(["back", "settings"]);

const game = useSudokuGameStore();
const prefs = useSudokuSettingsStore();
const levelLabel = computed(() => DIFFICULTIES[game.difficulty]?.label ?? "");
</script>

<template>
  <header class="flex items-center justify-between gap-2">
    <button type="button" class="icon-btn" :aria-label="t.back" @click="$emit('back')">
      <SudokuIcon name="back" class="size-6" />
    </button>

    <dl class="grid flex-1 grid-cols-3 text-center text-xs text-slate-500 dark:text-slate-400">
      <div>
        <dt class="sr-only">Daraja</dt>
        <dd class="font-semibold text-slate-800 dark:text-slate-200">{{ levelLabel }}</dd>
      </div>
      <div>
        <dt class="sr-only">{{ t.mistakes }}</dt>
        <dd :class="game.mistakes > 0 && 'text-rose-600 dark:text-rose-400'">
          {{ t.mistakes }}: {{ game.mistakes }}/{{ MAX_MISTAKES }}
        </dd>
      </div>
      <div>
        <dt class="sr-only">{{ t.time }}</dt>
        <dd class="font-mono tabular-nums">{{ prefs.settings.showTimer ? formatTime(game.elapsedMs) : "" }}</dd>
      </div>
    </dl>

    <button type="button" class="icon-btn" :aria-label="t.settings" @click="$emit('settings')">
      <SudokuIcon name="settings" class="size-6" />
    </button>

    <button
      type="button"
      class="icon-btn"
      :aria-label="game.status === 'paused' ? t.resume : t.paused"
      :disabled="game.status !== 'playing' && game.status !== 'paused'"
      @click="game.status === 'paused' ? game.resume() : game.pause()"
    >
      <SudokuIcon :name="game.status === 'paused' ? 'play' : 'pause'" class="size-6" />
    </button>
  </header>
</template>

<style scoped>
@reference "@/styles/main.css";

.icon-btn {
  @apply flex size-11 items-center justify-center rounded-full text-slate-700 transition active:bg-slate-200 disabled:opacity-30 dark:text-slate-200 dark:active:bg-slate-800;
}
</style>
