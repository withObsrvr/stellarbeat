<template>
  <div
    class="console-output"
    style="
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
    "
  >
    <!-- Console Search Box -->
    <div class="mb-2">
      <input
        v-model="consoleSearchQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="Search console logs"
      />
    </div>
    <!-- Console Logs -->
    <div ref="logContainer" style="overflow-y: auto; flex: 1">
      <div
        v-for="item in filteredConsoleLogs"
        :key="item.lineNumber"
        :class="[
          'log-entry',
          item.stepIndex % 2 === 0 ? 'step-even' : 'step-odd',
        ]"
      >
        {{ item.lineNumber }}| {{ item.log }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { watch } from "vue";

const logContainer = ref<HTMLElement | null>(null);
const consoleSearchQuery = ref("");

const filteredConsoleLogs = computed(() => {
  const eventLogs = federatedVotingStore.simulation.getFullEventLog(); // Returns Event[][]

  // Flatten the events while adding step index and event index
  const logsWithLineNumbers = eventLogs.flatMap((events, stepIndex) => {
    return events.map((event, eventIndex) => {
      return {
        log: event.toString(),
        lineNumber: `${stepIndex}.${eventIndex + 1}`,
        stepIndex: stepIndex,
      };
    });
  });

  if (consoleSearchQuery.value) {
    return logsWithLineNumbers.filter((item) =>
      item.log.toLowerCase().includes(consoleSearchQuery.value.toLowerCase()),
    );
  }
  return logsWithLineNumbers;
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
.log-entry {
  padding: 2px;
}

.log-entry.step-odd {
  background-color: white;
}

.log-entry.step-even {
  background-color: #f8f9fa; /* Light gray */
}
</style>
