<template>
  <div class="threshold-selector">
    <select
      :key="`${nrOfTrustedNodes}-${trustThreshold}`"
      class="form-select form-select-sm"
      :class="{ modified: isModified }"
      :value="trustThreshold"
      @change="updateThreshold($event)"
    >
      <option v-for="n in thresholdOptions" :key="n" :value="n">
        {{ n }}/{{ nrOfTrustedNodes }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  nrOfTrustedNodes: number;
  trustThreshold: number;
  isModified: boolean;
}>();

const emit = defineEmits<{
  (e: "threshold-changed", value: number): void;
}>();

const thresholdOptions = computed(() => {
  if (props.nrOfTrustedNodes === 0) return [0];

  // Get options from 1 to validatorCount
  const options = Array.from(
    { length: props.nrOfTrustedNodes },
    (_, i) => i + 1,
  );

  return options;
});

function updateThreshold(event: Event): void {
  const newThreshold = parseInt((event.target as HTMLSelectElement).value);
  if (newThreshold !== props.trustThreshold) {
    emit("threshold-changed", newThreshold);
  }
}
</script>

<style scoped>
.threshold-selector {
  width: 50px;
  margin: 0 auto;
}

.form-select.modified {
  border: 2px solid #ffc107;
}

.form-select {
  display: block;
  width: 100%;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  color: #212529;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}
</style>
