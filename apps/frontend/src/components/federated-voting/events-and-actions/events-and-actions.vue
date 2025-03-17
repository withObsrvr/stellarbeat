<template>
  <div class="card">
    <div v-if="!federatedVotingStore.selectedNodeId">
      <div
        class="card-header d-flex justify-content-between align-items-center"
      >
        <BreadCrumbs root="Events & Actions" />
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
          <button
            class="btn btn-sm btn-secondary ml-3"
            type="button"
            title="Show events and actions information"
            @click="showInfo"
          >
            <BIconInfoCircle class="text-muted" />
          </button>
        </div>
      </div>
      <div class="card-body px-3 py-0">
        <EventLog style="height: 250px" />
        <Actions style="height: 250px" />
      </div>
    </div>
    <div v-else class="card-body p-0 pt-0">
      <SelectedNodeEventsAndActions
        :selected-node-id="federatedVotingStore.selectedNodeId"
      />
    </div>
    <div class="card-footer">
      <div class="legend">
        <div class="legend-item">
          <span class="legend-bold">Event:</span>
          <span class="legend-description">What happened</span>
        </div>
        <div class="legend-item">
          <span class="legend-bold">Action:</span>
          <span class="legend-description">Executed next</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EventLog from "./event-log.vue";
import Actions from "./actions/actions.vue";
import BreadCrumbs from "./../bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import SelectedNodeEventsAndActions from "./selected-node-events-and-actions/selected-node-events-and-actions.vue";
import { BIconInfoCircle } from "bootstrap-vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import EventsAndActionsInfo from "./events-and-actions-info.vue";

function showInfo() {
  infoBoxStore.show(EventsAndActionsInfo);
}
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
