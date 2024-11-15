<template>
  <div>
    <!-- Control Panel -->
    <div class="card mt-2">
      <div class="card-header d-flex justify-content-between pl-2">
        <nav class="navbar p-0">
          <div class="btn-group" role="group">
            <button
              v-if="isPaused"
              class="btn btn-primary btn-sm"
              @click="play"
            >
              <BIconPlayFill class="icon-color" />
            </button>
            <button v-else class="btn btn-success btn-sm" @click="pause">
              <BIconPauseFill class="icon-color" />
            </button>
            <button class="btn btn-secondary btn-sm" @click="forward">
              <BIconArrowCounterclockwise class="icon-color" />
            </button>
          </div>
        </nav>
        <div>
          <scenario-selector />
        </div>
      </div>
      <!-- Content area: Console Output and Events Panel -->
      <div class="card-body p-2 d-flex" style="max-height: 250px">
        <!-- Console Output -->
        <div
          class="console-output"
          style="
            flex: 1;
            margin-right: 10px;
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
          <!-- Console Search Box -->
          <div class="mb-2">
            <input
              v-model="consoleSearchQuery"
              type="text"
              class="form-control form-control-sm"
              placeholder="Search console logs"
            />
          </div>
          <!-- Console Logs -->
          <div style="overflow-y: auto; flex: 1">
            <div v-for="(log, index) in filteredConsoleLogs" :key="index">
              {{ log }}
            </div>
          </div>
        </div>
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
import {
  BIconArrowClockwise,
  BIconArrowCounterclockwise,
  BIconPauseFill,
  BIconPlayFill,
} from "bootstrap-vue";
import { ref, computed } from "vue";

const isPaused = ref(true);

function play() {
  isPaused.value = false;
  // Implement play logic
}

function pause() {
  isPaused.value = true;
  // Implement pause logic
}

function forward() {
  // Implement forward logic
}

function handleEventAction(index: number) {
  const event = filteredEvents.value[index];
  const originalIndex = events.value.findIndex((e) => e.id === event.id);
  if (event.type === "Action") {
    // Handle cancel action
    const canceledEvent = events.value.splice(originalIndex, 1)[0];
    consoleLogs.value.push(`Action event canceled: ${canceledEvent.message}`);
  } else if (event.type === "Protocol") {
    // Handle disrupt action
    const disruptedEvent = events.value.splice(originalIndex, 1)[0];
    consoleLogs.value.push(
      `Protocol event disrupted: ${disruptedEvent.message}`,
    );
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

const consoleFilterQuery = ref("");
const consoleSearchQuery = ref("");
const consoleLogs = ref(
  Array.from({ length: 50 }, (_, i) => `Log entry ${i + 1}: Sample log data.`),
);

const filteredConsoleLogs = computed(() => {
  let logs = consoleLogs.value;
  if (consoleFilterQuery.value) {
    logs = logs.filter((log) =>
      log.toLowerCase().includes(consoleFilterQuery.value.toLowerCase()),
    );
  }
  if (consoleSearchQuery.value) {
    logs = logs.filter((log) =>
      log.toLowerCase().includes(consoleSearchQuery.value.toLowerCase()),
    );
  }
  return logs;
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

.console-output {
  /* Additional styles can be added here */
}

.events-panel {
  /* Additional styles can be added here */
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}
</style>
