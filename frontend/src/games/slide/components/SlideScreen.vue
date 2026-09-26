<script setup>
import { useRouter } from "vue-router";
import SlideIcon from "./SlideIcon.vue";
import { goBack } from "../utils/navigation";
import t from "../locales/uz";

// Page frame for Slayd screens: back button, optional title and header actions.
const props = defineProps({
  title: { type: String, default: "" },
  backTo: { type: [String, Object], default: () => ({ name: "slide-home" }) },
});

const router = useRouter();
const back = () => goBack(router, props.backTo);
</script>

<template>
  <main class="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">
    <header class="flex items-center gap-2">
      <button type="button" class="icon-btn" :aria-label="t.back" @click="back">
        <SlideIcon name="back" class="size-6" />
      </button>
      <h1 v-if="title" class="flex-1 text-2xl font-bold">{{ title }}</h1>
      <span v-else class="flex-1" />
      <slot name="actions" />
    </header>

    <slot />
  </main>
</template>

<style scoped>
.icon-btn {
  @apply flex size-11 items-center justify-center rounded-full text-slate-700 transition active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800;
}
</style>
