<template>
  <nav v-if="totalPages > 1" aria-label="Pagination">
    <ul :class="['flex items-center gap-1', sizeClass]">
      <!-- Previous -->
      <li>
        <button
          :disabled="modelValue <= 1"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goToPage(modelValue - 1)"
        >
          &lsaquo;
        </button>
      </li>

      <!-- Page numbers -->
      <li v-for="page in visiblePages" :key="page">
        <button
          :class="[
            'rounded-md border px-2 py-1 min-w-[2rem]',
            page === modelValue
              ? 'border-primary bg-primary text-white'
              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
          ]"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
      </li>

      <!-- Next -->
      <li>
        <button
          :disabled="modelValue >= totalPages"
          class="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="goToPage(modelValue + 1)"
        >
          &rsaquo;
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modelValue: number;
  totalRows: number;
  perPage?: number;
  size?: 'sm' | 'md' | 'lg';
  limit?: number;
}>(), {
  perPage: 20,
  limit: 5,
});

const emit = defineEmits<{
  'update:modelValue': [page: number];
}>();

const totalPages = computed(() => Math.ceil(props.totalRows / props.perPage));

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'text-xs';
  if (props.size === 'lg') return 'text-base';
  return 'text-sm';
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = props.modelValue;
  const maxButtons = props.limit;

  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  let end = start + maxButtons - 1;

  if (end > total) {
    end = total;
    start = Math.max(1, end - maxButtons + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:modelValue', page);
  }
}
</script>
