<script setup>
import SlideScreen from "../components/SlideScreen.vue";
import { useSlideSettingsStore } from "../stores/settings";
import t from "../locales/uz";

const prefs = useSlideSettingsStore();

const items = [
  { key: "sound", label: t.settingsPage.sound, hint: t.settingsPage.soundHint },
  { key: "vibration", label: t.settingsPage.vibration, hint: t.settingsPage.vibrationHint },
  { key: "highlightInPlace", label: t.settingsPage.highlightInPlace, hint: t.settingsPage.highlightInPlaceHint },
  { key: "showTimer", label: t.settingsPage.showTimer, hint: t.settingsPage.showTimerHint },
];
</script>

<template>
  <SlideScreen :title="t.settings">
    <ul
      class="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-700 dark:bg-slate-800 dark:ring-slate-700"
    >
      <li v-for="item in items" :key="item.key">
        <button
          type="button"
          role="switch"
          :aria-checked="prefs.settings[item.key]"
          class="flex w-full items-center gap-4 px-4 py-4 text-left active:bg-slate-50 dark:active:bg-slate-700"
          @click="prefs.toggle(item.key)"
        >
          <span class="flex-1">
            <span class="block font-medium">{{ item.label }}</span>
            <span class="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{{ item.hint }}</span>
          </span>
          <span
            class="relative h-7 w-12 shrink-0 rounded-full transition-colors"
            :class="prefs.settings[item.key] ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-600'"
            aria-hidden="true"
          >
            <span
              class="absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform"
              :class="prefs.settings[item.key] && 'translate-x-5'"
            />
          </span>
        </button>
      </li>
    </ul>
  </SlideScreen>
</template>
