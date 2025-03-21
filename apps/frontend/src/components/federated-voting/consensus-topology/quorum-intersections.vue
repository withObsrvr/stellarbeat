<template>
  <div>
    <ul class="intersection-list">
      <li
        v-for="(intersection, index) in paginatedIntersections"
        :key="index"
        class="intersection-item"
      >
        <div class="node-list">
          <FbasNodeBadge
            v-for="node in intersection"
            :key="node"
            :node-id="node"
            :show-vote="true"
            :visualize-phase="true"
            @select="handleNodeSelect(node)"
          />
        </div>
      </li>
    </ul>

    <!-- Pagination Controls -->
    <div v-if="intersections.length > 0" class="pagination">
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

    <div v-if="intersections.length === 0" class="empty-message">
      Some quorums do not overlap
      <span v-if="selectedNodeId">containing {{ selectedNodeId }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";

const currentPage = ref(1);
const itemsPerPage = 5;

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const intersections = computed(() => {
  const allIntersections =
    federatedVotingStore.networkAnalysis.minimalQuorumIntersections;

  if (!selectedNodeId.value) {
    return allIntersections;
  }

  // Filter intersections to only include those containing the selected node
  return allIntersections.filter((intersection) =>
    intersection.includes(selectedNodeId.value!),
  );
});

const totalPages = computed(() =>
  Math.ceil(intersections.value.length / itemsPerPage),
);

const paginatedIntersections = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return intersections.value.slice(start, start + itemsPerPage);
});

function handleNodeSelect(node: string) {
  federatedVotingStore.selectedNodeId = node;
  currentPage.value = 1;
}

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
</script>

<style scoped>
.intersection-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.intersection-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.intersection-item:last-child {
  border-bottom: none;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.empty-message {
  padding: 20px;
  text-align: center;
  color: #6c757d;
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
</style>
