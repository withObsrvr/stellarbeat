<template>
  <div>
    <div class="card mb-3">
      <div class="card-header">
        <div class="row w-100 controls-row mr-2">
          <div class="col-lg-2 col-md-3 col-sm-12">
            <SimulationController
              ref="simulationController"
              @resetAnimation="resetAnimation"
            />
          </div>
          <div class="col-lg-10 col-md-9 col-sm-12">
            <ScenarioSelector />
          </div>
        </div>
        <InfoButton @click="showInfo" />
      </div>
      <!-- Tick Time Animation -->
      <div v-show="isPlaying" class="tick-animation">
        <div ref="progressBar" class="progress-bar"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, nextTick } from "vue";
import ScenarioSelector from "./scenario-selector.vue";
import InfoButton from "../info-box/info-button.vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import ControllerInfo from "./controller-info.vue";
import SimulationController from "./simulation-controller.vue";

const simulationController = ref<InstanceType<
  typeof SimulationController
> | null>(null);
const progressBar = ref<HTMLElement | null>(null);

const isPlaying = computed(() => {
  return simulationController.value?.playing || false;
});

function resetAnimation() {
  nextTick(() => {
    if (progressBar.value) {
      // Get tick time from simulation controller
      const tickTime = simulationController.value?.tickTime || 1000;

      // Restart the animation
      progressBar.value.style.animation = "none";
      // Trigger reflow to restart the animation
      void progressBar.value.offsetWidth;
      progressBar.value.style.animation = `tickAnimation ${tickTime}ms linear`;
    }
  });
}

function showInfo() {
  infoBoxStore.show(ControllerInfo);
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

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  row-gap: 0.4em;
  flex-wrap: wrap-reverse;
}

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
