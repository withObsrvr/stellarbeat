<template>
  <div class="card side-panel h-100">
    <div
      class="title d-flex justify-content-around align-items-baseline border-bottom pb-4 mb-2"
    >
      Nodes
    </div>

    <ul class="node-list">
      <li
        v-for="nodeState in nodes"
        :key="nodeState.node.publicKey"
        class="node-item"
        :class="{
          'selected-node': nodeState.node.publicKey === selectedNodeId,
        }"
        role="button"
        tabindex="0"
        :aria-pressed="nodeState.node.publicKey === selectedNodeId"
        @click="selectNode(nodeState.node.publicKey)"
        @keydown.enter.prevent="selectNode(nodeState.node.publicKey)"
        @keydown.space.prevent="selectNode(nodeState.node.publicKey)"
      >
        <div class="node-info">
          <div class="node-key d-flex align-items-center">
            <span class="key-text">{{ nodeState.node.publicKey }}</span>
          </div>
          <div class="node-status">
            <span v-if="nodeState.voted" class="badge badge-voted mb-1">
              <BIconCheckCircle class="me-1" /> Voted:
              {{ nodeState.voteValue || "N/A" }}
            </span>
            <span v-else class="badge badge-phase phase-unknown">
              <BIconInfoCircleFill class="me-1" /> Not voted
            </span>
            <span
              v-if="nodeState.phase !== 'unknown'"
              class="badge badge-phase"
              :class="{
                'phase-accepted': nodeState.phase === 'accepted',
                'phase-confirmed': nodeState.phase === 'confirmed',
              }"
            >
              <template v-if="nodeState.phase === 'accepted'">
                <BIconInfoCircleFill class="me-1" /> Accepted:
                {{ nodeState.acceptedValue || "N/A" }}
              </template>
              <template v-else-if="nodeState.phase === 'confirmed'">
                <BIconCheckCircleFill class="me-1" /> Confirmed:
                {{ nodeState.confirmedValue || "N/A" }}
              </template>
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  BIconCheckCircle,
  BIconInfoCircleFill,
  BIconCheckCircleFill,
} from "bootstrap-vue";

const nodes = computed(() => {
  return federatedVotingStore.protocolContextState.protocolStates.map(
    (protocolState) => ({
      node: protocolState.node,
      voted: protocolState.voted,
      phase: protocolState.phase,
      voteValue: protocolState.voted,
      acceptedValue: protocolState.accepted,
      confirmedValue: protocolState.confirmed,
    }),
  );
});

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function selectNode(publicKey: string) {
  federatedVotingStore.selectedNodeId = publicKey;
}
</script>

<style scoped>
.side-panel {
  padding: 1rem;
  font-size: 0.9rem;
}

.node-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.node-item {
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-item:hover {
  background: #e9ecef;
}

.node-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.node-key {
  font-weight: 500;
  color: #212529;
  word-break: break-word;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.badge-voted {
  background-color: #d4edda;
  color: #155724;
}

.badge-phase.phase-unknown {
  background-color: #e2e3e5;
  color: #6c757d;
}

.badge-phase.phase-accepted {
  background-color: #cce5ff;
  color: #004085;
}

.badge-phase.phase-confirmed {
  background-color: #d4edda;
  color: #155724;
}

.key-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.selected-node {
  background-color: #e9ecef;
}
</style>
