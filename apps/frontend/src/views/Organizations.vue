<template>
  <div>
    <div class="flex justify-between items-center py-3">
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-900">Organizations</h1>
        <simulation-badge />
        <time-travel-badge />
      </div>
      <crawl-time />
    </div>
    <div class="rounded-xl border border-gray-200 bg-white mb-2">
      <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
        <div class="flex w-full">
          <div class="sm:ml-auto">
            <input
              id="searchInput"
              v-model="filter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 w-full sm:w-64"
              type="text"
              placeholder="Search organizations..."
            />
          </div>
        </div>
      </div>
      <!-- Prism-style table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-2xs font-mono text-gray-400 uppercase tracking-widest bg-gray-50/80">
              <th class="px-5 py-3 font-medium">Organization</th>
              <th class="px-4 py-3 font-medium text-center">Validators</th>
              <th class="px-4 py-3 font-medium text-right hidden md:table-cell">24H Avail.</th>
              <th class="px-4 py-3 font-medium text-right">30D Avail.</th>
              <th class="px-4 py-3 font-medium text-right hidden lg:table-cell">Tolerance</th>
              <th class="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="org in paginatedOrgs"
              :key="org.id"
              class="group hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="openSlideOut(org)"
            >
              <td class="px-5 py-3">
                <div class="flex items-center gap-1.5">
                  <span
                    v-if="org.hasReliableUptime"
                    v-tooltip="'>99% uptime with at least 3 validators'"
                    class="inline-flex items-center justify-center rounded bg-emerald-500 text-white p-0.5"
                  >
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </span>
                  <span class="text-sm font-medium text-gray-900">{{ org.name }}</span>
                  <UiBadge
                    v-if="failAt(org) < 1"
                    v-tooltip="store.getOrganizationFailingReason(org)"
                    variant="danger"
                  >{{ network.isOrganizationBlocked(org) ? 'Blocked' : 'Failing' }}</UiBadge>
                  <UiBadge
                    v-else-if="failAt(org) === 1"
                    v-tooltip="'If one more validator fails, this organization will fail'"
                    variant="warning"
                  >Warning</UiBadge>
                  <UiBadge
                    v-else-if="OrganizationWarningDetector.organizationHasWarnings(org, network)"
                    v-tooltip="OrganizationWarningDetector.getOrganizationWarningReasons(org, network).join(', ')"
                    variant="warning"
                  >Warning</UiBadge>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <UiStatusDot
                    v-for="v in getValidatorDots(org)"
                    :key="v.publicKey"
                    :color="v.isValidating ? 'emerald' : 'red'"
                  />
                </div>
              </td>
              <td class="px-4 py-3 text-right hidden md:table-cell">
                <span class="text-xs tabular" :class="availColor(org.subQuorum24HoursAvailability)">
                  {{ org.subQuorum24HoursAvailability }}%
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs tabular" :class="availColor(org.subQuorum30DaysAvailability)">
                  {{ org.subQuorum30DaysAvailability }}%
                </span>
              </td>
              <td class="px-4 py-3 text-right hidden lg:table-cell">
                <span class="text-xs tabular" :class="failAt(org) <= 0 ? 'text-red-500 font-semibold' : failAt(org) === 1 ? 'text-amber-600' : 'text-gray-700'">
                  {{ failAt(org) <= 0 ? '0' : failAt(org) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <UiBadge
                  v-if="network.isOrganizationFailing(org)"
                  variant="red"
                >Failing</UiBadge>
                <UiBadge
                  v-else
                  variant="emerald"
                >Healthy</UiBadge>
              </td>
            </tr>
            <tr v-if="paginatedOrgs.length === 0">
              <td colspan="6" class="px-5 py-8 text-center text-sm text-gray-400">
                No organizations found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="filteredOrgs.length > perPage" class="flex justify-between items-center px-5 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">
          Showing {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filteredOrgs.length) }} of {{ filteredOrgs.length }}
        </span>
        <UiPagination
          v-model="currentPage"
          size="sm"
          :limit="3"
          :total-rows="filteredOrgs.length"
          :per-page="perPage"
        />
      </div>
    </div>

    <!-- Slide-out -->
    <OrganizationSlideOut
      :organization="slideOutOrg"
      :visible="slideOutVisible"
      @close="slideOutVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { Organization, Node } from "shared";
import CrawlTime from "@/components/crawl-time.vue";
import SimulationBadge from "@/components/simulation-badge.vue";
import TimeTravelBadge from "@/components/time-travel-badge.vue";
import OrganizationSlideOut from "@/components/organization/OrganizationSlideOut.vue";
import { computed, ref, watch } from "vue";
import useStore from "@/store/useStore";
import { OrganizationWarningDetector } from "@/services/OrganizationWarningDetector";
import useMetaTags from "@/composables/useMetaTags";

const store = useStore();
const network = store.network;

const filter = ref("");
const currentPage = ref(1);
const perPage = 25;

const slideOutVisible = ref(false);
const slideOutOrg = ref<Organization | null>(null);

function openSlideOut(org: Organization) {
  slideOutOrg.value = org;
  slideOutVisible.value = true;
}

function failAt(org: Organization): number {
  return store.getOrganizationFailAt(org);
}

function getValidatorDots(org: Organization) {
  return org.validators
    .map((pk) => network.getNodeByPublicKey(pk))
    .filter((n) => n && !n.unknown)
    .sort((a: Node, b: Node) => a.displayName.localeCompare(b.displayName));
}

function availColor(pct: number) {
  if (pct >= 99) return 'text-emerald-600';
  if (pct >= 90) return 'text-amber-600';
  return 'text-red-500';
}

const filteredOrgs = computed(() => {
  const lowerFilter = filter.value.toLowerCase();
  return network.organizations
    .filter((org) => {
      if (!lowerFilter) return true;
      return (
        org.name.toLowerCase().includes(lowerFilter) ||
        org.id.toLowerCase().includes(lowerFilter) ||
        (org.url?.toLowerCase().includes(lowerFilter)) ||
        (org.keybase?.toLowerCase().includes(lowerFilter))
      );
    })
    .sort((a, b) => b.subQuorum30DaysAvailability - a.subQuorum30DaysAvailability);
});

const paginatedOrgs = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredOrgs.value.slice(start, start + perPage);
});

watch(filter, () => { currentPage.value = 1; });

useMetaTags("Organizations", "Search through all detected organizations");
</script>
