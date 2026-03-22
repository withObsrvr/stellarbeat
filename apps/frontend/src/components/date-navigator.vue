<template>
  <div class="flex">
    <div class="inline-flex rounded-lg shadow-sm" role="group">
      <button
        :disabled="!canGoBack()"
        class="rounded-l-lg border border-gray-200 bg-white px-2 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        @click="goBack"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div>
        <input
          v-if="!showTime"
          v-model="dateInputValue"
          type="date"
          :min="formatDateForInput(statisticsDateTimeNavigator.getMinSelectedDate(bucketSize))"
          :max="formatDateForInput(new Date())"
          class="border-y border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 h-[31px] focus:outline-none"
          @change="onDateInputChange"
        />
        <input
          v-else
          v-model="time"
          type="time"
          class="border-y border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 h-[31px] w-[100px] focus:outline-none"
          @change="timeInputHandler"
        />
      </div>
      <button
        v-tooltip="'Travel to selected time'"
        class="border-y border-gray-200 bg-white px-2 py-1 text-gray-400 hover:text-gray-700 transition-colors"
        @click="timeTravel"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </button>
      <button
        class="rounded-r-lg border border-gray-200 bg-white px-2 py-1 text-gray-500 hover:bg-gray-50 transition-colors"
        @click="goForward"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, type Ref, ref, toRefs, watch } from "vue";
import StatisticsDateTimeNavigator from "@/components/network/cards/network-risk-analysis-charts/StatisticsDateTimeNavigator";
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  selectedDate: {
    type: Date,
    required: true,
  },
  bucketSize: {
    type: String,
    required: true,
  },
  showTime: {
    type: Boolean,
    default: false,
  },
});

const { selectedDate, bucketSize, showTime } = toRefs(props);

const store = useStore();
const emit = defineEmits(["dateChanged"]);

const statisticsDateTimeNavigator = new StatisticsDateTimeNavigator(
  store.measurementsStartDate,
);

const datePickerDate: Ref<Date | string> = ref(selectedDate.value);

const hours = selectedDate.value.getHours().toString().padStart(2, "0");
const minutes = selectedDate.value.getMinutes().toString().padStart(2, "0");
const time = ref(`${hours}:${minutes}`);

const dateInputValue = ref(formatDateForInput(selectedDate.value));

function formatDateForInput(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function onDateInputChange() {
  datePickerDate.value = new Date(dateInputValue.value);
  emit("dateChanged", new Date(dateInputValue.value));
}

function canGoBack() {
  return statisticsDateTimeNavigator.canGoBack(
    bucketSize.value,
    new Date(datePickerDate.value),
  );
}

function goBack() {
  nextTick(() => {
    datePickerDate.value = statisticsDateTimeNavigator.goBack(
      bucketSize.value,
      new Date(datePickerDate.value),
    );
    dateInputValue.value = formatDateForInput(datePickerDate.value);
    time.value = new Date(datePickerDate.value).toISOString().substring(11, 16);
    emit("dateChanged", datePickerDate.value);
  });
}

function goForward() {
  nextTick(() => {
    datePickerDate.value = statisticsDateTimeNavigator.goForward(
      bucketSize.value,
      new Date(datePickerDate.value),
    );
    dateInputValue.value = formatDateForInput(datePickerDate.value);
    time.value = new Date(datePickerDate.value).toISOString().substring(11, 16);
    emit("dateChanged", datePickerDate.value);
  });
}

watch(selectedDate, async () => {
  datePickerDate.value = selectedDate.value;
  dateInputValue.value = formatDateForInput(selectedDate.value);
  const selectedHours = selectedDate.value.getHours().toString().padStart(2, "0");
  const selectedMinutes = selectedDate.value.getMinutes().toString().padStart(2, "0");
  time.value = `${selectedHours}:${selectedMinutes}`;
});

function timeInputHandler() {
  const selectedHours = Number(time.value.substring(0, 2));
  const selectedMinutes = Number(time.value.substring(3, 5));
  const date = new Date(datePickerDate.value);
  date.setHours(selectedHours, selectedMinutes);
  datePickerDate.value = date;
  emit("dateChanged", date);
}

const route = useRoute();
const router = useRouter();

function timeTravel() {
  const query = store.copyAndModifyObject(route.query, [
    { key: "at", value: new Date(datePickerDate.value).toISOString() },
  ]);
  router.push({
    name: route.name ? route.name : undefined,
    params: route.params,
    query: query as Record<string, string | Array<string>>,
  });
}
</script>
