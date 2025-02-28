<template>
  <div class="card">
    <div v-if="!federatedVotingStore.selectedNodeId">
      <div
        class="pt-3 px-3 card-header d-flex justify-content-between align-items-center"
      >
        <BreadCrumbs root="Federated Voting Status" />
        <div class="d-flex align-items-center">
          <span
            v-if="federatedVotingStore.consensusReached.value"
            class="badge consensus ms-2"
          >
            Consensus Reached
          </span>
          <span
            v-if="federatedVotingStore.isNetworkSplit.value"
            class="badge badge-danger ms-2"
          >
            Network Split
          </span>
          <span
            v-else-if="federatedVotingStore.isStuck.value"
            class="badge badge-danger ms-2"
          >
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
          <span class="legend-description"
            >Will be executed next (in order)</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SelectedNodePanel from "../selected-nodes-panel/selected-node-panel.vue";
import EventLog from "./event-log.vue";
import Actions from "./actions.vue";
import BreadCrumbs from "./../bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
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
