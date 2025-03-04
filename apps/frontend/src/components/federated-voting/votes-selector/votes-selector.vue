<template>
  <div class="card voting-controls mb-3">
    <div class="card-body mb-0 py-3">
      <div class="content-wrapper">
        <div class="main-content">
          <div class="votes-grid">
            <div v-for="node in nodes" :key="node.publicKey" class="vote-cell">
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
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import VotesSelectorInfo from "./votes-selector-info.vue";
import InfoButton from "../info-box/info-button.vue";

function showInfo() {
  infoBoxStore.show(VotesSelectorInfo);
}

const nodes = computed(() => federatedVotingStore.nodes);

const processedVotesByNode = computed(() => {
  const map: Record<string, boolean> = {};
  federatedVotingStore.nodes
    .flatMap((node) => node.processedVotes)
    .forEach((vote) => {
      map[vote.publicKey] = true;
    });
  return map;
});

const selectedVotes = ref<Record<string, string>>({});

function onVoteSelectionChange(publicKey: string) {
  const voteValue = selectedVotes.value[publicKey];
  if (voteValue) {
    federatedVotingStore.vote(publicKey, voteValue);
  }
}

function syncSelectedVotes() {
  const newSelectedVotes: Record<string, string> = {};

  // Set processed votes
  federatedVotingStore.nodes.forEach((node) => {
    newSelectedVotes[node.publicKey] = node.voted ?? "";
  });

  //override with pending votes
  federatedVotingStore.getPendingVotes().forEach((vote) => {
    newSelectedVotes[vote.publicKey] = vote.statement.toString();
  });

  selectedVotes.value = newSelectedVotes;
}

watch(
  () => federatedVotingStore.getPendingVotes(),
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
