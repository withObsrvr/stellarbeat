<template>
  <div class="actions-panel">
    <!-- Actions Search Box -->
    <div class="search-box">
      <input
        v-model="actionsFilter"
        type="text"
        class="form-control form-control-sm"
        placeholder="Filter actions executed next"
      />
    </div>
    <!-- Actions List -->
    <div ref="actionsList" class="actions-list">
      <div
        v-for="action in filteredActions"
        :key="action.description"
        class="action-item"
        :class="{
          'disrupted-item': isActionDisrupted(action.actionRef),
        }"
      >
        <span
          v-if="props.publicKey === null"
          class="action-public-key clickable"
          @click="selectNode(action.publicKey)"
          role="link"
        >
          {{ action.publicKey }}
        </span>
        <span class="action-sub-type">{{ mapSubType(action.subType) }}</span>
        <span>{{ action.description }}</span>
        <button
          v-if="action.actionRef instanceof ProtocolAction"
          class="btn btn-sm"
          :class="
            action.actionRef instanceof UserAction
              ? 'btn-primary'
              : 'btn-danger'
          "
          @click="handleEventAction(action.actionRef)"
        >
          {{ isActionDisrupted(action.actionRef) ? "Undisrupt" : "Disrupt" }}
        </button>
      </div>
      <div v-if="filteredActions.length === 0 && actionsFilter === ''">
        No actions will be executed next
      </div>
      <div v-if="filteredActions.length === 0 && actionsFilter !== ''">
        No results
      </div>
    </div>

    <!-- Events Counter Footer -->
    <div class="mt-2 text-center text-muted" style="font-size: 0.9em">
      {{ actions.length }} action(s) will be executed next
    </div>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { ProtocolAction, UserAction } from "scp-simulation";
import { ref, computed, watch, nextTick } from "vue";

const actionsList = ref<HTMLElement | null>(null);

const props = withDefaults(
  defineProps<{
    publicKey?: string | null;
  }>(),
  {
    publicKey: null,
  },
);

function handleEventAction(action: ProtocolAction) {
  if (!(action instanceof ProtocolAction)) {
    return;
  }

  if (isActionDisrupted(action)) {
    federatedVotingStore.simulation.undisrupt(action);
  } else {
    federatedVotingStore.simulation.disrupt(action);
  }
}

const isActionDisrupted = (action: ProtocolAction | UserAction) => {
  if (!(action instanceof ProtocolAction)) {
    return false;
  }
  return federatedVotingStore.simulation.isDisrupted(action);
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
    ...federatedVotingStore.simulation.pendingProtocolActions(),
    ...federatedVotingStore.simulation.pendingUserActions(),
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

  if (actionsFilter.value) {
    return mappedActions.filter(
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
  } else {
    return mappedActions;
  }
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
  margin-right: 10px;
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
</style>
