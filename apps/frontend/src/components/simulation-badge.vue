<template>
  <span
    v-if="store.isSimulation"
    class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200 mx-2"
  >
    Simulation mode
    <a
      v-if="!store.isLocalNetwork"
      href="#"
      class="ml-0.5 text-amber-500 hover:text-amber-700 transition-colors"
      @click.stop.prevent="store.resetUpdates()"
    >
      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </a>
  </span>
</template>
<script setup lang="ts">
import useStore from "@/store/useStore";

const store = useStore();
</script>
