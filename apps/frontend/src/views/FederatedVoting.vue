<template>
  <div class="h-100">
    <InfoBox />
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting Simulation (Beta)</h2>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-lg-12">
        <Controller></Controller>
      </div>
    </div>
    <div class="row mb-4">
      <div class="col-lg-12">
        <VotesSelector />
      </div>
    </div>

    <div class="row">
      <div class="col-md-6">
        <FbasGraph />
      </div>
      <div class="col-md-6">
        <FederatedVotingStatus />
      </div>
    </div>
    <div class="row pb-5" style="height: 500px">
      <div class="col-md-6 col-sm-12 h-100">
        <ProcessedVotes class="h-100" />
      </div>
      <div class="col-md-6 col-sm-12 h-100">
        <ConsensusTopology />
      </div>
    </div>
    <div class="row pb-5" style="height: 500px">
      <div class="col-6">
        <DSets />
      </div>
      <div class="col-6">
        <OverlayGraphBase />
      </div>
    </div>
    <div class="row">
      <div class="col-12 pb-5">
        <NodeTrustConfig />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FbasGraph from "@/components/federated-voting/fbas-graph/fbas-graph.vue";
import Controller from "@/components/federated-voting/simulation-control/controller.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph/overlay-graph-base.vue";
import ProcessedVotes from "@/components/federated-voting/selected-nodes-panel/processed-votes.vue";
import FederatedVotingStatus from "@/components/federated-voting/simulation-control/federated-voting-status.vue";
import DSets from "@/components/federated-voting/intactness.vue";
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
</style>
