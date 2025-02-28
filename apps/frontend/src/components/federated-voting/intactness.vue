<template>
  <div class="card h-100">
    <div class="card-header">
      <BreadCrumbs root="Intactness"></BreadCrumbs>
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
              <span
                v-for="node in intactNodes"
                :key="node"
                class="node intact main clickable"
                :class="{ selected: selectedNodeId === node }"
                @click="selectNode(node)"
              >
                {{ node }}
              </span>
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
              <span
                v-for="node in illBehavedNodes"
                :key="node"
                class="node ill-behaved clickable"
                :class="{ selected: selectedNodeId === node }"
                @click="selectNode(node)"
              >
                {{ node }}
              </span>
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
              <span
                v-for="node in befouledNodes"
                :key="node"
                class="node befouled clickable"
                :class="{ selected: selectedNodeId === node }"
                @click="selectNode(node)"
              >
                {{ node }}
              </span>
            </div>
            <div v-else class="empty-message">No befouled nodes</div>
          </div>
        </div>
      </div>

      <div class="section">
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

        <!-- List view for DSets -->
        <ul class="dsets-list">
          <li
            v-for="(dsetNodes, index) in detectedDSets"
            :key="index"
            class="dset-item"
          >
            <div v-if="dsetNodes.length > 0" class="node-list">
              <span
                v-for="node in dsetNodes"
                :key="node"
                class="node clickable"
                :class="[
                  statusClass(node),
                  { selected: selectedNodeId === node },
                ]"
                @click="selectNode(node)"
              >
                {{ node }}
              </span>
            </div>
            <div v-else class="empty-message">Empty DSet</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import BreadCrumbs from "./bread-crumbs.vue";
import { BIconInfoCircle } from "bootstrap-vue";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

// Add function to select a node
function selectNode(nodeId: string) {
  federatedVotingStore.selectedNodeId = nodeId;
}

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

const statusClass = (nodeId: string) => {
  return {
    intact: intactNodes.value.includes(nodeId),
    "ill-behaved": illBehavedNodes.value.includes(nodeId),
    befouled: befouledNodes.value.includes(nodeId),
  };
};

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

.node {
  display: inline-block;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9em;
  background-color: #f9f9f9;
  color: #212529;
}

.node.intact {
  background-color: #28a745;
  color: #fff;
}

.node.intact.main {
  background-color: #28a745;
  color: #fff;
}

.node.ill-behaved {
  background-color: #dc3545;
  color: #fff;
}

.node.befouled {
  background-color: #ffc107;
  color: #212529;
}

.dsets-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.dset-item {
  padding: 8px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  background-color: #f8f9fa;
  border: 2px solid transparent;
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

.clickable {
  cursor: pointer;
}
</style>
