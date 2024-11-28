<template>
  <div class="card selected-node-panel">
    <div v-if="selectedNodeId">
      <!-- Header Section -->
      <div class="header">
        <h1>Node Details</h1>
        <p>{{ selectedNodeId }}</p>
      </div>

      <!-- Node Information Section -->
      <div class="node-info">
        <div class="info-item">
          <span class="label">Phase:</span>
          <span
            class="value badge badge-phase"
            :class="{
              'phase-unknown': selectedNodePhase === 'unknown',
              'phase-accepted': selectedNodePhase === 'accepted',
              'phase-confirmed': selectedNodePhase === 'confirmed',
            }"
          >
            <template v-if="selectedNodePhase === 'unknown'">
              <BIconQuestionCircleFill class="me-1" /> Unknown
            </template>
            <template v-else-if="selectedNodePhase === 'accepted'">
              <BIconInfoCircleFill class="me-1" /> Accepted
            </template>
            <template v-else-if="selectedNodePhase === 'confirmed'">
              <BIconCheckCircleFill class="me-1" /> Confirmed
            </template>
          </span>
        </div>
        <div class="info-item">
          <span class="label">Voted:</span>
          <span class="value">{{ protocolState?.voted || "N/A" }}</span>
        </div>
        <div class="info-item">
          <span class="label">Accepted:</span>
          <span class="value">{{ protocolState?.accepted || "N/A" }}</span>
        </div>
        <div class="info-item">
          <span class="label">Confirmed:</span>
          <span class="value">{{ protocolState?.confirmed || "N/A" }}</span>
        </div>
      </div>

      <!-- Known Votes Section -->
      <div class="known-votes">
        <h2>Known Votes</h2>
        <table>
          <thead>
            <tr>
              <th>Voter</th>
              <th>Statement</th>
              <th>Vote to Accept</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(vote, index) in knownVotes" :key="index">
              <td>{{ vote.publicKey }}</td>
              <td>{{ vote.statement }}</td>
              <td>{{ vote.isVoteToAccept ? "Yes" : "No" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Quorum Set Section -->
      <div class="quorum-set">
        <h2>Quorum Set</h2>
        <quorum-set-display :quorum-set="quorumSet" :level="1" />
      </div>
    </div>
    <div v-else>
      <p>No node selected.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  BIconInfoCircleFill,
  BIconCheckCircleFill,
  BIconQuestionCircleFill,
} from "bootstrap-vue";
import QuorumSetDisplay from "./quorum-set-display.vue";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);
const contextState = computed(() => {
  return federatedVotingStore.protocolContextState;
});
const protocolState = computed(() => {
  return contextState.value.protocolStates.find(
    (state) => state.node.publicKey === selectedNodeId.value,
  );
});
const selectedNodePhase = computed(() => {
  return protocolState.value ? protocolState.value.phase : "unknown";
});
const knownVotes = computed(() => {
  return protocolState.value ? protocolState.value.processedVotes : [];
});
const quorumSet = computed(() => {
  return protocolState.value ? protocolState.value.node.quorumSet : null;
});
</script>

<style scoped>
.selected-node-panel {
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  margin-bottom: 5px;
  font-size: 32px;
}

.header p {
  font-size: 18px;
  color: #777;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.label {
  font-weight: bold;
  margin-right: 10px;
}

.badge-phase {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 12px;
  font-weight: bold;
  text-transform: capitalize;
}

.phase-unknown {
  background-color: #e2e3e5;
  color: #6c757d;
}

.phase-accepted {
  background-color: #cce5ff;
  color: #004085;
}

.phase-confirmed {
  background-color: #d4edda;
  color: #155724;
}

.me-1 {
  margin-right: 0.25rem;
}

.known-votes,
.quorum-set {
  margin-bottom: 40px;
}

.vote-item {
  display: flex;
  margin-bottom: 10px;
}

.known-votes table {
  width: 100%;
  border-collapse: collapse;
}

.known-votes th,
.known-votes td {
  border: 1px solid #ddd;
  padding: 8px;
}

.known-votes th {
  background-color: #f2f2f2;
  text-align: left;
}
</style>
