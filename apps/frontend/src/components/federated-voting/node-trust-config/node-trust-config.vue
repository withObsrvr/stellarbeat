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
                  :value="node.quorumSet.threshold"
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
      <QuorumSlices v-if="selectedNode" :node="selectedNode" />
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, Ref, ComputedRef, onBeforeMount, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import InfoButton from "../info-box/info-button.vue";
import NodeTrustConfigInfo from "./node-trust-config-info.vue";
import QuorumSlices from "./quorum-slices.vue";
import { BModal } from "bootstrap-vue";
import { Node, QuorumSet, UpdateQuorumSet } from "scp-simulation";

const nodes: ComputedRef<Node[]> = computed(
  () => federatedVotingStore.nodes as Node[],
);
const nodesCache = ref<Node[]>();
const hasLocalChanges = ref(false);

watch(
  () => federatedVotingStore.quorumSets,
  () => {
    initializeNodeCache();
  },
  { immediate: false, deep: true },
);

onBeforeMount(() => {
  initializeNodeCache();
});

function isTrusted(node: Node, otherNode: Node): boolean {
  return node.quorumSet.validators.includes(otherNode.publicKey);
}

function toggleTrust(node: Node, otherNode: Node): void {
  const index = node.quorumSet.validators.indexOf(otherNode.publicKey);
  const newValidators = [...node.quorumSet.validators];
  if (index === -1) {
    newValidators.push(otherNode.publicKey);
  } else {
    newValidators.splice(index, 1);
  }

  node.updateQuorumSet(
    new QuorumSet(node.quorumSet.threshold, newValidators, []),
  );

  hasLocalChanges.value = true;
}

function getOriginalNode(publicKey: string): Node | undefined {
  return federatedVotingStore.protocolContextState.protocolStates
    .map((protocolState) => protocolState.node)
    .find((node) => node.publicKey === publicKey);
}

function compareQuorumSets(qs1: QuorumSet, qs2: QuorumSet): boolean {
  if (qs1.threshold !== qs2.threshold) {
    return false;
  }

  const validators1 = [...qs1.validators].sort();
  const validators2 = [...qs2.validators].sort();

  if (validators1.length !== validators2.length) {
    return false;
  }

  for (let i = 0; i < validators1.length; i++) {
    if (validators1[i] !== validators2[i]) {
      return false;
    }
  }

  return true;
}

function initializeNodeCache() {
  console.log("INIT CACHE");
  hasLocalChanges.value = false;
  const newNodesCache: Node[] = [];
  nodes.value.forEach((element) => {
    newNodesCache.push(
      new Node(
        element.publicKey,
        new QuorumSet(
          element.quorumSet.threshold,
          element.quorumSet.validators,
          [],
        ),
      ),
    );
  });
  nodesCache.value = newNodesCache;
}

function applyChanges() {
  if (!nodesCache.value) {
    return;
  }
  nodesCache.value.forEach((node) => {
    const originalNode = getOriginalNode(node.publicKey);
    if (
      originalNode &&
      !compareQuorumSets(originalNode.quorumSet, node.quorumSet)
    ) {
      // Add the new action
      const action = new UpdateQuorumSet(node.publicKey, node.quorumSet);
      federatedVotingStore.simulation.addUserAction(action);
    } else {
      // Remove the action if it was previously added
      federatedVotingStore.simulation.pendingUserActions().forEach((action) => {
        if (
          action instanceof UpdateQuorumSet &&
          action.publicKey === node.publicKey
        ) {
          federatedVotingStore.simulation.cancelPendingUserAction(action);
        }
      });
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

const paginatedNodes: ComputedRef<Node[]> = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return nodesCache.value!.slice(start, start + itemsPerPage) as Node[];
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
const selectedNode: Ref<Node | null> = ref(null);

function showSlices(node: Node | null) {
  selectedNode.value = node;
  showingSlices.value = true;
}

function getTrustedCount(node: Node): number {
  return node.quorumSet.validators.length;
}

function getThresholdOptions(node: Node): number[] {
  const validatorCount = getTrustedCount(node);
  if (validatorCount === 0) return [0];
  return Array.from({ length: validatorCount }, (_, i) => i + 1);
}

function updateThreshold(node: Node, event: Event): void {
  const newThreshold = parseInt((event.target as HTMLSelectElement).value);
  if (newThreshold !== node.quorumSet.threshold) {
    node.updateQuorumSet(
      new QuorumSet(newThreshold, node.quorumSet.validators, []),
    );
    hasLocalChanges.value = true;
  }
}

function isThresholdModified(node: Node): boolean {
  const originalNode = getOriginalNode(node.publicKey);
  return (
    !!originalNode &&
    originalNode.quorumSet.threshold !== node.quorumSet.threshold
  );
}

// Add this function to determine if trust has been modified compared to original node
function isTrustModified(node: Node, otherNode: Node): boolean {
  const originalNode = getOriginalNode(node.publicKey);
  if (!originalNode) return false;

  // Check if the trust relationship is different between original and current
  const originallyTrusted = originalNode.quorumSet.validators.includes(
    otherNode.publicKey,
  );
  const currentlyTrusted = node.quorumSet.validators.includes(
    otherNode.publicKey,
  );

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
