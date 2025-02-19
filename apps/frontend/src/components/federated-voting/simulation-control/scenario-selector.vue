<template>
  <div>
    <select id="scenario" v-model="selectedScenario" class="fv-dropdown">
      <option
        v-for="scenario in federatedVotingStore.scenarios"
        :key="scenario.id"
        :value="scenario.id"
      >
        {{ scenario.label }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { computed } from "vue";

const selectedScenario = computed({
  get: () => federatedVotingStore.selectedScenarioId,
  set: (value: string) => {
    federatedVotingStore.selectScenario(value);
  },
});
</script>

<style scoped>
.fv-dropdown {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  min-width: 200px;
}
</style>
