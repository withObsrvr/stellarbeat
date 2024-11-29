<template>
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
      <div
        v-for="item in filteredConsoleLogs"
        :key="item.lineNumber"
        :class="getBackgroundClass(item.stepIndex)"
      >
        <span class="line-number">{{ item.lineNumber }} | </span>
        <span class="log-entry">{{ item.log }}</span>
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
  const eventLogs = federatedVotingStore.simulation.getFullEventLog(); // Returns Event[][]

  // Flatten and filter the events while adding step index and event index
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
      .filter((item) =>
        item.log.toLowerCase().includes(filter.value.toLowerCase()),
      );
  });
});

// Method to determine class based on step index
function getBackgroundClass(stepIndex: number) {
  return stepIndex % 2 === 0 ? "even-step" : "odd-step";
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
.event-log {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.console-output {
  flex: 1;
  margin-right: 10px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  background-color: white;
  border: 1px solid lightgray;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.search-box {
  margin-bottom: 5px;
}

.log-container {
  overflow-y: auto;
  flex: 1;
}

.line-number {
  color: #999;
  margin-right: 5px;
}

/* Alternating background styles */
.even-step {
  background-color: #ffffff; /* White background */
}

.odd-step {
  background-color: #f7f7f7; /* Light gray background */
}

/* Optional: Style for log entries */
.line-number {
  color: #999;
  margin-right: 5px;
}

input[type="text"] {
  padding: 5px;
  margin-bottom: 5px;
  font-size: 14px;
}
</style>
