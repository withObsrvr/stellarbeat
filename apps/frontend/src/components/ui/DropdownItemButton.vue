<template>
  <button
    type="button"
    class="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
    v-bind="$attrs"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { inject } from 'vue';

const closeDropdown = inject<(() => void) | undefined>('closeDropdown', undefined);

const emit = defineEmits<{
  click: [e: Event];
}>();

function handleClick(e: Event) {
  emit('click', e);
  closeDropdown?.();
}
</script>
