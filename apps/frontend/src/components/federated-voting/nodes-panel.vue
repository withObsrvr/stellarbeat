<template>
  <div class="card">
    <div class="card-body body">
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
                <BIconInfoCircleFill class="me-1 mb-1" /> Not voted
              </span>
              <span
                v-if="nodeState.phase !== 'unknown'"
                class="badge badge-phase mb-1"
                :class="{
                  'phase-accepted': nodeState.phase === 'accepted',
                  'phase-confirmed': nodeState.phase === 'confirmed',
                }"
              >
                <template v-if="nodeState.phase === 'accepted'">
                  <BIconInfoCircleFill class="me-1 mb-1" /> Accepted:
                  {{ nodeState.acceptedValue || "N/A" }}
                </template>
                <template v-else-if="nodeState.phase === 'confirmed'">
                  <BIconCheckCircleFill class="me-1 mb-1" /> Confirmed:
                  {{ nodeState.confirmedValue || "N/A" }}
                </template>
              </span>
              <span v-if="nodeState.illBehaved" class="badge badge-danger mb-1">
                <BIconExclamationCircleFill class="me-1" />
                Ill-behaved
              </span>
              <span
                v-else-if="nodeState.befouled"
                class="badge badge-warning mb-1"
              >
                <BIconExclamationCircleFill class="me-1" />
                Befouled (liveness)
              </span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  BIconCheckCircle,
  BIconInfoCircleFill,
  BIconCheckCircleFill,
  BIconExclamationCircleFill,
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
      illBehaved: illBehavedNodes.value.includes(protocolState.node.publicKey),
      befouled: befouledNodes.value.includes(protocolState.node.publicKey),
    }),
  );
});

const illBehavedNodes = computed(() => {
  return federatedVotingStore.illBehavedNodes();
});

const befouledNodes = computed(() => {
  return federatedVotingStore.befouledNodes();
});

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function selectNode(publicKey: string) {
  federatedVotingStore.selectedNodeId = publicKey;
}
</script>

<style scoped>
.node-list {
  max-height: 75vh;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}

.node-item {
  padding: 0.5rem 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
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

.badge-danger {
  background-color: #dc3545;
  color: #fff;
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

.badge-warning {
  background-color: #ffc107;
  color: #212529;
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

.body {
  padding: 0;
  display: flex;
  flex-direction: column;
}
</style>
