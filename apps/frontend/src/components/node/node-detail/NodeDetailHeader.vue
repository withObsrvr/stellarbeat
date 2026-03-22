<template>
  <div class="mb-5">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm text-gray-400 mb-3">
      <router-link
        :to="{ name: 'network-dashboard', query: routeQuery }"
        class="hover:text-gray-700 transition-colors"
      >Network</router-link>
      <span>&rsaquo;</span>
      <template v-if="organization">
        <router-link
          :to="{
            name: 'organization-dashboard',
            params: { organizationId: node.organizationId },
            query: routeQuery,
          }"
          class="hover:text-gray-700 transition-colors"
        >{{ organization.name }}</router-link>
        <span>&rsaquo;</span>
      </template>
      <span class="text-gray-700">{{ node.displayName }}</span>
    </nav>

    <!-- Title + Badges + Actions (single row) -->
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span class="text-2xl font-bold text-gray-900">{{ node.displayName }}</span>
      <UiBadge :variant="node.isValidating ? 'emerald' : 'red'">
        {{ node.isValidating ? 'Validating' : 'Not Validating' }}
      </UiBadge>
      <UiBadge v-if="node.isValidator" variant="gray" tier="meta">
        {{ node.isFullValidator ? 'Full Validator' : 'Validator' }}
      </UiBadge>
      <UiBadge v-else variant="gray" tier="meta">Connectable Node</UiBadge>
      <UiBadge
        v-if="node.isValidator && node.isFullValidator"
        variant="gray"
        tier="meta"
      >Archive Publisher</UiBadge>

      <!-- Inline warning indicator (replaces full-width alert banners) -->
      <button
        v-if="hasWarnings"
        class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-semibold ring-1 transition-colors"
        :class="isFailing
          ? 'text-red-600 bg-red-50 ring-red-200 hover:bg-red-100'
          : 'text-amber-700 bg-amber-50 ring-amber-200 hover:bg-amber-100'"
        @click="warningExpanded = !warningExpanded"
      >
        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {{ warningCount }} {{ warningCount === 1 ? 'warning' : 'warnings' }}
        <svg
          class="h-3 w-3 transition-transform"
          :class="{ 'rotate-180': warningExpanded }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Spacer + Actions pushed right -->
      <div class="ml-auto flex items-center gap-2">
        <button
          v-if="node.isValidator && !network.isValidatorBlocked(node)"
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="store.toggleValidating(node)"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ node.isValidating ? 'Halt' : 'Start Validating' }}
        </button>

        <UiDropdown right :no-caret="true" size="sm" variant="outline">
          <template #button-content>
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </template>
          <UiDropdownItemButton @click="$emit('simulate-node')">
            Simulate new node
          </UiDropdownItemButton>
          <UiDropdownItemButton @click="$emit('quorum-slices')">
            Quorum slices
          </UiDropdownItemButton>
          <UiDropdownItemButton
            v-if="node.isValidator"
            @click="store.isNetworkAnalysisVisible = true"
          >
            Network analysis
          </UiDropdownItemButton>
          <UiDropdownItemButton
            v-if="node.isValidator"
            @click="store.showHaltingAnalysis(node)"
          >
            Halting analysis
          </UiDropdownItemButton>
          <UiDropdownItemButton
            v-if="node.isValidator && store.networkContext.enableConfigExport"
            @click="$emit('stellar-config')"
          >
            Stellar core config
          </UiDropdownItemButton>
        </UiDropdown>
      </div>
    </div>

    <!-- Expanded warning details (collapsed by default) -->
    <div
      v-if="hasWarnings && warningExpanded"
      class="mb-3 rounded-lg px-4 py-3 text-sm ring-1"
      :class="isFailing
        ? 'text-red-600 bg-red-50/50 ring-red-200/60'
        : 'text-amber-700 bg-amber-50/50 ring-amber-200/60'"
    >
      <div v-if="isFailing" class="mb-1">
        {{ network.getNodeFailingReason(node).description }}
      </div>
      <ul v-if="warningReasons.length > 0" class="pl-3 ml-0 mb-0 list-disc">
        <li v-for="reason in warningReasons" :key="reason">{{ reason }}.</li>
      </ul>
      <div v-if="hasHistoryArchiveError" class="mt-1">
        History archive verification error detected.
        <slot name="history-archive-details" />
      </div>
    </div>

    <!-- Public key + Inline stats (merged into one line) -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
      <span class="flex items-center gap-1.5">
        <span class="font-mono text-xs text-gray-400">
          {{ node.publicKey.substring(0, 7) }}...{{ node.publicKey.substring(51) }}
        </span>
        <UiCopyButton :text="node.publicKey" />
      </span>
      <span class="text-gray-200">|</span>
      <span>Index <span class="font-semibold text-gray-900 tabular">{{ node.index }}</span></span>
      <span class="text-gray-300">&middot;</span>
      <span v-if="node.isValidator">
        24H <span class="font-semibold text-emerald-600 tabular">{{ validating24H }}</span>
      </span>
      <span v-else>
        24H <span class="font-semibold text-emerald-600 tabular">{{ active24H }}</span>
      </span>
      <span class="text-gray-300">&middot;</span>
      <span v-if="node.isValidator">
        30D <span class="font-semibold text-emerald-600 tabular">{{ validating30D }}</span>
      </span>
      <span v-else>
        30D <span class="font-semibold text-emerald-600 tabular">{{ active30D }}</span>
      </span>
      <span class="text-gray-300">&middot;</span>
      <span>Trusts <span class="font-semibold text-gray-900">{{ trustsCount }}</span></span>
      <span class="text-gray-300">&middot;</span>
      <span>Trusted by <span class="font-semibold text-gray-900">{{ trustedByCount }}</span></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Node, QuorumSet } from 'shared';
