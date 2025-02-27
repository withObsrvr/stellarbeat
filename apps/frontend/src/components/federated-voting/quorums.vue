<template>
  <div class="card h-100">
    <div class="card-header">
      <BreadCrumbs root="Quorums"></BreadCrumbs>
      <span
        v-if="federatedVotingStore.networkAnalysis.hasQuorumIntersection"
        class="badge badge-success ms-2"
        >Quorum Intersection</span
      >
      <span v-else class="badge badge-danger ms-2">No Quorum Intersection</span>
    </div>
    <div class="card-body content h-100">
      <table class="quorum-table">
        <thead>
          <tr>
            <th>Quorum (Hover node for containing slice)</th>
            <th>Is Minimal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(quorum, index) in paginatedQuorums" :key="index">
            <td>
              <div class="node-list">
                <span
                  v-for="node in quorum"
                  :key="node"
                  class="node"
                  :class="{
                    highlight: isInHighlightedSlice(node, index),
                    clickable: selectedNodId !== node,
                    'hovered-node':
                      hoveredNode === node && hoveredQuorumIndex === index,
                  }"
                  @mouseover="setHoveredNode(node, quorum, index)"
                  @mouseleave="clearHoveredNode"
                  @click="
                    federatedVotingStore.selectedNodeId = node;
                    currentPage = 1;
                  "
                >
                  {{ node }}
                </span>
              </div>
            </td>
            <td>
              <span
                class="minimal-badge"
                :class="{ yes: isMinimal(quorum), no: !isMinimal(quorum) }"
              >
                {{ isMinimal(quorum) ? "Yes" : "No" }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

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
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import BreadCrumbs from "./bread-crumbs.vue";

const selectedNodId = computed(() => federatedVotingStore.selectedNodeId);

const quorums = computed(() => {
  return federatedVotingStore.networkAnalysis.quorums.filter((q) =>
    selectedNodId.value ? q.has(selectedNodId.value) : true,
  );
});

const quorumSlices = computed(
  () => federatedVotingStore.networkAnalysis.quorumSlices,
);

const hoveredNode = ref<string | null>(null);
const highlightedSlice = ref<string[]>([]);
const hoveredQuorumIndex = ref<number | null>(null);

function setHoveredNode(node: string, quorum: Set<string>, index: number) {
  hoveredNode.value = node;
  hoveredQuorumIndex.value = index;

  const nodeSlices: Set<string>[] = quorumSlices.value.get(node) || [];
  const slicesInQuorum = Array.from(nodeSlices).filter((slice) =>
    Array.from(slice).every((node) => quorum.has(node)),
  );

  const smallestSlice = slicesInQuorum.reduce((smallest, slice) => {
    return slice.size < smallest.size ? slice : smallest;
  }, slicesInQuorum[0]);

  highlightedSlice.value = Array.from(smallestSlice || []);
}

function clearHoveredNode() {
  hoveredNode.value = null;
  highlightedSlice.value = [];
  hoveredQuorumIndex.value = null;
}

function isInHighlightedSlice(node: string, index: number) {
  return (
    index === hoveredQuorumIndex.value && highlightedSlice.value.includes(node)
  );
}

function isMinimal(quorum: Set<string>) {
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

const currentPage = ref(1);
const itemsPerPage = 5;

const totalPages = computed(() =>
  Math.ceil(quorums.value.length / itemsPerPage),
);

const paginatedQuorums = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return quorums.value.slice(start, start + itemsPerPage);
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
</script>

<style scoped>
.content {
  overflow-y: auto;
  max-height: 100%;
  padding: 1rem;
}

/* Table */
.quorum-table {
  width: 100%;
  border-collapse: collapse;
}

.quorum-table th,
.quorum-table td {
  padding: 8px;
  border: 1px solid #ddd;
}

.quorum-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: left;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.node {
  display: inline-block;
  padding: 3px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #f9f9f9;
  color: #212529;
  box-sizing: border-box;
}

.node:hover {
  cursor: pointer;
}

.node.highlight {
  background-color: #007bff; /* Bright blue background */
  border: 1px solid #007bff; /* Bright blue background */
  color: white;
  font-style: italic;
}

.node.hovered-node {
  background-color: #007bff; /* Bright blue background */
  color: #fff;
  border: 1px solid #004085; /* Thicker, darker border */
  font-style: normal;
}

.minimal-badge {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}

.minimal-badge.yes {
  background-color: #28a745;
  color: #fff;
}

.minimal-badge.no {
  background-color: #f2f2f2;
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
.clickable {
  color: #1888b2;
  cursor: pointer;
}
.card-header {
  display: flex;
  justify-content: space-between;
}
</style>
