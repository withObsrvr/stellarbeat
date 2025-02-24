<template>
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="mb-0">Node Trust Configurations</h5>
      <InfoButton @click="showInfo" />
    </div>
    <div class="card-body content h-100">
      <table class="connections-table">
        <thead>
          <tr>
            <th>Node</th>
            <th>Trusts</th>
            <th>With Threshold</th>
            <th>Quorum Slices</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in paginatedNodes" :key="node.publicKey">
            <td>
              <span class="node">
                {{ node.publicKey }}
              </span>
            </td>
            <td>
              <div class="node-list">
                <span
                  v-for="otherNode in allNodes"
                  :key="otherNode.publicKey"
                  class="node"
                  :class="{ trusted: isTrusted(node, otherNode) }"
                >
                  {{ otherNode.publicKey }}
                </span>
              </div>
            </td>
            <td>{{ formatThreshold(node) }}</td>
            <td>
              <button
                class="btn btn-sm btn-secondary"
                @click="showSlices(node)"
              >
                Show Slices
              </button>
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

    <BModal
      v-model="showingSlices"
      :title="
        `Quorum Slices of ` + (selectedNode ? selectedNode.publicKey : '')
      "
      size="lg"
      ok-only
    >
      <QuorumSlices v-if="selectedNode" :node="selectedNode" />
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, ComputedRef } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import InfoButton from "../info-box/info-button.vue";
import NodeTrustConfigInfo from "./node-trust-config-info.vue";
import QuorumSlices from "./quorum-slices.vue";
import { BModal } from "bootstrap-vue";
import { Node } from "scp-simulation";

const allNodes: Node[] = federatedVotingStore.nodes as Node[];

function isTrusted(node: Node, otherNode: Node) {
  return node.quorumSet.validators.includes(otherNode.publicKey);
}

function formatThreshold(node: Node): string {
  const threshold = node.quorumSet.threshold;
  const validatorCount = node.quorumSet.validators.length;
  return `${threshold}/${validatorCount}`;
}

// Pagination
const currentPage = ref(1);
const itemsPerPage = 5;

const totalPages = computed(() => Math.ceil(allNodes.length / itemsPerPage));

const paginatedNodes: ComputedRef<Node[]> = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return allNodes.slice(start, start + itemsPerPage) as Node[];
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

function showInfo() {
  infoBoxStore.show(NodeTrustConfigInfo);
}

// For slices modal
const showingSlices = ref(false);
const selectedNode: Ref<Node | null> = ref(null);

function showSlices(node: Node | null) {
  selectedNode.value = node;
  showingSlices.value = true;
}
</script>

<style scoped>
.content {
  overflow-y: auto;
  max-height: 100%;
  padding: 1rem;
}

.connections-table {
  width: 100%;
  border-collapse: collapse;
}

.connections-table th,
.connections-table td {
  padding: 8px;
  border: 1px solid #ddd;
}

.connections-table th {
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

.node.trusted {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
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

.btn-outline-secondary {
  border-color: #ced4da;
}

.btn-outline-secondary:hover {
  background-color: #e9ecef;
  border-color: #ced4da;
  color: #212529;
}
</style>
