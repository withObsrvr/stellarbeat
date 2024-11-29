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
        class="log-line"
      >
        <span class="line-number">{{ item.lineNumber }}</span>
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
  border: 1px solid #ddd;
  padding: 5px;
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

.log-line:hover {
  background-color: #f9f9f9;
}

input[type="text"] {
  padding: 5px;
  font-size: 12px;
  width: 100%;
  box-sizing: border-box;
}
</style>
