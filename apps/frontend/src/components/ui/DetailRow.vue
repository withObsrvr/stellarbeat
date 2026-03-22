<template>
  <div :class="[
    'detail-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 px-5 py-2.5',
    last ? '' : 'border-b border-gray-100',
  ]">
    <span class="text-sm text-gray-500 flex-shrink-0">{{ label }}</span>
    <div class="min-w-0 break-all sm:break-normal sm:text-right">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  last?: boolean;
}>();
</script>
