<template>
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h4 class="card-title">Network connections</h4>
      <div class="badges">
        <span
          v-if="federatedVotingStore.overlayIsGossipEnabled"
          v-tooltip.bottom="'Disable in scenario settings'"
          class="badge badge-info ms-2"
        >
          Gossiping
        </span>
        <span
          v-if="!federatedVotingStore.overlayIsGossipEnabled"
          v-tooltip.bottom="'Enable in scenario settings'"
          class="badge bg-secondary ms-2"
        >
          Gossiping Disabled
        </span>
        <span
          v-if="federatedVotingStore.overlayIsFullyConnected"
          v-tooltip.bottom="
            'Disable to allow user modifications in scenario settings'
          "
          class="badge bg-info ms-2"
        >
          Fully Connected
        </span>
        <span
          v-else
          v-tooltip.bottom="'User can add/remove connections'"
          class="badge bg-info ms-2"
          >Editable</span
        >
      </div>
    </div>
    <div class="card-body h-100">
      <div class="chart-container h-100 position-relative">
        <div class="floating-control">
          <div v-tooltip.bottom="`Repelling Force`" class="force-control">
            <input
              id="repellingForce"
              v-model.number="repellingForce"
              type="range"
              class="form-range"
              min="500"
              max="3000"
              step="100"
              @input="updateRepellingForce"
            />
          </div>
        </div>

        <svg
          ref="overlayGraph"
          class="overlay-graph"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
        >
          <g>
            <graph-link
              v-for="link in graphManager.links"
              :key="'overlay' + link.source.id + link.target.id"
              :link="link"
              :hover-disabled="federatedVotingStore.overlayIsFullyConnected"
              @click="(event) => handleLinkClick(event, link)"
            />
          </g>
          <g>
            <graph-node
              v-for="node in graphManager.nodes"
              :key="'overlay' + node.id"
              :node="node"
              :selected="isNodeSelected(node)"
              :hover-disabled="federatedVotingStore.overlayIsFullyConnected"
              @click="handleNodeClick(node)"
            />
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, Ref, ref, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  GraphManager,
  type LinkDatum,
  type NodeDatum,
} from "@/components/federated-voting/overlay-graph/GraphManager";
import { SimulationManager } from "@/components/federated-voting/overlay-graph/SimulationManager";
import GraphLink from "@/components/federated-voting/overlay-graph/graph-link.vue";
import GraphNode from "@/components/federated-voting/overlay-graph/graph-node.vue";

const initialRepellingForce = 1000;
const repellingForce = ref(initialRepellingForce);
const overlayGraph = ref<SVGElement | null>(null);
const graphManager = reactive(new GraphManager([], []));

let simulationManager: SimulationManager | null = null;
const addLinkSourceNode: Ref<NodeDatum | null> = ref(null);

const handleLinkClick = (event: Event, link: LinkDatum) => {
  if (federatedVotingStore.overlayIsFullyConnected) return; // Prevent editing when fully connected
  event.stopPropagation();
  graphManager.removeLink(link);
  if (simulationManager) {
    simulationManager.updateSimulationLinks(graphManager.links);
  }
  federatedVotingStore.removeConnection(link.source.id, link.target.id);
};

const handleNodeClick = (node: NodeDatum) => {
  if (federatedVotingStore.overlayIsFullyConnected) return; // Prevent editing when fully connected

  if (addLinkSourceNode.value) {
    graphManager.addLink(addLinkSourceNode.value, node);
    if (simulationManager)
      simulationManager.updateSimulationLinks(graphManager.links);
    federatedVotingStore.addConnection(addLinkSourceNode.value.id, node.id);
    addLinkSourceNode.value = null;
  } else {
    addLinkSourceNode.value = node;
  }
};

function isNodeSelected(node: NodeDatum): boolean {
  return addLinkSourceNode.value?.id === node.id;
}

const updateGraph = () => {
  const changed = graphManager.updateGraph(
    federatedVotingStore.nodes,
    federatedVotingStore.overlayConnections,
  );

  // If nothing changed, do not update the simulation
  if (!changed) return;

  if (simulationManager) {
    simulationManager.updateSimulation(
      graphManager.nodes,
      graphManager.links,
      width(),
      height(),
    );
  } else {
    simulationManager = new SimulationManager(
      graphManager.nodes,
      graphManager.links,
      repellingForce.value,
      width(),
      height(),
    );
  }
};

import "d3-transition";

watch(
  [
    () => federatedVotingStore.overlayUpdate,
    () => federatedVotingStore.simulationUpdate, //because we do live updates, we need to update the graph
    //when the simulation is updated. Or we could miss changes when going back in the simulation
  ],
  () => {
    updateGraph();
  },
);

onMounted(() => {
  updateGraph();
});

const updateRepellingForce = () => {
  if (simulationManager && graphManager.nodes.length > 0) {
    simulationManager.updateSimulationForce(repellingForce.value);
  }
};

const width = (): number => {
  if (!overlayGraph.value) return 0;
  return overlayGraph.value.clientWidth;
};

const height = (): number => {
  if (!overlayGraph.value) return 0;
  return overlayGraph.value.clientHeight;
};
</script>

<style scoped>
.legend {
  display: flex;
  justify-content: center;
  align-items: center;
}

.legend-item {
  margin: 0 10px;
  display: flex;
  align-items: center;
}

.legend-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.legend-rectangle {
  width: 20px;
  height: 10px;
  display: inline-block;
  margin-right: 5px;
}

.legend-circle.active-node {
  background-color: #1687b2;
}

.legend-rectangle.bidirectional-connection {
  background-color: #1687b2;
}
.legend-rectangle.bidirectional-selected-connection {
  background-color: #fec601;
}
.chart-container {
  width: 100%;
}
.overlay-graph {
  width: 100%;
  height: 100%;
}
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.floating-control {
  position: absolute;
  bottom: -20px;
  right: 10px;
  z-index: 100;
  border-radius: 8px;
  padding: 8px;
}

.form-range {
  height: 15px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.badge {
  margin-right: 4px;
  font-size: 0.85rem;
  padding: 0.35em 0.65em;
}
</style>
