<template>
  <div class="card">
    <div class="card-header header">
      <BreadCrumbs root="Federated Voting Status" />
      <div class="labels">
        <span v-if="isIllBehaved" class="badge badge-danger ms-2">
          Ill-behaved
        </span>
        <span v-else-if="isLivenessBefouled" class="badge badge-warning ms-2">
          Befouled (liveness)
        </span>
        <span v-if="isTopTierNode" class="badge badge-info ms-2">
          Top Tier Node
        </span>
      </div>
    </div>
    <div class="selected">
      <NodeInformation :public-key="selectedNodeId" class="px-3 py-3" />
      <!--ProcessedVotes /!-->

      <!-- Quorum Set Section -->
      <!--div class="quorum-set">
          <h3>Quorum Set</h3>
          <quorum-set-display :quorum-set="quorumSet" :level="1" />
        </div!-->

      <div class="row">
        <div class="col-12">
          <EventLog :public-key="selectedNodeId" style="height: 250px" />
        </div>
        <div class="col-12">
          <Actions :public-key="selectedNodeId" style="height: 200px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import NodeInformation from "./node-information.vue";
import EventLog from "../simulation-control/event-log.vue";
import Actions from "../simulation-control/actions.vue";
import BreadCrumbs from "../bread-crumbs.vue";

const props = defineProps({
  selectedNodeId: {
    type: String,
    required: true,
  },
});

const contextState = computed(() => {
  return federatedVotingStore.protocolContextState;
});

const protocolState = computed(() => {
  return contextState.value.protocolStates.find(
    (state) => state.node.publicKey === props.selectedNodeId,
  );
});

const quorumSet = computed(() => {
  return protocolState.value ? protocolState.value.node.quorumSet : null;
});

const isIllBehaved = computed(() => {
  return federatedVotingStore
    .illBehavedNodes()
    .some((node) => node === props.selectedNodeId);
});

const isLivenessBefouled = computed(() => {
  if (!props.selectedNodeId) return false;
  return federatedVotingStore.befouledNodes().includes(props.selectedNodeId);
});

const isTopTierNode = computed(() => {
  if (!props.selectedNodeId) return false;
  return federatedVotingStore.trustGraph.isVertexPartOfNetworkTransitiveQuorumSet(
    props.selectedNodeId,
  );
});
</script>

<style scoped>
.selected {
  padding: 2px;
  background: white;
}

.header {
  text-align: center;
  margin-bottom: 5px;
}

.header h1 {
  margin-bottom: 5px;
  font-size: 32px;
}

.header p {
  font-size: 18px;
  color: #777;
}

.me-1 {
  margin-right: 0.25rem;
}

.quorum-set {
  margin-bottom: 40px;
}

.badge-danger {
  background-color: #dc3545;
  color: #fff;
}

.ms-2 {
  margin-left: 0.5rem;
}

.badge-warning {
  background-color: #ffc107;
  color: #212529;
}

.badge-info {
  background-color: #cce5ff;
  color: #004085;
}

.header {
  display: flex;
  justify-content: space-between;
}
</style>
