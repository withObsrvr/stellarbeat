<template>
  <div>
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting Simulation</h2>
      </div>
    </div>

    <div class="row mb-4">
      <div class="col-lg-2 col-md-3 col-sm-12 mt-2 sticky h-100">
        <Controller></Controller>
        <nodes-panel></nodes-panel>
      </div>

      <div class="col-lg-10 col-md-9 col-sm-12">
        <div class="row">
          <div class="col-md-6 col-sm-12">
            <TrustGraph />
          </div>
          <div class="col-md-6 col-sm-12">
            <overlay-graph-base class="card-spacing" />
          </div>
        </div>
        <div class="row">
          <div class="col-12">
            <simulation-control class="card-spacing" />
          </div>
        </div>

        <div class="row">
          <div class="col-12">
            <selected-node-panel />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NodesPanel from "@/components/federated-voting/nodes-panel.vue";
import SimulationControl from "@/components/federated-voting/simulation-control/simulation-control.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph/overlay-graph-base.vue";
import TrustGraph from "@/components/federated-voting/trust-graph/trust-graph.vue";
import SelectedNodePanel from "@/components/federated-voting/selected-nodes-panel/selected-node-panel.vue";
import Controller from "@/components/federated-voting/simulation-control/controller.vue";
</script>

<style scoped>
.card-spacing {
  margin-bottom: 20px;
}

/* Optional: Adjust margins for smaller screens */
@media (max-width: 767.98px) {
  .card-spacing {
    margin-bottom: 15px;
  }
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
