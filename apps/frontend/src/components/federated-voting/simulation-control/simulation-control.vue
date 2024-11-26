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
              @click="reset"
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
        <actions />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScenarioSelector from "@/components/federated-voting/simulation-control/scenario-selector.vue";
import ConsoleLog from "@/components/federated-voting/simulation-control/console-log.vue";

import {
  BIconSkipBackwardFill,
  BIconSkipForwardFill,
  BIconStopFill,
} from "bootstrap-vue";
import { ref } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import Actions from "./actions.vue";

const started = ref(false);

function play() {
  started.value = true;
  federatedVotingStore.simulation.executeStep();
}

function reset() {
  started.value = false;
  federatedVotingStore.simulation.goToFirstStep();
}

function goBackOneStep() {
  federatedVotingStore.simulation.goBackOneStep();
}
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
</style>
