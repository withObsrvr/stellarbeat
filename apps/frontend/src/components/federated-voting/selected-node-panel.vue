<template>
  <div class="card h-100">
    <div class="card-body">
      <div class="title d-flex align-items-baseline border-bottom pb-2 mb-2">
        Selected Node Info
      </div>
      <div v-if="selectedNodeId">
        <p><strong>Public Key:</strong> {{ selectedNodeId }}</p>
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

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

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
