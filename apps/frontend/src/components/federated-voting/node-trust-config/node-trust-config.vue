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
            <th>Threshold</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="node in paginatedNodes" :key="node.publicKey">
            <td class="node-td">
              <span
                class="node node-control"
                :class="{
                  'node-active': isNodeActive(node.publicKey),
                  'node-inactive': !isNodeActive(node.publicKey),
                }"
                @click="toggleNode(node.publicKey)"
              >
                {{ node.publicKey.substring(0, 8) }}
              </span>
            </td>
            <td
              v-if="!isNodeActive(node.publicKey)"
              class="placeholder-td"
              colspan="2"
            >
              <span class="placeholder-text"
                >Add node to set trust configuration</span
              >
            </td>
            <td v-else>
              <div class="node-list">
                <span
                  v-for="otherNode in activeNodesForTrustColumn"
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
            <td v-if="isNodeActive(node.publicKey)" class="threshold-td">
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
            <span>You have unsaved trust configuration changes</span>
          </div>
          <div>
            <button
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, ComputedRef, onBeforeMount, watch } from "vue";
import {
  FederatedNode,
  federatedVotingStore,
} from "@/store/useFederatedVotingStore";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import InfoButton from "../info-box/info-button.vue";
import NodeTrustConfigInfo from "./node-trust-config-info.vue";

interface TrustConfig {
  publicKey: string;
  trustedNodes: string[];
  trustThreshold: number;
  isActive: boolean;
  isNew?: boolean;
  isRemoved?: boolean;
}

const nodes: ComputedRef<FederatedNode[]> = computed(
  () => federatedVotingStore.nodes,
);
const nodesCache = ref<TrustConfig[]>([]);
const hasLocalChanges = ref(false);

// Maximum number of nodes in the system
const MAX_NODES = 10;

// Define the standard order for nodes based on peopleNames
const standardNodeOrder = [
  "Alice",
  "Bob",
  "Chad",
  "Steve",
  "Daisy",
  "Frank",
  "Grace",
  "Henry",
  "Isabel",
  "Jack",
];

const allNodesWithPlaceholders = computed(() => {
  if (!nodesCache.value) return [];

  const nodes = [...nodesCache.value];

  nodes.sort((a, b) => {
    const indexA = standardNodeOrder.indexOf(a.publicKey);
    const indexB = standardNodeOrder.indexOf(b.publicKey);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.publicKey.localeCompare(b.publicKey);
  });

  return nodes;
});

const activeNodesForTrustColumn = computed(() => {
  return nodesCache.value.filter((node) => node.isActive && !node.isRemoved);
});

function isNodeActive(publicKey: string): boolean {
  const node = nodesCache.value.find((n) => n.publicKey === publicKey);
  return node ? node.isActive : false;
}

function toggleNode(publicKey: string): void {
  const nodeIndex = nodesCache.value.findIndex(
    (n) => n.publicKey === publicKey,
  );
  if (nodeIndex >= 0) {
    nodesCache.value[nodeIndex].isActive =
      !nodesCache.value[nodeIndex].isActive;

    if (nodesCache.value[nodeIndex].isActive) {
      const existingNodeKeys = nodesCache.value
        .filter((n) => n.isActive && n.publicKey !== publicKey && !n.isRemoved)
        .map((n) => n.publicKey);

      nodesCache.value[nodeIndex].trustedNodes = existingNodeKeys;
      nodesCache.value[nodeIndex].trustThreshold = Math.max(
        1,
        Math.floor(existingNodeKeys.length / 2) + 1,
      );

      if (nodesCache.value[nodeIndex].isNew === undefined) {
        nodesCache.value[nodeIndex].isNew = true;
      }

      if (nodesCache.value[nodeIndex].isRemoved) {
        nodesCache.value[nodeIndex].isRemoved = false;
      }
    } else {
      nodesCache.value[nodeIndex].isRemoved = true;
      const nodeToRemove = publicKey;
      nodesCache.value.forEach((otherNode) => {
        if (otherNode.publicKey !== nodeToRemove) {
          const trustIndex = otherNode.trustedNodes.indexOf(nodeToRemove);
          if (trustIndex !== -1) {
            otherNode.trustedNodes.splice(trustIndex, 1);

            if (otherNode.trustThreshold > otherNode.trustedNodes.length) {
              otherNode.trustThreshold = Math.max(
                1,
                otherNode.trustedNodes.length,
              );
            }
            hasLocalChanges.value = true;
          }
        }
      });
    }

    hasLocalChanges.value = true;
  }
}

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

