<template>
  <div>
    <!-- Control Panel -->
    <div class="card mt-2">
      <div class="card-header d-flex justify-content-between pl-2">
        <nav class="navbar p-0">
          <div class="btn-group" role="group">
            <button
              class="btn btn-secondary btn-sm"
              :disabled="!started"
              @click="goBackOneStep"
            >
              <BIconSkipBackwardFill class="icon-color" />
            </button>
            <button class="btn btn-primary btn-sm" @click="play">
              <BIconSkipForwardFill class="icon-color" />
            </button>
            <button
              class="btn btn-secondary btn-sm"
              :disabled="!started"
              @click="stop"
            >
              <BIconStopFill class="icon-color" />
            </button>
          </div>
        </nav>
        <div>
          <scenario-selector />
        </div>
      </div>
      <!-- Content area: Console Output and Events Panel -->
      <div class="card-body p-2 d-flex" style="max-height: 250px">
        <console-log />
        <!-- Events Panel -->
        <div
          class="events-panel"
          style="
            width: 250px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            background-color: white;
            border: 1px solid lightgray;
            padding: 10px;
            display: flex;
            flex-direction: column;
          "
        >
          <!-- Events Search Box -->
          <div class="mb-2">
            <input
              v-model="eventsSearchQuery"
              type="text"
              class="form-control form-control-sm"
              placeholder="Search events"
            />
          </div>
          <!-- Events List -->
          <div style="overflow-y: auto; flex: 1">
            <div
              v-for="(event, index) in filteredEvents"
              :key="event.id"
              class="event-item d-flex justify-content-between align-items-center mb-2"
              :style="
                event.type === 'Action' ? 'background-color: #e0f7ff;' : ''
              "
            >
              <span>{{ event.message }}</span>
              <button
                class="btn btn-sm"
                :class="event.type === 'Action' ? 'btn-primary' : 'btn-danger'"
                @click="handleEventAction(index)"
              >
                {{ event.type === "Action" ? "Cancel" : "Disrupt" }}
              </button>
            </div>
          </div>
          <!-- Events Counter Footer -->
          <div class="mt-2 text-center text-muted" style="font-size: 0.9em">
            {{ events.length }} events will be executed
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScenarioSelector from "@/components/federated-voting/scenario-selector.vue";
import ConsoleLog from "@/components/federated-voting/console-log.vue";

import {
  BIconSkipBackwardFill,
  BIconSkipForwardFill,
  BIconStopFill,
} from "bootstrap-vue";
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const started = ref(false);

function play() {
  started.value = true;
  federatedVotingStore.simulationPlayer.next();
}

function stop() {
  started.value = false;
}

function goBackOneStep() {
  //nothing yet
}

function handleEventAction(index: number) {
  const event = filteredEvents.value[index];
  const originalIndex = events.value.findIndex((e) => e.id === event.id);
  if (event.type === "Action") {
    // Handle cancel action
    const canceledEvent = events.value.splice(originalIndex, 1)[0];
  } else if (event.type === "Protocol") {
    // Handle disrupt action
    const disruptedEvent = events.value.splice(originalIndex, 1)[0];
  }
}

const eventsSearchQuery = ref("");
const events = ref(
  Array.from({ length: 30 }, (_, i) => {
    const type = i % 2 === 0 ? "Action" : "Protocol";
    const message =
      type === "Action"
        ? `Node ${i + 1} performs action: Vote(item ${i + 1})`
        : `Node ${i + 1} sends message: Update(item ${i + 1})`;
    return { id: i, type, message };
  }),
);

const filteredEvents = computed(() => {
  let filtered = events.value;
  if (eventsSearchQuery.value) {
    filtered = filtered.filter((event) =>
      event.message
        .toLowerCase()
        .includes(eventsSearchQuery.value.toLowerCase()),
    );
  }
  return filtered;
});
</script>

<style scoped>
.navbar {
  display: flex;
  padding: 1em;
  justify-content: space-between;
  flex-direction: row;
  background-color: white;
}

.button-group {
  display: flex;
  gap: 1em;
}

.navbar-item {
  padding: 0.5em 1em;
  background-color: white;
  color: gray;
  border: 1px solid lightgray;
  border-radius: 5px;
  cursor: pointer;
}

/* Additional styles for layout */
.card {
  background-color: white;
}

.card-header {
  background-color: white;
}

.card-body {
  background-color: white;
}

.event-item {
  padding: 5px 0;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
