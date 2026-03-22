<template>
  <div class="mb-3">
    <label v-if="label" :for="labelFor" class="mb-1 block text-sm font-medium text-slate-700">
      {{ label }}
    </label>
    <slot />
    <small v-if="description" class="mt-1 block text-xs text-slate-500">
      {{ description }}
    </small>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string;
  labelFor?: string;
  description?: string;
}>();
</script>
