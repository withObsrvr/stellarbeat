<template>
  <div class="scenario-controls">
    <select id="scenario" v-model="selectedScenarioId" class="fv-dropdown">
      <option
        v-for="scenario in federatedVotingStore.scenarios"
        :key="scenario.id"
        :value="scenario.id"
      >
        {{ scenario.name }}
      </option>
    </select>
    <button
      class="btn btn-sm"
      title="Reset current scenario"
      @click="resetScenario"
    >
      <BIconArrowClockwise />
    </button>
    <button
      class="btn btn-sm"
      title="Network Settings"
      @click="showSettingsModal"
    >
      <BIconGear />
    </button>
    <button class="btn btn-sm" title="Export Scenario" @click="showExportModal">
      <BIconDownload />
    </button>
    <button class="btn btn-sm" title="Import Scenario" @click="showImportModal">
      <BIconUpload />
    </button>

    <BModal
      id="settings-modal"
      ref="settingsModal"
      title="Network Settings for Scenario"
    >
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

    <BModal
      id="export-modal"
      ref="exportModal"
      title="Export Scenario"
      size="lg"
    >
      <p>Copy the JSON below to save this scenario configuration:</p>
      <div class="export-json-container">
        <pre><code>{{ exportedScenario }}</code></pre>
      </div>
      <template #modal-footer>
        <button class="btn btn-primary" @click="copyToClipboard">
          Copy to Clipboard
        </button>
        <button class="btn btn-secondary" @click="hideExportModal">
          Close
        </button>
      </template>
    </BModal>

    <BModal
      id="import-modal"
      ref="importModal"
      title="Import Scenario"
      size="lg"
      @ok="importScenario"
    >
      <div v-if="importError" class="alert alert-danger">
        <strong>Error:</strong> {{ importError }}
      </div>
      <p>Paste the scenario JSON below:</p>
      <div class="form-group">
        <textarea
          v-model="importJsonText"
          class="form-control import-json-textarea"
          placeholder="Paste JSON here..."
          rows="10"
        ></textarea>
      </div>
      <template #modal-footer="{ ok, cancel }">
        <button class="btn btn-secondary" @click="cancel()">Cancel</button>
        <button class="btn btn-primary" @click="ok()">Import</button>
      </template>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import {
  BIconArrowClockwise,
  BIconGear,
  BIconDownload,
  BIconUpload,
} from "bootstrap-vue";
import { BModal } from "bootstrap-vue";
import { computed, ref } from "vue";

const selectedScenarioId = computed({
  get: () => federatedVotingStore.selectedScenario.id,
  set: (value: string) => {
    federatedVotingStore.selectScenario(value);
  },
});

const isFullyConnected = ref(federatedVotingStore.overlayIsFullyConnected);
const isGossipEnabled = ref(federatedVotingStore.overlayIsGossipEnabled);
const settingsModal = ref<BModal | null>(null);
const exportModal = ref<BModal | null>(null);
const exportedScenario = ref("");
const importModal = ref<BModal | null>(null);
const importJsonText = ref("");
const importError = ref("");

function reloadScenario() {
  federatedVotingStore.selectScenario(
    selectedScenarioId.value,
    isFullyConnected.value,
    isGossipEnabled.value,
  );
}

function resetScenario() {
  federatedVotingStore.selectScenario(selectedScenarioId.value);
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

function showExportModal() {
  exportedScenario.value = JSON.stringify(
    federatedVotingStore.exportScenario(),
    null,
    2,
  );
  if (exportModal.value) {
    exportModal.value.show();
  }
}

function hideExportModal() {
  if (exportModal.value) {
    exportModal.value.hide();
  }
}

function copyToClipboard() {
  navigator.clipboard
    .writeText(exportedScenario.value)
    .then(() => {
      alert("Copied to clipboard!");
    })
    .catch((err) => {
      console.error("Could not copy text: ", err);
    });
}

function showImportModal() {
  importJsonText.value = "";
  importError.value = "";
  if (importModal.value) {
    importModal.value.show();
  }
}

function hideImportModal() {
  if (importModal.value) {
    importModal.value.hide();
  }
}

function importScenario() {
  try {
    const scenarioData = importJsonText.value;
    federatedVotingStore.importScenario(JSON.parse(scenarioData));
    importError.value = "";
    hideImportModal();
  } catch (err) {
    console.error(err);
    importError.value =
      err instanceof Error ? err.message : "Invalid JSON format";
  }
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

.export-json-container {
  max-height: 400px;
  overflow-y: auto;
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  font-family: monospace;
  font-size: 0.9rem;
}

.import-json-textarea {
  width: 100%;
  font-family: monospace;
  font-size: 0.9rem;
  resize: vertical;
}
</style>
