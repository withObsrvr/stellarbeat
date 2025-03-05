<template>
  <div class="card h-100">
    <div class="card-header">
      <h4 class="card-title">Network connections (overlay)</h4>
    </div>
    <div class="card-body h-100">
      <div class="chart-container h-100 position-relative">
        <!-- Add the floating control with force slider -->
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
              v-for="link in links"
              :key="'overlay' + link.source.id + link.target.id"
              :link="link"
            />
          </g>
          <g>
            <graph-node
              v-for="node in nodes"
              :key="'overlay' + node.id"
              :node="node"
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
const repellingForce = ref(initialRepellingForce); // Add repellingForce ref
const overlayGraph = ref<SVGElement | null>(null);
const graphManager = reactive(new GraphManager([], []));

let simulationManager: SimulationManager | null = null;
let addLinkSourceNode: NodeDatum | null = null;
// Track the current network structure update
let currentNetworkStructureUpdate = federatedVotingStore.networkStructureUpdate;

const handleLinkClick = (link: LinkDatum) => {
  graphManager.removeLink(link);
  if (simulationManager) {
    //simulationManager.updateSimulationLinks(graphManager.links);
  }
};

const handleNodeClick = (node: NodeDatum) => {
  federatedVotingStore.selectedNodeId = node.id;
  if (addLinkSourceNode) {
    graphManager.addLink(addLinkSourceNode, node);
    if (simulationManager)
      //simulationManager.updateSimulationLinks(graphManager.links);
      addLinkSourceNode = null;
  } else {
    addLinkSourceNode = node;
  }
};

const nodes: Ref<NodeDatum[]> = ref([]);
const links: Ref<LinkDatum[]> = ref([]);

const updateLinks = () => {
  const newLinks: LinkDatum[] = [];
  nodes.value.forEach((node) => {
    nodes.value.forEach((otherNode) => {
      if (node.id !== otherNode.id) {
        newLinks.push({
          source: node,
          target: otherNode,
        });
      }
    });
  });

  links.value = newLinks;
};

const updateGraph = () => {
  // Get node positions for persistence
  const nodePositions = new Map<string, { x: number; y: number }>();
  nodes.value.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      nodePositions.set(node.id, { x: node.x, y: node.y });
    }
  });

  // Update nodes from store, preserving positions
  nodes.value = federatedVotingStore.nodes.map((node) => {
    const position = nodePositions.get(node.publicKey);
    return {
      id: node.publicKey,
      name: node.publicKey,
      x: position ? position.x : 0,
      y: position ? position.y : 0,
    };
  });

  updateLinks();

  if (simulationManager) {
    simulationManager.updateSimulation(
      nodes.value,
      links.value,
      width(),
      height(),
    );
  } else {
    simulationManager = new SimulationManager(
      nodes.value,
      links.value,
      initialRepellingForce,
      width(),
      height(),
    );
  }
};

import "d3-transition";

// Watch for network structure changes
watch(
  () => federatedVotingStore.networkStructureUpdate,
  () => {
    if (
      currentNetworkStructureUpdate !==
      federatedVotingStore.networkStructureUpdate
    ) {
      currentNetworkStructureUpdate =
        federatedVotingStore.networkStructureUpdate;
      //check if nodes have been added or removed. checking length is not enough as a node could have been removed and another one added
      if (
        federatedVotingStore.nodes.length !== nodes.value.length ||
        !nodes.value.every((node) =>
          federatedVotingStore.nodes.some((n) => n.publicKey === node.id),
        )
      ) {
        updateGraph();
      }
    }
  },
);

onMounted(() => {
  updateGraph();
});

// Update the updateRepellingForce function to use the ref value
const updateRepellingForce = () => {
  if (simulationManager && nodes.value.length > 0) {
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
  bottom: 10px;
  right: 10px;
  z-index: 100;
  border-radius: 8px;
  padding: 8px;
}

.form-range {
  height: 15px;
}
</style>
