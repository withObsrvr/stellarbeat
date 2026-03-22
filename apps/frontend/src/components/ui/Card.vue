<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div
      v-if="title || header || $slots.header"
      class="border-b border-gray-100 bg-gray-50/80 px-4 py-3"
    >
      <slot name="header">
        <h3
          v-if="header || title"
          class="text-2xs font-semibold uppercase tracking-wider text-gray-400"
        >
          {{ header || title }}
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
