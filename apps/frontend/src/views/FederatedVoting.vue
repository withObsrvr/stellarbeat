<template>
  <div>
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting</h2>
      </div>
    </div>

    <!-- Simulation Control -->
    <div class="row">
      <div class="col-12">
        <simulation-control class="card-spacing" />
      </div>
    </div>

    <!-- Main Content -->
    <div class="row d-flex align-items-stretch">
      <!-- Nodes Panel -->
      <div class="col-lg-2 col-md-2 col-sm-12 mb-4">
        <div class="h-100">
          <nodes-panel></nodes-panel>
        </div>
      </div>

      <!-- Graphs -->
      <div class="col-lg-9 col-md-10 col-sm-12">
        <div class="row h-100">
          <div class="col-md-6 col-sm-12 mb-4 d-flex">
            <div class="w-100">
              <TrustGraph />
            </div>
          </div>
          <div class="col-md-6 col-sm-12 d-flex">
            <div class="w-100">
              <overlay-graph-base class="card-spacing" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import NodesPanel from "@/components/federated-voting/nodes-panel.vue";
import SimulationControl from "@/components/federated-voting/simulation-control/simulation-control.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph-base.vue";
import TrustGraph from "@/components/federated-voting/trust-graph/trust-graph.vue";
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
</style>
