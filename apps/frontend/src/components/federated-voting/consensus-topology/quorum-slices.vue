<template>
  <div>
    <div v-if="quorumSlicesList.length > 0">
      <ul class="slices-list">
        <li
          v-for="(slice, index) in paginatedQuorumSlicesList"
          :key="index"
          class="slice-item"
        >
          <div class="node-list">
            <FbasNodeBadge
              v-for="node in slice"
              :key="node"
              :node-id="node"
              :show-vote="true"
              :visualize-phase="true"
              @select="handleNodeSelect(node)"
            />
          </div>
        </li>
      </ul>

      <div class="pagination">
        <button
          class="btn btn-sm btn-secondary"
          :disabled="currentPage === 1"
          @click="previousPage"
        >
          Previous
        </button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          class="btn btn-sm btn-secondary"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>
    <div v-else class="empty-message">
      No quorum slices found for {{ selectedNodeId }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";

const props = defineProps({
  selectedNodeId: {
    type: String,
    required: true,
  },
});

const currentPage = ref(1);
const itemsPerPage = 5;

const quorumSlicesList = computed(() => {
  const quorumSlices = federatedVotingStore.networkAnalysis.quorumSlices.get(
    props.selectedNodeId,
  );
  if (!quorumSlices) return [];
  return Array.from(quorumSlices);
});

const totalPages = computed(() =>
  Math.ceil(quorumSlicesList.value.length / itemsPerPage),
);

const paginatedQuorumSlicesList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return quorumSlicesList.value.slice(start, start + itemsPerPage);
});

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function handleNodeSelect(node: string) {
  federatedVotingStore.selectedNodeId = node;
  currentPage.value = 1;
}
</script>

<style scoped>
.slices-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.slice-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.slice-item:last-child {
  border-bottom: none;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.pagination button {
  padding: 4px 8px;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}
</style>
