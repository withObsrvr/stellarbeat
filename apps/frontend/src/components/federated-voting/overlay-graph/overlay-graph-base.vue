<template>
  <div class="card">
    <div class="card-body pt-4 pb-0">
      <div
        class="title d-flex justify-content-around align-items-baseline border-bottom pb-4"
      >
        Overlay
      </div>

      <div class="chart-container">
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
              :selected="
                link.source.id === federatedVotingStore.selectedNodeId ||
                link.target.id === federatedVotingStore.selectedNodeId
              "
              @linkClick="handleLinkClick"
            />
          </g>
          <g>
            <graph-node
              v-for="nody in nodes"
              :key="'overlay' + nody.id"
              :node="nody"
              :selected="nody.id === federatedVotingStore.selectedNodeId"
              @nodeClick="handleNodeClick"
            />
          </g>
        </svg>
      </div>
      <div class="card-footer">
        <overlay-graph-options
          :initial-repelling-force="initialRepellingForce"
          :initial-topology="initialTopology"
          @updateRepellingForce="updateRepellingForce"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, Ref, ref, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  GraphManager,
  type LinkDatum,
  type NodeDatum,
} from "@/components/federated-voting/overlay-graph/GraphManager";
import OverlayGraphOptions from "@/components/federated-voting/overlay-graph/overlay-graph-options.vue";
import { SimulationManager } from "@/components/federated-voting/overlay-graph/SimulationManager";
import GraphLink from "@/components/federated-voting/overlay-graph/graph-link.vue";
import GraphNode from "@/components/federated-voting/overlay-graph/graph-node.vue";

const initialRepellingForce = 1000;
const initialTopology = "complete";
const overlayGraph = ref<SVGElement | null>(null);
const graphManager = reactive(new GraphManager([], []));

let simulationManager = reactive(
  new SimulationManager([], [], initialRepellingForce, 0, 0),
);

let addLinkSourceNode: NodeDatum | null = null;

const handleLinkClick = (link: LinkDatum) => {
  graphManager.removeLink(link);
  if (simulationManager) {
    //simulationManager.updateSimulationLinks(graphManager.links);
  }
};

const handleNodeClick = (node: NodeDatum) => {
  if (addLinkSourceNode) {
    graphManager.addLink(addLinkSourceNode, node);
    if (simulationManager)
      //simulationManager.updateSimulationLinks(graphManager.links);
      addLinkSourceNode = null;
  } else {
    addLinkSourceNode = node;
  }
};

const nodes: Ref<NodeDatum[]> = computed(() => {
  const nodes = federatedVotingStore.protocolContext.nodes.map((node) => ({
    id: node.publicKey,
    name: node.publicKey,
    x: 0,
    y: 0,
  }));

  return nodes;
});

const links: Ref<LinkDatum[]> = computed(() => {
  const links: LinkDatum[] = [];
  nodes.value.forEach((node) => {
    //todo: handle in context. How do we handle bi-directionality?
    nodes.value.forEach((otherNode) => {
      if (node.id !== otherNode.id) {
        links.push({
          source: node,
          target: otherNode,
        });
      }
    });
  });

  return links;
});

watch(federatedVotingStore.protocolContextState, () => {
  //todo: graphManager should create user-actions for the simulation. Reactive may not be the way to go here
  simulationManager = reactive(
    new SimulationManager(
      nodes.value,
      links.value,
      initialRepellingForce,
      width(),
      height(),
    ),
  ) as SimulationManager;
});

onMounted(() => {
  simulationManager = reactive(
    new SimulationManager(
      nodes.value,
      links.value,
      initialRepellingForce,
      width(),
      height(),
    ),
  ) as SimulationManager;
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
.chart-container {
  width: 100%;
  height: 400px;
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
