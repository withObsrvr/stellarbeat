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
    <div style="overflow-y: auto; flex: 1">
      <div v-for="item in filteredConsoleLogs" :key="item.lineNumber">
        {{ item.lineNumber }}. {{ item.log }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const consoleSearchQuery = ref("");
const filteredConsoleLogs = computed(() => {
  const logsWithLineNumbers = federatedVotingStore.log.map((log, index) => ({
    log,
    lineNumber: index + 1,
  }));

  if (consoleSearchQuery.value) {
    return logsWithLineNumbers.filter((item) =>
      item.log.toLowerCase().includes(consoleSearchQuery.value.toLowerCase()),
    );
  }
  return logsWithLineNumbers;
});
</script>

<style scoped></style>
