<template>
  <div>
    <input
      id="searchInput"
      v-model="filter"
      class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm w-full mb-2 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200"
      type="text"
      placeholder="Type public key, name, ... to search"
    />
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-gray-700">
        <thead>
          <tr class="bg-gray-50/80">
            <th class="px-4 py-2.5 text-left text-2xs font-mono font-semibold uppercase tracking-widest text-gray-400 w-8"></th>
            <th
              v-for="field in fields"
              :key="field.key"
              class="px-4 py-2.5 text-left text-2xs font-mono font-semibold uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:text-gray-900"
              @click="toggleSort(field.key)"
            >
              {{ field.label || field.key }}
              <span v-if="sortBy === field.key">{{ sortDesc ? ' ↓' : ' ↑' }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="item in paginatedItems"
            :key="item.publicKey"
            class="hover:bg-gray-50/50 cursor-pointer"
            :class="{ 'bg-emerald-50': selectedKeys.has(item.publicKey) }"
            @click="toggleSelect(item)"
          >
            <td class="px-4 py-2.5">
              <input
                type="checkbox"
                :checked="selectedKeys.has(item.publicKey)"
                class="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                @click.stop="toggleSelect(item)"
              />
            </td>
            <td class="px-4 py-2.5">
              <span
                v-if="item.isFullValidator"
                v-tooltip="'Full validator'"
                class="inline-flex items-center justify-center rounded bg-emerald-500 text-white mr-1 p-0.5"
              >
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>
              {{ truncate(item.name, 20) || " " }}
            </td>
            <td class="px-4 py-2.5">{{ item.availability }}</td>
            <td class="px-4 py-2.5">{{ item.index }}</td>
            <td class="px-4 py-2.5">{{ truncate(item.version, 28) || " " }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiPagination
      v-model="currentPage"
      :total-rows="totalRows"
      :per-page="perPage"
      class="my-1"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Node } from "shared";
import { useTruncate } from "@/composables/useTruncate";

const props = defineProps<{
  validators: Node[];
}>();

const emit = defineEmits(["validators-selected"]);
const truncate = useTruncate();

const sortBy = ref("index");
const sortDesc = ref(true);
const perPage = ref(10);
const currentPage = ref(1);
const filter = ref("");
const totalRows = computed(() => filteredItems.value.length);
const selectedKeys = ref(new Set<string>());
const fields = ref([
  { key: "name", label: "Name", sortable: true },
  { key: "availability", label: "Availability", sortable: true },
  { key: "index", label: "Index", sortable: true },
  { key: "version", label: "Version", sortable: true },
]);

const nodes = computed(() => {
  return props.validators.map((node) => ({
    name: node.displayName,
    version: node.versionStr || "",
    isFullValidator: node.isFullValidator,
    index: node.index,
    publicKey: node.publicKey,
    availability: node.statistics.has30DayStats
      ? node.statistics.active30DaysPercentage + "%"
      : "NA",
  }));
});

const filteredItems = computed(() => {
  if (!filter.value) return nodes.value;
  const q = filter.value.toLowerCase();
  return nodes.value.filter(item =>
    Object.values(item).some(val => String(val).toLowerCase().includes(q))
  );
});

const sortedItems = computed(() => {
  return [...filteredItems.value].sort((a, b) => {
    const aVal = (a as any)[sortBy.value];
    const bVal = (b as any)[sortBy.value];
    let cmp = 0;
    if (aVal < bVal) cmp = -1;
    else if (aVal > bVal) cmp = 1;
    return sortDesc.value ? -cmp : cmp;
  });
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return sortedItems.value.slice(start, start + perPage.value);
});

function toggleSort(key: string) {
  if (sortBy.value === key) sortDesc.value = !sortDesc.value;
  else { sortBy.value = key; sortDesc.value = false; }
}

function toggleSelect(item: any) {
  if (selectedKeys.value.has(item.publicKey)) {
    selectedKeys.value.delete(item.publicKey);
  } else {
    selectedKeys.value.add(item.publicKey);
  }
  const selectedItems = nodes.value.filter(n => selectedKeys.value.has(n.publicKey));
  emit("validators-selected", selectedItems);
}

</script>
