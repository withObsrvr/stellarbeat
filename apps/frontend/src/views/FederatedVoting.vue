<template>
  <div class="h-100">
    <InfoBox />
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting Simulation (Beta)</h2>
      </div>
    </div>

    <!-- Sticky Controller -->
    <div class="sticky-controller-container">
      <div class="col-lg-12 px-0 controller-row">
        <Controller></Controller>
      </div>
    </div>

    <div class="content-container">
      <div class="row mb-4">
        <div class="col-lg-12">
          <VotesSelector />
        </div>
      </div>

      <div class="row">
        <div class="col-md-6"><TrustGraph /></div>
        <div class="col-md-6">
          <EventsAndActions />
        </div>
      </div>
      <div class="row mb-2">
        <div class="col-md-6 col-sm-12">
          <ProcessedVotes class="" style="min-height: 500px" />
        </div>
        <div class="col-md-6 col-sm-12">
          <ConsensusTopology class="" style="min-height: 500px" />
        </div>
      </div>
      <div class="row">
        <div class="col-md-6 col-sm-12 mb-4" style="height: 550px">
          <DSets />
        </div>
        <div class="col-md-6 col-sm-12 mb-4" style="height: 550px">
          <OverlayGraphBase />
        </div>
      </div>
      <div class="row">
        <div class="col-12 mb-5">
          <NodeTrustConfig />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Controller from "@/components/federated-voting/simulation-control/controller.vue";
import TrustGraph from "@/components/federated-voting/trust-graph/trust-graph.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph/overlay-graph-base.vue";
import DSets from "@/components/federated-voting/intactness.vue";
import EventsAndActions from "@/components/federated-voting/events-and-actions/events-and-actions.vue";
import ProcessedVotes from "@/components/federated-voting/processed-votes/processed-votes.vue";
import VotesSelector from "@/components/federated-voting/votes-selector/votes-selector.vue";
import InfoBox from "@/components/federated-voting/info-box/info-box.vue";
import NodeTrustConfig from "@/components/federated-voting/node-trust-config/node-trust-config.vue";
import ConsensusTopology from "@/components/federated-voting/consensus-topology/consensus-topology.vue";
</script>

<style>
.badge-success {
  background-color: #28a745;
  color: white;
}

.sticky-controller-container {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: white;
  padding: 0 0;
  border: none;
}

.content-container {
  padding-top: 1rem;
}

.controller-row {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
