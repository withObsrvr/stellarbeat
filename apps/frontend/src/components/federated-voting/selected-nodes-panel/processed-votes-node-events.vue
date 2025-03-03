<template>
  <ul class="events-list">
    <li
      v-for="(event, idx) in nodeEvents"
      :key="`event-${idx}`"
      :class="['event-item', event.eventClass]"
      :style="!props.selectedNodeId ? 'cursor: pointer;' : ''"
      @click="!props.selectedNodeId && selectNode(event.nodeId)"
    >
      <div class="event-basic">
        <strong v-if="!props.selectedNodeId">{{ event.nodeId }}: </strong>
        <span v-html="event.message"></span>
      </div>

      <div v-if="props.selectedNodeId && event.details" class="event-details">
        <span v-html="event.details"></span>
      </div>
    </li>

    <li v-if="nodeEvents.length === 0" class="event-item empty-event">
      {{ emptyMessage }}
    </li>
  </ul>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  AcceptVoteVBlocked,
  VoteRatified,
  AcceptVoteRatified,
  Event,
} from "scp-simulation";
import SelectedNodePanel from "./selected-node-panel.vue";

const props = defineProps<{
  selectedNodeId?: string;
}>();

function selectNode(nodeId: string) {
  federatedVotingStore.selectedNodeId = nodeId;
}
const nodeEvents = computed(() => {
  const allEvents = federatedVotingStore.fullEventLog.flat() as Event[];

  // Filter for relevant events, conditionally filter by node ID
  return allEvents
    .filter((event) => {
      const isRelevantEventType =
        event instanceof AcceptVoteVBlocked ||
        event instanceof VoteRatified ||
        event instanceof AcceptVoteRatified;

      // If selectedNodeId is provided, filter by it
      if (props.selectedNodeId) {
        return isRelevantEventType && event.publicKey === props.selectedNodeId;
      }

      // Otherwise return all relevant events
      return isRelevantEventType;
    })
    .map((event: any) => {
      const nodeId = event.publicKey;
      const statement = event.statement.toString();

      const result = {
        nodeId,
        statement,
        eventClass: "",
        message: "",
        details: "", // Additional details for second line
      };

      if (event instanceof AcceptVoteVBlocked) {
        const vBlockingSet = Array.from(event.vBlockingSet);
        result.eventClass = "vblocking-event";
        result.message = `V-Blocking set accepted "<span class="statement-text">${result.statement}</span>"`;

        if (props.selectedNodeId && vBlockingSet.length > 0) {
          result.details = `<span class="node-list">${vBlockingSet.join(", ")}</span>`;
        }
      } else if (event instanceof VoteRatified) {
        const quorum = Array.from(event.quorum.keys());
        result.eventClass = "ratified-event";
        result.message = `Quorum ratified "<span class="statement-text">${result.statement}</span>"`;

        if (props.selectedNodeId && quorum.length > 0) {
          result.details = `<span class="node-list">${quorum.join(", ")}</span>`;
        }
      } else if (event instanceof AcceptVoteRatified) {
        const quorum = Array.from(event.quorum.keys());
        result.eventClass = "confirmed-event";
        result.message = `Quorum ratified Accept("<span class="statement-text">${result.statement}</span>")`;

        if (props.selectedNodeId && quorum.length > 0) {
          result.details = `<span class="node-list">${quorum.join(", ")}</span>`;
        }
      }

      return result;
    });
});

const emptyMessage = computed(() => {
  return props.selectedNodeId
    ? `No events found for ${props.selectedNodeId}`
    : "No events found";
});

// Helper to format node lists - only used for the unselected view
function getNodeListText(nodes: string[]) {
  if (nodes.length <= 2) {
    return nodes.join(", ");
  }
  return `${nodes.length} nodes`;
}
</script>

<style scoped>
.events-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.event-item {
  padding: 5px 8px;
  margin-bottom: 4px;
  font-size: 0.85rem;
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.event-basic {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-details {
  font-size: 0.8rem;
  margin-top: 2px;
  padding-top: 2px;
  border-top: 1px dotted rgba(0, 0, 0, 0.1);
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-list {
  font-family: monospace;
}

.event-detail {
  color: #007bff;
  font-weight: 500;
  margin: 0 4px;
}

.statement-text {
  font-style: italic;
}

.vblocking-event {
  background-color: #e6f0ff;
  border-left: 3px solid #007bff;
}

.ratified-event {
  background-color: #edf8f6;
  border-left: 3px solid #28a745;
}

.confirmed-event {
  background-color: #d4edda;
  border-left: 3px solid #155724;
}

.empty-event {
  color: #6c757d;
  font-style: italic;
  padding-left: 10px;
}

/* Add a hover effect for clickable events */
li.event-item:hover {
  opacity: 0.9;
}
</style>
