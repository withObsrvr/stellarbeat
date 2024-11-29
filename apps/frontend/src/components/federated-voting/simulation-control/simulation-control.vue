<template>
  <div>
    <!-- Control Panel -->
    <div class="card mt-2">
      <div class="card-header">
        <h4 class="card-title">Network Events and Actions</h4>
      </div>
      <div class="card-body p-2 d-flex">
        <div class="row w-100">
          <div class="col-lg-8">
            <EventLog style="height: 250px" />
          </div>
          <div class="col-lg-4">
            <actions style="height: 250px" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick } from "vue";
import { ref } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import Actions from "./actions.vue";
import EventLog from "./event-log.vue";

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

<style scoped></style>
