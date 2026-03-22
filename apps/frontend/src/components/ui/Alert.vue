<template>
  <div v-if="show" :class="alertClasses" role="alert">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'success' | 'danger' | 'warning' | 'info';
  show?: boolean;
}>();

const alertClasses = computed(() => {
  const base = 'p-4 mb-4 rounded-xl text-sm ring-1';

  const variants = {
    success: 'bg-emerald-50/50 text-emerald-700 ring-emerald-200/60',
    danger: 'bg-red-50/50 text-red-600 ring-red-200/60',
    warning: 'bg-amber-50/50 text-amber-700 ring-amber-200/60',
    info: 'bg-cyan-50/50 text-cyan-700 ring-cyan-200/60',
  };

  return [base, variants[props.variant || 'info']];
});
</script>
