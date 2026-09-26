import { isTauri } from "@tauri-apps/api/core";
import { impactFeedback, notificationFeedback, selectionFeedback } from "@tauri-apps/plugin-haptics";

// Browser fallback (Android Chrome only; iOS Safari has no vibration API).
const FALLBACK_MS = {
  selection: 5,
  light: 10,
  medium: 20,
  heavy: 35,
  success: [20, 60, 30],
  warning: [30, 40, 30],
  error: [40, 30, 40, 30, 40],
};

/** kind: selection | light | medium | heavy | success | warning | error */
export function haptic(kind) {
  try {
    if (isTauri()) {
      const call =
        kind === "selection"
          ? selectionFeedback()
          : kind === "success" || kind === "warning" || kind === "error"
            ? notificationFeedback(kind)
            : impactFeedback(kind);
      call.catch(() => {}); // desktop: plugin has no haptics
      return;
    }
    // Browsers block (and log) vibration until the user has touched the page.
    const nav = globalThis.navigator;
    if (nav?.vibrate && nav.userActivation?.hasBeenActive !== false) {
      nav.vibrate(FALLBACK_MS[kind] ?? 10);
    }
  } catch {
    // haptics are optional
  }
}
