<template>
  <div class="card">
    <div class="card-header">
      <div class="card-header-content">
        <BreadCrumbs :root="'Trust Graph'" />
        <NetworkAnalysisBadges />
      </div>
      <button
        class="btn btn-sm btn-secondary ml-3"
        type="button"
        title="Show graph information"
        @click="showInfo"
      >
        <BIconInfoCircle class="text-muted" />
      </button>
    </div>
    <div class="card-body graph pt-4 pb-0" style="height: 500px">
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
          <g class="animation-layer">
            <AnimatedMessage
              v-for="message in messageAnimations"
              :key="message.id"
              :start-x="message.startX"
              :start-y="message.startY"
              :end-x="message.endX"
              :end-y="message.endY"
              :duration="message.duration"
              :is-forged="message.isForged"
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
      <div class="jlex-footer justify-content-center">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { polygonHull } from "d3-polygon";
import {
  FederatedNode,
  federatedVotingStore,
} from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./trust-graph-node.vue";
import FbasGraphLink, { Link } from "./trust-graph-link.vue";
import AnimatedMessage from "./animated-message.vue";
import { usePanning } from "./usePanning";
import BreadCrumbs from "../bread-crumbs.vue";
import { curveCatmullRomClosed, line } from "d3-shape";
import fbasGraphService from "./TrustGraphService";
import messageService, { MessageAnimation } from "./MessageService";
import { ProtocolEvent } from "scp-simulation";
import { BIconInfoCircle } from "bootstrap-vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import FbasGraphInfo from "./trust-graph-info.vue";
import NetworkAnalysisBadges from "../network-analysis-badges.vue";

const { translateX, translateY, scale, startPan, pan, endPan, zoom } =
  usePanning();
const height = 500;
const svgRef = ref<SVGSVGElement | null>(null);
const hoveredNode = ref<Node | null>(null);
let currentSimulationUpdate = federatedVotingStore.simulationUpdate;
let currentNetworkStructureUpdate = federatedVotingStore.networkStructureUpdate;
const messageSendDuration = computed(
  () => federatedVotingStore.simulationStepDurationInSeconds * 0.8 * 1000,
);
const width = ref(800);
const heightRef = ref(500);

const nodes = ref<Node[]>([]);
const links = ref<Link[]>([]);

const messageAnimations = ref<MessageAnimation[]>([]);

const topTierNodeIds = computed(() => {
  return Array.from(federatedVotingStore.networkAnalysis.topTierNodes);
});

const repellingForce = ref(1000); // Default value from FbasGraphService

watch(
  [
    () => federatedVotingStore.simulationUpdate,
    () => federatedVotingStore.networkStructureUpdate,
  ],
  () => {
    messageAnimations.value = [];
    if (currentSimulationUpdate !== federatedVotingStore.simulationUpdate) {
      currentSimulationUpdate = federatedVotingStore.simulationUpdate;
      if (federatedVotingStore.latestSimulationStepWentForwards) {
        messageAnimations.value = messageService.createMessageAnimations(
          federatedVotingStore.getLatestEvents(),
          nodes.value,
          messageSendDuration.value,
        );
      }
    }

    if (
      currentNetworkStructureUpdate !==
      federatedVotingStore.networkStructureUpdate
    ) {
      currentNetworkStructureUpdate =
        federatedVotingStore.networkStructureUpdate;
      setTimeout(
        () => {
          messageAnimations.value = [];
          updateOrCreateGraph();
        },
        messageAnimations.value.length > 0 ? messageSendDuration.value : 0,
      );
    } else {
      updateNodeStates(); //node states are not previewed and thus do not need a delay
    }
  },
);

watch(
  () => federatedVotingStore.selectedNodeId,
  () => {
    updateNodeStates();
  },
);

function updateNodeStates() {
  fbasGraphService.updateNodeStates(
    nodes.value,
    federatedVotingStore.nodes,
    federatedVotingStore.selectedNode.value as FederatedNode | null,
    federatedVotingStore
      .getLatestEvents()
      .filter((event) => event instanceof ProtocolEvent),
  );
}

function updateOrCreateGraph() {
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
    repellingForce.value, // Pass the repelling force value
  );
}

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

function updateRepellingForce() {
  if (nodes.value.length > 0) {
    fbasGraphService.updateRepellingForce(repellingForce.value);
  }
}

function showInfo() {
  infoBoxStore.show(FbasGraphInfo);
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
  flex-wrap: wrap;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.flex-footer {
  display: flex;
}
.card-header-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
