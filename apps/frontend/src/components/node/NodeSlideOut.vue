<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 bg-black/8 backdrop-blur-[1px] z-40"
        @click="$emit('close')"
      />
    </Transition>

    <!-- Panel -->
    <Transition name="slide">
      <div
        v-if="visible && node"
        class="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] z-50 bg-white border-l border-gray-200 shadow-2xl overflow-y-auto"
      >
        <!-- Sticky header -->
        <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            @click="$emit('close')"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            class="text-gray-400 hover:text-gray-900 transition-colors"
            @click="$emit('close')"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-6 py-5">
          <!-- Identity -->
          <div class="flex items-center gap-3 mb-1">
            <div class="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-sm">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <span class="text-lg font-bold text-gray-900">{{ node.displayName }}</span>
              <div class="flex items-center gap-1.5">
                <UiStatusDot :color="node.isValidating ? 'emerald' : 'red'" />
                <span class="font-mono text-2xs text-gray-400">
                  {{ node.publicKey.substring(0, 6) }}...{{ node.publicKey.substring(52) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Badges -->
          <div class="flex items-center gap-2 mt-3 mb-5">
            <UiBadge :variant="node.isValidating ? 'emerald' : 'red'">
              {{ node.isValidating ? 'Validating' : 'Not Validating' }}
            </UiBadge>
            <UiBadge variant="gray" tier="meta">
              {{ node.isFullValidator ? 'Full Validator' : node.isValidator ? 'Validator' : 'Node' }}
            </UiBadge>
          </div>

          <!-- Quick stats (3 across) -->
          <div class="grid grid-cols-3 gap-3 mb-6">
            <div class="rounded-lg border border-gray-200 px-3 py-2.5 text-center">
              <div class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Node Index</div>
              <div class="text-lg font-bold text-gray-900 tabular">{{ node.index }}</div>
            </div>
            <div class="rounded-lg border border-gray-200 px-3 py-2.5 text-center">
              <div class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">24H Valid.</div>
              <div class="text-lg font-bold tabular" :class="node.isValidating ? 'text-emerald-600' : 'text-gray-400'">
                {{ node.statistics.has24HourStats ? node.statistics.validating24HoursPercentage + '%' : 'N/A' }}
              </div>
            </div>
            <div class="rounded-lg border border-gray-200 px-3 py-2.5 text-center">
              <div class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-0.5">30D Valid.</div>
              <div class="text-lg font-bold tabular" :class="node.isValidating ? 'text-emerald-600' : 'text-gray-400'">
                {{ node.statistics.has30DayStats ? node.statistics.validating30DaysPercentage + '%' : 'N/A' }}
              </div>
            </div>
          </div>

          <!-- Node Details -->
          <div class="mb-5">
            <div class="rounded-xl border border-gray-200 overflow-hidden text-sm">
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Organization</span>
                <router-link
                  v-if="organization"
                  :to="{
                    name: 'organization-dashboard',
                    params: { organizationId: node.organizationId },
                    query: routeQuery,
                  }"
                  class="font-medium text-gray-900 hover:text-emerald-700 transition-colors"
                  @click="$emit('close')"
                >{{ organization.name }}</router-link>
                <span v-else class="text-gray-400">N/A</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Domain</span>
                <span class="text-gray-700">{{ node.homeDomain || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Host</span>
                <span class="font-mono text-xs text-gray-700">{{ node.host || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Version</span>
                <span class="font-mono text-xs text-gray-700">{{ node.versionStr || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                <span class="text-gray-400">Country</span>
                <span class="text-gray-700">{{ node.geoData.countryName || 'N/A' }}</span>
              </div>
              <div class="flex items-center justify-between px-4 py-2.5">
                <span class="text-gray-400">ISP</span>
                <span class="text-gray-700">{{ node.isp || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <!-- Relationship to context node (if viewing from a specific node) -->
          <div v-if="contextNode && contextNode.publicKey !== node.publicKey" class="mb-5">
            <div class="rounded-xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 text-sm">
              <div class="flex items-center gap-1.5 mb-1">
                <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span class="font-semibold text-emerald-700">Relationship to {{ contextNode.displayName }}</span>
              </div>
              <p class="text-gray-600">
                <template v-if="trustsContext && trustedByContext">
                  {{ contextNode.displayName }} includes this validator in its quorum set. This is a <strong>mutual trust</strong> relationship.
                </template>
                <template v-else-if="trustsContext">
                  {{ contextNode.displayName }} includes this validator in its quorum set.
                </template>
                <template v-else-if="trustedByContext">
                  This validator includes {{ contextNode.displayName }} in its quorum set.
                </template>
                <template v-else>
                  No direct trust relationship.
                </template>
              </p>
            </div>
          </div>

          <!-- 30D Validating bar chart -->
          <div v-if="node.isValidator" class="mb-6">
            <div class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">30D Validating</div>
            <div class="flex items-end gap-[2px] h-10">
              <div
                v-for="(bar, i) in validatingBars"
                :key="i"
                class="flex-1 rounded-t-sm"
                :class="bar.color"
                :style="{ height: bar.height }"
              />
            </div>
          </div>

          <!-- CTA -->
          <router-link
            :to="{
              name: 'node-dashboard',
              params: { publicKey: node.publicKey },
              query: { center: '1', ...routeQuery },
            }"
            class="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
            @click="$emit('close')"
          >
            Open Full Page
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </router-link>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Node, QuorumSet } from 'shared';
import useStore from '@/store/useStore';
import useNodeMeasurementsStore from '@/store/useNodeMeasurementsStore';
import type { NodeDayStatistics } from '@/store/NodeStatisticsStore';
import { useRoute } from 'vue-router';

const props = defineProps<{
  node: Node | null;
  visible: boolean;
  contextNode?: Node;
}>();

defineEmits<{
  close: [];
}>();

const store = useStore();
const network = store.network;
const nodeMeasurementStore = useNodeMeasurementsStore();
const route = useRoute();

const routeQuery = computed(() => ({
  view: route.query.view,
  network: route.query.network,
  at: route.query.at,
}));

const organization = computed(() => {
  if (props.node?.organizationId) {
    return network.getOrganizationById(props.node.organizationId);
  }
  return null;
});

// Trust relationship to context node
const trustsContext = computed(() => {
  if (!props.contextNode || !props.node) return false;
  return QuorumSet.getAllValidators(props.contextNode.quorumSet).includes(props.node.publicKey);
});

const trustedByContext = computed(() => {
  if (!props.contextNode || !props.node) return false;
  return QuorumSet.getAllValidators(props.node.quorumSet).includes(props.contextNode.publicKey);
});

// 30D bar chart data
const dayStats = ref<NodeDayStatistics[]>([]);

async function fetchDayStats() {
  if (!props.node) return;
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

watch(() => props.node?.publicKey, (pk) => {
  if (pk) fetchDayStats();
});

watch(() => props.visible, (v) => {
  if (v && props.node) fetchDayStats();
  // Prevent body scroll when open
  document.body.style.overflow = v ? 'hidden' : '';
});

const validatingBars = computed(() => {
  if (dayStats.value.length === 0) {
    return Array(30).fill({ height: '4px', color: 'bg-gray-200' });
  }
  return dayStats.value.map((stat) => {
    const ratio = stat.isValidatingCount / stat.crawlCount;
    const pct = Math.max(4, Math.round(ratio * 100));
    return {
      height: pct + '%',
      color: ratio > 0.99 ? 'bg-emerald-500' : ratio > 0.5 ? 'bg-amber-400' : 'bg-red-400',
    };
  });
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 250ms ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
