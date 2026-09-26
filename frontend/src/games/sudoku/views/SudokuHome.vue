<script setup>
import { ref, computed, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { goBack } from "@/shared/navigation";
import SudokuIcon from "../components/SudokuIcon.vue";
import { useSudokuGameStore } from "../stores/game";
import { DIFFICULTIES } from "../engine/difficulty";
import { BOX_SIZES } from "../engine/board";
import storage from "../storage";
import { formatTime } from "../utils/format";
import t from "../locales/uz";

const router = useRouter();
const game = useSudokuGameStore();
const choosing = ref(false);

// Board size for the next game; the last choice is remembered.
const chosenBox = ref(BOX_SIZES.includes(storage.get("lastBox")) ? storage.get("lastBox") : 3);
function chooseBox(box) {
  chosenBox.value = box;
  storage.set("lastBox", box);
}
const sizeLabel = (box) => `${box * box}×${box * box}`;

const canContinue = computed(() => game.status === "playing" || game.status === "paused");

onMounted(() => {
  // Load the saved game so its level and time can be shown on the card.
  if (game.status === "idle" && game.hasSavedGame) game.restore();
});

function start(level) {
  choosing.value = false;
  game.newGame(level, undefined, chosenBox.value).catch(() => {
    // Generation failed: leave the empty game screen; home shows game.loadError.
    if (router.currentRoute.value.name === "sudoku-play") goBack(router, { name: "sudoku-home" });
  });
  router.push({ name: "sudoku-play" });
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
    <div class="flex justify-between">
      <button type="button" class="icon-link" :aria-label="t.back" @click="goBack(router, '/')">
        <SudokuIcon name="back" class="size-6" />
      </button>
      <RouterLink :to="{ name: 'sudoku-settings' }" class="icon-link" :aria-label="t.settings">
        <SudokuIcon name="settings" class="size-6" />
      </RouterLink>
    </div>

    <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <div
        class="grid size-24 grid-cols-3 gap-0.5 rounded-2xl bg-indigo-600 p-2 text-lg font-bold text-white shadow-lg"
        aria-hidden="true"
      >
        <span
          v-for="(n, k) in [5, '', 3, '', 7, '', 1, '', 9]"
          :key="k"
          class="flex items-center justify-center rounded bg-indigo-500/60"
        >
          {{ n }}
        </span>
      </div>
      <h1 class="mt-4 text-4xl font-bold tracking-tight">{{ t.title }}</h1>
      <p v-if="game.loadError" class="text-sm text-rose-600" role="alert">{{ t.loadError }}</p>
    </div>

    <div class="flex flex-col gap-3 pb-4">
      <RouterLink
        v-if="canContinue"
        :to="{ name: 'sudoku-play' }"
        class="flex flex-col items-center rounded-2xl bg-indigo-600 py-3 text-white shadow-md transition active:scale-95"
      >
        <span class="text-lg font-semibold">{{ t.continue }}</span>
        <span class="text-xs text-indigo-100">
          {{ sizeLabel(game.box) }} · {{ DIFFICULTIES[game.difficulty]?.label }} · {{ formatTime(game.elapsedMs) }}
        </span>
      </RouterLink>

      <template v-if="choosing">
        <p class="text-center text-sm text-slate-500 dark:text-slate-400">{{ t.chooseSize }}</p>
        <div class="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200 p-1 dark:bg-slate-800" role="radiogroup">
          <button
            v-for="box in BOX_SIZES"
            :key="box"
            type="button"
            role="radio"
            :aria-checked="chosenBox === box"
            class="rounded-xl py-2.5 text-base font-bold tabular-nums transition"
            :class="
              chosenBox === box
                ? 'bg-white text-indigo-600 shadow dark:bg-slate-600 dark:text-white'
                : 'text-slate-500 dark:text-slate-400'
            "
            @click="chooseBox(box)"
          >
            {{ sizeLabel(box) }}
          </button>
        </div>

        <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">{{ t.chooseDifficulty }}</p>
        <button
          v-for="level in DIFFICULTIES"
          :key="level.id"
          type="button"
          class="rounded-2xl bg-white py-3 text-lg font-semibold shadow-sm ring-1 ring-slate-200 transition active:scale-95 dark:bg-slate-800 dark:ring-slate-700"
          @click="start(level.id)"
        >
          {{ level.label }}
        </button>
        <button type="button" class="py-2 text-sm text-slate-500" @click="choosing = false">
          {{ t.statsPage.no }}
        </button>
      </template>

      <template v-else>
        <button
          type="button"
          class="rounded-2xl py-3 text-lg font-semibold shadow-md transition active:scale-95"
          :class="
            canContinue
              ? 'bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'
              : 'bg-indigo-600 text-white'
          "
          @click="choosing = true"
        >
          {{ t.newGame }}
        </button>
        <RouterLink
          :to="{ name: 'sudoku-stats' }"
          class="flex items-center justify-center gap-2 py-3 font-medium text-slate-600 dark:text-slate-300"
        >
          <SudokuIcon name="stats" class="size-5" />
          {{ t.stats }}
        </RouterLink>
      </template>
    </div>
  </main>
</template>

<style scoped>
.icon-link {
  @apply flex size-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800;
}
</style>
