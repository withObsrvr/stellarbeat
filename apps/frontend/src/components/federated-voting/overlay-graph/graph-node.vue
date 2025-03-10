<template>
  <g
    :transform="getNodeTransform(node)"
    class="node-container"
    :class="hoveredClass"
    @click="$emit('click', node)"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <circle :class="circleClassName" r="6"></circle>
    <g>
      <rect
        :class="rectClassName"
        :width="getLabelWidth(node.name, 10) + 'px'"
        height="13px"
        y="10"
        :x="getLabelX(node.name, 10)"
        rx="2"
      ></rect>
      <text color="#1687b2" :class="rectLabelClassName" y="5" dy="1.3em">
        {{ truncate(node.name, 10) }}
        <title>{{ node.name }}</title>
      </text>
    </g>
  </g>
</template>
<script setup lang="ts">
import { useTruncate } from "@/composables/useTruncate";
import useGraph from "@/composables/useGraph";
import { type NodeDatum } from "@/components/federated-voting/overlay-graph/GraphManager";
import { type PropType, toRefs, computed, ref } from "vue";

const truncate = useTruncate();
const { getLabelX, getLabelWidth, getNodeTransform } = useGraph();

const props = defineProps({
  node: {
    type: Object as PropType<NodeDatum>,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  hoverDisabled: {
    type: Boolean,
    default: false,
  },
});

const isHovered = ref(false);
const handleMouseOver = () => {
  if (props.hoverDisabled) return;
  isHovered.value = true;
};
const handleMouseOut = () => {
  isHovered.value = false;
};

const hoveredClass = computed(() => {
  return isHovered.value ? "hovered" : "";
});

const { node, selected } = toRefs(props);

const circleClassName = computed(() => {
  if (selected.value) return "node-selected";
  return "node";
});
const rectClassName = computed(() => {
  if (selected.value) return "rect-selected";
  return "rect";
});
const rectLabelClassName = computed(() => {
  if (selected.value) return "rect-label-selected";
  return "rect-label";
});
</script>

<style lang="scss" scoped>
@import "@/assets/variables";

.node {
  fill: #1687b2;
  stroke: #fff;
  stroke-width: 2px;
}
.node-selected {
  r: 10px;
  stroke-width: 2px;
  fill: #1687b2;
  stroke: $yellow;
}

.rect {
  fill: white;
  opacity: 0.9;
}

.rect-label {
  font-size: 12px;
  text-anchor: middle;
  font-weight: 400;
  fill: #1687b2;
}

.rect-selected {
  fill: white;
  opacity: 0.9;
  stroke: yellow;
  stroke-width: 1.5;
}

.rect-label-selected {
  font-size: 12px;
  text-anchor: middle;
  font-weight: 400;
  fill: #1687b2;
  text-transform: lowercase;
}

.hovered circle {
  r: 10px !important;
  cursor: pointer;
}
</style>
