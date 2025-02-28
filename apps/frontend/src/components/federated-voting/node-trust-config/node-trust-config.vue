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
                {{ node.publicKey.substring(0, 8) }}
              </span>
            </td>
            <td>
              <div class="node-list">
                <span
                  v-for="otherNode in nodesCache"
                  :key="otherNode.publicKey"
                  class="node"
                  :class="{
                    trusted: isTrusted(node, otherNode),
                    modified: isTrustModified(node, otherNode),
                  }"
                  @click="toggleTrust(node, otherNode)"
                >
                  {{ otherNode.publicKey.substring(0, 8) }}
                </span>
              </div>
            </td>
            <td>
              <div class="threshold-selector">
                <select
                  class="form-select form-select-sm"
                  :class="{ modified: isThresholdModified(node) }"
                  :value="node.trustThreshold"
                  @change="updateThreshold(node, $event)"
                >
                  <option
                    v-for="n in getThresholdOptions(node)"
                    :key="n"
                    :value="n"
                  >
                    {{ n }}/{{ getTrustedCount(node) }}
                  </option>
                </select>
              </div>
            </td>
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

      <div v-if="hasLocalChanges" class="cache-controls p-2">
        <div
          class="alert"
          :class="{
            'alert-warning': hasLocalChanges,
          }"
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <div>
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <span v-if="hasLocalChanges"
              >You have unsaved trust configuration changes</span
            >
          </div>
          <div>
            <button
              v-if="hasLocalChanges"
              class="btn btn-primary btn-sm me-2 mr-2"
              @click="applyChanges"
            >
              Apply Changes
            </button>
            <button
              class="btn btn-outline-secondary btn-sm"
              :title="'Reset changes'"
              @click="reset"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

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
      :title="`Quorum Slices of ${selectedNode ? selectedNode.publicKey : ''}`"
      size="lg"
      ok-only
    >
      <QuorumSlices
        v-if="selectedNode"
        :public-key="selectedNode.publicKey"
        :trusted-nodes="selectedNode.trustedNodes"
        :trust-threshold="selectedNode.trustThreshold"
      />
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, ComputedRef, onBeforeMount, watch } from "vue";
import {
  FederatedNode,
  federatedVotingStore,
} from "@/store/useFederatedVotingStore";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import InfoButton from "../info-box/info-button.vue";
import NodeTrustConfigInfo from "./node-trust-config-info.vue";
import QuorumSlices from "./quorum-slices.vue";
import { BModal } from "bootstrap-vue";

interface TrustConfig {
  publicKey: string;
  trustedNodes: string[];
  trustThreshold: number;
}

const nodes: ComputedRef<FederatedNode[]> = computed(
  () => federatedVotingStore.nodes,
);
const nodesCache = ref<TrustConfig[]>();
const hasLocalChanges = ref(false);

watch(
  () => federatedVotingStore.nodes,
  () => {
    initializeNodeCache();
  },
  { immediate: false, deep: true },
);

onBeforeMount(() => {
  initializeNodeCache();
});

function isTrusted(node: TrustConfig, otherNode: TrustConfig): boolean {
  return node.trustedNodes.includes(otherNode.publicKey);
}

function toggleTrust(node: TrustConfig, otherNode: TrustConfig): void {
  const index = node.trustedNodes.indexOf(otherNode.publicKey);
  const newValidators = [...node.trustedNodes];
  if (index === -1) {
    newValidators.push(otherNode.publicKey);
  } else if (newValidators.length > 1) {
    newValidators.splice(index, 1);
  }

  node.trustedNodes = newValidators;
  node.trustThreshold = Math.min(node.trustThreshold, newValidators.length);

  hasLocalChanges.value = true;
}

function getOriginalNode(publicKey: string): FederatedNode | null {
  return federatedVotingStore.getNodeWithoutPreviewChanges(publicKey);
}