function getNode(publicKey: string): FederatedNode | null {
  return (
    federatedVotingStore.nodes.find((node) => node.publicKey === publicKey) ??
    null
  );
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
  console.log("Initializing node cache");
  hasLocalChanges.value = false;

  // Start with existing active nodes
  const newNodesCache: TrustConfig[] = nodes.value.map((node) => ({
    publicKey: node.publicKey,
    trustedNodes: node.trustedNodes.slice(),
    trustThreshold: node.trustThreshold,
    isActive: true,
  }));

  const existingNodeCount = newNodesCache.length;
  const placeholderCount = Math.max(0, MAX_NODES - existingNodeCount);

  const peopleNames = standardNodeOrder;
  const existingNames = new Set(nodes.value.map((node) => node.publicKey));
  const availableNames = peopleNames.filter((name) => !existingNames.has(name));

  let placeholdersAdded = 0;
  let nameIndex = 0;

  while (
    placeholdersAdded < placeholderCount &&
    nameIndex < availableNames.length
  ) {
    const personName = availableNames[nameIndex++];

    newNodesCache.push({
      publicKey: personName,
      trustedNodes: [],
      trustThreshold: 0,
      isActive: false,
    });

    placeholdersAdded++;
  }

  // If we've used all available names but still need more placeholders,
  // create generic placeholder names. Should not happen...
  while (placeholdersAdded < placeholderCount) {
    const placeholderName = `Node${existingNodeCount + placeholdersAdded + 1}`;

    newNodesCache.push({
      publicKey: placeholderName,
      trustedNodes: [],
      trustThreshold: 0,
      isActive: false,
    });

    placeholdersAdded++;
  }

  // Sort the nodes according to the standard order
  newNodesCache.sort((a, b) => {
    const indexA = standardNodeOrder.indexOf(a.publicKey);
    const indexB = standardNodeOrder.indexOf(b.publicKey);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return a.publicKey.localeCompare(b.publicKey);
  });

  nodesCache.value = newNodesCache;
}

function applyChanges() {
  if (!nodesCache.value) return;

  // Handle removed nodes first
  nodesCache.value
    .filter((node) => node.isRemoved)
    .forEach((node) => {
      federatedVotingStore.removeNode(node.publicKey);
    });

  // Handle new nodes
  nodesCache.value
    .filter((node) => node.isNew && node.isActive)
    .forEach((node) => {
      federatedVotingStore.addNode(
        node.publicKey,
        node.trustedNodes,
        node.trustThreshold,
      );
    });

  // Handle trust updates for existing nodes
  nodesCache.value
    .filter((node) => node.isActive && !node.isNew && !node.isRemoved)
    .forEach((node) => {
      const originalNode = getOriginalNode(node.publicKey);
      if (!originalNode) {
        const nodeAddedInThisSimulationStep = getNode(node.publicKey); //maybe we just added it in the same simulation step
        if (nodeAddedInThisSimulationStep) {
          federatedVotingStore.addNode(
            node.publicKey,
            node.trustedNodes,
            node.trustThreshold,
          ); //replace the addNode action
        }
      }
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

  initializeNodeCache();
}

function reset() {
  initializeNodeCache();
}

const currentPage = ref(1);
const itemsPerPage = 5;

const paginatedNodes: ComputedRef<TrustConfig[]> = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return allNodesWithPlaceholders.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() =>
  Math.ceil(allNodesWithPlaceholders.value.length / itemsPerPage),
);

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

function isTrustModified(node: TrustConfig, otherNode: TrustConfig): boolean {
  const originalNode = getOriginalNode(node.publicKey);
  if (!originalNode) return false;

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

.node-control {
  transition: all 0.2s ease;
}

.node-active {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

.node-inactive {
  background-color: #e9ecef;
  border-color: #ced4da;
  color: #6c757d;
}

.node.trusted {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

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

.alert-info {
  color: #0c5460;
  background-color: #d1ecf1;
  border-color: #bee5eb;
}

.threshold-selector {
  width: 50px;
  margin: 0 auto;
}

.form-select.modified {
  border: 2px solid #ffc107;
}

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

.node-td {
  width: 30px;
}

.threshold-td {
  width: 30px;
}

.placeholder-td {
  color: #6c757d;
  font-style: italic;
  text-align: center;
}

.placeholder-text {
  display: block;
  padding: 8px 0;
}
</style>
