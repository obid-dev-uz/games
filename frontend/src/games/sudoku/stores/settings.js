import { defineStore } from "pinia";
import { ref, watch } from "vue";
import storage from "../storage";

const STORAGE_KEY = "settings";

export const DEFAULT_SETTINGS = {
  sound: true,
  vibration: true,
  highlightSame: true, // highlight every cell holding the selected digit
  showTimer: true,
};

export const useSudokuSettingsStore = defineStore("sudoku/settings", () => {
  const saved = storage.get(STORAGE_KEY, {});
  const settings = ref({ ...DEFAULT_SETTINGS, ...saved });

  watch(settings, (value) => storage.set(STORAGE_KEY, value), { deep: true });

  function toggle(key) {
    if (key in DEFAULT_SETTINGS) settings.value[key] = !settings.value[key];
  }

  return { settings, toggle };
});
