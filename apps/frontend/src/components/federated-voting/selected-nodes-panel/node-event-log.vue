<template>
  <div>
    <h3>Node Event Log</h3>
    <div class="console-output">
      <div class="search-box">
        <input
          v-model="filter"
          type="text"
          class="form-control form-control-sm"
          placeholder="Filter events"
        />
      </div>
      <div ref="logContainer" class="log-container">
        <div v-if="filteredConsoleLogs.length === 0" class="no-events-message">
          No events yet, start the simulation
        </div>
        <div
          v-for="item in filteredConsoleLogs"
          :key="item.lineNumber"
          :class="getBackgroundClass(item.stepIndex)"
        >
          <span class="line-number">{{ item.lineNumber }}</span>
          <span class="event-subtype">{{ item.event.subType }}</span>
          <span class="log-entry">{{ item.log }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { OverlayEvent, ProtocolEvent } from "scp-simulation";

const logContainer = ref<HTMLElement | null>(null);
const filter = ref("");

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

const filteredConsoleLogs = computed(() => {
  const eventLogs = federatedVotingStore.simulation.getFullEventLog();

  return eventLogs.flatMap((events, stepIndex) => {
    return events
      .filter(
        (event) =>
          event instanceof ProtocolEvent || event instanceof OverlayEvent,
      )
      .filter((event) => event.publicKey === selectedNodeId.value)
      .map((event, eventIndex) => ({
        log: event.toString(),
        lineNumber: `${stepIndex}.${eventIndex + 1}`,
        stepIndex: stepIndex,
        event: event,
      }))
      .filter(
        (item) =>
          item.log.toLowerCase().includes(filter.value.toLowerCase()) ||
          item.event.subType.toLowerCase().includes(filter.value.toLowerCase()),
      );
  });
});

// Method to determine class based on step index
function getBackgroundClass(stepIndex: number) {
  return stepIndex % 2 === 0 ? "even-step log-line" : "odd-step log-line";
}

watch(filteredConsoleLogs, () => {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
});
</script>

<style scoped>
.console-output {
  display: flex;
  flex-direction: column;

  border: 1px solid #ddd;
  height: 100%;
  font-family: monospace;
  font-size: 12px;
  background-color: #fff;
  padding: 10px;
}

.search-box {
  margin-bottom: 5px;
}

.log-container {
  height: 300px; /* Fixed height for the log container */
  overflow-y: auto;
  padding: 5px;
}

.log-line:hover {
  background-color: #e9ecef;
}

.log-line {
  display: flex;
  align-items: baseline;
  padding: 2px 0;
}

.line-number {
  color: #999;
  margin-right: 10px;
  min-width: 30px;
}

.event-subtype {
  font-weight: bold;
  margin-right: 10px;
}

.log-entry {
  flex: 1;
  word-break: break-word;
}

input[type="text"] {
  padding: 5px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
}
/* Alternating background styles */
.even-step {
  background-color: #ffffff; /* White background */
}

.odd-step {
  background-color: #f9f9f9; /* Light gray background */
}
</style>
