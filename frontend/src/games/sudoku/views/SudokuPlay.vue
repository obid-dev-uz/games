<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import GameHeader from "../components/GameHeader.vue";
import SudokuBoard from "../components/SudokuBoard.vue";
import GameToolbar from "../components/GameToolbar.vue";
import NumberPad from "../components/NumberPad.vue";
import ResultModal from "../components/ResultModal.vue";
import SudokuIcon from "../components/SudokuIcon.vue";
import { useSudokuGameStore } from "../stores/game";
import { goBack } from "@/shared/navigation";
import { useSudokuFeedback, WAVE_MS } from "../composables/useSudokuFeedback";
import { rowOf, colOf, indexOf } from "../engine/board";
import t from "../locales/uz";

const router = useRouter();
const game = useSudokuGameStore();

const { flash, shake, wave } = useSudokuFeedback();

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
  window.removeEventListener("keydown", onKey);
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("pagehide", game.pause);
});
onBeforeRouteLeave(() => game.pause());

// Hardware keyboard support (desktop, tablets with keyboards).
function onKey(e) {
  if (!game.isPlaying) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    game.undo();
  } else if (e.key >= "1" && e.key <= "9") {
    game.input(Number(e.key));
  } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
    game.erase();
  } else if (e.key.toLowerCase() === "n") {
    game.toggleNotesMode();
  } else if (e.key.startsWith("Arrow")) {
    const s = game.selected ?? 40;
    const [dr, dc] = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    game.select(indexOf((rowOf(s) + dr + 9) % 9, (colOf(s) + dc + 9) % 9));
  } else {
    return;
  }
  e.preventDefault();
}

function newGame() {
  game.newGame(game.difficulty).catch(() => {
    if (router.currentRoute.value.name === "sudoku-play") goHome();
  });
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-2 py-2">
    <GameHeader @back="goHome" @settings="openSettings" />

    <div class="relative my-auto">
      <SudokuBoard
        :class="game.status !== 'playing' && !game.isGameOver && 'invisible'"
        :flash="flash"
        :shake="shake"
        :wave="wave"
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

    <div class="flex flex-col gap-4 pb-2" :class="!game.isPlaying && 'pointer-events-none opacity-40'">
      <GameToolbar />
      <NumberPad />
    </div>

    <ResultModal :open="showResult" @new-game="newGame" @restart="game.restart()" @home="goHome" />
  </main>
</template>
