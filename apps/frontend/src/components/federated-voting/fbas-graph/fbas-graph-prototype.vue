<template>
  <div class="card graph">
    <div class="card-header">
      <h4 class="card-title">QuorumSet Connections</h4>
    </div>
    <div class="card-body pt-4 pb-0" style="height: 400px">
      <svg ref="svgRef" width="100%" height="100%">
        <g class="links">
          <g v-for="(link, i) in links" :key="i" class="link-group">
            <path
              :class="['link', { 'self-loop': link.selfLoop }]"
              fill="none"
              :stroke="linkStrokeColor(link)"
              :stroke-width="isHoveredLink(link) ? 6 : 3"
              stroke-opacity="0.9"
              :d="link.selfLoop ? selfLoopPath(link) : linkPath(link)"
            ></path>
            <path
              class="arrowhead"
              d="M -7,-7 L 7,0 L -7,7 Z"
              :fill="linkStrokeColor(link)"
              :transform="arrowTransform(link, link.selfLoop ?? false)"
            ></path>
          </g>
        </g>

        <g class="nodes">
          <FbasGraphNode
            v-for="node in nodes"
            :key="node.id"
            :node="node"
            :handleMouseOver="handleMouseOver"
            :handleMouseOut="handleMouseOut"
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
  SimulationLinkDatum,
} from "d3-force";
import { ref, onMounted, Ref, nextTick, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasGraphNode, { Node } from "./fbas-graph-node.vue";

interface Link extends SimulationLinkDatum<Node> {
  bidirectional?: boolean;
  selfLoop?: boolean;
}

const height = 400;
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
      node.vote = state.voted ? true : false;
      node.accept = state.accepted ? true : false;
      node.confirm = state.confirmed ? true : false;
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
        vote: state.voted ? true : false,
        accept: state.accepted ? true : false,
        confirm: state.confirmed ? true : false,
        x: 0,
        y: 0,
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

function linkStrokeColor(link: Link): string {
  const targetNode = link.target as Node;
  if (!targetNode) return "#A9A9A9";
  if (targetNode.confirm) {
    return "#2ca02c"; // Green
  } else if (targetNode.accept) {
    return "#1f77b4"; // Blue
  } else {
    return "#A9A9A9"; // Dark gray
  }
}

function linkPath(link: Link) {
  const sourceNode = link.source as Node;
  const targetNode = link.target as Node;

  if (
    !sourceNode ||
    !targetNode ||
    sourceNode.x == null ||
    sourceNode.y == null ||
    targetNode.x == null ||
    targetNode.y == null
  ) {
    return "";
  }

  const sx = sourceNode.x;
  const sy = sourceNode.y;
  const tx = targetNode.x;
  const ty = targetNode.y;

  if (link.bidirectional) {
    const dx = tx - sx;
    const dy = ty - sy;
    const dr = Math.sqrt(dx * dx + dy * dy) * 2;
    return `M${sx},${sy} A${dr},${dr} 0 0,1 ${tx},${ty}`;
  } else {
    return `M${sx},${sy} L${tx},${ty}`;
  }
}

function selfLoopPath(link: Link) {
  const sourceNode = link.source as Node;
  if (!sourceNode || sourceNode.x == null || sourceNode.y == null) {
    return "";
  }

  const sx = sourceNode.x;
  const sy = sourceNode.y;
  const pathRadius = 40;
  const centerX = width() / 2;
  const centerY = height / 2;
  const dx = sx - centerX;
  const dy = sy - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy) || 1;
  const offsetDistance = 20;
  const nx = dx / distance;
  const ny = dy / distance;

  const x = sx + nx * offsetDistance;
  const y = sy + ny * offsetDistance;
  const dx1 = -pathRadius * 2 * ny;
  const dy1 = pathRadius * 2 * nx;
  const dx2 = pathRadius * 2 * ny;
  const dy2 = -pathRadius * 2 * nx;

  return `
    M ${x} ${y}
    a ${pathRadius} ${pathRadius} 0 1 1 ${dx1} ${dy1}
    a ${pathRadius} ${pathRadius} 0 1 1 ${dx2} ${dy2}
  `;
}

function arrowTransform(link: Link, isSelfLoop: boolean) {
  const pathD = isSelfLoop ? selfLoopPath(link) : linkPath(link);
  if (!pathD || !svgRef.value) return "";

  const pathDummy = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  pathDummy.setAttribute("d", pathD);
  const totalLength = pathDummy.getTotalLength();
  if (totalLength <= 0) return "";

  const lengthAt = isSelfLoop ? totalLength * 0.25 : totalLength / 2;
  const epsilon = 1;
  const before = pathDummy.getPointAtLength(lengthAt - epsilon);
  const after = pathDummy.getPointAtLength(lengthAt + epsilon);

  const angle =
    Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
  const point = pathDummy.getPointAtLength(lengthAt);
  return `translate(${point.x},${point.y}) rotate(${angle})`;
}

function handleMouseOver(event: MouseEvent, node: Node) {
  hoveredNode.value = node;
  const currentTarget = event.currentTarget as SVGGElement;
  if (currentTarget && currentTarget.parentNode) {
    currentTarget.parentNode.appendChild(currentTarget);
  }
}
function handleMouseOut(event: MouseEvent, node: Node) {
  hoveredNode.value = null;
}

function isHoveredLink(link: Link): boolean {
  if (!hoveredNode.value) return false;
  return (link.source as Node).id === hoveredNode.value.id;
}

function width() {
  return (svgRef.value as SVGElement).clientWidth;
}
</script>

<style scoped>
.link {
  stroke-opacity: 0.9;
}

.node-label.name {
  font-size: 12px;
}

.node-label.threshold {
  font-size: 12px;
}

.link-group {
  pointer-events: none;
}
</style>
