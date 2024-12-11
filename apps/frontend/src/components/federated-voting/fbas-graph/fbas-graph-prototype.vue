<template>
  <div class="card graph">
    <div class="card-header">
      <h4 class="card-title">FBAS</h4>
    </div>
    <div class="card-body pt-4 pb-0" style="height: 500px">
      <svg ref="svgRef" width="100%" height="100%">
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
            :center-x="width() / 2"
            :center-y="height / 2"
          />
        </g>

        <g class="nodes">
          <FbasGraphNode
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            @mouseover="handleMouseOver($event, node)"
            @mouseout="handleMouseOut($event, node)"
          />
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
import { ref, onMounted, Ref, watch, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./fbas-graph-node.vue";
import FbasGraphLink, { Link } from "./fbas-graph-link.vue";
import { MessageSent, OverlayEvent, ProtocolEvent } from "scp-simulation";
import AnimatedMessage from "./animated-message.vue";

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

const nodes: Ref<Node[]> = ref([]);
const links: Ref<Link[]> = ref([]);

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
          hoovered: false,
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

watch(federatedVotingStore.protocolContext, () => {
  updateNodesAndLinks();
});

onMounted(() => {
  createNodesAndLinks();
  forceSimulation<Node>(nodes.value)
    .force(
      "link",
      forceLink<Node, Link>(links.value)
        .id((node: Node) => node.id)
        .distance(150),
    )
    .force("charge", forceManyBody().strength(-500))
    .force("center", forceCenter(width() / 2, height / 2));
});

function handleMouseOver(event: MouseEvent, node: Node) {
  hoveredNode.value = node;

  links.value.forEach((link) => {
    if (link.source === node) {
      link.hoovered = true;
    }
  });
}
function handleMouseOut(event: MouseEvent, node: Node) {
  links.value.forEach((link) => {
    link.hoovered = false;
  });
}

function width() {
  return (svgRef.value as SVGElement).clientWidth;
}
</script>

<style scoped>
.animation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
