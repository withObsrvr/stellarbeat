<template>
  <div class="flex items-center">
    <input
      v-model="dateValue"
      type="date"
      :min="formatDateInput(minSelectedDate)"
      :max="formatDateInput(new Date())"
      class="rounded-l-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 h-8 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300"
    />
    <input
      v-model="crawlTime"
      type="time"
      step="1"
      class="border-y border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 h-8 w-[110px] focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-300"
    />
    <button
      v-tooltip:top="'Travel to selected time'"
      class="flex items-center justify-center h-8 px-2 rounded-r-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      @click="timeTravel"
    >
      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";

const store = useStore();
const router = useRouter();
const route = useRoute();

const minSelectedDate: Date = store.measurementsStartDate;

const dateValue = ref(formatDateInput(new Date(store.network.time.getTime())));
const crawlTime = ref(formatCrawlTime(new Date(store.network.time.getTime())));

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatCrawlTime(date: Date): string {
  return (
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0") +
    ":" +
    date.getSeconds().toString().padStart(2, "0")
  );
}

function timeTravel() {
  const date = new Date(dateValue.value);
  date.setHours(Number(crawlTime.value.substring(0, 2)));
  date.setMinutes(Number(crawlTime.value.substring(3, 5)));
  date.setSeconds(Number(crawlTime.value.substring(5, 7) || "0"));

  router.push({
    name: route.name ? route.name : undefined,
    params: route.params,
    query: {
      view: route.query.view,
      "no-scroll": "1",
      network: route.query.network,
      at: date.toISOString(),
    },
  });
}
</script>
