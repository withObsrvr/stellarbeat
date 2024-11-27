<template>
  <div class="card h-100">
    <div class="card-body">
      <div class="title d-flex align-items-baseline border-bottom pb-2 mb-2">
        Selected Node Info
      </div>
      <div v-if="selectedNode">
        <p><strong>Public Key:</strong> {{ selectedNode.publicKey }}</p>
        <p><strong>Phase:</strong> {{ selectedNodePhase }}</p>
      </div>
      <div v-else>
        <p>No node selected.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { Node } from "shared";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return federatedVotingStore.network.getNodeByPublicKey(
    selectedNodeId.value,
  ) as Node | null;
});

const selectedNodePhase = computed(() => {
  const protocolState =
    federatedVotingStore.protocolContextState.protocolStates.find(
      (state) => state.node.publicKey === selectedNodeId.value,
    );
  return protocolState ? protocolState.phase : "unknown";
});
</script>

<style scoped>
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}
</style>
