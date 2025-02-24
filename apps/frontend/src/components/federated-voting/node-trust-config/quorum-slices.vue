<template>
  <ul class="slices-list">
    <li v-for="(slice, index) in quorumSlices" :key="index" class="slice">
      <span
        v-for="(nodeId, nodeIndex) in slice"
        :key="nodeId"
        class="node"
        :class="{ 'node-self': nodeIndex === 0 }"
      >
        {{ nodeId }}
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Node } from "scp-simulation";
import { findSubSetsOfSize } from "@/components/federated-voting/analysis/Sets";

const props = defineProps<{
  node: Node;
}>();
const quorumSlices = computed(() => {
  const validators = props.node.quorumSet.validators;
  const threshold = props.node.quorumSet.threshold;

  return Array.from(findSubSetsOfSize(new Set(validators), threshold)).map(
    (slice) => {
      slice.add(props.node.publicKey);
      const sliceArray = Array.from(slice);
      const nodeIndex = sliceArray.indexOf(props.node.publicKey);
      if (nodeIndex > 0) {
        // Move node's key to front
        sliceArray.splice(nodeIndex, 1);
        sliceArray.unshift(props.node.publicKey);
      }
      return sliceArray;
    },
  );
});
</script>

<style scoped>
.slices-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.slice {
  padding: 0.5rem;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.slice:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.node {
  display: inline-block;
  padding: 3px 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #f9f9f9;
  color: #212529;
  box-sizing: border-box;
}

.node-self {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
}

h3 {
  margin-bottom: 1rem;
  font-size: 1.1rem;
}
</style>
