<template>
  <div v-if="errors.length > 0">
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="expanded = !expanded"
    >
      {{ totalErrorCount }} error(s) detected
      <span v-if="expanded">&#9650;</span>
      <span v-else>&#9660;</span>
    </button>

    <div v-if="expanded" class="mt-2">
      <ul class="list-unstyled error-list">
        <li v-for="(error, index) in errors" :key="index" class="mb-2">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <span class="badge bg-warning text-dark me-2">{{ formatCategory(error.category) }}</span>
              <span v-if="error.count > 1" class="badge bg-secondary">{{ formatCount(error.count) }}</span>
            </div>
          </div>
          <small class="text-muted">{{ error.message }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { HistoryArchiveScanError } from "shared";

const props = defineProps<{
  errors: HistoryArchiveScanError[];
}>();

const expanded = ref(false);

const totalErrorCount = computed(() => {
  return props.errors.reduce((sum, error) => sum + error.count, 0);
});

function formatCategory(category: string): string {
  const categoryLabels: Record<string, string> = {
    TRANSACTION_SET_HASH: "Tx Set Hash",
    TRANSACTION_RESULT_HASH: "Tx Result Hash",
    LEDGER_HEADER_HASH: "Ledger Hash",
    BUCKET_HASH: "Bucket Hash",
    MISSING_FILE: "Missing File",
    CONNECTION: "Connection",
    OTHER: "Other",
  };
  return categoryLabels[category] || category;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
</script>

<style scoped>
.error-list {
  max-height: 300px;
  overflow-y: auto;
}

.error-list li {
  padding: 4px 8px;
  background-color: rgba(255, 193, 7, 0.1);
  border-radius: 4px;
}
</style>
