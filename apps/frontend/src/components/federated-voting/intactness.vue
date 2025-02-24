<template>
  <div class="card h-100">
    <div class="card-header">
      <BreadCrumbs root="Intactness"></BreadCrumbs>
    </div>
    <div class="card-body content h-100">
      <div class="section">
        <div class="voter-groups">
          <div class="node-group">
            <strong class="node-title">Intact Nodes</strong>
            <div v-if="intactNodes.length > 0" class="node-list">
              <span v-for="node in intactNodes" :key="node" class="node intact">
                {{ node }}
              </span>
            </div>
            <div v-else class="empty-message">No intact nodes</div>
          </div>

          <div class="node-group">
            <strong class="node-title">Ill-Behaved Nodes</strong>
            <div v-if="illBehavedNodes.length > 0" class="node-list">
              <span
                v-for="node in illBehavedNodes"
                :key="node"
                class="node ill-behaved"
              >
                {{ node }}
              </span>
            </div>
            <div v-else class="empty-message">No ill-behaved nodes</div>
          </div>

          <div class="node-group">
            <strong class="node-title">Befouled Nodes</strong>
            <div v-if="befouledNodes.length > 0" class="node-list">
              <span
                v-for="node in befouledNodes"
                :key="node"
                class="node befouled"
              >
                {{ node }}
              </span>
            </div>
            <div v-else class="empty-message">No befouled nodes</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div
          v-for="(dsetNodes, index) in detectedDSets"
          :key="index"
          class="dset-group"
        >
          <strong class="dset-label">DSet {{ index + 1 }}:</strong>
          <div v-if="dsetNodes.length > 0" class="node-list">
            <span
              v-for="node in dsetNodes"
              :key="node"
              class="node"
              :class="statusClass(node)"
            >
              {{ node }}
            </span>
          </div>
          <div v-else class="empty-message">Empty DSet</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import BreadCrumbs from "./bread-crumbs.vue";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const detectedDSets = computed(() => {
  return federatedVotingStore.networkAnalysis.dSets
    .filter((dset) =>
      selectedNodeId.value ? dset.has(selectedNodeId.value) : true,
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

const intactNodes = computed(() => federatedVotingStore.intactNodes());
const illBehavedNodes = computed(() => federatedVotingStore.illBehavedNodes());
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

/* Sections */
.section {
  margin-bottom: 2rem;
}

/* Node Groups */
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
  margin-bottom: 4px;
}

/* Node List */
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

.node.ill-behaved {
  background-color: #dc3545;
  color: #fff;
}

.node.befouled {
  background-color: #ffc107;
  color: #212529;
}

.dset-group {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.dset-label {
  font-weight: bold;
  white-space: nowrap;
  margin-right: 8px;
}

.empty-message {
  color: #6c757d;
  font-style: italic;
  margin-top: 4px;
  font-size: 0.9em;
}
</style>
