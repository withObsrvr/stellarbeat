<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/80 pl-3 py-3">
      <div class="inline-flex rounded-lg shadow-sm" role="group" aria-label="Chart view">
        <button
          type="button"
          class="rounded-l-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-gray-100 font-semibold': chartView === '30D' }"
          @click="select30DayViewDefault"
        >
          30D
        </button>
        <button
          type="button"
          class="border-y border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-gray-100 font-semibold': chartView === '24H' }"
          @click="select24HViewDefault"
        >
          24H
        </button>
        <button
          type="button"
          class="rounded-r-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          :class="{ 'bg-gray-100 font-semibold': chartView === '1H' }"
          @click="select1HViewDefault"
        >
          1H
        </button>
      </div>
      <h5 class="text-sm font-semibold text-gray-900">
        {{ subject }}
      </h5>
    </div>
    <div v-if="failed" class="p-4 text-sm text-red-600 bg-red-50/50 ring-1 ring-red-200/60">
      <svg class="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
      Error fetching data
    </div>
    <div class="p-2">
      <div :class="dimmerClass" class="h-full">
        <div class="loader"></div>
        <div
          ref="chartContainer"
          class="dimmer-content h-full flex flex-col items-center justify-center"
        >
          <div v-if="rendered">
            <BarChartDay
              v-if="chartView === '30D'"
              :key="'1'"
              :width="chartWidth"
              :data="thirtyDaysBarChartData"
              :unit="'day'"
              @click-date="select24HView"
            />
            <BarChartDay
              v-if="chartView === '24H'"
              :key="'2'"
              :width="chartWidth"
              :data="twentyFourHourBarChartData"
              :unit="'hour'"
              @click-date="select1HView"
            />
            <line-chart-hour
              v-if="chartView === '1H'"
              :width="chartWidth"
              :data="oneHourLineChartData"
              :inverted="inverted"
              @click-date="updateSelectedDateAndHighlight"
              @update-view="updateView"
            />
          </div>

          <div
            class="flex flex-wrap mt-1"
            :class="{ animated: animated }"
            @animationend="animated = false"
          >
            <date-navigator
              v-if="rendered"
              :selected-date="selectedDate"
              :show-time="chartView === '1H'"
              class="mr-1 mb-1"
              :bucket-size="chartView"
              @dateChanged="updateSelectedDate"
            >
            </date-navigator>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DateNavigator from "@/components/date-navigator.vue";
import LineChartHour from "@/components/charts/line-chart-hour.vue";
import {
  type Statistics,
  type StatisticsAggregation,
} from "@/store/StatisticsStore";
import StatisticsDateTimeNavigator from "@/components/network/cards/network-risk-analysis-charts/StatisticsDateTimeNavigator";
import useStore from "@/store/useStore";
import { useIsLoading } from "@/composables/useIsLoading";
import { computed, type ComputedRef, onMounted, ref, toRefs, watch } from "vue";
import BarChartDay from "@/components/charts/bar-chart-day.vue";
import { type ScatterDataPoint } from "chart.js";

const { isLoading, dimmerClass } = useIsLoading();

interface Props {
  subject: string;
  fetchDayMeasurements: (
    id: string,
    from: Date,
    to: Date,
  ) => Promise<StatisticsAggregation[]>;
  fetchMeasurements: (
    id: string,
    from: Date,
    to: Date,
  ) => Promise<Statistics[]>;
  dayMeasurementProperty: string;
  measurementProperty: string;
  entityId: string;
  inverted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  inverted: false,
});

const {
  subject,
  fetchDayMeasurements,
  fetchMeasurements,
  dayMeasurementProperty,
  measurementProperty,
  entityId,
  inverted,
} = toRefs(props);

const store = useStore();

const thirtyDayMeasurements = ref<StatisticsAggregation[]>([]);
const twentyFourHourMeasurements = ref<Statistics[]>([]);
const oneHourLineChartData = ref<ScatterDataPoint[]>([]);

const statisticsDateTimeNavigator = new StatisticsDateTimeNavigator(
  store.measurementsStartDate,
);

const rendered = ref(false);
const selectedDate = ref(new Date());
const failed = ref(false);
const chartView = ref("30D");
const animated = ref(false);

async function select30DayViewDefault() {
  const time = new Date(store.network.time);
  //subtract 30 days
  time.setDate(time.getDate() - 30);
  await select30DayView(time);
}

async function select30DayView(time?: Date) {
  if (time) selectedDate.value = time;
  await updateDayHistoryChart();
  chartView.value = "30D";
}

async function select24HViewDefault() {
  const time = new Date(store.network.time);
  time.setDate(time.getDate() - 1);
  await select24HView(time);
}

async function select24HView(time?: Date) {
  if (time) selectedDate.value = time;

  await update24HourHistoryChart();
  chartView.value = "24H";
}

async function select1HViewDefault() {
  selectedDate.value = new Date(store.network.time.getTime() - 60 * 60 * 1000);
  await select1HView(selectedDate.value);
}

async function select1HView(time?: Date) {
  if (time) selectedDate.value = time;
  await update24HourHistoryChart("h");
  computeOneHourLineChartData();
  chartView.value = "1H";
}

