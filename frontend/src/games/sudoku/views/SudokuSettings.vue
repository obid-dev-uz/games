<script setup>
import { useRouter } from "vue-router";
import { goBack } from "../utils/navigation";
import SudokuIcon from "../components/SudokuIcon.vue";
import { useSudokuSettingsStore } from "../stores/settings";
import { playSound } from "../feedback/sounds";
import { haptic } from "../feedback/haptics";
import t from "../locales/uz";

const router = useRouter();
const prefs = useSudokuSettingsStore();

const items = [
  { key: "sound", label: t.settingsPage.sound, hint: t.settingsPage.soundHint },
  { key: "vibration", label: t.settingsPage.vibration, hint: t.settingsPage.vibrationHint },
  { key: "highlightSame", label: t.settingsPage.highlightSame, hint: t.settingsPage.highlightSameHint },
  { key: "showTimer", label: t.settingsPage.showTimer, hint: t.settingsPage.showTimerHint },
  { key: "mistakeLimit", label: t.settingsPage.mistakeLimit, hint: t.settingsPage.mistakeLimitHint },
];

function toggle(key) {
  prefs.toggle(key);
  // Preview the effect when it gets switched on.
  if (key === "sound" && prefs.settings.sound) playSound("place");
  if (key === "vibration" && prefs.settings.vibration) haptic("medium");
}

const back = () => goBack(router, { name: "sudoku-home" });
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
    <header class="flex items-center gap-2">
      <button
        type="button"
        class="flex size-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800"
        :aria-label="t.back"
        @click="back"
      >
        <SudokuIcon name="back" class="size-6" />
      </button>
      <h1 class="text-2xl font-bold">{{ t.settings }}</h1>
    </header>

    <ul
      class="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-700 dark:bg-slate-800 dark:ring-slate-700"
    >
      <li v-for="item in items" :key="item.key">
        <button
          type="button"
          role="switch"
          :aria-checked="prefs.settings[item.key]"
          class="flex w-full items-center gap-4 px-4 py-4 text-left active:bg-slate-50 dark:active:bg-slate-700"
          @click="toggle(item.key)"
        >
          <span class="flex-1">
            <span class="block font-medium">{{ item.label }}</span>
            <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{{ item.hint }}</span>
          </span>
          <span
            class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
            :class="prefs.settings[item.key] ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'"
            aria-hidden="true"
          >
            <span
              class="absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform"
              :class="prefs.settings[item.key] && 'translate-x-5'"
            />
          </span>
        </button>
      </li>
    </ul>
  </main>
</template>
