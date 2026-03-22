<template>
  <div class="rounded-xl border border-gray-200 bg-white" :class="dimmerClass">
    <div class="loader"></div>
    <div
      class="p-0 flex flex-col justify-between dimmer-content"
    >
      <div class="flex justify-between items-start pt-3 px-3">
        <div>
          <div class="text-gray-500 text-sm">
            {{ title }}
          </div>
          <div>
            <div v-if="hasActiveElement && activeElement" class="flex">
              <div class="active-element-value mr-1">
                {{
                  isBool
                    ? calculatePercentage(activeElement[statsProperty]) + "%"
                    : activeElement[statsProperty]
                }}
              </div>
              <div class="active-element-time self-start text-gray-500">
                {{ formatTime(activeElement?.time) }}
              </div>
            </div>
            <div v-else>
              <div v-if="value !== undefined">
                <div
                  v-if="isBool || unknown"
                  class="value"
                >
                  <UiBadge
                    v-if="!unknown"
                    :variant="value ? 'success' : 'danger'"
                  >{{ value ? "Yes" : "No" }}</UiBadge>
                  <UiBadge v-else variant="default">Not analyzed</UiBadge>
                </div>
                <div v-else class="value">
                  {{ value }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          @click="showModal = true"
        >
          <svg v-tooltip:top="'Click for info'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>
      <div
        v-show="!store.isSimulation && store.networkContext.enableHistory"
        style="height: 35px"
      >
        <network-statistics-chart
          v-if="initialDataLoaded"
          :stats-property="statsProperty"
          :year-statistics="yearStatistics"
          @hover="onHover"
        />
      </div>
      <div
        v-show="store.isSimulation || !store.networkContext.enableHistory"
        class="mb-4"
      ></div>
    </div>
    <UiModal v-model="showModal" :lazy="true" title="Info" :ok-only="true" :hide-header="true">
      <slot name="info"></slot>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import NetworkStatisticsChart from "@/components/network/cards/network-statistics/network-statistics-chart.vue";
import { NetworkStatisticsAggregation } from "shared";
import { computed, type Ref, ref, toRefs, withDefaults } from "vue";
import useStore from "@/store/useStore";

const store = useStore();
export interface Props {
  isLoading: boolean;
  tooltip: string;
  title: string;
  value: number | boolean;
  initialDataLoaded: boolean;
  yearStatistics: NetworkStatisticsAggregation[];
  statsProperty: string;
  isBool?: boolean;
  isSimulationSensitive?: boolean;
  unknown?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  isLoading: true,
  isBool: false,
  isSimulationSensitive: false,
  unknown: false,
});

const {
  title,
  value,
  initialDataLoaded,
  yearStatistics,
  statsProperty,
  isBool,
  unknown,
} = toRefs(props);

const activeElement: Ref<NetworkStatisticsAggregation | null> = ref(null);
const showModal = ref(false);

const hasActiveElement = computed(() => activeElement.value !== null);

function onHover(stat: NetworkStatisticsAggregation) {
  activeElement.value = stat;
}

function formatTime(date: Date) {
  const options = { year: "numeric" as const, month: "short" as const };
  return date.toLocaleDateString(undefined, options);
}

const dimmerClass = computed(() => {
  return {
    dimmer: true,
    active: props.isLoading,
  };
});

const calculatePercentage = (value: unknown) => {
  return (typeof value === "number" ? value * 100 : 0) + "%";
};
</script>

<style scoped>
.value {
  font-size: 18px;
  font-weight: bold;
  line-height: 20px;
  padding-bottom: 0;
}

.active-element-time {
  font-size: 12px;
  line-height: 17px;
  align-self: flex-start;
}

.active-element-value {
  font-size: 18px;
  font-weight: bold;
  line-height: 20px;
  padding-bottom: 0;
}
</style>
