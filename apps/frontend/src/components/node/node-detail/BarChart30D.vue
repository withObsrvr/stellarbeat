<template>
  <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex items-center justify-between mb-1">
      <span class="text-sm font-semibold text-gray-900">{{ title }}</span>
      <span :class="valueColorClass" class="text-sm font-bold tabular">{{ value }}</span>
    </div>
    <div class="flex items-end gap-[3px] h-16 mb-2">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="flex-1 rounded-t-sm"
        :class="bar.color"
        :style="{ height: bar.height }"
      />
    </div>
    <div class="flex justify-between text-2xs text-gray-400">
      <span>30d ago</span>
      <span>15d</span>
      <span>Today</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface Bar {
  height: string;
  color: string;
}

const props = withDefaults(defineProps<{
  title: string;
  value: string;
  bars: Bar[];
  colorScheme?: 'emerald' | 'red' | 'amber';
}>(), {
  colorScheme: 'emerald',
});

const valueColorClass = computed(() => {
  const map: Record<string, string> = {
    emerald: 'text-emerald-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
  };
  return map[props.colorScheme] || 'text-emerald-600';
});
</script>
