<template>
  <div class="card h-100">
    <div class="card-header">
      <h4 class="card-title">Network connections (overlay)</h4>
    </div>
    <div class="card-body h-100">
      <div class="chart-container h-100">
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
              v-for="nody in nodes"
              :key="'overlay' + nody.id"
              :node="nody"
            />
          </g>
        </svg>
      </div>
      <!--div class="card-footer">
        <div class="legend">
          <span class="legend-item">
            <span class="legend-circle active-node"></span> Active
          </span>
          <span v-if="!federatedVotingStore.selectedNodeId" class="legend-item">
            <span class="legend-rectangle bidirectional-connection"></span>
            Bidirectional Connection
          </span>
          <span v-else>
            <span
              class="legend-rectangle bidirectional-selected-connection"
            ></span>
            Bidirectional Connection
          </span>
        </div!-->
      <!--overlay-graph-options
          :initial-repelling-force="initialRepellingForce"
          :initial-topology="initialTopology"
          @updateRepellingForce="updateRepellingForce"
        /!-->
      <!--/div!-->
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
import { MessageSent } from "scp-simulation";

const initialRepellingForce = 1000;
const overlayGraph = ref<SVGElement | null>(null);
const graphManager = reactive(new GraphManager([], []));

let simulationManager: SimulationManager | null = null;
let addLinkSourceNode: NodeDatum | null = null;

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
    //todo: handle in context. How do we handle bi-directionality?
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

import "d3-transition";

onMounted(() => {
  nodes.value = federatedVotingStore.protocolContextState.protocolStates.map(
    (protocolState) => ({
      id: protocolState.node.publicKey,
      name: protocolState.node.publicKey,
      x: 0,
      y: 0,
    }),
  );

  updateLinks();

  simulationManager = new SimulationManager(
    nodes.value,
    links.value,
    initialRepellingForce,
    width(),
    height(),
  );
});

const updateRepellingForce = (force: number) => {
  if (simulationManager) {
    simulationManager.updateSimulationForce(force);
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
</style>
