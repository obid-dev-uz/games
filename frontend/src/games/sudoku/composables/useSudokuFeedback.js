import { ref, onScopeDispose } from "vue";
import { useSudokuGameStore } from "../stores/game";
import { useSudokuSettingsStore } from "../stores/settings";
import { playSound } from "../feedback/sounds";
import { haptic } from "../feedback/haptics";

const FLASH_MS = 700;
const SHAKE_MS = 400;
// The win ripple spreads from the winning cell over ~0.7 s on any board size.
const WAVE_SPREAD_MS = 720;
/** Delay per cell of distance from the winning cell (45 ms on 9×9). */
export const waveStepMs = (size) => WAVE_SPREAD_MS / (2 * (size - 1));
export const WAVE_MS = WAVE_SPREAD_MS + 500; // farthest cell + its animation

/**
 * Turns the outcomes of game moves into sound, vibration and board
 * animations, honouring the player's settings.
 *
 * Returns reactive animation state for <SudokuBoard>:
 *   flash  Set of cells in a just-completed row/column/box
 *   shake  cell index that received a wrong digit
 *   wave   winning cell index; the win animation ripples out from it
 */
export function useSudokuFeedback() {
  const game = useSudokuGameStore();
  const prefs = useSudokuSettingsStore();

  const flash = ref(new Set());
  const shake = ref(null);
  const wave = ref(null);
  const timers = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  const sound = (name) => prefs.settings.sound && playSound(name);
  const buzz = (kind) => prefs.settings.vibration && haptic(kind);

  function onOutcome(outcome) {
    switch (outcome.type) {
      case "correct":
        if (outcome.units.length) {
          sound("unit");
          buzz("medium");
          flash.value = new Set(outcome.units.flat());
          later(() => (flash.value = new Set()), FLASH_MS);
        } else {
          sound("place");
          buzz("light");
        }
        break;
      case "won":
        sound("win");
        buzz("success");
        wave.value = outcome.cell;
        later(() => (wave.value = null), WAVE_MS);
        break;
      case "wrong":
      case "lost":
        sound(outcome.type === "lost" ? "lose" : "error");
        buzz("error");
        shake.value = outcome.cell;
        later(() => (shake.value = null), SHAKE_MS);
        break;
      case "note":
        sound("note");
        buzz("selection");
        break;
      case "erase":
      case "undo":
        sound("erase");
        buzz("light");
        break;
    }
  }

  const stop = game.$onAction(({ name, after }) => {
    if (name === "select") after(() => buzz("selection"));
    else if (name === "input" || name === "erase" || name === "undo" || name === "hint") {
      after((outcome) => outcome && onOutcome(outcome));
    }
  });

  onScopeDispose(() => {
    stop();
    timers.forEach(clearTimeout);
  });

  return { flash, shake, wave };
}
