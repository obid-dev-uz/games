/**
 * In-app "back" that behaves like the Android back button: returns to the
 * previous screen if there is one, otherwise replaces the current screen with
 * `fallback`. Never pushes, so the history does not grow and the system back
 * button never leads into a finished or stale screen.
 */
export function goBack(router, fallback) {
  if (window.history.state?.back) router.back();
  else router.replace(fallback);
}
