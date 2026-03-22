<template>
  <button
    class="text-gray-300 hover:text-gray-600 transition-colors"
    title="Copy to clipboard"
    @click="copy"
  >
    <svg v-if="!copied" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
    <svg v-else class="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  text: string;
}>();

const copied = ref(false);
let timeout: ReturnType<typeof setTimeout> | null = null;

function copy() {
  navigator.clipboard.writeText(props.text);
  copied.value = true;
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    copied.value = false;
  }, 1500);
}
</script>
