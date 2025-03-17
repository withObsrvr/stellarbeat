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

    <div class="events-section">
      <h5>Events</h5>
      <ProcessedVotesNodeEvents
        class="events-component"
        :selected-node-id="selectedNodeId"
        @statement-selected="$emit('statement-selected', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import FbasNodeBadge from "../fbas-node-badge.vue";
import ProcessedVotesNodeEvents from "./processed-votes-node-events.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const props = defineProps<{
  votes: string[];
  votesToAccept: string[];
}>();

const emit = defineEmits<{
  (e: "select-node", nodeId: string): void;
  (e: "statement-selected", statement: string): void;
}>();

const selectedNodeId = computed(
  () => federatedVotingStore.selectedNodeId ?? undefined,
);

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

/* Events section styling */
.events-section {
  margin-top: 1rem;
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.events-section h5 {
  font-size: 1rem;
  margin-bottom: 0.75rem;
}

.events-component {
  height: 140px;
  overflow-y: auto;
  border-radius: 4px;
}
</style>
