<script setup>
defineProps({
  name: { type: String, required: true },
});

// 24×24 stroke icons.
const PATHS = {
  back: ["M15 18l-6-6 6-6"],
  undo: ["M9 14L4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 0 11H11"],
  erase: [
    "M20 20H8.5L3.7 15.2a2 2 0 0 1 0-2.8L12.4 3.7a2 2 0 0 1 2.8 0l5.1 5.1a2 2 0 0 1 0 2.8L11.9 20",
    "M8 8.5l7.5 7.5",
  ],
  pencil: ["M12 20h9", "M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"],
  hint: [
    "M9 18h6",
    "M10 22h4",
    "M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z",
  ],
  pause: ["M8 5v14", "M16 5v14"],
  play: ["M7 4l13 8-13 8z"],
  stats: ["M4 20V11", "M10 20V4", "M16 20v-6", "M3 20h18"],
  restart: ["M3 12a9 9 0 1 0 2.6-6.4L3 8", "M3 3v5h5"],
  home: ["M3 11l9-8 9 8", "M5 10v10h14V10"],
  settings: ["M4 6h9", "M17 6h3", "M15 4v4", "M4 12h3", "M11 12h9", "M9 10v4", "M4 18h11", "M19 18h1", "M17 16v4"],
};
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path v-for="d in PATHS[name]" :key="d" :d="d" />
  </svg>
</template>
