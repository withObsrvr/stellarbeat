<template>
  <div class="console-output">
    <div class="search-box">
      <input
        v-model="filterQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Filter Events"
      />
    </div>
    <div ref="logContainer" class="log-container">
      <div
        v-if="filteredConsoleLogs.length === 0 && filterQuery === ''"
        class="no-events-message"
      >
        No events yet, start the simulation
      </div>
      <div
        v-if="filteredConsoleLogs.length === 0 && filterQuery !== ''"
        class="no-events-message"
      >
        No results
      </div>

      <div
        v-for="item in filteredConsoleLogs"
        :key="item.lineNumber"
        class="log-line"
        :class="getBackgroundClass(item.stepIndex)"
      >
        <span class="line-number">{{ item.lineNumber }}</span>
        <span
          v-if="props.publicKey === null"
          class="event-publickey clickable"
          role="link"
          @click="selectNode(item.event.publicKey)"
          >{{ item.event.publicKey }}</span
        >
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

const props = withDefaults(
  defineProps<{
    publicKey?: string | null;
  }>(),
  {
    publicKey: null,
  },
);
const filterQuery = ref("");
const logContainer = ref<HTMLElement | null>(null);

const filteredConsoleLogs = computed(() => {
  const eventLogs = federatedVotingStore.getFullEventLog(); // Returns Event[][]
  const logsWithLineNumbers = eventLogs.flatMap((events, stepIndex) => {
    return events
      .filter(
        (event) =>
          event instanceof ProtocolEvent || event instanceof OverlayEvent,
      )
      .filter((event) =>
        props.publicKey ? event.publicKey === props.publicKey : true,
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

  if (filterQuery.value) {
    return logsWithLineNumbers.filter(
      (item) =>
        item.log.toLowerCase().includes(filterQuery.value.toLowerCase()) ||
        item.event.subType
          .toLowerCase()
          .includes(filterQuery.value.toLowerCase()) ||
        item.event.publicKey
          .toLowerCase()
          .includes(filterQuery.value.toLowerCase()),
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

function selectNode(publicKey: string) {
  federatedVotingStore.selectedNodeId = publicKey;
}
</script>

<style scoped>
.console-output {
  flex: 1;
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
.clickable {
  cursor: pointer;
}

.clickable:hover {
  color: #0056b3;
  background-color: white;
}
</style>
