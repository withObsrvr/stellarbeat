<template>
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
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import {
  BIconInfoCircleFill,
  BIconCheckCircleFill,
  BIconQuestionCircleFill,
} from "bootstrap-vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const protocolState = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.find(
    (state) => state.node.publicKey === selectedNodeId.value,
  );
});
const selectedNodePhase = computed(() => {
  return protocolState.value ? protocolState.value.phase : "unknown";
});
</script>

<style scoped>
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
</style>
