<script setup>
import { RouterLink } from "vue-router";
import { games } from "@/games";
</script>

<template>
  <main class="mx-auto w-full max-w-md flex-1 px-4 py-6">
    <header class="mb-6">
      <h1 class="text-3xl font-bold tracking-tight">KHO Games</h1>
      <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">O'yinni tanlang</p>
    </header>

    <ul class="grid grid-cols-2 gap-4">
      <li v-for="game in games" :key="game.id">
        <RouterLink
          :to="`/${game.id}`"
          class="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl p-4 text-white shadow-md transition active:scale-95"
          :class="game.color ?? 'bg-indigo-600'"
        >
          <span class="text-5xl leading-none" aria-hidden="true">{{ game.icon }}</span>
          <span class="text-lg font-semibold">{{ game.name }}</span>
        </RouterLink>
      </li>
    </ul>
  </main>
</template>
