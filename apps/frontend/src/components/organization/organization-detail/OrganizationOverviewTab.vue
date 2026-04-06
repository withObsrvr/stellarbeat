<template>
  <div>
    <!-- Availability bar chart -->
    <div v-if="!store.isSimulation" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      <BarChart30D
        title="24H Availability"
        :value="organization.subQuorum24HoursAvailability + '%'"
        :bars="availabilityBars"
        color-scheme="emerald"
      />
      <BarChart30D
        title="30D Availability"
        :value="organization.subQuorum30DaysAvailability + '%'"
        :bars="availabilityBars"
        color-scheme="emerald"
      />
    </div>

    <!-- Two-column: Validators + Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Validators -->
      <div>
        <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Validators ({{ validators.length }})
        </h3>
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
          <div
            v-for="(validator, i) in validators"
            :key="validator.publicKey"
            :class="[
              'flex items-center justify-between px-5 py-2.5',
              i < validators.length - 1 ? 'border-b border-gray-100' : '',
            ]"
          >
            <div class="flex items-center gap-2">
              <UiStatusDot :color="validator.isValidating ? 'emerald' : 'red'" />
              <router-link
                :to="{
                  name: 'node-dashboard',
                  params: { publicKey: validator.publicKey },
                  query: routeQuery,
                }"
                class="font-medium text-gray-900 hover:text-emerald-700 transition-colors"
              >{{ validator.displayName }}</router-link>
              <UiBadge v-if="validator.isFullValidator" variant="gray" tier="meta">Full</UiBadge>
              <UiBadge
                v-if="network.isNodeFailing(validator)"
                v-tooltip="network.getNodeFailingReason(validator).description"
                variant="danger"
              >{{ network.getNodeFailingReason(validator).label }}</UiBadge>
              <UiBadge
                v-else-if="NodeWarningDetector.nodeHasWarning(validator, network)"
                v-tooltip="NodeWarningDetector.getNodeWarningReasonsConcatenated(validator, network)"
                variant="warning"
              >Warning</UiBadge>
            </div>
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <span class="tabular hidden sm:inline">
                {{ validator.statistics.has30DayStats ? validator.statistics.validating30DaysPercentage + '%' : 'N/A' }}
              </span>
              <span class="font-mono text-2xs hidden md:inline">
                {{ validator.versionStr ? truncateVersion(validator.versionStr) : '' }}
              </span>
            </div>
          </div>
          <div class="flex items-center justify-between px-5 py-2.5 bg-gray-50/80">
            <span class="text-gray-400">Fail tolerance</span>
            <span class="font-semibold" :class="failAt <= 0 ? 'text-red-500' : failAt === 1 ? 'text-amber-600' : 'text-emerald-600'">
              {{ failAt <= 0 ? 'Failing' : failAt + ' can fail' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Organization Details -->
      <div>
        <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Details</h3>
        <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden text-sm">
          <UiDetailRow label="Website">
            <a v-if="organization.url" :href="organization.url" target="_blank" rel="noopener" class="text-gray-700 hover:text-emerald-700 transition-colors">
              {{ organization.url }}
            </a>
            <span v-else class="text-gray-400">N/A</span>
          </UiDetailRow>
          <UiDetailRow label="Email">
            <a v-if="organization.officialEmail" :href="'mailto:' + organization.officialEmail" class="text-gray-700">
              {{ organization.officialEmail }}
            </a>
            <span v-else class="text-gray-400">N/A</span>
          </UiDetailRow>
          <UiDetailRow label="Phone">
            <span class="text-gray-700">{{ organization.phoneNumber || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="Address">
            <span class="text-gray-700">{{ organization.physicalAddress || 'N/A' }}</span>
          </UiDetailRow>
          <UiDetailRow label="Keybase">
            <a v-if="organization.keybase" :href="'https://keybase.io/' + organization.keybase" target="_blank" rel="noopener" class="text-gray-700">
              {{ organization.keybase }}
            </a>
            <span v-else class="text-gray-400">N/A</span>
          </UiDetailRow>
          <UiDetailRow label="GitHub">
            <a v-if="organization.github" :href="'https://github.com/' + organization.github" target="_blank" rel="noopener" class="text-gray-700">
              {{ organization.github }}
            </a>
            <span v-else class="text-gray-400">N/A</span>
          </UiDetailRow>
          <UiDetailRow label="Horizon">
            <a v-if="organization.horizonUrl" :href="organization.horizonUrl" target="_blank" rel="noopener" class="text-gray-700 break-all text-xs">
              {{ organization.horizonUrl }}
            </a>
            <span v-else class="text-gray-400">N/A</span>
          </UiDetailRow>
          <UiDetailRow label="DBA" :last="true">
            <span class="text-gray-700">{{ organization.dba || 'N/A' }}</span>
          </UiDetailRow>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Organization, Node } from 'shared';
import useStore from '@/store/useStore';
import { NodeWarningDetector } from '@/services/NodeWarningDetector';
import useOrganizationMeasurementsStore from '@/store/useOrganizationMeasurementsStore';
import BarChart30D, { type Bar } from '@/components/node/node-detail/BarChart30D.vue';
import { useRoute } from 'vue-router';

const props = defineProps<{
  organization: Organization;
}>();

const store = useStore();
const network = store.network;
const orgMeasurementStore = useOrganizationMeasurementsStore();
const route = useRoute();

const routeQuery = computed(() => ({
  view: route.query.view,
  network: route.query.network,
  at: route.query.at,
}));

const failAt = computed(() => store.getOrganizationFailAt(props.organization));

const validators = computed(() => {
  return props.organization.validators
    .map((pk) => network.getNodeByPublicKey(pk))
    .filter((n) => n && !n.unknown)
    .sort((a: Node, b: Node) => a.displayName.localeCompare(b.displayName));
});

function truncateVersion(versionStr: string): string {
  const match = versionStr.match(/v?(\d+\.\d+\.\d+)/);
  return match ? match[1] : versionStr.substring(0, 20);
}

// 30D availability bars
const dayStats = ref<any[]>([]);

async function fetchDayStats() {
  const to = new Date(network.time);
  const from = new Date(network.time);
  from.setDate(from.getDate() - 30);
  try {
    dayStats.value = await orgMeasurementStore.getDayStatistics(
      props.organization.id,
      from,
      to,
    );
  } catch {
    dayStats.value = [];
  }
}

onMounted(fetchDayStats);
watch(() => props.organization.id, fetchDayStats);

const availabilityBars = computed<Bar[]>(() => {
  if (dayStats.value.length === 0) {
    return Array(30).fill({ height: '4px', color: 'bg-gray-200' });
  }
  return dayStats.value.map((stat: any) => {
    const ratio = stat.isSubQuorumAvailableCount / stat.crawlCount;
    const pct = Math.max(4, Math.round(ratio * 100));
    return {
      height: pct + '%',
      color: ratio > 0.99 ? 'bg-emerald-500' : ratio > 0.5 ? 'bg-amber-400' : 'bg-red-400',
    };
  });
});
</script>
