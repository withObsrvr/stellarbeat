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
      title="Reset current scenario"
      @click="resetScenario"
    >
      <BIconArrowClockwise />
    </button>
    <button
      class="fv-button"
      title="Network Settings"
      @click="showSettingsModal"
    >
      <BIconGear />
    </button>

    <BModal id="settings-modal" ref="settingsModal" title="Network Settings">
      <div class="alert alert-warning">
        <strong>Warning:</strong> Changing these settings will reset the current
        scenario.
      </div>

      <div class="mb-3">
        <div class="form-check form-switch">
          <input
            id="fullyConnectedToggle"
            v-model="isFullyConnected"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="fullyConnectedToggle">
            Overlay: Fully connected
          </label>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-check form-switch">
          <input
            id="gossipToggle"
            v-model="isGossipEnabled"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="gossipToggle">
            Overlay: Message Gossip enabled
          </label>
        </div>
      </div>

      <template #modal-footer>
        <button class="btn btn-secondary" @click="hideModal()">Cancel</button>
        <button class="btn btn-primary" @click="saveSettings">Save</button>
      </template>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { BIconArrowClockwise, BIconGear } from "bootstrap-vue";
import { BModal } from "bootstrap-vue";
import { computed, ref } from "vue";

const selectedScenario = computed({
  get: () => federatedVotingStore.selectedScenarioId,
  set: (value: string) => {
    federatedVotingStore.selectScenario(value);
  },
});

const isFullyConnected = ref(federatedVotingStore.overlayIsFullyConnected);
const isGossipEnabled = ref(federatedVotingStore.overlayIsGossipEnabled);
const settingsModal = ref<BModal | null>(null);

function reloadScenario() {
  federatedVotingStore.selectScenario(
    selectedScenario.value,
    isFullyConnected.value,
    isGossipEnabled.value,
  );
}

function resetScenario() {
  isFullyConnected.value = true; //when we have better scenario's, values will be encapsulated there
  isGossipEnabled.value = false;
  reloadScenario();
}

function showSettingsModal() {
  isFullyConnected.value = federatedVotingStore.overlayIsFullyConnected;
  isGossipEnabled.value = federatedVotingStore.overlayIsGossipEnabled;
  if (settingsModal.value !== null) {
    settingsModal.value.show();
  }
}

function hideModal() {
  if (settingsModal.value) {
    settingsModal.value.hide();
  }
}

function saveSettings() {
  reloadScenario();
  hideModal();
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
