<template>
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
</template>
<script setup lang="ts">
import {
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  ref,
  watch,
} from "vue";
import {
  BIconPauseFill,
  BIconPlayFill,
  BIconSkipBackwardFill,
  BIconSkipForwardFill,
  BIconStopFill,
} from "bootstrap-vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const playing = ref(false);
let playInterval: NodeJS.Timeout | null = null;

const tickTime = computed(
  () => federatedVotingStore.simulationStepDurationInSeconds * 1000,
);

let simulationUpdate = federatedVotingStore.simulationUpdate;

function play() {
  playing.value = true;
  // Emit an event for parent to handle animation reset
  emit("resetAnimation");

  if (federatedVotingStore.hasNextStep()) {
    executeNextStep();
    simulationUpdate = federatedVotingStore.simulationUpdate;
  }

  playInterval = setInterval(() => {
    if (federatedVotingStore.hasNextStep()) {
      // Emit an event for parent to handle animation reset
      emit("resetAnimation");
      executeNextStep();
      simulationUpdate = federatedVotingStore.simulationUpdate;
    } else {
      clearPlayingInterval();
      playing.value = false;
    }
  }, tickTime.value);
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

watch(
  () => federatedVotingStore.simulationUpdate,
  () => {
    console.log(simulationUpdate, federatedVotingStore.simulationUpdate);
    if (
      playing.value &&
      simulationUpdate !== federatedVotingStore.simulationUpdate
    ) {
      clearPlayingInterval();
      playing.value = false;
    }
  },
);

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

onMounted(() => {
  document.addEventListener("keydown", handleKeydown, { capture: true });
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown, { capture: true });
  clearPlayingInterval();
});

const emit = defineEmits(["resetAnimation"]);

// Export the playing state and tickTime for the parent component
defineExpose({
  playing,
  tickTime,
});
</script>

<style scoped>
.btn-group {
  display: inherit !important;
}
</style>
