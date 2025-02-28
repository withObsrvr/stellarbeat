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
        accepted: hasAccepted,
        confirmed: hasConfirmed,
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

const nodeObject = computed(() =>
  federatedVotingStore.nodes.find((node) => node.publicKey === props.nodeId),
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

const hasConfirmed = computed(() => !!nodeObject.value?.confirmed);
const hasAccepted = computed(
  () => !!nodeObject.value?.accepted && !hasConfirmed.value,
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
  padding: 2px 4px;
  border: 3px solid #a9a9a9;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #a9a9a9; /* Changed to dark gray */
  color: #ffffff; /* Changed to white */
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.node:hover {
  background-color: #888888; /* Darker gray on hover */
}

.node.selected {
  cursor: default;
}

.node.accepted {
  background-color: #1f77b4;
  border-color: #1f77b4;
  color: white;
}

.node.confirmed {
  background-color: #2ca02c;
  border-color: #2ca02c;
  color: white;
}

.ill-behaved {
  border-color: #ff0000 !important;
}

.befouled {
  border-color: #ffa500 !important; /* Use important to ensure this takes priority */
}
</style>
