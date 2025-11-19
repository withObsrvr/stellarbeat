<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}>();

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60';

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-slate-700 focus:ring-secondary',
    success: 'bg-success text-white hover:bg-green-600 focus:ring-success',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
    warning: 'bg-warning text-white hover:bg-yellow-600 focus:ring-warning',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-primary',
  };

  return [base, sizes[props.size || 'md'], variants[props.variant || 'outline']];
});
</script>