import useStore from '@/store/useStore';
import { NodeWarningDetector } from '@/services/NodeWarningDetector';
import { useRoute } from 'vue-router';

const props = defineProps<{
  node: Node;
}>();

defineEmits<{
  'simulate-node': [];
  'quorum-slices': [];
  'stellar-config': [];
}>();

const store = useStore();
const network = store.network;
const route = useRoute();

const warningExpanded = ref(false);

const routeQuery = computed(() => ({
  view: route.query.view,
  network: route.query.network,
  at: route.query.at,
}));

const organization = computed(() => {
  if (props.node.organizationId) {
    return network.getOrganizationById(props.node.organizationId);
  }
  return null;
});

// Warning state
const isFailing = computed(() => network.isNodeFailing(props.node));

const warningReasons = computed(() =>
  NodeWarningDetector.getNodeWarningReasons(props.node, network),
);

const hasHistoryArchiveError = computed(() =>
  network.historyArchiveHasError(props.node),
);

const hasWarnings = computed(() =>
  isFailing.value || warningReasons.value.length > 0 || hasHistoryArchiveError.value,
);

const warningCount = computed(() => {
  let count = 0;
  if (isFailing.value) count++;
  count += warningReasons.value.length;
  if (hasHistoryArchiveError.value) count++;
  return count;
});

// Stats
const validating24H = computed(() =>
  props.node.statistics.has24HourStats
    ? props.node.statistics.validating24HoursPercentage + '%'
    : 'N/A',
);

const active24H = computed(() =>
  props.node.statistics.has24HourStats
    ? props.node.statistics.active24HoursPercentage + '%'
    : 'N/A',
);

const validating30D = computed(() =>
  props.node.statistics.has30DayStats
    ? props.node.statistics.validating30DaysPercentage + '%'
    : 'N/A',
);

const active30D = computed(() =>
  props.node.statistics.has30DayStats
    ? props.node.statistics.active30DaysPercentage + '%'
    : 'N/A',
);

const trustsCount = computed(() =>
  QuorumSet.getAllValidators(props.node.quorumSet).length,
);

const trustedByCount = computed(() =>
  network.getTrustingNodes(props.node).length,
);
</script>
