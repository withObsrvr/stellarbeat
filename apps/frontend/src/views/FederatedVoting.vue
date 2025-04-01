<template>
  <div class="h-100">
    <InfoBox />
    <!-- Page Header -->
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting Simulation</h2>
        <button
          class="btn btn-sm btn-secondary ml-0"
          type="button"
          title="Show simulation information"
          @click="showInfo"
        >
          <BIconInfoCircle class="text-muted" />
        </button>
      </div>
    </div>
    <div class="info mb-6">
      <div class="alert alert-info" role="alert">
        Learn about Federated Voting and the different scenarios in
        <a
          href="https://medium.com/stellarbeatio/federated-voting-part-1-theory-learn-about-a-stellar-consensus-protocol-scp-building-block-e050a8d0e16e"
          target="_blank"
          rel="noopener"
          class="font-weight-bold"
        >
          this blog-post series.
        </a>
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
import OverlayGraphBase from "@/components/federated-voting/overlay-graph/overlay-graph.vue";
import DSets from "@/components/federated-voting/intactness.vue";
import EventsAndActions from "@/components/federated-voting/events-and-actions/events-and-actions.vue";
import ProcessedVotes from "@/components/federated-voting/processed-votes/processed-votes.vue";
import VotesSelector from "@/components/federated-voting/votes-selector/votes-selector.vue";
import InfoBox from "@/components/federated-voting/info-box/info-box.vue";
import NodeTrustConfig from "@/components/federated-voting/node-trust-config/node-trust-config.vue";
import ConsensusTopology from "@/components/federated-voting/consensus-topology/consensus-topology.vue";
import { infoBoxStore } from "@/components/federated-voting/info-box/useInfoBoxStore";
import FederatedVotingInfo from "@/components/federated-voting/federated-voting-info.vue";
import { BIconInfoCircle } from "bootstrap-vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { onMounted } from "vue";
import useMetaTags from "@/composables/useMetaTags";

// Define props to receive route parameters
const props = defineProps<{
  scenarioId?: string;
}>();

useMetaTags("Federated Voting Simulation", "Federated Voting Simulation tool");

onMounted(() => {
  if (props.scenarioId) {
    // Check if the requested scenario exists
    const scenarioExists = federatedVotingStore.scenarios.some(
      (scenario) => scenario.id === props.scenarioId,
    );

    if (scenarioExists) {
      federatedVotingStore.selectScenario(props.scenarioId);
    }
  }
});

function showInfo() {
  infoBoxStore.show(FederatedVotingInfo);
}
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
