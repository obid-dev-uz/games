<script setup>
import { ref, onMounted } from "vue";
import { RouterLink, useRouter } from "vue-router";
import SlideScreen from "../components/SlideScreen.vue";
import SlideIcon from "../components/SlideIcon.vue";
import { useSlideGameStore } from "../stores/game";
import { SIZES } from "../engine/board";
import { formatTime } from "../utils/format";
import storage from "../storage";
import t from "../locales/uz";

// Logo: a 3×3 board with the last tile about to move into the gap.
const LOGO = [1, 2, 3, 4, 5, 6, 7, 0, 8];

const router = useRouter();
const game = useSlideGameStore();
const choosing = ref(false);
const lastSize = storage.get("lastSize");

onMounted(() => {
  // Load the saved game so its size, moves and time can be shown on the card.
  if (game.status === "idle" && game.hasSavedGame) game.restore();
});

function start(size) {
  storage.set("lastSize", size);
  game.newGame(size);
  router.push({ name: "slide-play" });
}
</script>

<template>
  <SlideScreen back-to="/">
    <template #actions>
      <RouterLink
        :to="{ name: 'slide-settings' }"
        class="flex size-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800"
        :aria-label="t.settings"
      >
        <SlideIcon name="settings" class="size-6" />
      </RouterLink>
    </template>

    <div class="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <div class="grid size-28 grid-cols-3 gap-1 rounded-2xl bg-amber-900 p-1.5" aria-hidden="true">
        <span
          v-for="(n, k) in LOGO"
          :key="k"
          class="flex items-center justify-center rounded-md text-lg font-bold"
          :class="n ? 'bg-amber-200 text-amber-900' : ''"
        >
          {{ n || "" }}
        </span>
      </div>
      <h1 class="mt-4 text-4xl font-bold tracking-tight">{{ t.title }}</h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ t.subtitle }}</p>
    </div>

    <div class="flex flex-col gap-3 pb-4">
      <RouterLink
        v-if="game.isActive"
        :to="{ name: 'slide-play' }"
        class="flex flex-col items-center rounded-2xl bg-amber-600 py-3 text-white shadow-md transition active:scale-95"
      >
        <span class="text-lg font-semibold">{{ t.continue }}</span>
        <span class="text-xs text-amber-100 tabular-nums">
          {{ game.size }}×{{ game.size }} · {{ t.moves }}: {{ game.moves }} · {{ formatTime(game.elapsedMs) }}
        </span>
      </RouterLink>

      <template v-if="choosing">
        <p class="text-center text-sm text-slate-500 dark:text-slate-400">{{ t.chooseSize }}</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="size in SIZES"
            :key="size"
            type="button"
            class="flex flex-col items-center gap-1 rounded-2xl bg-white py-3 shadow-sm transition active:scale-95 dark:bg-slate-800"
            :class="size === lastSize ? 'ring-2 ring-amber-500' : 'ring-1 ring-slate-200 dark:ring-slate-700'"
            @click="start(size)"
          >
            <span class="text-xl font-bold tabular-nums">{{ size }}×{{ size }}</span>
            <span class="text-xs text-slate-500 dark:text-slate-400">{{ size * size - 1 }} {{ t.tiles }}</span>
          </button>
        </div>
        <button type="button" class="py-2 text-sm text-slate-500" @click="choosing = false">{{ t.cancel }}</button>
      </template>

      <template v-else>
        <button
          type="button"
          class="rounded-2xl py-3 text-lg font-semibold shadow-md transition active:scale-95"
          :class="
            game.isActive
              ? 'bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700'
              : 'bg-amber-600 text-white'
          "
          @click="choosing = true"
        >
          {{ t.newGame }}
        </button>
        <RouterLink
          :to="{ name: 'slide-stats' }"
          class="flex items-center justify-center gap-2 py-3 font-medium text-slate-600 dark:text-slate-300"
        >
          <SlideIcon name="stats" class="size-5" />
          {{ t.stats }}
        </RouterLink>
      </template>
    </div>
  </SlideScreen>
</template>
