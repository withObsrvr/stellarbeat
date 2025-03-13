<template>
  <div>
    <div class="card mb-3">
      <div class="card-header">
        <div class="controls-container">
          <div class="controls-main">
            <div class="btn-group" role="group">
              <button
                class="btn btn-secondary btn-sm"
                :disabled="!federatedVotingStore.hasPreviousStep() || playing"
                @click="goBackOneStep"
              >
                <BIconSkipBackwardFill class="icon-color" />
              </button>
              <button
                class="btn btn-success btn-sm"
                :disabled="!federatedVotingStore.hasNextStep() || playing"
                @click="play"
              >
                <BIconPlayFill class="icon-color" />
              </button>
              <button
                :disabled="!federatedVotingStore.hasNextStep() || playing"
                class="btn btn-primary btn-sm"
                @click="executeNextStep"
              >
                <BIconSkipForwardFill class="icon-color" />
              </button>
              <button
                class="btn btn-secondary btn-sm"
                :disabled="!federatedVotingStore.hasPreviousStep()"
                @click="stop"
              >
                <BIconStopFill v-if="!playing" class="icon-color" />
                <BIconPauseFill v-else class="icon-color" />
              </button>
            </div>
            <ScenarioSelector />
          </div>
          <InfoButton @click="showInfo" />
        </div>
      </div>
      <!-- Tick Time Animation -->
      <div v-show="playing" class="tick-animation">
        <div ref="progressBar" class="progress-bar"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import {
  BIconPauseFill,
  BIconPlayFill,
  BIconSkipBackwardFill,
  BIconSkipForwardFill,
  BIconStopFill,
} from "bootstrap-vue";
import { ref } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import ScenarioSelector from "./scenario-selector.vue";
import InfoButton from "../info-box/info-button.vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import ControllerInfo from "./controller-info.vue";

const playing = ref(false);
const progressBar = ref<HTMLElement | null>(null);
let playInterval: NodeJS.Timeout | null = null;

const tickTime = computed(
  () => federatedVotingStore.simulationStepDurationInSeconds * 1000,
);

function play() {
  playing.value = true;
  resetAnimation();
  if (federatedVotingStore.hasNextStep()) {
    executeNextStep();
  }
  playInterval = setInterval(() => {
    if (federatedVotingStore.hasNextStep()) {
      resetAnimation();
      executeNextStep();
    } else {
      clearPlayingInterval();
      playing.value = false;
    }
  }, tickTime.value);
}

function resetAnimation() {
  nextTick(() => {
    if (progressBar.value) {
      // Restart the animation
      progressBar.value.style.animation = "none";
      // Trigger reflow to restart the animation
      void progressBar.value.offsetWidth;
      progressBar.value.style.animation = `tickAnimation ${tickTime.value}ms linear`;
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
  federatedVotingStore.executeStep();
}

function reset() {
  federatedVotingStore.reset();
}

function goBackOneStep() {
  federatedVotingStore.goBackOneStep();
}

// Keydown event handler
const handleKeydown = (event: KeyboardEvent) => {
  // Check if focus is in an editable element - if so, don't handle the keystroke
  const target = event.target as HTMLElement;
  const isEditableElement =
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.contentEditable === "true" ||
    target.isContentEditable;

  if (isEditableElement) {
    return;
  }

  if (event.key === "n") {
    if (federatedVotingStore.hasNextStep()) {
      executeNextStep();
    }
  }
  if (event.key === "N") {
    if (federatedVotingStore.hasPreviousStep()) {
      goBackOneStep();
    }
  }
};

function showInfo() {
  infoBoxStore.show(ControllerInfo);
}

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

.controls-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.controls-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  gap: 1rem;
}

.btn-group {
  display: flex;
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
