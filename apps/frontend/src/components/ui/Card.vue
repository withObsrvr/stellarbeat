<template>
  <div class="rounded-lg border border-slate-200 bg-white shadow-sm">
    <div
      v-if="title || header || $slots.header"
      class="border-b border-slate-100 px-4 py-3"
    >
      <slot name="header">
        <h3 v-if="header" class="text-base font-semibold text-slate-700">
          {{ header }}
        </h3>
        <h3 v-else-if="title" class="text-base font-semibold text-slate-700">
          {{ title }}
        </h3>
      </slot>
    </div>
    <div class="px-4 py-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  header?: string;
}>();
</script>
