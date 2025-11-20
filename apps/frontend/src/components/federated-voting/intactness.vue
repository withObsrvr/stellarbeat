<template>
  <div class="card h-100">
    <div class="card-header">
      <div class="card-header-content">
        <BreadCrumbs root="Intactness"></BreadCrumbs>
        <InfoButton @click="showInfo" />
      </div>
    </div>
    <div class="card-body content h-100">
      <div class="section">
        <div class="voter-groups">
          <div class="node-group">
            <div class="title-with-tooltip">
              <strong class="node-title">Intact Nodes</strong>
              <BIconInfoCircle
                v-tooltip.top="
                  'There exists a DSET containing all ill-behaved nodes that does not contain the (intact) node'
                "
                class="text-secondary"
              />
            </div>
            <div v-if="intactNodes.length > 0" class="node-list">
              <FbasNodeBadge
                v-for="node in intactNodes"
                :key="node"
                :node-id="node"
                is-main
                @select="selectNode"
              />
            </div>
            <div v-else class="empty-message">No intact nodes</div>
          </div>

          <div class="node-group">
            <div class="title-with-tooltip">
              <strong class="node-title">Ill-Behaved Nodes</strong>
              <BIconInfoCircle
                v-tooltip.top="
                  'Nodes that have crashed or are acting byzantine and are not following the protocol rules'
                "
                class="text-secondary"
              />
            </div>
            <div v-if="illBehavedNodes.length > 0" class="node-list">
              <FbasNodeBadge
                v-for="node in illBehavedNodes"
                :key="node"
                :node-id="node"
                @select="selectNode"
              />
            </div>
            <div v-else class="empty-message">No ill-behaved nodes</div>
          </div>

          <div class="node-group">
            <strong class="node-title">Befouled Nodes</strong>
            <BIconInfoCircle
              v-tooltip.top="'Nodes that are not Intact'"
              class="text-secondary"
            />

            <div v-if="befouledNodes.length > 0" class="node-list">
              <FbasNodeBadge
                v-for="node in befouledNodes"
                :key="node"
                :node-id="node"
                @select="selectNode"
              />
            </div>
            <div v-else class="empty-message">No befouled nodes</div>
          </div>
        </div>
      </div>

      <div class="section last">
        <div class="title-with-tooltip">
          <strong class="node-title">
            Dispensable Sets
            <template v-if="selectedNodeId">
              for {{ selectedNodeId }}
            </template>
            <template v-else> for FBAS </template>
          </strong>
          <BIconInfoCircle
            v-tooltip.top="
              'Other nodes can function correctly after removing the DSET from the FBAS'
            "
            class="text-secondary"
          />
        </div>

        <ul class="dsets-list">
          <li
            v-for="(dsetNodes, index) in paginatedDSets"
            :key="index"
            class="dset-item"
          >
            <div v-if="dsetNodes.length > 0" class="node-list">
              <FbasNodeBadge
                v-for="node in dsetNodes"
                :key="node"
                :node-id="node"
                @select="selectNode"
              />
            </div>
            <div v-else class="empty-message">Empty DSet</div>
          </li>
        </ul>

        <!-- Pagination Controls -->
        <div v-if="detectedDSets.length > 0" class="pagination">
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
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import BreadCrumbs from "./bread-crumbs.vue";
import { BIconInfoCircle } from '@/components/bootstrap-compat';
import FbasNodeBadge from "./fbas-node-badge.vue";
import InfoButton from "./info-box/info-button.vue";
import { infoBoxStore } from "./info-box/useInfoBoxStore";
import IntactnessInfo from "./intactness/intactness-info.vue";

// Add the showInfo function
function showInfo() {
  infoBoxStore.show(IntactnessInfo);
}

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function selectNode(nodeId: string) {
  federatedVotingStore.selectedNodeId = nodeId;
}

// Pagination for DSETs
const currentPage = ref(1);
const itemsPerPage = 5;

const detectedDSets = computed(() => {
  // If no node is selected, show all DSets
  if (!selectedNodeId.value) {
    return federatedVotingStore.networkAnalysis.dSets.map((dset) =>
      Array.from(dset),
    );
  }

  return federatedVotingStore.networkAnalysis.dSets
    .filter(
      (dset) =>
        !dset.has(selectedNodeId.value as string) && // DSet doesn't contain selected node
        illBehavedNodes.value.every((illNode) => dset.has(illNode)), // DSet contains all ill-behaved nodes
    )
    .map((dset) => Array.from(dset));
});

// Calculate total pages based on number of DSets
const totalPages = computed(() =>
  Math.ceil(detectedDSets.value.length / itemsPerPage),
);

// Get only the DSets for the current page
const paginatedDSets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return detectedDSets.value.slice(start, start + itemsPerPage);
});

// Navigation functions
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

// Reset to page 1 when selected node changes
watch(selectedNodeId, () => {
  currentPage.value = 1;
});

const intactNodes = computed(() => federatedVotingStore.intactNodes);
const illBehavedNodes = computed(() => federatedVotingStore.illBehavedNodes);
const befouledNodes = computed(() => {
  const allNodes = federatedVotingStore.nodes.map((node) => node.publicKey);
  return allNodes.filter(
    (node) =>
      !intactNodes.value.includes(node) &&
      !illBehavedNodes.value.includes(node),
  );
});
</script>

<style scoped>
.content {
  overflow-y: auto;
  max-height: 100%;
  padding: 1rem;
}

.section {
  margin-bottom: 1rem;
}
.section.last {
  margin-bottom: 0rem;
}
.voter-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.node-group {
  flex: 1;
  min-width: 200px;
}

.node-title {
  font-size: 1em;
  font-weight: bold;
  margin-right: 4px;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dsets-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.dset-item {
  display: flex;
  padding: 6px 0;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
  gap: 6px;
}

.dset-item:last-child {
  border-bottom: none;
}

.empty-message {
  color: #6c757d;
  font-style: italic;
  margin-top: 4px;
  font-size: 0.9em;
}

.title-with-tooltip {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.3rem;
}

.pagination button {
  padding: 4px 8px;
}

/* Add this new style for the header content */
.card-header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
