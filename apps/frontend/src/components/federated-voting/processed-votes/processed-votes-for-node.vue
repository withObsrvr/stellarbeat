<template>
  <div>
    <div class="voter-groups">
      <div class="voter-group">
        <strong>Votes</strong>
        <div class="voter-list">
          <FbasNodeBadge
            v-for="(publicKey, idx) in votes"
            :key="`vote-${idx}`"
            :node-id="publicKey"
            @select="selectNodeId"
          />
          <span v-if="votes.length === 0" class="placeholder-text">
            No votes processed
          </span>
        </div>
      </div>

      <div class="voter-group">
        <strong>Votes to Accept</strong>
        <div class="voter-list">
          <FbasNodeBadge
            v-for="(publicKey, idx) in votesToAccept"
            :key="`accept-${idx}`"
            :node-id="publicKey"
            :visualize-phase="true"
            @select="selectNodeId"
          />
          <span v-if="votesToAccept.length === 0" class="placeholder-text">
            No accept votes processed
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import FbasNodeBadge from "../fbas-node-badge.vue";
import ProcessedVotesNodeEvents from "./processed-votes-node-events.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const props = defineProps<{
  statement: string;
}>();

const emit = defineEmits<{
  (e: "select-node", nodeId: string): void;
  (e: "statement-selected", statement: string): void;
}>();

const votes = computed(() => {
  if (!federatedVotingStore.selectedNode.value) return [];
  return (
    federatedVotingStore.selectedNode.value.processedVotes
      .filter(
        (vote) =>
          !vote.isVoteToAccept &&
          vote.statement === props.statement.toLowerCase(),
      )
      .map((vote) => vote.publicKey) ?? []
  );
});

const votesToAccept = computed(() => {
  if (!federatedVotingStore.selectedNode.value) return [];
  return (
    federatedVotingStore.selectedNode.value.processedVotes
      .filter(
        (vote) =>
          vote.isVoteToAccept &&
          vote.statement === props.statement.toLocaleLowerCase(),
      )
      .map((vote) => vote.publicKey) ?? []
  );
});

function selectNodeId(nodeId: string) {
  emit("select-node", nodeId);
}
</script>

<style scoped>
.voter-groups {
  display: flex;
  margin-bottom: 1.5rem;
}

.voter-group {
  flex: 1;
  position: relative;
  padding-right: 15px;
}

.voter-group strong {
  display: block;
  margin-bottom: 4px;
  font-size: 1em;
  font-weight: bold;
}

.voter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.placeholder-text {
  color: #6c757d;
  font-style: italic;
  display: block;
  padding: 4px 0;
}
</style>
