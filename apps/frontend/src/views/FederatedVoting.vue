<template>
  <div>
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">
          Federated Voting Simulation (Work in Progress)
        </h2>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-lg-12">
        <Controller></Controller>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <FbasGraphPrototype class="card-spacing" />
      </div>
      <div class="col-md-6">
        <FederatedVotingStatus />
      </div>
    </div>
    <div class="row">
      <div class="col-md-6 col-sm-12">
        <overlay-graph-base class="card-spacing" />
      </div>
      <div class="col-md-6 col-sm-12">
        <ProcessedVotes />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FbasGraphPrototype from "@/components/federated-voting/fbas-graph/fbas-graph-prototype.vue";
import Controller from "@/components/federated-voting/simulation-control/controller.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph/overlay-graph-base.vue";
import ProcessedVotes from "@/components/federated-voting/selected-nodes-panel/processed-votes.vue";
import FederatedVotingStatus from "@/components/federated-voting/federated-voting-status.vue";
</script>

<style scoped>
.card-spacing {
  margin-bottom: 20px;
}

@media (max-width: 767.98px) {
  .card-spacing {
    margin-bottom: 15px;
  }
}

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

/* Ensure nodes-panel content stretches */
.nodes-panel {
  height: 100%;
}

/* Optional: Add scrollbar if nodes list exceeds height */
.nodes-panel {
  overflow-y: auto;
}

/* Default: Side panel is not sticky */
.sticky {
  position: static;
}

/* Sticky Side Panel on larger screens */
@media (min-width: 768px) {
  .sticky {
    position: sticky;
    top: 10px; /* Adds a 10px margin above the sticky side panel */
  }
}
</style>
