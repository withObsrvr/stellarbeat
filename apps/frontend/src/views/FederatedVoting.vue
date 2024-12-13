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
        <!--div class="consensus-status">
          <div
            v-if="isStuck"
            class="alert alert-warning mt-3 text-center"
            role="alert"
          >
            This vote is stuck
            {{ someNodesReachedConsensus ? "for some befouled nodes" : "" }}
          </div>
          <div
            v-if="consensusReached"
            class="alert alert-success mt-3 text-center"
            role="alert"
          >
            Consensus reached
          </div>
        </div!-->
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <FbasGraphPrototype class="card-spacing" />
      </div>
      <div class="col-md-6">
        <div class="card" v-if="!federatedVotingStore.selectedNodeId">
          <div
            class="pt-3 px-3 card-header d-flex justify-content-between align-items-center"
          >
            <BreadCrumbs root="FBAS Status" />
            <span class="badge ms-2">Quorum Intersection</span>
          </div>
          <div class="card-body p-0">
            <EventLog style="height: 250px" />
            <Actions style="height: 250px" />
          </div>
        </div>
        <div v-else class="card-body p-0">
          <SelectedNodePanel
            :selectedNodeId="federatedVotingStore.selectedNodeId"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6 col-sm-12">
        <TrustGraph class="card-spacing" />
      </div>
      <div class="col-md-6 col-sm-12">
        <overlay-graph-base class="card-spacing" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import NodesPanel from "@/components/federated-voting/nodes-panel.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph/overlay-graph-base.vue";
import TrustGraph from "@/components/federated-voting/trust-graph/trust-graph.vue";
import EventLog from "@/components/federated-voting/simulation-control/event-log.vue";
import Actions from "@/components/federated-voting/simulation-control/actions.vue";
import FbasGraphPrototype from "@/components/federated-voting/fbas-graph/fbas-graph-prototype.vue";
import SelectedNodePanel from "@/components/federated-voting/selected-nodes-panel/selected-node-panel.vue";
import Controller from "@/components/federated-voting/simulation-control/controller.vue";
import BreadCrumbs from "@/components/federated-voting/bread-crumbs.vue";

// Computed property to get the currently selected node ID
const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

// Function to unselect the node
function unselectNode() {
  federatedVotingStore.selectedNodeId = null;
}

const hasNoNextMoves = computed(() => {
  return !federatedVotingStore.simulation.hasNextStep();
});

const consensusReached = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.every(
    (state) => state.confirmed,
  );
});

const someNodesReachedConsensus = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.some(
    (state) => state.confirmed,
  );
});

const isStuck = computed(() => {
  return hasNoNextMoves.value && !consensusReached.value;
});
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

.badge {
  background-color: #d4edda;
  color: #155724;
}
</style>
