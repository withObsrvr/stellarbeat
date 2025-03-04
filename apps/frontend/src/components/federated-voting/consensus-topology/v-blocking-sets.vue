<template>
  <div>
    <div v-if="vblockingSets.length > 0">
      <ul class="blocking-sets-list">
        <li
          v-for="(blockingSet, index) in paginatedVBlockingSets"
          :key="index"
          class="blocking-set-item"
        >
          <div class="node-list">
            <FbasNodeBadge
              v-for="node in blockingSet"
              :key="node"
              :node-id="node"
              :show-vote="true"
              @select="handleNodeSelect(node)"
            />
          </div>
        </li>
      </ul>

      <!-- Pagination for v-blocking sets -->
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
      No v-blocking sets found for {{ selectedNodeId }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";
import { QuorumSet, QuorumSetService } from "scp-simulation";

interface VBlockingSetsProps {
  selectedNodeId: string;
}

const props = defineProps<VBlockingSetsProps>();

const currentPage = ref<number>(1);
const itemsPerPage = 5;

// V-blocking sets for selected node
const vblockingSets = computed<string[][]>(() => {
  if (!props.selectedNodeId) return [];

  const selectedNode = federatedVotingStore.nodes.find(
    (node) => node.publicKey === props.selectedNodeId,
  );

  if (!selectedNode) return [];

  // Calculate minimal v-blocking sets
  const trustedNodes = selectedNode.trustedNodes;
  const threshold = selectedNode.trustThreshold;

  // For a node with threshold k out of n validators,
  // a minimal v-blocking set needs (n - k + 1) validators
  const minBlockingSetSize = trustedNodes.length - threshold + 1;

  if (minBlockingSetSize <= 0) return [];

  // Find all possible combinations of nodes that form v-blocking sets
  const potentialBlockingSets = findAllVBlockingSets(
    trustedNodes,
    minBlockingSetSize,
    new QuorumSet(threshold, trustedNodes, []),
  );

  return potentialBlockingSets;
});

// Function to find all v-blocking sets
function findAllVBlockingSets(
  nodes: string[],
  minSize: number,
  quorumSet: QuorumSet,
): string[][] {
  const result: string[][] = [];

  // Helper function to generate combinations
  function generateCombinations(start: number, currentSet: string[]): void {
    if (currentSet.length >= minSize) {
      // Check if this set is v-blocking
      if (QuorumSetService.isSetVBlocking(currentSet, quorumSet)) {
        result.push([...currentSet]);
      }
      return;
    }

    for (let i = start; i < nodes.length; i++) {
      currentSet.push(nodes[i]);
      generateCombinations(i + 1, currentSet);
      currentSet.pop();
    }
  }

  generateCombinations(0, []);
  return result;
}

const totalPages = computed<number>(() =>
  Math.ceil(vblockingSets.value.length / itemsPerPage),
);

const paginatedVBlockingSets = computed<string[][]>(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return vblockingSets.value.slice(start, start + itemsPerPage);
});

function nextPage(): void {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function previousPage(): void {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function handleNodeSelect(node: string): void {
  federatedVotingStore.selectedNodeId = node;
  currentPage.value = 1;
}
</script>

<style scoped>
.blocking-sets-header {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #dee2e6;
  color: #212529;
}

.blocking-sets-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.blocking-set-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.blocking-set-item:last-child {
  border-bottom: none;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.size-badge {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #6c757d;
  color: #fff;
  margin-left: 8px;
  white-space: nowrap;
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
