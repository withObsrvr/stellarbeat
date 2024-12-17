<template>
  <div v-if="!federatedVotingStore.selectedNodeId" class="card">
    <div
      class="pt-3 px-3 card-header d-flex justify-content-between align-items-center"
    >
      <BreadCrumbs root="Federated Voting Status" />
      <div class="d-flex align-items-center">
        <span v-if="consensusReached" class="badge consensus ms-2">
          Consensus Reached
        </span>
        <span v-else-if="isStuck" class="badge stuck ms-2"> Vote Stuck </span>
      </div>
    </div>
    <div class="card-body p-0">
      <EventLog style="height: 250px" />
      <Actions style="height: 250px" />
    </div>
  </div>
  <div v-else class="card-body p-0">
    <SelectedNodePanel
      :selected-node-id="federatedVotingStore.selectedNodeId"
    />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import SelectedNodePanel from "./selected-nodes-panel/selected-node-panel.vue";
import EventLog from "./simulation-control/event-log.vue";
import Actions from "./simulation-control/actions.vue";
import BreadCrumbs from "./bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const consensusReached = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.every(
    (state) => state.confirmed,
  );
});

const hasNoNextMoves = computed(() => {
  return !federatedVotingStore.simulation.hasNextStep();
});

const isStuck = computed(() => {
  return hasNoNextMoves.value && !consensusReached.value;
});
</script>

<style scoped>
.consensus {
  background-color: var(--bs-success);
  color: white;
}

.stuck {
  background-color: var(--bs-warning);
  color: black;
}
</style>
