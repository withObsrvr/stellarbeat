<template>
  <div>
    <!-- 30D Bar Charts -->
    <div v-if="!store.isSimulation" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <BarChart30D
        title="Validating"
        :value="validating30DValue"
        :bars="validatingBars"
        color-scheme="emerald"
      />
      <BarChart30D
        v-if="node.isValidator"
        title="History Archive"
        :value="historyArchiveValue"
        :bars="historyArchiveBars"
        color-scheme="emerald"
      />
      <BarChart30D
        v-if="node.isValidator"
        title="Crawler Rejected"
        :value="crawlerRejectedValue"
        :bars="crawlerRejectedBars"
        color-scheme="red"
      />
    </div>

    <!-- Two-column: Node Details + Organization -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Node Details -->
      <div>
        <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Node Details</h3>
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
          <UiDetailRow label="Host">
            <span class="font-mono text-xs text-gray-700">{{ node.host || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="IP">
            <span class="font-mono text-xs text-gray-700">{{ node.key || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="Version">
            <span class="text-gray-900">{{ node.versionStr || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="Organization">
            <router-link
              v-if="organization"
              :to="{
                name: 'organization-dashboard',
                params: { organizationId: node.organizationId },
                query: routeQuery,
              }"
              class="font-medium text-gray-900"
            >{{ organization.name }}</router-link>
            <span v-else class="text-gray-900">N/A</span>
          </UiDetailRow>
          <UiDetailRow label="Domain">
            <span class="text-gray-900">{{ node.homeDomain || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="Country">
            <span class="text-gray-900">{{ node.geoData.countryName || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="ISP">
            <span class="text-gray-700">{{ node.isp || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="Discovered">
            <span class="text-gray-700">{{ node.dateDiscovered.toDateString() }}</span>
          </UiDetailRow>
          <UiDetailRow label="History URL">
            <span class="font-mono text-xs text-gray-700 break-all">{{ node.historyUrl || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow v-if="node.overlayVersion" label="Overlay Version">
            <span class="text-gray-900">{{ node.overlayVersion }}</span>
          </UiDetailRow>
          <UiDetailRow v-if="node.overlayMinVersion" label="Overlay Min Version">
            <span class="text-gray-900">{{ node.overlayMinVersion }}</span>
          </UiDetailRow>
          <UiDetailRow v-if="node.ledgerVersion" label="Ledger Version">
            <span class="text-gray-900">{{ node.ledgerVersion }}</span>
          </UiDetailRow>
          <UiDetailRow v-if="node.isValidator" label="Externalize Lag" :last="true">
            <span class="text-gray-900">{{ node.lag !== null ? node.lag + ' ms' : 'Not detected' }}</span>
          </UiDetailRow>
        </div>
      </div>

      <!-- Organization -->
      <div v-if="organization">
        <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Organization: {{ organization.name }}
        </h3>
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
          <div
            v-for="orgNode in orgNodes"
            :key="orgNode.publicKey"
            :class="[
              'flex items-center justify-between px-5 py-2.5 border-b border-gray-100',
              orgNode.publicKey === node.publicKey ? 'bg-emerald-50/30' : '',
            ]"
          >
            <div class="flex items-center gap-2">
              <UiStatusDot :color="orgNode.isValidating ? 'emerald' : 'red'" />
              <router-link
                :to="{
                  name: 'node-dashboard',
                  params: { publicKey: orgNode.publicKey },
                  query: routeQuery,
                }"
                class="font-medium text-gray-900 hover:text-emerald-700 transition-colors"
              >{{ orgNode.displayName }}</router-link>
              <UiBadge v-if="orgNode.publicKey === node.publicKey" variant="emerald">
                Viewing
              </UiBadge>
            </div>
            <span class="text-emerald-600 tabular text-sm">
              {{ orgNode.statistics.has30DayStats ? orgNode.statistics.validating30DaysPercentage + '%' : 'N/A' }}
            </span>
          </div>
          <div class="flex items-center justify-between px-5 py-2.5 bg-gray-50/80">
            <span class="text-gray-400">Org Uptime</span>
            <span class="font-semibold text-emerald-600">
              {{ orgUptime }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust Graph (collapsible) -->
    <div class="mb-8">
      <button
        class="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2 hover:text-gray-600 transition-colors"
        @click="graphExpanded = !graphExpanded"
      >
        <svg
          class="h-3.5 w-3.5 transition-transform"
          :class="{ 'rotate-90': graphExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        Trust Graph
      </button>
      <div v-show="graphExpanded" class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" style="height: 400px">
        <network-visual-navigator :view="route.query.view as string || 'graph'" />
      </div>
    </div>

    <!-- Trusts preview -->
    <div v-if="node.isValidator" class="mb-8">
      <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
        Trusts ({{ trustsCount }})
      </h3>
      <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table class="w-full text-left">
          <thead>
            <tr class="text-2xs font-mono text-gray-400 uppercase tracking-widest bg-gray-50/80">
              <th class="px-5 py-3 font-medium">Validator</th>
              <th class="px-4 py-3 font-medium text-right hidden md:table-cell">24H</th>
              <th class="px-4 py-3 font-medium text-right hidden md:table-cell">30D</th>
              <th class="px-4 py-3 font-medium text-right hidden lg:table-cell">Version</th>
              <th class="px-4 py-3 font-medium text-right hidden lg:table-cell">Country</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="v in trustsPreview"
              :key="v.publicKey"
              class="hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="navigateToNode(v.publicKey)"
            >
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <UiStatusDot :color="v.isValidating ? 'emerald' : 'red'" />
                  <span class="font-medium text-gray-900">{{ v.displayName }}</span>
                  <UiBadge v-if="v.isFullValidator" variant="gray" tier="meta">Full</UiBadge>
                </div>
              </td>
              <td class="px-4 py-3 text-right hidden md:table-cell text-sm tabular">
                {{ v.statistics.has24HourStats ? v.statistics.validating24HoursPercentage + '%' : 'N/A' }}
              </td>
              <td class="px-4 py-3 text-right hidden md:table-cell">
                <span :class="get30DColor(v)" class="text-sm tabular">
                  {{ v.statistics.has30DayStats ? v.statistics.validating30DaysPercentage + '%' : 'N/A' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right hidden lg:table-cell font-mono text-xs text-gray-500">
                {{ v.versionStr || 'N/A' }}
              </td>
              <td class="px-4 py-3 text-right hidden lg:table-cell text-xs text-gray-700">
                {{ v.geoData.countryName || 'N/A' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Node, QuorumSet } from 'shared';
import useStore from '@/store/useStore';
import useNodeMeasurementsStore from '@/store/useNodeMeasurementsStore';
import type { NodeDayStatistics } from '@/store/NodeStatisticsStore';
import BarChart30D, { type Bar } from './BarChart30D.vue';
import NetworkVisualNavigator from '@/components/visual-navigator/network-visual-navigator.vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  node: Node;
}>();

const store = useStore();
const network = store.network;
const nodeMeasurementStore = useNodeMeasurementsStore();
const router = useRouter();
const route = useRoute();

const routeQuery = computed(() => ({
  view: route.query.view,
  network: route.query.network,
  at: route.query.at,
}));

const graphExpanded = ref(false);
const dayStats = ref<NodeDayStatistics[]>([]);

async function fetchDayStats() {
  const to = new Date(network.time);
  const from = new Date(network.time);
  from.setDate(from.getDate() - 30);
  try {
    dayStats.value = await nodeMeasurementStore.getDayStatistics(
      props.node.publicKey,
      from,
      to,
    );
  } catch {
    dayStats.value = [];
  }
}

onMounted(fetchDayStats);
watch(() => props.node.publicKey, fetchDayStats);

function makeBars(
  property: keyof NodeDayStatistics,
  goodColor: string,
  badColor: string,
  inverted = false,
): Bar[] {
  if (dayStats.value.length === 0) {
    return Array(30).fill({ height: '4px', color: 'bg-gray-200' });
  }
  return dayStats.value.map((stat) => {
    let ratio = (stat[property] as number) / stat.crawlCount;
    if (inverted) ratio = 1 - ratio;
    const pct = Math.max(4, Math.round(ratio * 100));
    const isGood = inverted ? ratio < 0.01 : ratio > 0.99;
    return {
      height: pct + '%',
      color: isGood ? goodColor : badColor,
    };
  });
}

const validatingBars = computed<Bar[]>(() => {
  if (props.node.isValidator) {
    return makeBars('isValidatingCount', 'bg-emerald-500', 'bg-amber-400');
  }
  return makeBars('isActiveCount', 'bg-emerald-500', 'bg-amber-400');
});

const validating30DValue = computed(() => {
  if (props.node.isValidator) {
    return props.node.statistics.has30DayStats
      ? props.node.statistics.validating30DaysPercentage + '%'
      : 'N/A';
  }
  return props.node.statistics.has30DayStats
    ? props.node.statistics.active30DaysPercentage + '%'
    : 'N/A';
});

const historyArchiveBars = computed<Bar[]>(() =>
  makeBars('isFullValidatorCount', 'bg-emerald-500', 'bg-amber-400'),
);

const historyArchiveValue = computed(() => {
  if (dayStats.value.length === 0) return 'N/A';
  const total = dayStats.value.reduce((s, d) => s + d.crawlCount, 0);
  const count = dayStats.value.reduce((s, d) => s + d.isFullValidatorCount, 0);
  if (total === 0) return 'N/A';
  return ((count / total) * 100).toFixed(1) + '%';
});

const crawlerRejectedBars = computed<Bar[]>(() =>
  makeBars('isOverloadedCount', 'bg-red-400', 'bg-red-400', true),
);

const crawlerRejectedValue = computed(() => {
  if (dayStats.value.length === 0) return 'N/A';
  const total = dayStats.value.reduce((s, d) => s + d.crawlCount, 0);
  const count = dayStats.value.reduce((s, d) => s + d.isOverloadedCount, 0);
  if (total === 0) return 'N/A';
  return (((total - count) / total) * 100).toFixed(1) + '%';
});

// Organization
const organization = computed(() => {
  if (props.node.organizationId)
    return network.getOrganizationById(props.node.organizationId);
  return null;
});

const orgNodes = computed(() => {
  if (!organization.value) return [];
  return organization.value.validators
    .map((pk: string) => network.getNodeByPublicKey(pk))
    .filter((n: Node) => n && !n.unknown);
});

const orgUptime = computed(() => {
  const org = organization.value;
  if (!org) return 'N/A';
  if (org.has30DayStats) return org.subQuorum30DaysAvailability + '%';
  return 'N/A';
});

// Trusts preview
const trustsCount = computed(() =>
  QuorumSet.getAllValidators(props.node.quorumSet).length,
);

const trustsPreview = computed(() => {
  return QuorumSet.getAllValidators(props.node.quorumSet)
    .map((pk) => network.getNodeByPublicKey(pk))
    .filter((n) => n && !n.unknown)
    .slice(0, 10);
});

function get30DColor(v: Node) {
  if (!v.statistics.has30DayStats) return 'text-gray-400';
  return v.statistics.validating30DaysPercentage >= 99
    ? 'text-emerald-600'
    : 'text-amber-600';
}

function navigateToNode(publicKey: string) {
  router.push({
    name: 'node-dashboard',
    params: { publicKey },
    query: routeQuery.value,
  });
}
</script>
