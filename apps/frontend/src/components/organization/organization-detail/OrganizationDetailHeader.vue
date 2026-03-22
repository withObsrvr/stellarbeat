<template>
  <div class="mb-5">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-sm text-gray-400 mb-3">
      <router-link
        :to="{ name: 'network-dashboard', query: routeQuery }"
        class="hover:text-gray-700 transition-colors"
      >Network</router-link>
      <span>&rsaquo;</span>
      <span class="text-gray-700">{{ organization.name }}</span>
    </nav>

    <!-- Title + Badges + Actions -->
    <div class="flex flex-wrap items-center gap-2 mb-2">
      <span
        v-if="organization.hasReliableUptime"
        v-tooltip="'>99% uptime with at least 3 validators'"
        class="inline-flex items-center justify-center rounded bg-emerald-500 text-white p-0.5"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      </span>
      <span class="text-2xl font-bold text-gray-900">{{ organization.name }}</span>

      <UiBadge
        v-if="isFailing"
        variant="red"
      >{{ isBlocked ? 'Blocked' : 'Failing' }}</UiBadge>
      <UiBadge
        v-else-if="failAt === 1"
        variant="amber"
      >Warning</UiBadge>
      <UiBadge v-else variant="emerald">Healthy</UiBadge>

      <UiBadge v-if="organization.hasReliableUptime" variant="gray" tier="meta">
        Reliable Uptime
      </UiBadge>

      <!-- Inline warning indicator -->
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
        {{ warningCount }} {{ warningCount === 1 ? 'issue' : 'issues' }}
        <svg
          class="h-3 w-3 transition-transform"
          :class="{ 'rotate-180': warningExpanded }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Actions pushed right -->
      <div class="ml-auto flex items-center gap-2">
        <button
          v-if="!isBlocked"
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="store.toggleOrganizationAvailability(organization)"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {{ organization.subQuorumAvailable ? 'Halt' : 'Start' }}
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
          <UiDropdownItemButton
            v-if="store.networkContext.enableConfigExport"
            @click="$emit('stellar-config')"
          >
            Stellar core config
          </UiDropdownItemButton>
        </UiDropdown>
      </div>
    </div>

    <!-- Expanded warning details -->
    <div
      v-if="hasWarnings && warningExpanded"
      class="mb-3 rounded-lg px-4 py-3 text-sm ring-1"
      :class="isFailing
        ? 'text-red-600 bg-red-50/50 ring-red-200/60'
        : 'text-amber-700 bg-amber-50/50 ring-amber-200/60'"
    >
      <div v-if="isFailing" class="mb-1">
        {{ store.getOrganizationFailingReason(organization) }}
      </div>
      <ul v-if="warningReasons.length > 0" class="pl-3 ml-0 mb-0 list-disc">
        <li v-for="reason in warningReasons" :key="reason">{{ reason }}.</li>
      </ul>
    </div>

    <!-- Description -->
    <p v-if="organization.description" class="text-sm text-gray-500 mb-3">
      {{ organization.description }}
    </p>

    <!-- Inline stats + social links -->
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
      <span>Validators <span class="font-semibold text-gray-900">{{ organization.validators.length }}</span></span>
      <span class="text-gray-300">&middot;</span>
      <span>24H <span class="font-semibold tabular" :class="availColor(organization.subQuorum24HoursAvailability)">{{ organization.subQuorum24HoursAvailability }}%</span></span>
      <span class="text-gray-300">&middot;</span>
      <span>30D <span class="font-semibold tabular" :class="availColor(organization.subQuorum30DaysAvailability)">{{ organization.subQuorum30DaysAvailability }}%</span></span>
      <span class="text-gray-300">&middot;</span>
      <span>Tolerance <span class="font-semibold" :class="failAt <= 0 ? 'text-red-500' : failAt === 1 ? 'text-amber-600' : 'text-gray-900'">{{ failAt }}</span></span>

      <!-- Social links -->
      <span v-if="organization.url || organization.keybase || organization.github" class="text-gray-200 hidden sm:inline">|</span>
      <span class="flex items-center gap-2">
        <a v-if="organization.url" :href="organization.url" target="_blank" rel="noopener" class="text-gray-400 hover:text-gray-700 transition-colors" v-tooltip="organization.url">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </a>
        <a v-if="organization.officialEmail" :href="'mailto:' + organization.officialEmail" class="text-gray-400 hover:text-gray-700 transition-colors" v-tooltip="organization.officialEmail">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        </a>
        <a v-if="organization.github" :href="'https://github.com/' + organization.github" target="_blank" rel="noopener" class="text-gray-400 hover:text-gray-700 transition-colors" v-tooltip="organization.github">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a v-if="organization.keybase" :href="'https://keybase.io/' + organization.keybase" target="_blank" rel="noopener" class="text-gray-400 hover:text-gray-700 transition-colors" v-tooltip="organization.keybase">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </a>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Organization } from 'shared';
import useStore from '@/store/useStore';
import { OrganizationWarningDetector } from '@/services/OrganizationWarningDetector';
import { useRoute } from 'vue-router';

const props = defineProps<{
  organization: Organization;
}>();

defineEmits<{
  'simulate-node': [];
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

const isFailing = computed(() => network.isOrganizationFailing(props.organization));
const isBlocked = computed(() => network.isOrganizationBlocked(props.organization));
const failAt = computed(() => store.getOrganizationFailAt(props.organization));

const warningReasons = computed(() =>
  OrganizationWarningDetector.getOrganizationWarningReasons(props.organization, network),
);

const hasWarnings = computed(() =>
  isFailing.value || warningReasons.value.length > 0,
);

const warningCount = computed(() => {
  let count = 0;
  if (isFailing.value) count++;
  count += warningReasons.value.length;
  return count;
});

function availColor(pct: number) {
  if (pct >= 99) return 'text-emerald-600';
  if (pct >= 90) return 'text-amber-600';
  return 'text-red-500';
}
</script>
