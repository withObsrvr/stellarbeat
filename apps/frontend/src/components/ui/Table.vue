<template>
  <div :class="responsive ? 'overflow-x-auto' : ''">
    <table :class="tableClasses">
      <thead>
        <tr class="bg-gray-50/80">
          <th
            v-for="field in normalizedFields"
            :key="field.key"
            :class="[
              'px-4 py-2.5 text-left text-2xs font-mono font-semibold uppercase tracking-widest text-gray-400',
              field.sortable ? 'cursor-pointer select-none hover:text-gray-900' : '',
              field.class,
            ]"
            @click="field.sortable ? onSort(field.key) : undefined"
          >
            <slot :name="'head(' + field.key + ')'" :label="field.label" :field="field">
              <span class="inline-flex items-center gap-1">
                {{ field.label }}
                <template v-if="field.sortable">
                  <svg
                    v-if="sortBy === field.key && !sortDesc"
                    class="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else-if="sortBy === field.key && sortDesc"
                    class="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <svg
                    v-else
                    class="h-3 w-3 text-gray-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </template>
              </span>
            </slot>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        <tr
          v-for="(item, idx) in paginatedItems"
          :key="idx"
          :class="rowClasses"
        >
          <td
            v-for="field in normalizedFields"
            :key="field.key"
            :class="[cellPadding, field.tdClass]"
          >
            <slot :name="'cell(' + field.key + ')'" :item="item" :value="item[field.key]">
              {{ item[field.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface TableField {
  key: string;
  label: string;
  sortable?: boolean;
  class?: string;
  tdClass?: string;
}

const props = defineProps<{
  items?: Record<string, unknown>[];
  fields?: (string | TableField)[];
  hover?: boolean;
  striped?: boolean;
  bordered?: boolean;
  small?: boolean;
  responsive?: boolean | string;
  perPage?: number;
  currentPage?: number;
  filter?: string;
  sortBy?: string;
  sortDesc?: boolean;
}>();

const emit = defineEmits<{
  'update:sortBy': [key: string];
  'update:sortDesc': [desc: boolean];
}>();

const normalizedFields = computed<TableField[]>(() =>
  (props.fields || []).map(f => {
    if (typeof f === 'string') return { key: f, label: f };
    return { key: f.key, label: f.label || f.key, sortable: f.sortable, class: f.class, tdClass: f.tdClass };
  })
);

const filteredItems = computed(() => {
  let result = props.items || [];
  if (props.filter) {
    const q = props.filter.toLowerCase();
    result = result.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(q))
    );
  }
  return result;
});

const sortedItems = computed(() => {
  if (!props.sortBy) return filteredItems.value;
  return [...filteredItems.value].sort((a, b) => {
    const aVal = a[props.sortBy!];
    const bVal = b[props.sortBy!];
    let cmp = 0;
    if (aVal == null && bVal != null) cmp = -1;
    else if (aVal != null && bVal == null) cmp = 1;
    else if ((aVal as any) < (bVal as any)) cmp = -1;
    else if ((aVal as any) > (bVal as any)) cmp = 1;
    return props.sortDesc ? -cmp : cmp;
  });
});

const paginatedItems = computed(() => {
  if (!props.perPage || !props.currentPage) return sortedItems.value;
  const start = (props.currentPage - 1) * props.perPage;
  return sortedItems.value.slice(start, start + props.perPage);
});

const tableClasses = computed(() => {
  const classes = ['w-full text-sm text-gray-700'];
  if (props.bordered) classes.push('border border-gray-200');
  return classes;
});

const rowClasses = computed(() => {
  const classes: string[] = [];
  if (props.hover) classes.push('hover:bg-gray-50/50');
  if (props.striped) classes.push('even:bg-gray-50/30');
  return classes;
});

const cellPadding = computed(() => props.small ? 'px-4 py-1.5' : 'px-4 py-2.5');

function onSort(key: string) {
  if (props.sortBy === key) {
    emit('update:sortDesc', !props.sortDesc);
  } else {
    emit('update:sortBy', key);
    emit('update:sortDesc', false);
  }
}
</script>
