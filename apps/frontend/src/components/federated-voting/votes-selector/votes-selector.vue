<template>
  <div class="card voting-controls mb-3">
    <div class="card-body mb-0 py-3">
      <div class="content-wrapper">
        <div class="main-content">
          <div class="votes-grid">
            <div
              v-for="node in allNodes"
              :key="node.publicKey"
              class="vote-cell"
            >
              <label
                :for="`voteSelection-${node.publicKey}`"
                class="vote-label"
              >
                {{ node.publicKey }}:
              </label>
              <select
                :id="`voteSelection-${node.publicKey}`"
                v-model="selectedVotes[node.publicKey]"
                :disabled="processedVotesByNode[node.publicKey]"
                class="vote-select"
                @change="onVoteSelectionChange(node.publicKey)"
              >
                <option value="">No vote</option>
                <option value="burger">Vote Burger</option>
                <option value="salad">Vote Salad</option>
                <option value="pizza">Vote Pizza</option>
              </select>
            </div>
          </div>
        </div>
        <InfoButton @click="showInfo" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { VoteOnStatement } from "scp-simulation";
import { BIconInfoCircle } from "bootstrap-vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import VotesSelectorInfo from "./votes-selector-info.vue";
import InfoButton from "../info-box/info-button.vue";

function showInfo() {
  infoBoxStore.show(VotesSelectorInfo);
}

const allNodes = computed(() =>
  federatedVotingStore.protocolContextState.protocolStates.map((ps) => ps.node),
);

const processedVotesByNode = computed(() => {
  const map: Record<string, boolean> = {};
  federatedVotingStore.protocolContextState.protocolStates
    .flatMap((state) => state.processedVotes)
    .forEach((vote) => {
      map[vote.publicKey] = true;
    });
  return map;
});

const selectedVotes = ref<Record<string, string>>({});

function onVoteSelectionChange(publicKey: string) {
  removeExistingVoteActionForNode(publicKey);
  const voteValue = selectedVotes.value[publicKey];
  if (voteValue) {
    const action = new VoteOnStatement(publicKey, voteValue);
    federatedVotingStore.simulation.addUserAction(action);
  }
}

function removeExistingVoteActionForNode(publicKey: string) {
  const simulation = federatedVotingStore.simulation;
  const actions = simulation.pendingUserActions();
  for (let i = actions.length - 1; i >= 0; i--) {
    const ua = actions[i];
    if (ua.subType === "VoteOnStatement" && ua.publicKey === publicKey) {
      actions.splice(i, 1);
    }
  }
}

function syncSelectedVotes() {
  const newSelectedVotes: Record<string, string> = {};

  // Initialize all votes to empty
  allNodes.value.forEach((node) => {
    newSelectedVotes[node.publicKey] = "";
  });

  // Set processed votes
  federatedVotingStore.protocolContextState.protocolStates
    .flatMap((state) => state.processedVotes)
    .forEach((vote) => {
      newSelectedVotes[vote.publicKey] = vote.statement.toString();
    });

  // Override with pending user actions
  federatedVotingStore.simulation
    .pendingUserActions()
    .forEach((action: any) => {
      if (action.subType === "VoteOnStatement") {
        newSelectedVotes[action.publicKey] = action.statement;
      }
    });

  selectedVotes.value = newSelectedVotes;
}

watch(
  () => federatedVotingStore.simulation.pendingUserActions(),
  () => syncSelectedVotes(),
  { deep: true, immediate: true },
);
</script>

<style scoped>
.voting-controls {
  width: 100%;
  margin-bottom: 1rem;
}

.votes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  width: 100%;
}

.vote-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
}

.vote-label {
  font-size: 0.875rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 0 0 auto;
}

.vote-select {
  flex: 1;
  min-width: 90px;
  padding: 0.25rem;
  font-size: 0.875rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
}

.vote-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.content-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}

.main-content {
  flex: 1;
}
</style>
