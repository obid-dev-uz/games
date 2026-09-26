// Paths are relative to /slide; route names are prefixed with the game id.
export default [
  {
    path: "",
    name: "slide-home",
    component: () => import("./views/SlideHome.vue"),
  },
  {
    path: "play",
    name: "slide-play",
    component: () => import("./views/SlidePlay.vue"),
  },
  {
    path: "settings",
    name: "slide-settings",
    component: () => import("./views/SlideSettings.vue"),
  },
  {
    path: "stats",
    name: "slide-stats",
    component: () => import("./views/SlideStats.vue"),
  },
];
