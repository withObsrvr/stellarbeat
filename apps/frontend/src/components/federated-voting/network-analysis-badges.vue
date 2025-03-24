<template>
  <div class="network-analysis-badges">
    <span
      v-if="federatedVotingStore.networkAnalysis.hasQuorumIntersection"
      v-tooltip="'Quorum Intersection'"
      class="badge badge-success ms-2 mr-2"
      >Quorum Intersection</span
    >
    <span
      v-else
      v-tooltip="'No quorum intersection'"
      class="badge badge-danger ms-2 mr-2"
    >
      No Quorum Intersection</span
    >
    <span
      v-if="federatedVotingStore.consensusReached.value"
      class="badge badge-success ms-2"
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
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
</script>

<style scoped>
.network-analysis-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1px;
}
</style>
