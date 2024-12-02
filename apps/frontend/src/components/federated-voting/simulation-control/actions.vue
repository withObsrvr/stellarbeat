<template>
  <div class="actions-panel">
    <!-- Actions Search Box -->
    <div class="search-box">
      <input
        v-model="actionsFilter"
        type="text"
        class="form-control form-control-sm"
        placeholder="Filter actions"
      />
    </div>
    <!-- Actions List -->
    <div ref="actionsList" class="actions-list">
      <div
        v-for="action in filteredActions"
        :key="action.toString()"
        class="action-item"
      >
        <span class="action-public-key">{{ action.publicKey }}</span>
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
          Disrupt
        </button>
      </div>
    </div>
    <!-- Events Counter Footer -->
    <div class="mt-2 text-center text-muted" style="font-size: 0.9em">
      {{ actions.length }} actions will be executed next
    </div>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { ProtocolAction, UserAction } from "scp-simulation";
import { ref, computed, watch, nextTick } from "vue";

const actionsList = ref<HTMLElement | null>(null);

function handleEventAction(action: ProtocolAction) {
  //todo
}
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
  ];
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
</style>
