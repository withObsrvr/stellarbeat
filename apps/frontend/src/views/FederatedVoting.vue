<template>
  <div>
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting</h2>
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <simulation-control class="card-spacing" />
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <TrustGraph />
      </div>
      <div class="col-md-6">
        <overlay-graph-base class="card-spacing" />
      </div>
    </div>
    <div class="row">
      <div class="col-md-6"><nodes-panel></nodes-panel></div>
    </div>
    <!-- Nodes List -->
  </div>
</template>

<script setup lang="ts">
import NodesPanel from "@/components/federated-voting/nodes-panel.vue";
import SimulationControl from "@/components/federated-voting/simulation-control/simulation-control.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph-base.vue";
import TrustGraph from "@/components/federated-voting/trust-graph/trust-graph.vue";
</script>

<style scoped>
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}
.card-spacing {
  margin-bottom: 10px;
}
.footer {
  height: 60px;
}
</style>
