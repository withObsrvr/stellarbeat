<template>
  <div class="card selected-node-panel">
    <div v-if="selectedNodeId">
      <div class="header">
        <h2>{{ selectedNodeId }} Info</h2>
      </div>

      <NodeInformation :public-key="selectedNodeId" class="mb-5" />
      <ProcessedVotes />

      <!-- Quorum Set Section -->
      <div class="quorum-set">
        <h3>Quorum Set</h3>
        <quorum-set-display :quorum-set="quorumSet" :level="1" />
      </div>

      <NodeEventLog />
    </div>
    <div v-else>
      <p>No node selected.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import QuorumSetDisplay from "./quorum-set-display.vue";
import ProcessedVotes from "./processed-votes.vue";
import NodeInformation from "./node-information.vue";
import NodeEventLog from "./node-event-log.vue"; // Import the new component

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const contextState = computed(() => {
  return federatedVotingStore.protocolContextState;
});

const protocolState = computed(() => {
  return contextState.value.protocolStates.find(
    (state) => state.node.publicKey === selectedNodeId.value,
  );
});

const quorumSet = computed(() => {
  return protocolState.value ? protocolState.value.node.quorumSet : null;
});
</script>

<style scoped>
.selected-node-panel {
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin-bottom: 5px;
  font-size: 32px;
}

.header p {
  font-size: 18px;
  color: #777;
}

.me-1 {
  margin-right: 0.25rem;
}

.quorum-set {
  margin-bottom: 40px;
}
</style>
