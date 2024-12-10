<template>
  <g
    :transform="transform"
    style="cursor: grab"
    @mouseover="emit('mouseover', $event, node)"
    @mouseout="emit('mouseout', $event, node)"
  >
    <circle
      :r="getNodeRadius"
      :fill="nodeFillColor"
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
        node.threshold && node.validators
          ? `${node.threshold}/${node.validators.length}`
          : ""
      }}
    </text>
  </g>
</template>

<script setup lang="ts">
import { SimulationNodeDatum } from "d3-force";
import { computed, PropType, defineEmits } from "vue";

export interface Node extends SimulationNodeDatum {
  id: string;
  validators?: readonly string[];
  threshold?: number;
  vote: boolean;
  accept: boolean;
  confirm: boolean;
  fx?: number | null;
  fy?: number | null;
}

const emit = defineEmits(["mouseover", "mouseout"]);

const transform = computed(() => {
  return `translate(${props.node.x}, ${props.node.y})`;
});

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
});

const getNodeRadius = computed(() => {
  const nameLength = props.node.id.length;
  const thresholdTextLength =
    props.node.threshold && props.node.validators
      ? `${props.node.threshold}/${props.node.validators.length}`.length
      : 0;
  const maxLabelLength = Math.max(nameLength, thresholdTextLength);
  const baseRadius = 20;
  const extraRadius = maxLabelLength * 3;
  const lineHeight = 14;
  const totalHeight = lineHeight * 2;
  return Math.max(baseRadius + extraRadius, totalHeight);
});

const nodeFillColor = computed(() => {
  if (props.node.confirm) {
    return "#2ca02c"; // Green if confirmed
  } else if (props.node.accept) {
    return "#1f77b4"; // Blue if accepted a value
  } else {
    return "#A9A9A9"; // Dark gray if only voted
  }
});
</script>
