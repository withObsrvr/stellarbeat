<template>
  <div class="console-output">
    <div class="search-box">
      <input
        v-model="consoleSearchQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Search events"
      />
    </div>
    <div ref="logContainer" class="log-container">
      <div v-if="filteredConsoleLogs.length === 0" class="no-events-message">
        No events yet, start the simulation
      </div>

      <div
        v-for="item in filteredConsoleLogs"
        :key="item.lineNumber"
        class="log-line"
        :class="getBackgroundClass(item.stepIndex)"
      >
        <span class="line-number">{{ item.lineNumber }}</span>
        <span class="event-publickey">{{ item.event.publicKey }}</span>
        <span class="event-subtype">{{ item.event.subType }}</span>
        <span class="log-entry">{{ item.log }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { OverlayEvent, ProtocolEvent } from "scp-simulation";

const consoleSearchQuery = ref("");
const logContainer = ref<HTMLElement | null>(null);

const filteredConsoleLogs = computed(() => {
  const eventLogs = federatedVotingStore.simulation.getFullEventLog(); // Returns Event[][]
  const logsWithLineNumbers = eventLogs.flatMap((events, stepIndex) => {
    return events
      .filter(
        (event) =>
          event instanceof ProtocolEvent || event instanceof OverlayEvent,
      )
      .map((event, eventIndex) => {
        return {
          log: event.toString(),
          lineNumber: `${stepIndex}.${eventIndex + 1}`,
          stepIndex: stepIndex,
          event: event,
        };
      });
  });

  if (consoleSearchQuery.value) {
    return logsWithLineNumbers.filter(
      (item) =>
        item.log
          .toLowerCase()
          .includes(consoleSearchQuery.value.toLowerCase()) ||
        item.event.subType
          .toLowerCase()
          .includes(consoleSearchQuery.value.toLowerCase()) ||
        item.event.publicKey
          .toLowerCase()
          .includes(consoleSearchQuery.value.toLowerCase()),
    );
  }
  return logsWithLineNumbers;
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
  flex: 1;
  margin-right: 10px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  background-color: white;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.search-box {
  margin-bottom: 5px;
}

.log-container {
  overflow-y: auto;
  padding: 5px;
}

/* Alternating background styles */
.even-step {
  background-color: #ffffff; /* White background */
}

.odd-step {
  background-color: #f9f9f9; /* Light gray background */
}

/* Optional: Style for log entries */
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

.log-line {
  display: flex;
  align-items: baseline;
  padding: 2px 0;
}

.log-line:hover {
  background-color: #e9ecef;
}

input[type="text"] {
  padding: 5px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
}

.event-publickey {
  background-color: #e9ecef;
  padding: 0px 6px;
  border-radius: 4px;
  font-weight: bold;
  margin-right: 8px;
  text-transform: none;
  display: inline-block;
  font-size: 11px;
  word-break: break-all;
}
</style>
