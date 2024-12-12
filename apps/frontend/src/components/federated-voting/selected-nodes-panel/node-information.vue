<template>
  <div class="node-info-container">
    <div class="top-row">
      <div class="badge-row">
        <span v-if="isIllBehaved" class="badge badge-danger">Ill-behaved</span>
        <span v-else-if="isLivenessBefouled" class="badge badge-warning"
          >Befouled (liveness)</span
        >
        <span v-if="isTopTierNode" class="badge badge-info">Top Tier Node</span>
      </div>
    </div>

    <div class="info-row">
      <div class="info-item">
        <span class="label">Phase:</span>
        <span
          class="value badge-phase"
          :class="{
            'phase-unknown': selectedNodePhase === 'unknown',
            'phase-accepted': selectedNodePhase === 'accepted',
            'phase-confirmed': selectedNodePhase === 'confirmed',
          }"
        >
          <BIconQuestionCircleFill
            v-if="selectedNodePhase === 'unknown'"
            class="phase-icon"
          />
          <BIconInfoCircleFill
            v-else-if="selectedNodePhase === 'accepted'"
            class="phase-icon"
          />
          <BIconCheckCircleFill
            v-else-if="selectedNodePhase === 'confirmed'"
            class="phase-icon"
          />
          <span>{{ selectedNodePhase }}</span>
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

const props = defineProps<{ publicKey: string }>();

const isIllBehaved = computed(() => {
  return federatedVotingStore.illBehavedNodes().includes(props.publicKey);
});

const isLivenessBefouled = computed(() => {
  return federatedVotingStore.befouledNodes().includes(props.publicKey);
});

const isTopTierNode = computed(() => {
  return federatedVotingStore.trustGraph.isVertexPartOfNetworkTransitiveQuorumSet(
    props.publicKey,
  );
});

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
.node-info-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9em;
  line-height: 1.2;
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.public-key-section {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
  font-weight: bold;
}

.public-key-label {
  font-weight: bolder;
  color: #343a40;
}

.public-key-value {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 5px;
  border-radius: 4px;
  color: #495057;
}

.badge-row {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
}

.info-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: flex-start;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.label {
  font-weight: bold;
}

.value {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.phase-icon {
  font-size: 0.9em;
}

.badge-phase {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: bold;
  text-transform: capitalize;
  gap: 4px;
  font-size: 0.9em;
}

.phase-unknown {
  background-color: #e2e3e5;
  color: #6c757d;
}

.phase-accepted {
  background-color: #d1ecf1;
  color: #0c5460;
}

.phase-confirmed {
  background-color: #d4edda;
  color: #155724;
}

.badge {
  display: inline-block;
  padding: 2px 5px;
  font-size: 1em;
  line-height: 1.2;
  border-radius: 6px;
  font-weight: bold;
  text-transform: none;
  white-space: nowrap;
}

.badge-danger {
  background-color: #f8d7da;
  color: #721c24;
}

.badge-warning {
  background-color: #fff3cd;
  color: #856404;
}

.badge-info {
  background-color: #d1ecf1;
  color: #0c5460;
}
</style>
