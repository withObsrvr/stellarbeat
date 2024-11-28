<template>
  <div>
    <!-- Control Panel -->
    <div class="card mt-2">
      <div class="card-header d-flex justify-content-between pl-2">
        <nav class="navbar p-0">
          <div class="btn-group" role="group">
            <button
              class="btn btn-secondary btn-sm"
              :disabled="
                !federatedVotingStore.simulation.hasPreviousStep() || playing
              "
              @click="goBackOneStep"
            >
              <BIconSkipBackwardFill class="icon-color" />
            </button>
            <button
              class="btn btn-success btn-sm"
              :disabled="
                !federatedVotingStore.simulation.hasNextStep() || playing
              "
              @click="play"
            >
              <BIconPlayFill class="icon-color" />
            </button>
            <button
              :disabled="
                !federatedVotingStore.simulation.hasNextStep() || playing
              "
              class="btn btn-primary btn-sm"
              @click="executeNextStep"
            >
              <BIconSkipForwardFill class="icon-color" />
            </button>
            <button
              class="btn btn-secondary btn-sm"
              :disabled="!federatedVotingStore.simulation.hasPreviousStep()"
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
      <!-- Tick Time Animation -->
      <div v-show="playing" class="tick-animation">
        <div ref="progressBar" class="progress-bar"></div>
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
import ConsoleLog from "@/components/federated-voting/simulation-control/event-log.vue";
import { onMounted, onBeforeUnmount, nextTick } from "vue";
import {
  BIconPlayFill,
  BIconSkipBackwardFill,
  BIconSkipForwardFill,
  BIconStopFill,
} from "bootstrap-vue";
import { ref } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import Actions from "./actions.vue";

const playing = ref(false);
const tickTime = 2000;
const progressBar = ref<HTMLElement | null>(null);
let playInterval: NodeJS.Timeout | null = null;

function play() {
  playing.value = true;
  resetAnimation();
  if (federatedVotingStore.simulation.hasNextStep()) {
    executeNextStep();
  }
  playInterval = setInterval(() => {
    if (federatedVotingStore.simulation.hasNextStep()) {
      resetAnimation();
      executeNextStep();
    } else {
      clearPlayingInterval();
      playing.value = false;
    }
  }, tickTime);
}

function resetAnimation() {
  nextTick(() => {
    if (progressBar.value) {
      // Restart the animation
      progressBar.value.style.animation = "none";
      // Trigger reflow to restart the animation
      void progressBar.value.offsetWidth;
      progressBar.value.style.animation = `tickAnimation ${tickTime}ms linear`;
    }
  });
}

const clearPlayingInterval = () => {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
};

function stop() {
  if (playing.value) {
    clearPlayingInterval();
    playing.value = false;
  } else {
    reset();
  }
}

function executeNextStep() {
  federatedVotingStore.simulation.executeStep();
}

function reset() {
  federatedVotingStore.simulation.goToFirstStep();
}

function goBackOneStep() {
  federatedVotingStore.simulation.goBackOneStep();
}

// Keydown event handler
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "n") {
    if (federatedVotingStore.simulation.hasNextStep()) {
      executeNextStep();
      event.preventDefault();
    }
  }
  if (event.key === "N") {
    if (federatedVotingStore.simulation.hasPreviousStep()) {
      goBackOneStep();
    }
    event.preventDefault();
  }
};

onMounted(() => {
  document.addEventListener("keydown", handleKeydown, { capture: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown, { capture: true });
  clearPlayingInterval();
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

.tick-animation {
  position: relative;
  height: 4px;
  background-color: #e9ecef;
  overflow: hidden;
}

.tick-animation .progress-bar {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background-color: #28a745;
  animation: tickAnimation linear infinite;
}
</style>
<style>
@keyframes tickAnimation {
  from {
    left: -101%;
  }
  to {
    left: -1%;
  }
}
</style>
