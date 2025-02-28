<template>
  <span
    class="node clickable"
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
  emit("select", props.nodeId);
}
</script>

<style scoped>
.node {
  display: inline-block;
  padding: 3px 6px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #f9f9f9;
  color: #212529;
  cursor: pointer;
}

.intact {
  background-color: #28a745;
  color: #fff;
}

.ill-behaved {
  background-color: #dc3545;
  color: #fff;
}

.befouled {
  background-color: #ffc107;
  color: #fff;
}
</style>
