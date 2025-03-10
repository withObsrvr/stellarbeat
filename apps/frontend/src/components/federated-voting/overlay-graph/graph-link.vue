<template>
  <line
    class="link"
    :class="{ 'link-hovered': isHovered }"
    :x1="link.source.x"
    :y1="link.source.y"
    :x2="link.target.x"
    :y2="link.target.y"
    @mouseover="handleLinkMouseOver"
    @mouseleave="handleLinkMouseLeave"
    @click.stop="$emit('click', $event, link)"
  />
</template>

<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { LinkDatum } from "./GraphManager";

const props = defineProps<{
  link: LinkDatum;
  hoverDisabled?: boolean;
}>();

defineEmits(["click"]);

const isHovered = ref(false);

// Add handlers for link hover
const handleLinkMouseOver = () => {
  if (props.hoverDisabled) return;
  isHovered.value = true;
};

const handleLinkMouseLeave = () => {
  isHovered.value = false;
};
</script>

<style scoped>
.link {
  stroke: #1687b2;
  stroke-width: 3px;
}

.link-hovered {
  stroke-width: 5px;
  cursor: pointer;
}
</style>
