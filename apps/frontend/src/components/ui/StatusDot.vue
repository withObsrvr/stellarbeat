<template>
  <span :class="dotClasses">
    <span v-if="pulse" :class="['absolute inline-flex h-full w-full rounded-full opacity-75', pingColor]" style="animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
    <span :class="['relative inline-flex rounded-full', sizeClass, dotColor]"></span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  color?: 'emerald' | 'amber' | 'red' | 'gray';
  pulse?: boolean;
  size?: 'sm' | 'md';
}>(), {
  color: 'emerald',
  size: 'sm',
});

const colorMap: Record<string, { dot: string; ping: string }> = {
  emerald: { dot: 'bg-emerald-500', ping: 'bg-emerald-400' },
  amber:   { dot: 'bg-amber-500',   ping: 'bg-amber-400' },
  red:     { dot: 'bg-red-500',     ping: 'bg-red-400' },
  gray:    { dot: 'bg-gray-400',    ping: 'bg-gray-300' },
};

const sizeClass = computed(() => props.size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2');

const dotClasses = computed(() => {
  const base = 'relative flex';
  return props.pulse
    ? `${base} ${props.size === 'md' ? 'h-2.5 w-2.5' : 'h-2 w-2'}`
    : base;
});

const dotColor = computed(() => (colorMap[props.color] || colorMap.emerald).dot);
const pingColor = computed(() => (colorMap[props.color] || colorMap.emerald).ping);
</script>

<style scoped>
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>