function updateView(view: string) {
  chartView.value = view;
}

async function updateSelectedDate(newDate: string) {
  selectedDate.value = new Date(newDate);
  await updateChartData();
}

async function updateSelectedDateAndHighlight(newDate: string) {
  selectedDate.value = new Date(newDate);
  animated.value = true;
}

watch(entityId, async () => {
  await updateChartData();
});

async function updateChartData() {
  if (chartView.value === "30D") await updateDayHistoryChart();
  else if (chartView.value === "24H") await update24HourHistoryChart();
  else {
    await update24HourHistoryChart();
    computeOneHourLineChartData();
  }
}

const chartContainer = ref<HTMLDivElement | null>(null);
const chartWidth = ref();

async function updateDayHistoryChart() {
  isLoading.value = true;
  const to = new Date(selectedDate.value.getTime());
  to.setDate(to.getDate() + 30); // add 30 days
  try {
    failed.value = false;
    thirtyDayMeasurements.value = await fetchDayMeasurements.value(
      entityId.value,
      new Date(selectedDate.value),
      to,
    );
  } catch (e) {
    failed.value = true;
  }
  isLoading.value = false;
}

async function update24HourHistoryChart(unit: "h" | "d" = "d") {
  isLoading.value = true;
  const to = new Date(selectedDate.value.getTime());
  if (unit === "d") {
    to.setDate(to.getDate() + 1); // add 1 day
  } else if (unit === "h") {
    to.setTime(to.getTime() + 60 * 60 * 1000); // add 1 hour
  }
  try {
    failed.value = false;
    twentyFourHourMeasurements.value = await fetchMeasurements.value(
      entityId.value,
      new Date(selectedDate.value),
      to,
    );
  } catch (e) {
    failed.value = true;
  }
  isLoading.value = false;
}

const thirtyDaysBarChartData: ComputedRef<ScatterDataPoint[]> = computed(() => {
  function getY(measurement: StatisticsAggregation) {
    const value = //@ts-ignore
      measurement[dayMeasurementProperty.value] / measurement.crawlCount;
    return Number((value * 100).toFixed(2));
  }

  return thirtyDayMeasurements.value.map((measurement) => {
    if (!inverted.value) {
      return {
        x: measurement.time.getTime(),
        y: getY(measurement),
      };
    } else {
      return {
        x: measurement.time.getTime(),
        y: Number(
          (
            ((measurement.crawlCount -
              //@ts-ignore
              measurement[dayMeasurementProperty.value]) /
              measurement.crawlCount) *
            100
          ).toFixed(2),
        ),
      };
    }
  });
});

const twentyFourHourBarChartData = computed((): { x: number; y: number }[] => {
  const twentyFourHourMap = new Map<string, number[]>();
  twentyFourHourMeasurements.value.forEach((measurement: any) => {
    const date = new Date(measurement.time);
    date.setMinutes(0, 0, 0); // set minutes, seconds, and milliseconds to 0 to start of the hour
    const hourBucketString = date.toISOString();
    let twentyFourHourValue = twentyFourHourMap.get(hourBucketString);
    if (!twentyFourHourValue) twentyFourHourValue = [];
    twentyFourHourValue.push(measurement[measurementProperty.value]);
    twentyFourHourMap.set(hourBucketString, twentyFourHourValue);
  });

  const twentyFourHourAverages: { x: number; y: number }[] = [];
  twentyFourHourMap.forEach((measurements, hourString) => {
    if (inverted.value) {
      twentyFourHourAverages.push({
        x: new Date(hourString).getTime(),
        y: Number(
          (
            100 -
            (measurements.reduce((a, b) => a + b, 0) / measurements.length) *
              100
          ).toFixed(2),
        ),
      });
    } else {
      twentyFourHourAverages.push({
        x: new Date(hourString).getTime(),
        y: Number(
          (
            (measurements.reduce((a, b) => a + b, 0) / measurements.length) *
            100
          ).toFixed(2),
        ),
      });
    }
  });

  return twentyFourHourAverages;
});

const computeOneHourLineChartData = (): void => {
  oneHourLineChartData.value = twentyFourHourMeasurements.value
    .filter((measurement) => {
      const measurementTime = new Date(measurement.time).getTime();
      const selectedTime = selectedDate.value.getTime();
      const oneHourLater = selectedTime + 60 * 60 * 1000; // add 1 hour in milliseconds

      return measurementTime > selectedTime && measurementTime <= oneHourLater;
    })
    .map((measurement: any) => {
      if (!inverted.value) {
        return {
          x: measurement.time.getTime(),
          y: measurement[measurementProperty.value],
        };
      } else {
        return {
          x: measurement.time.getTime(),
          y: measurement[measurementProperty.value],
        };
      }
    });
};

onMounted(async () => {
  chartWidth.value = chartContainer.value
    ? chartContainer.value.clientWidth
    : 0;
  selectedDate.value = statisticsDateTimeNavigator.getInitialSelectedDate(
    chartView.value,
    store.network.time,
  );
  await select30DayViewDefault();
  rendered.value = true;
});
</script>
