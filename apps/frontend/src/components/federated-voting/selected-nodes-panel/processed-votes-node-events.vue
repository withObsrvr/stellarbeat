<template>
  <div class="status-notifications">
    <strong>Events</strong>
    <div v-if="vBlockedEvent" class="badge-container">
      <div class="vblocking-badge">
        <div class="badge-header">
          <span>Accept votes V-Blocking</span>
        </div>
        <div class="badge-detail">
          {{ statement }} accepted by:
          {{ Array.from(vBlockedEvent.vBlockingSet).join(", ") }}
        </div>
      </div>
    </div>

    <div v-if="ratifiedVoteEvent" class="badge-container">
      <div class="ratified-badge">
        <div class="badge-header">
          <span>Vote Ratified {{ statement }}</span>
        </div>
        <div class="badge-detail">
          {{ statement }} ratified by quorum:

          {{ Array.from(ratifiedVoteEvent.quorum.keys()).join(", ") }}
        </div>
      </div>
    </div>

    <div v-if="ratifiedAcceptVoteEvent" class="badge-container">
      <div class="ratified-badge confirmed-badge">
        <div class="badge-header">
          <span>Accept Vote Ratified</span>
        </div>
        <div class="badge-detail">
          Accept({{ statement }}) ratified by quorum:
          {{ Array.from(ratifiedAcceptVoteEvent.quorum.keys()).join(", ") }}
        </div>
      </div>
    </div>

    <div
      v-if="!vBlockedEvent && !ratifiedVoteEvent && !ratifiedAcceptVoteEvent"
      class="empty-message"
    >
      No quorum ratification or v-blocking events detected for
      {{ statement }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  AcceptVoteVBlocked,
  VoteRatified,
  AcceptVoteRatified,
} from "scp-simulation";

const props = defineProps<{
  selectedNodeId: string;
  statement: string;
}>();

const eventsLog = computed(() => federatedVotingStore.fullEventLog.flat());

const vBlockedEvent = computed(
  () =>
    eventsLog.value.find(
      (event) =>
        event instanceof AcceptVoteVBlocked &&
        event.publicKey === props.selectedNodeId &&
        event.statement.toString() === props.statement,
    ) as AcceptVoteVBlocked | undefined,
);

const ratifiedVoteEvent = computed(() => {
  return eventsLog.value.find(
    (event) =>
      event instanceof VoteRatified &&
      event.publicKey === props.selectedNodeId &&
      event.statement.toString() === props.statement,
  ) as VoteRatified | undefined;
});

const ratifiedAcceptVoteEvent = computed(() => {
  console.log("COMPUTE");
  return eventsLog.value.find(
    (event) =>
      event instanceof AcceptVoteRatified &&
      event.publicKey === props.selectedNodeId &&
      event.statement.toString() === props.statement,
  ) as AcceptVoteRatified | undefined;
});
</script>

<style scoped>
.status-notifications {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.badge-container {
  position: relative;
  margin-bottom: 8px;
}

.vblocking-badge,
.ratified-badge {
  display: flex;
  flex-direction: column;
  padding: 3px 10px 0px 10px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.vblocking-badge {
  background-color: #e6f0ff;
  border-left: 4px solid #007bff;
}

.ratified-badge {
  background-color: #edf8f6;
  border-left: 4px solid #28a745;
}

.confirmed-badge {
  background-color: #d4edda;
  border-left: 4px solid #155724;
}

.badge-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 0.9em;
}

.badge-detail {
  height: 0;
  overflow: hidden;
  font-size: 0.8em;
  color: #6c757d;
  transition:
    height 0.2s ease-in-out,
    margin-top 0.2s ease-in-out;
}

.badge-container:hover .badge-detail {
  height: auto;
  margin-top: 4px;
  padding-top: 2px;
  border-top: 1px dotted rgba(0, 0, 0, 0.1);
}

.empty-message {
  color: #6c757d;
  font-style: italic;
  font-size: 0.9em;
}
</style>
