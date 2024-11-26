<template>
  <div class="card">
    <div class="card-title pt-2 pb-2">
      <ul class="list-group list-group-flush">
        <li
          v-for="node in nodes"
          :key="node.publicKey"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          {{ node.publicKey }}
          <button class="btn btn-primary btn-sm" @click="vote(node)">
            Vote
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { computed } from "vue";

function vote(node) {
  console.log(node);
}

const nodes = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.map(
    (protocolState) => protocolState.node,
  );
});
</script>
