<template>
  <div class="card" :class="dimmerClass">
    <div class="loader"></div>
    <div
      class="card-body p-0 d-flex flex-column justify-content-between dimmer-content"
    >
      <div class="d-flex justify-content-between align-items-start pt-3 px-3">
        <div class="">
          <div class="text-muted">
            {{ title }}
          </div>
          <div>
            <div v-if="hasActiveElement && activeElement" class="d-flex">
              <div class="active-element-value mr-1">
                {{
                  isBool
                    ? calculatePercentage(activeElement[statsProperty]) + "%"
                    : activeElement[statsProperty]
                }}
              </div>
              <div class="active-element-time align-self-start text-muted">
                {{ formatTime(activeElement?.time) }}
              </div>
            </div>
            <div v-else>
              <div v-if="value !== undefined">
                <div
                  v-if="isBool || unknown"
                  class="value"
                  style="color: #5eba00"
                >
                  <b-badge
                    v-if="!unknown"
                    :variant="value ? 'success' : 'danger'"
                    >{{ value ? "Yes" : "No" }}</b-badge
                  >
                  <b-badge v-else variant="default">Not analyzed</b-badge>
                </div>
                <div v-else class="value">
                  {{ value }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          class="btn btn-sm"
          style="border: none; box-shadow: none"
          @click="showModal = true"
        >
          <b-icon-info-circle
            v-tooltip:top="'Click for info'"
            class="text-muted"
          />
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
    <b-modal v-model="showModal" lazy title="Info" ok-only hide-header>
      <slot name="info"></slot>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import { BBadge, BIconInfoCircle, BModal } from "bootstrap-vue";
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
  statsProperty: keyof NetworkStatisticsAggregation;
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
