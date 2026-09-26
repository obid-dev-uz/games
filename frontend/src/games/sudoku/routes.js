// Paths are relative to /sudoku; route names are prefixed with the game id.
export default [
  {
    path: "",
    name: "sudoku-home",
    component: () => import("./views/SudokuHome.vue"),
  },
  {
    path: "play",
    name: "sudoku-play",
    component: () => import("./views/SudokuPlay.vue"),
  },
  {
    path: "settings",
    name: "sudoku-settings",
    component: () => import("./views/SudokuSettings.vue"),
  },
  {
    path: "stats",
    name: "sudoku-stats",
    component: () => import("./views/SudokuStats.vue"),
  },
];
