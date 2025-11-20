<template>
  <div class="actions-panel">
    <!-- Actions Search Box -->
    <div class="search-box">
      <input
        v-model="actionsFilter"
        type="text"
        class="form-control form-control-sm"
        placeholder="Filter Actions"
      />
    </div>
    <!-- Actions List -->
    <div ref="actionsList" class="actions-list">
      <div
        v-for="(action, id) in filteredActions"
        :key="id"
        class="action-item"
        :class="{
          'disrupted-item': isActionDisrupted(action.actionRef),
        }"
      >
        <span
          v-if="props.publicKey === null"
          class="action-public-key clickable"
          role="link"
          @click="selectNode(action.publicKey)"
        >
          {{ action.publicKey }}
        </span>
        <span class="action-sub-type">{{ mapSubType(action.subType) }}</span>
        <span>{{ action.description }}</span>
        <button
          v-if="action.actionRef instanceof ProtocolAction"
          class="btn btn-sm btn-danger"
          @click="handleEventAction(action.actionRef)"
        >
          {{ isActionDisrupted(action.actionRef) ? "Undisrupt" : "Disrupt" }}
        </button>
        <button
          v-if="action.actionRef instanceof UserAction"
          class="btn btn-sm btn-warning"
          @click="cancelUserAction(action.actionRef)"
        >
          {{ "Cancel" }}
        </button>
      </div>
      <div v-if="filteredActions.length === 0 && actionsFilter === ''">
        No actions will be executed next
      </div>
      <div v-if="filteredActions.length === 0 && actionsFilter !== ''">
        No results
      </div>
    </div>

    <div class="actions-footer">
      <div class="text-muted text-center" style="font-size: 0.9em">
        {{ actions.length }} action(s) will be executed next
      </div>
      <ForgeMessages />
    </div>

    <BModal
      id="disruptModal"
      ref="disruptModal"
      title="Select Neighbors to Disrupt"
      @ok="saveDisruptSelection"
      @hidden="clearCurrentAction"
    >
      <p>
        Select neighbors of {{ currentAction?.publicKey }} to disrupt broadcast
        to:
      </p>
      <div v-if="neighbors.length === 0" class="text-center py-3">
        <p>No overlay connections available for this node</p>
      </div>
      <div v-else class="neighbor-list">
        <div v-for="neighbor in neighbors" :key="neighbor" class="form-check">
          <input
            :id="`neighbor-${neighbor}`"
            v-model="selectedNeighbors"
            class="form-check-input"
            type="checkbox"
            :value="neighbor"
          />
          <label :for="`neighbor-${neighbor}`" class="form-check-label">
            {{ neighbor }}
          </label>
        </div>
      </div>
      <template #modal-footer="{ ok, cancel }">
        <button class="btn btn-outline-secondary" @click="cancel()">
          Cancel
        </button>
        <button class="btn btn-primary" @click="ok()">Save</button>
      </template>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  Broadcast,
  ForgeMessage,
  Gossip,
  ProtocolAction,
  UserAction,
} from "scp-simulation";
import { ref, computed, watch, nextTick } from "vue";
import { BModal } from '@/components/bootstrap-compat';
import ForgeMessages from "./forge-messages.vue";

const actionsList = ref<HTMLElement | null>(null);

const props = withDefaults(
  defineProps<{
    publicKey?: string | null;
  }>(),
  {
    publicKey: null,
  },
);

const disruptModal = ref<typeof BModal | null>(null);
const currentAction = ref<Broadcast | Gossip | null>(null);
const neighbors = ref<string[]>([]);
const selectedNeighbors = ref<string[]>([]);

function handleEventAction(action: ProtocolAction) {
  if (!(action instanceof ProtocolAction)) {
    return;
  }

  if (action instanceof Broadcast || action instanceof Gossip) {
    currentAction.value = action;
    neighbors.value = getNodeConnections(action.publicKey);

    if (action.isDisrupted) {
      selectedNeighbors.value = action.getBlackList();
    } else {
      selectedNeighbors.value = [];
    }

    if (disruptModal.value) {
      disruptModal.value.show();
    }
  } else {
    if (action.isDisrupted) {
      federatedVotingStore.undisruptAction(action);
    } else {
      federatedVotingStore.disruptAction(action);
    }
  }
}

