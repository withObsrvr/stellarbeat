<template>
  <div class="actions-panel">
    <!-- Actions Search Box -->
    <div class="mb-2">
      <input
        v-model="actionsFilter"
        type="text"
        class="form-control form-control-sm"
        placeholder="Filter actions"
      />
    </div>
    <!-- Actions List -->
    <div class="actions-list">
      <div
        v-for="action in actions"
        :key="action.toString()"
        class="action-item"
        :style="
          action instanceof ProtocolAction
            ? 'background-color: #e0f7ff;'
            : 'background-color: #f5f7fb'
        "
      >
        <span>{{ action.toString() }}</span>
        <button
          class="btn btn-sm"
          :class="action instanceof UserAction ? 'btn-primary' : 'btn-danger'"
          @click="handleEventAction(action)"
        >
          {{ action instanceof UserAction ? "Cancel" : "Disrupt" }}
        </button>
      </div>
    </div>
    <!-- Events Counter Footer -->
    <div class="mt-2 text-center text-muted" style="font-size: 0.9em">
      {{ actions.length }} actions will be executed
    </div>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { ProtocolAction, UserAction } from "scp-simulation";
import { ref, computed } from "vue";

function handleEventAction(action: ProtocolAction | UserAction) {
  //todo
}

const actionsFilter = ref("");
const actions = computed(() => {
  return federatedVotingStore.simulation
    .pendingProtocolActions()
    .concat(federatedVotingStore.simulation.pendingUserActions());
});

const filteredActions = computed(() => {
  let filteredActions = actions.value;
  if (actionsFilter.value) {
    filteredActions = filteredActions.filter((event) =>
      event
        .toString()
        .toLowerCase()
        .includes(actionsFilter.value.toLowerCase()),
    );
  }
  return actions;
});
</script>

<style scoped>
.actions-panel {
  width: 250px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  background-color: white;
  border: 1px solid lightgray;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>
