<template>
  <div class="card graph">
    <div class="card-header">
      <h4 class="card-title">QuorumSet Connections</h4>
    </div>
    <div class="card-body pt-4 pb-0" style="height: 400px">
      <svg ref="svgRef" width="100%" height="100%">
        <g class="links">
          <g v-for="(link, i) in otherLinks" :key="i" class="link-group">
            <path
              :class="['link', { 'self-loop': false }]"
              fill="none"
              :stroke="linkStrokeColor(link)"
              :stroke-width="isHoveredLink(link) ? 6 : 3"
              stroke-opacity="0.9"
              :d="linkPath(link)"
            ></path>
            <path
              class="arrowhead"
              d="M -7,-7 L 7,0 L -7,7 Z"
              :fill="linkStrokeColor(link)"
              :transform="arrowTransform(link, false)"
            ></path>
          </g>

          <g
            v-for="(link, i) in selfLoopLinks"
            :key="'selfloop-' + i"
            class="link-group"
          >
            <path
              :class="['link', { 'self-loop': true }]"
              fill="none"
              :stroke="linkStrokeColor(link)"
              :stroke-width="isHoveredLink(link) ? 6 : 3"
              stroke-opacity="0.9"
              :d="selfLoopPath(link)"
            ></path>
            <path
              class="arrowhead"
              d="M -7,-7 L 7,0 L -7,7 Z"
              :fill="linkStrokeColor(link)"
              :transform="arrowTransform(link, true)"
            ></path>
          </g>
        </g>

        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            :transform="`translate(${node.x}, ${node.y})`"
            style="cursor: grab"
            @mouseover="handleMouseOver($event, node)"
            @mouseout="handleMouseOut($event, node)"
          >
            <circle
              :r="getNodeRadius(node)"
              :fill="nodeFillColor(node)"
              stroke="#fff"
              stroke-width="1.5"
            ></circle>
            <text
              class="node-label name"
              text-anchor="middle"
              dy="-0.3em"
              font-family="Arial, sans-serif"
              font-size="12"
              fill="#fff"
              font-weight="bold"
              pointer-events="none"
            >
              {{ node.id }}
            </text>
            <text
              class="node-label threshold"
              text-anchor="middle"
              dy="1em"
              font-family="Arial, sans-serif"
              font-size="12"
              fill="#fff"
              font-weight="bold"
              pointer-events="none"
            >
              {{
                node.threshold && node.quorumSet
                  ? `${node.threshold}/${node.quorumSet.length}`
                  : ""
              }}
            </text>
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
  forceCollide,
  SimulationNodeDatum,
  SimulationLinkDatum,
} from "d3-force";
import { ref, onMounted, nextTick, watch } from "vue";

interface Node extends SimulationNodeDatum {
  id: string;
  quorumSet?: string[];
  threshold?: number;
  vote: string;
  accept: string;
  confirm: string;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends SimulationLinkDatum<Node> {
  bidirectional?: boolean;
  selfLoop?: boolean;
}

const height = 400;
const svgRef = ref<SVGSVGElement | null>(null);

// Initial graph data
const graphNodes: Node[] = [
  {
    id: "Alice",
    quorumSet: ["Bob", "Chad", "Alice"],
    threshold: 2,
    vote: "pizza",
    accept: "pizza",
    confirm: "pizza",
  },
  {
    id: "Bob",
    quorumSet: ["Alice", "Chad", "Bob"],
    threshold: 2,
    vote: "pizza",
    accept: "pizza",
    confirm: "",
  },
  {
    id: "Chad",
    quorumSet: ["Alice", "Bob", "Chad"],
    threshold: 3,
    vote: "burger",
    accept: "",
    confirm: "",
  },
  {
    id: "Steve",
    quorumSet: ["Bob", "Chad"],
    threshold: 2,
    vote: "burger",
    accept: "",
    confirm: "",
  },
];

const graphLinks: Link[] = [];
const nodesById = new Map<string, Node>();
graphNodes.forEach((node) => nodesById.set(node.id, node));

// Create links based on quorum sets
graphNodes.forEach((node) => {
  node.quorumSet?.forEach((qsMember) => {
    if (qsMember === node.id) {
      graphLinks.push({ source: node.id, target: qsMember, selfLoop: true });
    } else {
      graphLinks.push({ source: node.id, target: qsMember });
    }
  });
});

const linkKey = (link: any) => {
  const sourceId =
    typeof link.source === "string" ? link.source : link.source.id;
  const targetId =
    typeof link.target === "string" ? link.target : link.target.id;
  return `${sourceId}-${targetId}`;
};

// Identify bidirectional links
const linkMap = new Map<string, Link>();
graphLinks.forEach((link) => linkMap.set(linkKey(link), link));
graphLinks.forEach((link) => {
  const reverseKey = linkKey({ source: link.target, target: link.source });
  if (linkMap.has(reverseKey)) {
    if (link.source !== link.target) {
      link.bidirectional = true;
      linkMap.get(reverseKey)!.bidirectional = true;
    }
  } else {
    link.bidirectional = false;
  }
});

const selfLoopArr = graphLinks.filter((link) => link.selfLoop);
const otherLinksArr = graphLinks.filter((link) => !link.selfLoop);

const nodes = ref<Node[]>(graphNodes);
const otherLinks = ref<Link[]>(otherLinksArr);
const selfLoopLinks = ref<Link[]>(selfLoopArr);

const hoveredNode = ref<Node | null>(null);

onMounted(() => {
  otherLinks.value.forEach((link) => {
    if (typeof link.source === "string")
      link.source = nodesById.get(link.source)!;
    if (typeof link.target === "string")
      link.target = nodesById.get(link.target)!;
  });
  selfLoopLinks.value.forEach((link) => {
    if (typeof link.source === "string")
      link.source = nodesById.get(link.source)!;
    link.target = link.source;
  });

  forceSimulation<Node>(nodes.value)
    .force(
      "link",
      forceLink<Node, Link>(otherLinks.value)
        .id((node: Node) => node.id)
        .distance(200),
    )
    .force("charge", forceManyBody().strength(-2000))
    .force("center", forceCenter(width() / 2, height / 2))
    .force(
      "collide",
      forceCollide<Node>().radius((node) => getNodeRadius(node) + 10),
    )
    .on("tick", () => {
      nodes.value = [...nodes.value]; //when updating to vue3, we could simply use reactive instead of refs
    });
});

function getNodeRadius(node: Node): number {
  const nameLength = node.id.length;
  const thresholdTextLength =
    node.threshold && node.quorumSet
      ? `${node.threshold}/${node.quorumSet.length}`.length
      : 0;
  const maxLabelLength = Math.max(nameLength, thresholdTextLength);
  const baseRadius = 20;
  const extraRadius = maxLabelLength * 3;
  const lineHeight = 14;
  const totalHeight = lineHeight * 2;
  return Math.max(baseRadius + extraRadius, totalHeight);
}

function nodeFillColor(node: Node): string {
  if (node.confirm) {
    return "#2ca02c"; // Green if confirmed
  } else if (node.accept) {
    return "#1f77b4"; // Blue if accepted a value
  } else {
    return "#A9A9A9"; // Dark gray if only voted
  }
}

function nodeTransform(node: Node) {
  const x = typeof node.x === "number" ? node.x : 0;
  const y = typeof node.y === "number" ? node.y : 0;
  return `translate(${x},${y})`;
}

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
