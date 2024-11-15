<template>
  <div>
    <!-- Console View -->
    <div class="card mt-2">
      <div class="card-header d-flex justify-content-between pl-2">
        <nav class="navbar p-0">
          <div class="btn-group" role="group">
            <button v-if="isPaused" class="btn btn-primary" @click="play">
              <BIconPlayFill class="icon-color" />
            </button>
            <button v-else class="btn btn-success" @click="pause">
              <BIconPauseFill class="icon-color" />
            </button>
            <button class="btn btn-secondary" @click="forward">
              <BIconArrowClockwise class="icon-color" />
            </button>
          </div>
        </nav>
        <input
          v-model="consoleFilterQuery"
          type="text"
          class="form-control form-control-sm"
          placeholder="Filter logs"
          style="width: 150px"
        />
      </div>
      <div
        class="card-body p-2"
        style="
          max-height: 200px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
        "
      >
        <div v-for="(log, index) in filteredConsoleLogs" :key="index">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BIconArrowClockwise,
  BIconPauseFill,
  BIconPlayFill,
} from "bootstrap-vue";
import { ref, computed } from "vue";
import ScenarioSelector from "@/components/federated-voting/scenario-selector.vue";

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

const events = ref([
  "Node 1 sends message: Vote(pizza)",
  "Node 2 sends message: Vote(pasta)",
  "Node 3 sends message: Vote(sushi)",
  "Node 4 sends message: Vote(burger)",
  "Node 5 sends message: Vote(salad)",
]);

const consoleFilterQuery = ref("");

const filteredConsoleLogs = computed(() => {
  if (!consoleFilterQuery.value) {
    return consoleLogs.value;
  }
  return consoleLogs.value.filter((log) =>
    log.toLowerCase().includes(consoleFilterQuery.value.toLowerCase()),
  );
});

// Mockup console logs
const consoleLogs = ref([
  "Protocol started...",
  "Node 1 sends message: Vote(pizza)",
  "Node 2 sends message: Vote(pasta)",
  "Node 3 sends message: Vote(sushi)",
  "Node 4 sends message: Vote(burger)",
  "Node 5 sends message: Vote(salad)",
  "Node 1 received message: Vote(pizza)",
  "Node 2 received message: Vote(pasta)",
  "Node 3 received message: Vote(sushi)",
  "Node 4 received message: Vote(burger)",
  "Node 5 received message: Vote(salad)",
]);
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
</style>
