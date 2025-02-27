<template>
  <div class="card">
    <div class="card-header">
      <BreadCrumbs />
      <span
        v-if="federatedVotingStore.networkAnalysis.hasQuorumIntersection"
        class="badge badge-success ms-2"
        >Quorum Intersection</span
      >
      <span v-else class="badge badge-danger ms-2">No Quorum Intersection</span>
    </div>
    <div class="card-body graph pt-4 pb-0" style="height: 500px">
      <svg
        ref="svgRef"
        width="100%"
        height="100%"
        @mousedown="startPan"
        @mousemove="pan"
        @mouseup="endPan"
        @mouseleave="endPan"
        @wheel.prevent="zoom"
        @touchstart="startPan"
        @touchmove.prevent="pan"
        @touchend="endPan"
      >
        <g
          :transform="`translate(${translateX}, ${translateY}) scale(${scale})`"
        >
          <g v-if="topTierHullPath" class="hull-layer">
            <path
              :d="topTierHullPath"
              fill="#f5f7fb"
              stroke="#f5f7fb"
              stroke-width="60"
            ></path>
          </g>
          <g class="animation-layer">
            <AnimatedMessage
              v-for="message in messages"
              :key="message.id"
              :start-x="message.startX"
              :start-y="message.startY"
              :end-x="message.endX"
              :end-y="message.endY"
              :duration="message.duration"
              @animation-end="handleAnimationEnd(message.id)"
            />
          </g>

          <g class="links">
            <FbasGraphLink
              v-for="(link, i) in links"
              :key="i"
              :link="link"
              :center-x="width / 2"
              :center-y="height / 2"
              :highlight="false"
            />
          </g>
          <g class="nodes">
            <FbasGraphNode
              v-for="node in nodes"
              :key="node.id"
              :node="node"
              @mouseover="handleMouseOver(node)"
              @mouseout="handleMouseOut(node)"
            />
          </g>
        </g>
      </svg>
    </div>
    <div class="card-footer">
      <div class="legend">
        <div class="legend-item">
          <span class="legend-color accepted-node"></span>
          <span>Accepted</span>
        </div>
        <div class="legend-item">
          <span class="legend-color confirmed-node"></span>
          <span>Confirmed</span>
        </div>
        <div class="legend-item">
          <span class="legend-color intact-node"></span>
          <span>Intact</span>
        </div>
        <div class="legend-item">
          <span class="legend-color ill-behaved-node"></span>
          <span>Ill-Behaved</span>
        </div>
        <div class="legend-item">
          <span class="legend-color befouled-node"></span>
          <span>Befouled</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { polygonHull } from "d3-polygon";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./fbas-graph-node.vue";
import FbasGraphLink, { Link } from "./fbas-graph-link.vue";
import { MessageSent } from "scp-simulation";
import AnimatedMessage from "./animated-message.vue";
import { usePanning } from "./usePanning";
import BreadCrumbs from "../bread-crumbs.vue";
import { curveCatmullRomClosed, line } from "d3-shape";
import fbasGraphService from "./FbasGraphService";
import messageService from "./MessageService";

const { translateX, translateY, scale, startPan, pan, endPan, zoom } =
  usePanning();
const height = 500;
const svgRef = ref<SVGSVGElement | null>(null);
const hoveredNode = ref<Node | null>(null);
const updatingGraph = ref(false);
let currentSimulationUpdate = federatedVotingStore.simulationUpdate;
const messageDuration = computed(
  () => federatedVotingStore.simulationStepDurationInSeconds * 0.8,
);
const width = ref(800);
const heightRef = ref(500);

const nodes = ref<Node[]>([]);
const links = ref<Link[]>([]);

const messages = computed(() => messageService.getMessages());

const topTierNodeIds = computed(() => {
  return Array.from(federatedVotingStore.networkAnalysis.topTierNodes);
});

function updateNodesAndLinks() {
  fbasGraphService.updateNodesState(nodes.value, federatedVotingStore.nodes);
}

function updateOrCreateGraph() {
  updatingGraph.value = true;

  nodes.value = fbasGraphService.createNodes(
    federatedVotingStore.nodes,
    nodes.value,
  );

  links.value = fbasGraphService.createLinksFromNodes(nodes.value);

  fbasGraphService.updateForceSimulation(
    nodes.value,
    links.value,
    width.value,
    height,
    topTierNodeIds.value,
  );

  const updateDelay =
    federatedVotingStore.simulationStepDurationInSeconds * 0.2 * 1000;
  setTimeout(() => {
    updatingGraph.value = false;

    messageService.processMessageQueue(nodes.value, messageDuration.value);
  }, updateDelay);
}

function handleAnimationEnd(id: number) {
  messageService.removeMessage(id);
}

watch(
  [
    () => federatedVotingStore.simulationUpdate,
    () => federatedVotingStore.nodes,
  ],
  () => {
    const hasStructuralChange = true;

    if (currentSimulationUpdate !== federatedVotingStore.simulationUpdate) {
      currentSimulationUpdate = federatedVotingStore.simulationUpdate;
      federatedVotingStore.getLatestEvents().forEach((event) => {
        if (event instanceof MessageSent) {
          messageService.handleMessageEvent(event);
        }
      });
    }

    if (hasStructuralChange) {
      updateOrCreateGraph();
    } else {
      updateNodesAndLinks();
    }
  },
  { deep: true },
);

function handleMouseOver(node: Node) {
  hoveredNode.value = node;
  links.value.forEach((link) => {
    if (link.source === node) {
      link.hovered = true;
    }
  });
}

function handleMouseOut(node: Node) {
  hoveredNode.value = null;
  links.value.forEach((link) => {
    link.hovered = false;
  });
}

const topTierHullPath = computed(() => {
  const topTierNodes = nodes.value.filter((node) =>
    topTierNodeIds.value.includes(node.id),
  );
  if (topTierNodes.length < 3) return null;

  const points = topTierNodes.map(
    (d) => [d.x ?? 0, d.y ?? 0] as [number, number],
  );
  const hull = polygonHull(points);
  if (!hull) return null;

  const valueLine = line()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(curveCatmullRomClosed);

  return valueLine(hull);
});

function updateDimensions() {
  if (svgRef.value) {
    width.value = svgRef.value.clientWidth;
    heightRef.value = svgRef.value.clientHeight;
  }
}

onMounted(() => {
  updateDimensions();
  updateOrCreateGraph();
});
</script>

<style scoped>
.legend {
  display: flex;
  gap: 16px;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid;
}

.legend-color.intact-node {
  background-color: white;
  border-color: #28a745;
}

.legend-color.ill-behaved-node {
  background-color: white;
  border-color: #dc3545;
}

.legend-color.befouled-node {
  background-color: white;
  border-color: #ffa500;
}

.legend-color.accepted-node {
  background-color: #1f77b4;
  border-color: #1f77b4;
}

.legend-color.confirmed-node {
  background-color: #28a745;
  border-color: #28a745;
}

.animation-layer {
  pointer-events: none;
}

.graph {
  cursor: grab;
  background: white;
  position: relative;
}

/* Hull layer */
.hull-layer path {
  pointer-events: none;
}

.badge {
  background-color: #28a745;
  color: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
