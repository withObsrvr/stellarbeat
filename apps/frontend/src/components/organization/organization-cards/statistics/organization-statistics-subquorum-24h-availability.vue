<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex flex-wrap items-center p-3">
      <gauge
        width="65px"
        height="65px"
        :value="organization.subQuorum24HoursAvailability"
        :max-value="100"
        value-color="#5eba00"
        negative-value-color="#cd201f"
        class="mr-3"
      />
      <div class="lh-sm">
        <div class="strong">
          {{ +organization.subQuorum24HoursAvailability.toFixed(2) }}%
        </div>
        <div class="text-gray-500">
          24H Availability
          <svg
            v-tooltip="'Availability: more than or equal to 50% of the organization validators are validating.'"
            class="inline h-3.5 w-3.5 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Organization } from "shared";
import Gauge from "@/components/charts/gauge.vue";

defineProps<{
  organization: Organization;
}>();
</script>
<style scoped>
.strong {
  font-weight: 500;
}
</style>