function compareTrust(node1: FederatedNode, node2: TrustConfig): boolean {
  if (node1.trustThreshold !== node2.trustThreshold) {
    return false;
  }

  const trustedNodes1 = [...node1.trustedNodes].sort();
  const trustedNodes2 = [...node2.trustedNodes].sort();

  if (trustedNodes1.length !== trustedNodes2.length) {
    return false;
  }

  for (let i = 0; i < trustedNodes1.length; i++) {
    if (trustedNodes1[i] !== trustedNodes2[i]) {
      return false;
    }
  }

  return true;
}

function initializeNodeCache() {
  hasLocalChanges.value = false;
  const newNodesCache: TrustConfig[] = [];
  nodes.value.forEach((node) => {
    newNodesCache.push({
      publicKey: node.publicKey,
      trustedNodes: node.trustedNodes.slice(),
      trustThreshold: node.trustThreshold,
    });
  });

  nodesCache.value = newNodesCache;
}

function applyChanges() {
  if (!nodesCache.value) {
    return;
  }
  nodesCache.value.forEach((node) => {
    const originalNode = getOriginalNode(node.publicKey);
    if (originalNode && !compareTrust(originalNode, node)) {
      federatedVotingStore.updateNodeTrust(
        node.publicKey,
        node.trustedNodes,
        node.trustThreshold,
      );
    } else {
      federatedVotingStore.cancelNodeTrustUpdate(node.publicKey);
    }
  });

  hasLocalChanges.value = false;
}

function reset() {
  initializeNodeCache();
}

const currentPage = ref(1);
const itemsPerPage = 5;

const totalPages = computed(() =>
  Math.ceil(nodesCache.value!.length / itemsPerPage),
);

const paginatedNodes: ComputedRef<TrustConfig[]> = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return nodesCache.value!.slice(start, start + itemsPerPage);
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

const showingSlices = ref(false);
const selectedNode: Ref<TrustConfig | null> = ref(null);

function showSlices(node: TrustConfig | null) {
  selectedNode.value = node;
  showingSlices.value = true;
}

function getTrustedCount(node: TrustConfig): number {
  return node.trustedNodes.length;
}

function getThresholdOptions(node: TrustConfig): number[] {
  const validatorCount = getTrustedCount(node);
  if (validatorCount === 0) return [0];
  return Array.from({ length: validatorCount }, (_, i) => i + 1);
}

function updateThreshold(node: TrustConfig, event: Event): void {
  const newThreshold = parseInt((event.target as HTMLSelectElement).value);
  if (newThreshold !== node.trustThreshold) {
    node.trustThreshold = newThreshold;
    hasLocalChanges.value = true;
  }
}

function isThresholdModified(node: TrustConfig): boolean {
  const originalNode = getOriginalNode(node.publicKey);
  return !!originalNode && originalNode.trustThreshold !== node.trustThreshold;
}

// Add this function to determine if trust has been modified compared to original node
function isTrustModified(node: TrustConfig, otherNode: TrustConfig): boolean {
  const originalNode = getOriginalNode(node.publicKey);
  if (!originalNode) return false;

  // Check if the trust relationship is different between original and current
  const originallyTrusted = originalNode.trustedNodes.includes(
    otherNode.publicKey,
  );
  const currentlyTrusted = node.trustedNodes.includes(otherNode.publicKey);

  return originallyTrusted !== currentlyTrusted;
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
  cursor: pointer;
}

.node.trusted {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

/* Added style for modified elements */
.node.modified,
select.modified {
  border: 2px solid #ffc107;
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

.threshold-selector {
  width: 80px;
  margin: 0 auto;
}

/* Add a style for pending changes */
.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

/* Add or update the threshold selector styles */
.threshold-selector {
  width: 80px;
  margin: 0 auto;
}

/* Make sure the modified style applies to form-select */
.form-select.modified {
  border: 2px solid #ffc107;
}

/* Add Bootstrap-like form-select styles if not already available */
.form-select {
  display: block;
  width: 100%;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}
</style>
