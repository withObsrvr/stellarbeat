<template>
  <div class="mb-8 flex gap-6 border-b border-gray-200 text-sm font-medium text-gray-400 overflow-x-auto flex-nowrap whitespace-nowrap">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="tab.key === modelValue
        ? 'border-b-2 border-gray-900 pb-3 text-gray-900 font-semibold'
        : 'pb-3.5 cursor-pointer hover:text-gray-900 transition-colors'"
      @click="$emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined"
        class="ml-1 text-2xs text-gray-400"
      >{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface Tab {
  key: string;
  label: string;
  count?: number;
}

defineProps<{
  tabs: Tab[];
  modelValue: string;
}>();

defineEmits<{
  'update:modelValue': [key: string];
}>();
</script>
