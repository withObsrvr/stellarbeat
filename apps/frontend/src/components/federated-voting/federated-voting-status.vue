<template>
  <div class="card">
    <div v-if="!federatedVotingStore.selectedNodeId">
      <div
        class="pt-3 px-3 card-header d-flex justify-content-between align-items-center"
      >
        <BreadCrumbs root="Federated Voting Status" />
        <div class="d-flex align-items-center">
          <span v-if="consensusReached" class="badge consensus ms-2">
            Consensus Reached
          </span>
          <span v-if="isNetworkSplit" class="badge badge-danger ms-2">
            Network Split
          </span>
          <span v-else-if="isStuck" class="badge badge-danger ms-2">
            Vote Stuck
          </span>
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
    <div class="card-footer">
      <div class="legend">
        <div class="legend-item">
          <span class="legend-bold">Event:</span>
          <span class="legend-description">Occurred in the past</span>
        </div>
        <div class="legend-item">
          <span class="legend-bold">Action:</span>
          <span class="legend-description">Will be executed next</span>
        </div>
      </div>
    </div>
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
  const protocolStates =
    federatedVotingStore.protocolContextState.protocolStates;

  if (!protocolStates.every((state) => state.confirmed)) {
    return false;
  }

  const confirmedValues = protocolStates
    .filter((state) => state.confirmed)
    .map((state) => state.confirmed);

  console.log(confirmedValues);
  const firstConfirmedValue = confirmedValues[0];
  return confirmedValues.every((value) => value === firstConfirmedValue);
});

const isNetworkSplit = computed(() => {
  const protocolStates =
    federatedVotingStore.protocolContextState.protocolStates;

  const confirmedStates = protocolStates.filter(
    (state) => state.confirmed !== null,
  );

  const confirmedValues = new Set(
    confirmedStates.map((state) => state.confirmed),
  );

  // If there's more than one unique value, the network is split
  return confirmedValues.size > 1;
});

const hasNoNextMoves = computed(() => {
  return !federatedVotingStore.simulation.hasNextStep();
});

const isStuck = computed(() => {
  return hasNoNextMoves.value && !consensusReached.value;
});
</script>

<style scoped>
.badge:not(:last-child) {
  margin-right: 0.5rem;
}

.consensus {
  background-color: #28a745;
  color: white;
}

.stuck {
  background-color: #dc3545;
  color: white;
}

.footer {
  padding: 10px 15px;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

/* Legend Styling */
.legend {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: flex-start;
  font-size: 0.95em;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-bold {
  font-weight: bold;
  color: #212529;
}

.legend-description {
  color: #6c757d;
  font-weight: normal;
}
</style>
