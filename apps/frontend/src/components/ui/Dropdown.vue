<template>
  <div ref="dropdownRef" class="relative inline-block">
    <button
      type="button"
      :class="toggleClasses"
      @click.stop="toggle"
      :aria-expanded="isOpen"
    >
      <slot name="button-content">
        {{ text }}
      </slot>
      <svg
        v-if="!noCaret"
        class="ml-1 inline-block h-4 w-4"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <div
      v-show="isOpen"
      :class="[
        'absolute z-50 mt-1 min-w-[10rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg',
        right ? 'right-0' : 'left-0'
      ]"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, provide } from 'vue';

const props = defineProps<{
  text?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  right?: boolean;
  noCaret?: boolean;
  toggleClass?: string;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

provide('closeDropdown', close);

const toggleClasses = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';

  const sizes: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variants: Record<string, string> = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
    secondary: 'bg-secondary text-white hover:bg-slate-700 focus:ring-secondary',
    success: 'bg-success text-white hover:bg-green-600 focus:ring-success',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
    warning: 'bg-warning text-white hover:bg-yellow-600 focus:ring-warning',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-primary',
  };

  return [
    base,
    sizes[props.size || 'md'],
    variants[props.variant || 'outline'],
    props.toggleClass,
  ];
});

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
