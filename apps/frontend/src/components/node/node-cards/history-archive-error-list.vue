<template>
  <div v-if="errors.length > 0">
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="expanded = !expanded"
    >
      {{ formatCount(totalErrorCount) }} error(s) detected
      <span v-if="expanded">&#9650;</span>
      <span v-else>&#9660;</span>
    </button>

    <div v-if="expanded" class="mt-2">
      <ul class="list-unstyled error-list">
        <li v-for="(error, index) in errors" :key="index" class="error-item">
          <div class="error-header">
            <span class="badge bg-warning text-dark me-2">{{
              formatCategory(error.category)
            }}</span>
            <span class="error-count">Count: {{ formatCount(error.count) }}</span>
          </div>

          <div class="error-details">
            <div v-if="error.firstLedger !== null" class="detail-row">
              <span class="detail-prefix">&#9500;&#9472;</span>
              <span class="detail-label">First occurrence:</span>
              <span class="detail-value"
                >ledger {{ formatLedger(error.firstLedger) }}</span
              >
            </div>

            <div
              v-if="getFilePath(error.firstLedger, error.category)"
              class="detail-row file-path"
            >
              <span class="detail-prefix">&#9474;&nbsp;&nbsp;</span>
              <span class="detail-label">File:</span>
              <code class="detail-value">{{
                getFilePath(error.firstLedger, error.category)
              }}</code>
            </div>

            <div
              v-if="
                error.lastLedger !== null &&
                error.lastLedger !== error.firstLedger
              "
              class="detail-row"
            >
              <span class="detail-prefix">&#9500;&#9472;</span>
              <span class="detail-label">Last occurrence:</span>
              <span class="detail-value"
                >ledger {{ formatLedger(error.lastLedger) }}</span
              >
            </div>

            <div
              v-if="getRepairActionText(error.firstLedger, error.category)"
              class="detail-row action-row"
            >
              <span class="detail-prefix">&#9492;&#9472;</span>
              <span class="detail-label">Action:</span>
              <span class="detail-value">{{
                getRepairActionText(error.firstLedger, error.category)
              }}</span>
            </div>

            <div
              v-if="
                !error.firstLedger &&
                !getRepairActionText(error.firstLedger, error.category)
              "
              class="detail-row"
            >
              <span class="detail-prefix">&#9492;&#9472;</span>
              <small class="text-muted">{{ error.message }}</small>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { HistoryArchiveScanError } from "shared";
import {
  getCheckpointForLedger,
  getCheckpointFilePath,
  categoryToFileType,
} from "shared";

const props = defineProps<{
  errors: HistoryArchiveScanError[];
}>();

const expanded = ref(false);

const totalErrorCount = computed(() => {
  return props.errors.reduce((sum, error) => sum + error.count, 0);
});

function formatCategory(category: string): string {
  const categoryLabels: Record<string, string> = {
    TRANSACTION_SET_HASH: "Tx Set Hash Mismatch",
    TRANSACTION_RESULT_HASH: "Tx Result Hash Mismatch",
    LEDGER_HEADER_HASH: "Ledger Header Hash Mismatch",
    BUCKET_HASH: "Bucket Hash Mismatch",
    MISSING_FILE: "Missing File",
    CONNECTION: "Connection Error",
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
  return count.toLocaleString();
}

function formatLedger(ledger: number): string {
  return ledger.toLocaleString();
}

function getFilePath(
  firstLedger: number | null,
  category: string,
): string | null {
  if (firstLedger === null) return null;
  const fileType = categoryToFileType(category);
  if (!fileType) return null;
  const checkpoint = getCheckpointForLedger(firstLedger);
  return getCheckpointFilePath(checkpoint, fileType);
}

function getRepairActionText(
  firstLedger: number | null,
  category: string,
): string | null {
  if (firstLedger === null) return null;
  const fileType = categoryToFileType(category);
  if (!fileType) return null;
  const checkpoint = getCheckpointForLedger(firstLedger);
  return `Start repair at checkpoint ${checkpoint.toLocaleString()}`;
}
</script>

<style scoped>
.error-list {
  max-height: 400px;
  overflow-y: auto;
}

.error-item {
  padding: 12px;
  background-color: rgba(255, 193, 7, 0.1);
  border-radius: 6px;
  margin-bottom: 12px;
  font-family: system-ui, -apple-system, sans-serif;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.error-count {
  font-size: 0.85em;
  color: #6c757d;
  font-weight: 500;
}

.error-details {
  font-size: 0.9em;
  padding-left: 4px;
}

.detail-row {
  display: flex;
  align-items: baseline;
  margin-bottom: 2px;
  line-height: 1.6;
}

.detail-prefix {
  color: #6c757d;
  font-family: monospace;
  margin-right: 8px;
  flex-shrink: 0;
}

.detail-label {
  color: #6c757d;
  margin-right: 6px;
  flex-shrink: 0;
}

.detail-value {
  color: #212529;
  word-break: break-all;
}

.file-path code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
}

.action-row .detail-value {
  color: #0d6efd;
  font-weight: 500;
}
</style>
