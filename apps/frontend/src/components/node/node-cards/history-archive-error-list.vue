<template>
  <div v-if="errors.length > 0">
    <button
      type="button"
      class="btn btn-sm btn-outline-secondary"
      @click="expanded = !expanded"
    >
      {{ errors.length }} error(s) detected
      <span v-if="expanded">&#9650;</span>
      <span v-else>&#9660;</span>
    </button>

    <div v-if="expanded" class="mt-2">
      <ul class="list-unstyled error-list">
        <li v-for="(error, index) in errors" :key="index" class="mb-2">
          <a :href="error.url" target="_blank" rel="noopener noreferrer">
            {{ truncateUrl(error.url) }}
          </a>
          <br />
          <small class="text-muted">{{ error.message }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { HistoryArchiveScanError } from "shared";

defineProps<{
  errors: HistoryArchiveScanError[];
}>();

const expanded = ref(false);

function truncateUrl(url: string): string {
  if (url.length <= 80) return url;
  return url.substring(0, 77) + "...";
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
