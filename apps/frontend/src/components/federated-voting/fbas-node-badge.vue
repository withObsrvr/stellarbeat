<template>
  <span
    class="node clickable"
    role="link"
    :class="[
      {
        intact: isIntact,
        'ill-behaved': isIllBehaved,
        befouled: isBefouled,
        selected: isSelected,
        main: isMain,
      },
      $attrs.class,
    ]"
    @click="handleClick"
    @mouseover="$emit('mouseover', $event)"
    @mouseleave="$emit('mouseleave', $event)"
  >
    {{ nodeId }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const props = defineProps<{
  nodeId: string;
  isMain?: boolean;
}>();

const emit = defineEmits(["select", "mouseover", "mouseleave"]);

const intactNodes = computed(() => federatedVotingStore.intactNodes);
const illBehavedNodes = computed(() => federatedVotingStore.illBehavedNodes);
const allNodes = computed(() =>
  federatedVotingStore.nodes.map((node) => node.publicKey),
);

const isIntact = computed(() => intactNodes.value.includes(props.nodeId));
const isIllBehaved = computed(() =>
  illBehavedNodes.value.includes(props.nodeId),
);
const isBefouled = computed(
  () =>
    allNodes.value.includes(props.nodeId) &&
    !isIntact.value &&
    !isIllBehaved.value,
);
const isSelected = computed(
  () => federatedVotingStore.selectedNodeId === props.nodeId,
);

function handleClick() {
  if (!isSelected.value) {
    emit("select", props.nodeId);
  }
}
</script>

<style scoped>
.node {
  display: inline-block;
  padding: 3px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #f9f9f9;
  color: #212529;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.node:hover {
  background-color: #e9e9e9;
}

.node.selected {
  background-color: #e9e9e9;
  cursor: default;
}

.ill-behaved {
  background-color: #dc3545;
  color: #fff;
}

.ill-behaved:hover,
.ill-behaved.selected {
  background-color: #c82333;
}

.befouled {
  background-color: #ffa500;
  color: #fff;
}

.befouled:hover,
.befouled.selected {
  background-color: #e69400;
}
</style>
