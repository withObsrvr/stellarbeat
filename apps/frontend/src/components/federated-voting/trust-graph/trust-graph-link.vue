<template>
  <g class="link-group">
    <path
      :class="['link', { 'self-loop': link.selfLoop }]"
      fill="none"
      :stroke="linkStrokeColor"
      :stroke-width="strokeWidth"
      stroke-opacity="0.9"
      :d="path"
    ></path>
    <path
      class="arrowhead"
      d="M -5,-5 L 5,0 L -5,5 Z"
      :fill="linkStrokeColor"
      :transform="arrowTransform"
    ></path>
  </g>
</template>

<script setup lang="ts">
import { SimulationLinkDatum } from "d3-force";
import { Node } from "./trust-graph-node.vue";
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { isObject } from "shared";

export interface Link extends SimulationLinkDatum<Node> {
  bidirectional?: boolean;
  selfLoop?: boolean;
  hovered: boolean;
}

const props = defineProps<{
  link: Link;
  centerX: number;
  centerY: number;
}>();

const strokeWidth = computed(() => {
  const sourceId = isObject(props.link.source)
    ? props.link.source.id
    : props.link.source;
  return props.link.hovered || federatedVotingStore.selectedNodeId === sourceId
    ? 5
    : 2;
});

const path = computed(() => {
  return props.link.selfLoop ? selfLoopPath.value : linkPath.value;
});

const linkStrokeColor = computed(() => {
  const targetNode = props.link.target as Node;
  if (!targetNode) return "#A9A9A9";
  if (targetNode.confirm) {
    return "#2ca02c"; // Green
  } else if (targetNode.accept) {
    return "#1f77b4"; // Blue
  } else {
    return "#A9A9A9"; // Dark gray
  }
});

const linkPath = computed(() => {
  const sourceNode = props.link.source as Node;
  const targetNode = props.link.target as Node;

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

  if (props.link.bidirectional) {
    const dx = tx - sx;
    const dy = ty - sy;
    const dr = Math.sqrt(dx * dx + dy * dy) * 2;
    return `M${sx},${sy} A${dr},${dr} 0 0,1 ${tx},${ty}`;
  } else {
    return `M${sx},${sy} L${tx},${ty}`;
  }
});

const selfLoopPath = computed(() => {
  const sourceNode = props.link.source as Node;
  if (!sourceNode || sourceNode.x == null || sourceNode.y == null) {
    return "";
  }

  const sx = sourceNode.x;
  const sy = sourceNode.y;
  const pathRadius = 20;
  const dx = sx - props.centerX;
  const dy = sy - props.centerY;
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
});

const arrowTransform = computed(() => {
  const pathD = path.value;

  const pathDummy = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path",
  );
  pathDummy.setAttribute("d", pathD);
  const totalLength = pathDummy.getTotalLength();
  if (totalLength <= 0) return "";

  const lengthAt = props.link.selfLoop ? totalLength * 0.25 : totalLength / 2;
  const epsilon = 1;
  const before = pathDummy.getPointAtLength(lengthAt - epsilon);
  const after = pathDummy.getPointAtLength(lengthAt + epsilon);

  const angle =
    Math.atan2(after.y - before.y, after.x - before.x) * (180 / Math.PI);
  const point = pathDummy.getPointAtLength(lengthAt);
  return `translate(${point.x},${point.y}) rotate(${angle})`;
});
</script>

<style scoped>
.link {
  fill: none;
  cursor: pointer;
}

.link.selected {
  stroke-width: 1px;
  stroke: yellow;
}
</style>
