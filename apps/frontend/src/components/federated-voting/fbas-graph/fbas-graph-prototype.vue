<template>
  <div class="card">
    <div class="card-header">
      <BreadCrumbs />
      <span class="badge ms-2">Quorum Intersection</span>
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
  </div>
</template>

<script setup lang="ts">
import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import { polygonHull } from "d3-polygon"; // Import the polygonHull function
import { ref, onMounted, watch, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./fbas-graph-node.vue";
import FbasGraphLink, { Link } from "./fbas-graph-link.vue";
import { MessageSent, OverlayEvent, ProtocolEvent } from "scp-simulation";
import AnimatedMessage from "./animated-message.vue";
import { usePanning } from "./usePanning";
import BreadCrumbs from "../bread-crumbs.vue";
import { curveCatmullRomClosed, line } from "d3-shape";

const { translateX, translateY, scale, startPan, pan, endPan, zoom } =
  usePanning();

const height = 500;
const svgRef = ref<SVGSVGElement | null>(null);

const hoveredNode = ref<Node | null>(null);

const messages = ref<
  Array<{
    id: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    duration: number;
  }>
>([]);
let messageCounter = 0;

const nodes = ref<Node[]>([]);
const links = ref<Link[]>([]);

const topTierNodeIds = computed(() => {
  return Array.from(federatedVotingStore.trustGraph.networkTransitiveQuorumSet);
});

function animateMessage(source: Node, target: Node) {
  messages.value.push({
    id: messageCounter++,
    startX: source.x ?? 0,
    startY: source.y ?? 0,
    endX: target.x ?? 0,
    endY: target.y ?? 0,
    duration: federatedVotingStore.simulationStepDurationInSeconds,
  });
}

const updateNodesAndLinks = () => {
  nodes.value.forEach((node) => {
    const state = federatedVotingStore.protocolContextState.protocolStates.find(
      (state) => state.node.publicKey === node.id,
    );
    if (state) {
      node.vote = state.voted ? state.voted.toString() : null;
      node.accept = state.accepted ? state.accepted.toString() : null;
      node.confirm = state.confirmed ? state.confirmed.toString() : null;
      node.events = federatedVotingStore.simulation
        .getLatestEvents()
        .filter((event) => {
          return (
            (event instanceof ProtocolEvent || event instanceof OverlayEvent) &&
            event.publicKey === node.id
          );
        }) as (ProtocolEvent | OverlayEvent)[];
    }
  });
};

const createNodesAndLinks = () => {
  nodes.value = federatedVotingStore.protocolContextState.protocolStates.map(
    (state) => {
      return {
        id: state.node.publicKey,
        validators: state.node.quorumSet.validators,
        threshold: state.node.quorumSet.threshold,
        vote: state.voted ? state.voted.toString() : null,
        accept: state.accepted ? state.accepted.toString() : null,
        confirm: state.confirmed ? state.confirmed.toString() : null,
        x: 0,
        y: 0,
        events: [],
      };
    },
  );

  links.value = (() => {
    const constructedLinks: Link[] = [];
    nodes.value.forEach((node) => {
      node.validators?.forEach((validator) => {
        constructedLinks.push({
          source: node.id,
          target: validator,
          selfLoop: validator === node.id,
          hovered: false,
        });
      });
    });

    // Identify bidirectional links
    const linkMap = new Map<string, Link>();
    const linkKey = (link: Link) => {
      const sourceId = (link.source as Node).id;
      const targetId = (link.target as Node).id;
      return `${sourceId}-${targetId}`;
    };

    constructedLinks.forEach((link) => linkMap.set(linkKey(link), link));
    constructedLinks.forEach((link) => {
      const reverseKey = linkKey({
        source: link.target,
        target: link.source,
      } as Link);
      if (linkMap.has(reverseKey)) {
        if (link.source !== link.target) {
          link.bidirectional = true;
          linkMap.get(reverseKey)!.bidirectional = true;
        }
      } else {
        link.bidirectional = false;
      }
    });

    return constructedLinks;
  })();
};

const events = computed(() => {
  return federatedVotingStore.simulation.getLatestEvents();
});

watch(events, (newEvents) => {
  messages.value = [];
  newEvents.forEach((event) => {
    if (event instanceof MessageSent) {
      const sourceNode = nodes.value.find((n) => n.id === event.message.sender);
      const targetNode = nodes.value.find(
        (n) => n.id === event.message.receiver,
      );
      if (sourceNode && targetNode) {
        animateMessage(sourceNode, targetNode);
      }
    }
  });
});

watch(
  () => federatedVotingStore.protocolContext,
  () => {
    updateNodesAndLinks();
  },
  { deep: true },
);

onMounted(() => {
  updateDimensions();
  createNodesAndLinks();
  forceSimulation<Node>(nodes.value)
    .force(
      "link",
      forceLink<Node, Link>(links.value)
        .id((node: Node) => node.id)
        .distance(150),
    )
    .force("charge", forceManyBody().strength(-2000))
    .force("center", forceCenter(width.value / 2, height / 2))
    .force(
      "topTierX",
      forceX<Node>(width.value / 2).strength((node) =>
        topTierNodeIds.value.includes(node.id) ? 0.2 : 0,
      ),
    )
    .force(
      "topTierY",
      forceY<Node>(height / 2).strength((node) =>
        topTierNodeIds.value.includes(node.id) ? 0.2 : 0,
      ),
    );
});

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

// Compute hull path for top-tier nodes
const topTierHullPath = computed(() => {
  const topTierNodes = nodes.value.filter((node) =>
    topTierNodeIds.value.includes(node.id),
  );
  // We need at least 3 points to form a hull
  if (topTierNodes.length < 3) return null;

  const points: [number, number][] = topTierNodes.map(
    (d) => [d.x ?? 0, d.y ?? 0] as [number, number],
  );
  const hull = polygonHull(points);
  if (!hull) return null;

  const valueLine = line()
    .x(function (d) {
      return d[0];
    })
    .y(function (d) {
      return d[1];
    })
    .curve(curveCatmullRomClosed); //we want a smooth line

  return valueLine(hull);
});

// Helper function to get SVG width and height
const width = ref(800); // Set initial width
const heightRef = ref(500); // Set initial height

function updateDimensions() {
  if (svgRef.value) {
    width.value = svgRef.value.clientWidth;
    heightRef.value = svgRef.value.clientHeight;
  }
}
</script>

<style scoped>
.animation-layer {
  pointer-events: none;
}

.graph {
  cursor: grab;
  background: white;
}

/* Optional styling adjustments for hull */
.hull-layer path {
  pointer-events: none; /* Hull should not interfere with node interactions */
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
