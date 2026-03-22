<template>
  <span :class="badgeClasses">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'secondary' | 'emerald' | 'violet' | 'amber' | 'red' | 'cyan' | 'gray';
  tier?: 'status' | 'type' | 'meta';
  pill?: boolean;
}>();

const resolvedColor = computed(() => {
  const colorMap: Record<string, string> = {
    success: 'emerald',
    danger: 'red',
    warning: 'amber',
    info: 'cyan',
    secondary: 'gray',
    default: 'gray',
  };
  const v = props.variant || 'default';
  return colorMap[v] || v;
});

const badgeClasses = computed(() => {
  const tier = props.tier || 'status';
  const color = resolvedColor.value;

  const colorStyles: Record<string, { text: string; bg: string; ring: string }> = {
    emerald: { text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
    violet:  { text: 'text-violet-700',  bg: 'bg-violet-50',  ring: 'ring-violet-200' },
    amber:   { text: 'text-amber-700',   bg: 'bg-amber-50',   ring: 'ring-amber-200' },
    red:     { text: 'text-red-600',     bg: 'bg-red-50',     ring: 'ring-red-200' },
    cyan:    { text: 'text-cyan-700',    bg: 'bg-cyan-50',    ring: 'ring-cyan-200' },
    gray:    { text: 'text-gray-500',    bg: 'bg-gray-50',    ring: 'ring-gray-200' },
  };

  const c = colorStyles[color] || colorStyles.gray;

  if (tier === 'meta') {
    return [
      'inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-semibold',
      'text-gray-500 bg-gray-50 ring-1 ring-gray-200',
    ];
  }

  if (tier === 'type') {
    return [
      'inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-bold ring-1',
      c.text, c.bg, `${c.ring}/60`,
    ];
  }

  // status (default)
  const rounded = props.pill !== false ? 'rounded-full' : 'rounded';
  return [
    `inline-flex items-center ${rounded} px-2.5 py-0.5 text-2xs font-semibold ring-1`,
    c.text, c.bg, c.ring,
  ];
});
</script>
