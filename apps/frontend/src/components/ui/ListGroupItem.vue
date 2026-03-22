<template>
  <li :class="itemClasses" v-bind="$attrs">
    <slot />
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  active?: boolean;
  disabled?: boolean;
}>();

const variantAccents: Record<string, string> = {
  primary: 'border-l-4 border-l-primary',
  secondary: 'border-l-4 border-l-secondary',
  success: 'border-l-4 border-l-success',
  danger: 'border-l-4 border-l-danger',
  warning: 'border-l-4 border-l-warning',
  info: 'border-l-4 border-l-info',
};

const itemClasses = computed(() => {
  const base = 'px-4 py-2 text-sm';
  const classes = [base];

  if (props.variant) classes.push(variantAccents[props.variant]);
  if (props.active) classes.push('bg-primary text-white');
  if (props.disabled) classes.push('opacity-50 pointer-events-none');

  return classes;
});
</script>
