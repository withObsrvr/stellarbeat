<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  pill?: boolean;
}>();

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-medium';
  const rounded = props.pill ? 'rounded-full' : 'rounded';

  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-success-light text-success',
    danger: 'bg-danger-light text-danger',
    warning: 'bg-warning-light text-warning',
    info: 'bg-info-light text-info',
    secondary: 'bg-slate-100 text-slate-600',
  };

  return [base, rounded, variants[props.variant || 'default']];
});
</script>
