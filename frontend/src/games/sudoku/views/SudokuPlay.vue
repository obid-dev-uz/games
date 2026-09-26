<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import GameStatusBar from "../components/GameStatusBar.vue";
import SudokuBoard from "../components/SudokuBoard.vue";
import GameToolbar from "../components/GameToolbar.vue";
import NumberPad from "../components/NumberPad.vue";
import ResultModal from "../components/ResultModal.vue";
import SudokuIcon from "../components/SudokuIcon.vue";
import { useSudokuGameStore } from "../stores/game";
import { goBack } from "@/shared/navigation";
import { useSudokuFeedback, WAVE_MS } from "../composables/useSudokuFeedback";
import t from "../locales/uz";

const router = useRouter();
const game = useSudokuGameStore();

const { flash, shake, wave } = useSudokuFeedback();

const sizeLabel = computed(() => (game.difficulty ? `${game.size}×${game.size}` : ""));

// Big boards can show finger-sized cells in a scrollable viewport.
// 25×25 starts zoomed (its cells are ~14px when the whole board fits).
const zoomable = computed(() => game.box > 3);
const zoomed = ref(false);
watch(
  () => game.box,
  (box) => (zoomed.value = box === 5),
  { immediate: true },
);

const goHome = () => goBack(router, { name: "sudoku-home" });
const openSettings = () => router.push({ name: "sudoku-settings" });

// Let the win ripple / last shake play before the result dialog covers the board.
const showResult = ref(Boolean(game.lastResult));
let resultTimer = null;
watch(
  () => game.lastResult,
  (result) => {
    clearTimeout(resultTimer);
    showResult.value = false;
    if (result) resultTimer = setTimeout(() => (showResult.value = true), result.won ? WAVE_MS : 600);
  },
);

// Pause when the app goes to the background (home button, app switch, screen off).
function onVisibility() {
  if (document.visibilityState === "hidden") game.pause();
}

onMounted(() => {
  // Continue a paused/saved game (or one still loading); nothing to show → home.
  if (["idle", "paused", "loading"].includes(game.status) && !game.resume()) goHome();
  window.addEventListener("keydown", onKey);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", game.pause);
});

onBeforeUnmount(() => {
  clearTimeout(resultTimer);
  clearTimeout(digitTimer);
  window.removeEventListener("keydown", onKey);
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pagehide", game.pause);
});
onBeforeRouteLeave(() => game.pause());

// Typed digits on 16×16 / 25×25 can have two characters ("1" then "2" = 12):
// wait briefly for a second digit unless no larger number is possible.
let typed = "";
let digitTimer = null;
function commitTyped() {
  clearTimeout(digitTimer);
  if (typed) game.input(Number(typed));
  typed = "";
}
function typeDigit(ch) {
  typed += ch;
  const value = Number(typed);
  if (value * 10 > game.size || typed.length === 2) commitTyped();
  else digitTimer = setTimeout(commitTyped, 600);
}

// Hardware keyboard support (desktop, tablets with keyboards).
function onKey(e) {
  if (!game.isPlaying) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    game.undo();
  } else if (e.key >= "0" && e.key <= "9" && (e.key !== "0" || typed)) {
    typeDigit(e.key);
  } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
    game.erase();
  } else if (e.key.toLowerCase() === "n") {
    game.toggleNotesMode();
  } else if (e.key.startsWith("Arrow")) {
    const { size, rowOf, colOf, indexOf, cells } = game.geo;
    const s = game.selected ?? Math.floor(cells / 2);
    const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    game.select(indexOf((rowOf(s) + dr + size) % size, (colOf(s) + dc + size) % size));
  } else {
    return;
  }
  e.preventDefault();
}

function newGame() {
  game.newGame(game.difficulty, undefined, game.box).catch(() => {
    if (router.currentRoute.value.name === "sudoku-play") goHome();
  });
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-2 py-2">
    <header class="flex items-center justify-between">
      <button type="button" class="icon-btn" :aria-label="t.back" @click="goHome">
        <SudokuIcon name="back" class="size-6" />
      </button>
      <span class="text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">{{ sizeLabel }}</span>
      <button type="button" class="icon-btn" :aria-label="t.settings" @click="openSettings">
        <SudokuIcon name="settings" class="size-6" />
      </button>
    </header>

    <!-- Status bar and board stay together, centred in the free space -->
    <div class="my-auto flex flex-col gap-1">
      <GameStatusBar />

      <div class="relative">
          <SudokuBoard
          :class="game.status !== 'playing' && !game.isGameOver && 'invisible'"
          :flash="flash"
          :shake="shake"
          :wave="wave"
          :zoomed="zoomable && zoomed"
        />

        <div
          v-if="game.status === 'loading'"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <span class="size-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <span class="text-sm">{{ t.loading }}</span>
        </div>

        <button
          v-else-if="game.status === 'paused'"
          type="button"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          @click="game.resume()"
        >
          <span class="flex size-20 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
            <SudokuIcon name="play" class="size-9 translate-x-0.5" />
          </span>
          <span class="text-lg font-semibold">{{ t.resume }}</span>
        </button>
      </div>
    </div>

    <div class="flex flex-col gap-4 pb-2" :class="!game.isPlaying && 'pointer-events-none opacity-40'">
      <GameToolbar :zoomable="zoomable" :zoomed="zoomed" @toggle-zoom="zoomed = !zoomed" />
      <NumberPad />
    </div>

    <ResultModal :open="showResult" @new-game="newGame" @restart="game.restart()" @home="goHome" />
  </main>
</template>

<style scoped>
.icon-btn {
  @apply flex size-11 items-center justify-center rounded-full text-slate-700 transition active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800;
}
</style>
