<template>
  <div class="scenario-controls">
    <select id="scenario" v-model="selectedScenario" class="fv-dropdown">
      <option
        v-for="scenario in federatedVotingStore.scenarios"
        :key="scenario.id"
        :value="scenario.id"
      >
        {{ scenario.label }}
      </option>
    </select>
    <button
      class="fv-button"
      title="Reload current scenario"
      @click="refreshScenario"
    >
      <BIconArrowClockwise />
    </button>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { BIconArrowClockwise } from "bootstrap-vue";
import { computed } from "vue";

const selectedScenario = computed({
  get: () => federatedVotingStore.selectedScenarioId,
  set: (value: string) => {
    federatedVotingStore.selectScenario(value);
  },
});

function refreshScenario() {
  federatedVotingStore.selectScenario(selectedScenario.value);
}
</script>

<style scoped>
.scenario-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.fv-dropdown {
  padding: 0rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  min-width: 200px;
}

.fv-button {
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.fv-button:hover {
  background-color: #f8f9fa;
}
</style>
