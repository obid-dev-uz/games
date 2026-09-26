import { createRouter, createWebHashHistory } from "vue-router";
import LauncherView from "@/launcher/LauncherView.vue";
import { games } from "@/games";

// Every game is mounted under its own prefix: /<id>/...
const gameRoutes = games.map((game) => ({
  path: `/${game.id}`,
  children: game.routes,
}));

const router = createRouter({
  // Hash history is the most reliable option inside the Tauri mobile WebView.
  history: createWebHashHistory(),
  routes: [
    { path: "/", name: "launcher", component: LauncherView },
    ...gameRoutes,
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

export default router;
