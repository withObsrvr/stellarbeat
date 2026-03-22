<template>
  <UiModal v-model="showModal" :lazy="true" title="Quorum Slices" size="xl" :hide-header="false" @shown="loadSlices">
    <UiAlert variant="info" :show="true">
      The node itself is added to every slice
    </UiAlert>
    <UiTable
      id="network-analysis-table"
      striped
      hover
      :fields="fields"
      :items="items"
      :per-page="perPage"
      :current-page="currentPage"
    >
      <template #cell(slice)="{ item }">
        {{ mapSlice(item.slice) }}
      </template>
    </UiTable>
    <UiPagination
      v-model="currentPage"
      :total-rows="rows"
      :per-page="perPage"
      class="mt-2"
    />
  </UiModal>
</template>

<script setup lang="ts">
import {
  Node,
  QuorumSet,
  QuorumSlicesGenerator,
} from "shared";
import { computed, ref } from "vue";
import useStore from "@/store/useStore";

const props = defineProps<{
  selectedNode: Node;
}>();

const store = useStore();
const network = store.network;

const showModal = ref(false);
const perPage = ref(10);
const currentPage = ref(1);
const items = ref<{ slice: string[] }[]>([{ slice: ["loading..."] }]);
const fields = ref<{ key: string; label: string }[]>([
  { key: "slice", label: "slices" },
]);

const rows = computed(() => items.value.length);

function loadSlices() {
  const generator = new QuorumSlicesGenerator();
  const quorumSetWithSelf = new QuorumSet(
    2,
    [props.selectedNode.publicKey],
    [props.selectedNode.quorumSet],
  );
  items.value = generator.getSlices(quorumSetWithSelf).map((slice) => {
    return { slice: Array.from(new Set(slice)) };
  });
}

function mapSlice(slice: string[]) {
  return slice
    .map(
      (publicKey: string) => network.getNodeByPublicKey(publicKey).displayName,
    )
    .join(", ");
}

defineExpose({ show: () => { showModal.value = true; } });
</script>
