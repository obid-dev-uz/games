<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import SlideBoard from "../components/SlideBoard.vue";
import SlideStatusBar from "../components/SlideStatusBar.vue";
import SlideResultModal from "../components/SlideResultModal.vue";
import SlideIcon from "../components/SlideIcon.vue";
import { useSlideGameStore } from "../stores/game";
import { goBack } from "../utils/navigation";
import t from "../locales/uz";

const router = useRouter();
const game = useSlideGameStore();

const goHome = () => goBack(router, { name: "slide-home" });
const openSettings = () => router.push({ name: "slide-settings" });

// Let the last tile finish sliding before the result dialog appears.
const RESULT_DELAY_MS = 700;
const showResult = ref(Boolean(game.lastResult));
let resultTimer = null;
watch(
  () => game.lastResult,
  (result) => {
    clearTimeout(resultTimer);
    showResult.value = false;
    if (result) resultTimer = setTimeout(() => (showResult.value = true), RESULT_DELAY_MS);
  },
);

// Pause when the app goes to the background (home button, app switch, screen off).
function onVisibility() {
  if (document.visibilityState === "hidden") game.pause();
}

// Arrow keys slide the tile next to the blank in that direction.
const ARROWS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
function onKey(e) {
  const direction = ARROWS[e.key];
  if (!direction || !game.isPlaying) return;
  game.slide(direction);
  e.preventDefault();
}

onMounted(() => {
  // Continue a paused/saved game; nothing to show → Slayd home.
  if ((game.status === "idle" || game.isPaused) && !game.resume()) goHome();
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

const newGame = () => game.newGame(game.size);
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-3 py-2">
    <header class="flex items-center justify-between">
      <button type="button" class="icon-btn" :aria-label="t.back" @click="goHome">
        <SlideIcon name="back" class="size-6" />
      </button>
      <span class="text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">
        {{ game.size }}×{{ game.size }}
      </span>
      <button type="button" class="icon-btn" :aria-label="t.settings" @click="openSettings">
        <SlideIcon name="settings" class="size-6" />
      </button>
    </header>

    <!-- Status bar and board stay together, centred in the free space -->
    <div class="my-auto flex flex-col gap-2">
      <SlideStatusBar />

      <div class="relative">
        <SlideBoard :class="game.isPaused && 'invisible'" />

        <button
          v-if="game.isPaused"
          type="button"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-amber-900 text-amber-50 dark:bg-amber-950"
          @click="game.resume()"
        >
          <span class="flex size-20 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
            <SlideIcon name="play" class="size-9 translate-x-0.5" />
          </span>
          <span class="text-lg font-semibold">{{ t.resume }}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 pb-3">
      <button type="button" class="action" :disabled="!game.isActive" @click="game.restart()">
        <SlideIcon name="restart" class="size-5" />
        {{ t.restart }}
      </button>
      <button type="button" class="action" @click="newGame">
        <SlideIcon name="shuffle" class="size-5" />
        {{ t.newGame }}
      </button>
    </div>

    <SlideResultModal :open="showResult" @new-game="newGame" @home="goHome" />
  </main>
</template>

<style scoped>
.icon-btn {
  @apply flex size-11 items-center justify-center rounded-full text-slate-700 transition active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800;
}
.action {
  @apply flex items-center justify-center gap-2 rounded-2xl bg-white py-3 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:scale-95 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700;
}
</style>
