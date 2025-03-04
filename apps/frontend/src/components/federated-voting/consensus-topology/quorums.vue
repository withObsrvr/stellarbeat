<template>
  <div>
    <ul class="quorum-list">
      <li
        v-for="(quorum, index) in paginatedQuorums"
        :key="index"
        class="quorum-item"
      >
        <div class="node-list">
          <FbasNodeBadge
            v-for="node in quorum"
            :key="node"
            :node-id="node"
            :class="{
              highlight: isInHighlightedSlice(node, index),
              'hovered-node':
                hoveredNode === node && hoveredQuorumIndex === index,
            }"
            :show-vote="true"
            @mouseover="setHoveredNode(node, quorum, index)"
            @mouseleave="clearHoveredNode"
            @select="handleNodeSelect(node)"
          />
        </div>
        <div class="quorum-badge">
          <span
            class="minimal-badge"
            :class="{ yes: isMinimal(quorum), no: !isMinimal(quorum) }"
          >
            {{ isMinimal(quorum) ? "Minimal" : "Not Minimal" }}
          </span>
        </div>
      </li>
    </ul>

    <!-- Pagination Controls -->
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
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";
import {
  findQuorums,
  findTransitivelyTrustedNodes,
} from "../analysis/DSetAnalysis";

const quorums = computed(() => {
  if (!federatedVotingStore.selectedNodeId) {
    return federatedVotingStore.networkAnalysis.quorums;
  }

  return findQuorums(
    Array.from(
      findTransitivelyTrustedNodes(
        federatedVotingStore.selectedNodeId,
        federatedVotingStore.networkAnalysis.quorumSlices,
      ),
    ),
    federatedVotingStore.networkAnalysis.quorumSlices,
  ).sort((a, b) => a.size - b.size);
});
const quorumSlices = computed(
  () => federatedVotingStore.networkAnalysis.quorumSlices,
);
const hoveredNode = ref<string | null>(null);
const highlightedSlice = ref<string[]>([]);
const hoveredQuorumIndex = ref<number | null>(null);
const currentPage = ref(1);
const itemsPerPage = 5;

const totalPages = computed(() =>
  Math.ceil(quorums.value.length / itemsPerPage),
);

const paginatedQuorums = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return quorums.value.slice(start, start + itemsPerPage);
});

function setHoveredNode(
  node: string,
  quorum: Set<string>,
  index: number,
): void {
  hoveredNode.value = node;
  hoveredQuorumIndex.value = index;

  const nodeSlices = quorumSlices.value.get(node) || [];
  const slicesInQuorum = Array.from(nodeSlices).filter((slice) =>
    Array.from(slice).every((node) => quorum.has(node)),
  );

  const smallestSlice = slicesInQuorum.reduce((smallest, slice) => {
    return slice.size < smallest.size ? slice : smallest;
  }, slicesInQuorum[0]);

  highlightedSlice.value = Array.from(smallestSlice || []);
}

function clearHoveredNode(): void {
  hoveredNode.value = null;
  highlightedSlice.value = [];
  hoveredQuorumIndex.value = null;
}

function isInHighlightedSlice(node: string, index: number): boolean {
  return (
    index === hoveredQuorumIndex.value && highlightedSlice.value.includes(node)
  );
}

function handleNodeSelect(node: string): void {
  federatedVotingStore.selectedNodeId = node;
  currentPage.value = 1;
}

function isMinimal(quorum: Set<string>): boolean {
  return (
    federatedVotingStore.networkAnalysis.minimalQuorums.filter(
      (minimalQuorum) => {
        return (
          minimalQuorum.size === quorum.size &&
          Array.from(minimalQuorum).every((node) => quorum.has(node))
        );
      },
    ).length > 0
  );
}

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
</script>

<style scoped>
/* List styling */
.quorum-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.quorum-item {
  display: flex;
  padding: 10px 0;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  gap: 6px;
}

.quorum-item:last-child {
  border-bottom: none;
}

.quorum-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0;
}

.quorum-nodes {
  flex: 1;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.quorum-badge {
  margin-left: 10px;
}

.node.highlight {
  background-color: #007bff !important;
  color: white !important;
}

.node.hovered-node {
  background-color: #007bff !important;
  color: #fff !important;
}

.minimal-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
}

.minimal-badge.yes {
  background-color: #28a745;
  color: #fff;
}

.minimal-badge.no {
  background-color: #f2f2f2;
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
