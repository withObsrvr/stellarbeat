<template>
  <div class="card graph">
    <div class="card-header">
      <h4 class="card-title">FBAS</h4>
    </div>
    <div class="card-body pt-4 pb-0" style="height: 500px">
      <svg ref="svgRef" width="100%" height="100%">
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
import { ref, onMounted, Ref, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./fbas-graph-node.vue";
import FbasGraphLink, { Link } from "./fbas-graph-link.vue";
import { OverlayEvent, ProtocolEvent } from "scp-simulation";

const height = 500;
const svgRef = ref<SVGSVGElement | null>(null);
const hoveredNode = ref<Node | null>(null);

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
        .distance(200), //todo: handle distance for selfloops
    )
    .force("charge", forceManyBody().strength(-2000))
    .force("center", forceCenter(width() / 2, height / 2));
});

function handleMouseOver(event: MouseEvent, node: Node) {
  hoveredNode.value = node;

  links.value.forEach((link) => {
    if (link.source === node) {
      console.log("TRUE");
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

<style scoped></style>
