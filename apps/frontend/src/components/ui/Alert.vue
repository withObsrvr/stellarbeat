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
  const base = 'p-4 mb-4 rounded-lg border';

  const variants = {
    success: 'bg-success-light border-success text-success',
    danger: 'bg-danger-light border-danger text-danger',
    warning: 'bg-warning-light border-warning text-warning',
    info: 'bg-info-light border-info text-info',
  };

  return [base, variants[props.variant || 'info']];
});
</script>
