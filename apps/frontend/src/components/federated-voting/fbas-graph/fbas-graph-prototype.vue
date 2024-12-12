<template>
  <div class="card">
    <div
      class="card-body graph pt-4 pb-0"
      style="height: 500px; overflow: hidden; position: relative"
    >
      <BreadCrumbs class="breadcrumbs" />
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
        @touchmove="pan"
        @touchend="endPan"
      >
        <g
          :transform="`translate(${translateX}, ${translateY}) scale(${scale})`"
        >
          <g class="animation-layer">
            <AnimatedMessage
              v-for="message in messages"
              :key="message.id"
              :startX="message.startX"
              :startY="message.startY"
              :endX="message.endX"
              :endY="message.endY"
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
} from "d3-force";
import { ref, onMounted, Ref, watch, computed, onBeforeUnmount } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./fbas-graph-node.vue";
import FbasGraphLink, { Link } from "./fbas-graph-link.vue";
import { MessageSent, OverlayEvent, ProtocolEvent } from "scp-simulation";
import AnimatedMessage from "./animated-message.vue";
import { usePanning } from "./usePanning";
import BreadCrumbs from "../bread-crumbs.vue";

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

const nodes: Ref<Node[]> = ref([]);
const links: Ref<Link[]> = ref([]);

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
    const links: Link[] = [];
    nodes.value.forEach((node) => {
      node.validators?.forEach((validator) => {
        links.push({
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

    links.forEach((link) => linkMap.set(linkKey(link), link));
    links.forEach((link) => {
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

    return links;
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
    .force("charge", forceManyBody().strength(-500))
    .force("center", forceCenter(width.value / 2, height / 2));
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

.breadcrumbs {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10; /* Ensure it floats above the SVG */
  background: rgba(
    255,
    255,
    255,
    0.8
  ); /* Optional: semi-transparent background */
  padding: 5px 10px;
  border-radius: 4px;
}
</style>