function getNodeConnections(nodeId: string): string[] {
  const connections = federatedVotingStore.overlayConnections;
  const nodeConnections: string[] = [];

  for (const connection of connections) {
    if (connection.publicKey === nodeId) {
      nodeConnections.push(...connection.connections);
    }
  }

  return nodeConnections;
}

function saveDisruptSelection() {
  if (!currentAction.value) return;

  if (selectedNeighbors.value.length > 0) {
    federatedVotingStore.disruptAction(
      currentAction.value,
      selectedNeighbors.value,
    );
  } else {
    federatedVotingStore.undisruptAction(currentAction.value);
  }
}

function clearCurrentAction() {
  currentAction.value = null;
  neighbors.value = [];
  selectedNeighbors.value = [];
}

function cancelUserAction(action: UserAction) {
  federatedVotingStore.cancelPendingUserAction(action);
}

const isActionDisrupted = (action: ProtocolAction | UserAction) => {
  if (action instanceof ForgeMessage) {
    return true;
  }
  if (!(action instanceof ProtocolAction)) {
    return false;
  }
  return action.isDisrupted;
};

function mapSubType(subType: string) {
  switch (subType) {
    case "VoteOnStatement":
      return "Vote";
    case "AddNode":
      return "AddNode";

    default:
      return subType;
  }
}

const actionsFilter = ref("");
const actions = computed(() => {
  return [
    ...federatedVotingStore.pendingUserActions,
    ...federatedVotingStore.pendingProtocolActions,
  ].filter((action) =>
    props.publicKey !== null ? action.publicKey === props.publicKey : true,
  );
});
const filteredActions = computed(() => {
  const mappedActions = actions.value.map((action) => {
    return {
      publicKey: action.publicKey,
      subType: action.subType,
      description: action.toString(),
      actionRef: action,
    };
  });

  let result = mappedActions;

  if (actionsFilter.value) {
    result = mappedActions.filter(
      (action) =>
        action.description
          .toLowerCase()
          .includes(actionsFilter.value.toLowerCase()) ||
        action.subType
          .toLowerCase()
          .includes(actionsFilter.value.toLowerCase()) ||
        action.publicKey
          .toLowerCase()
          .includes(actionsFilter.value.toLowerCase()),
    );
  }

  return result;
});

watch(filteredActions, () => {
  nextTick(() => {
    if (actionsList.value) {
      actionsList.value.scrollTop = actionsList.value.scrollHeight;
    }
  });
});

function selectNode(publicKey: string) {
  federatedVotingStore.selectedNodeId = publicKey;
}
</script>

<style scoped>
.actions-panel {
  flex: 1;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  background-color: white;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.actions-list {
  overflow-y: auto;
  flex: 1;
}

.event-item {
  padding: 5px 0;
}

.action-item {
  padding: 2px 4px;
  margin: 2px 0;
}

.action-item:last-child {
  border-bottom: none;
}

.action-item span {
  flex: 1;
  margin-right: 10px;
}

.action-item button {
  margin-left: 0.1rem;
  padding: 0rem 0.2rem;
  font-size: 0.65rem;
}

.action-item:hover {
  background-color: #e9ecef;
}
.action-sub-type {
  font-weight: bold;
  margin-right: 10px;
}
.action-public-key {
  background-color: #e9ecef;
  padding: 0px 6px;
  border-radius: 4px;
  font-weight: bold;
  margin-right: 8px;
  text-transform: none;
  display: inline-block;
  font-size: 11px;
  word-break: break-all;
}
.search-box {
  margin-bottom: 5px;
}
.disrupted-item {
  background-color: #f8d7da;
  font-style: italic;
}

.disrupted-item button {
  background-color: #dc3545;
  color: white;
}

.disrupted-item:hover {
  background-color: #f9ced2;
}
.clickable {
  cursor: pointer;
}

.clickable:hover {
  color: #0056b3;
  background-color: white;
}

.neighbor-list {
  padding: 10px;
}

.form-check {
  padding: 8px;
  margin: 4px 0;
  border-radius: 4px;
}

.form-check:hover {
  background-color: #f8f9fa;
}

.actions-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding: 5px 0;
}

.text-center {
  text-align: center;
}
</style>
