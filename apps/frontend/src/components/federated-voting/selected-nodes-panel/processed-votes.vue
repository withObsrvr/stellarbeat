<template>
  <div class="processed-votes">
    <h3>Processed Votes</h3>
    <table>
      <thead>
        <tr>
          <th>Voter</th>
          <th>Statement</th>
          <th>Vote to Accept</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(vote, index) in processedVotes" :key="index">
          <td>{{ vote.publicKey }}</td>
          <td>{{ vote.statement }}</td>
          <td>{{ vote.isVoteToAccept ? "Yes" : "No" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script lang="ts" setup>
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { computed } from "vue";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const protocolState = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.find(
    (state) => state.node.publicKey === selectedNodeId.value,
  );
});

const processedVotes = computed(() => {
  return protocolState.value ? protocolState.value.processedVotes : [];
});
</script>
<style scoped>
.processed-votes {
  margin-bottom: 40px;
}

.vote-item {
  display: flex;
  margin-bottom: 10px;
}

.processed-votes table {
  width: 100%;
  border-collapse: collapse;
}

.processed-votes th,
.processed-votes td {
  border: 1px solid #ddd;
  padding: 8px;
}

.processed-votes th {
  background-color: #f2f2f2;
  text-align: left;
}
</style>
