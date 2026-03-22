<template>
  <div>
    <div>
      <div class="flex justify-between items-center py-3">
        <div class="flex items-center">
          <h1 class="text-xl font-semibold text-gray-900">Organizations</h1>
          <simulation-badge />
          <time-travel-badge />
        </div>
        <crawl-time />
      </div>
      <div class="rounded-xl border border-gray-200 bg-white mb-2 p-1">
        <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
          <div class="flex w-full">
            <div class="sm:w-1/2">
              <input
                id="searchInput"
                v-model="filter"
                class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 w-full"
                type="text"
                placeholder="Search"
              />
            </div>
          </div>
        </div>
        <div class="p-4">
          <organizations-table
            :organizations="organizations"
            :fields="fields"
            :filter="filter"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CrawlTime from "@/components/crawl-time.vue";
import SimulationBadge from "@/components/simulation-badge.vue";
import TimeTravelBadge from "@/components/time-travel-badge.vue";
import OrganizationsTable, {
  type TableOrganization,
} from "@/components/organization/organizations-table.vue";
import { computed, type ComputedRef, ref } from "vue";
import useStore from "@/store/useStore";
import { OrganizationWarningDetector } from "@/services/OrganizationWarningDetector";
import useMetaTags from "@/composables/useMetaTags";
import { Node, Organization } from "shared";

defineProps({
  isLoading: {
    type: Boolean,
    required: true,
    default: false,
  },
});

const store = useStore();
const filter = ref("");
const fields = computed(() => {
  if (store.isSimulation) {
    return [
      { key: "name", sortable: true },
      { key: "validators", sortable: false },
    ];
  } else {
    return [
      { key: "name", sortable: true },
      { key: "validators", sortable: false },
      { key: "subQuorum24HAvailability", label: "24H Availability", sortable: true },
      { key: "subQuorum30DAvailability", label: "30D Availability", sortable: true },
      { key: "url", sortable: true },
      { key: "keybase", sortable: true },
      { key: "email", sortable: true },
    ];
  }
});

const organizations: ComputedRef<TableOrganization[]> = computed(() => {
  return store.network.organizations.map((organization) => {
    const mappedOrganization: TableOrganization = {
      name: organization.name,
      validators: getValidators(organization),
      keybase: organization.keybase || undefined,
      github: organization.github || undefined,
      url: organization.url || undefined,
      email: organization.officialEmail || undefined,
      id: organization.id,
      failAt: store.getOrganizationFailAt(organization),
      dangers: store.getOrganizationFailingReason(organization),
      hasWarning: OrganizationWarningDetector.organizationHasWarnings(organization, store.network),
      warning: OrganizationWarningDetector.getOrganizationWarningReasons(organization, store.network).join(" | "),
      blocked: store.network.isOrganizationBlocked(organization),
      subQuorum24HAvailability: organization.subQuorum24HoursAvailability + "%",
      subQuorum30DAvailability: organization.subQuorum30DaysAvailability + "%",
      hasReliableUptime: organization.hasReliableUptime,
    };
    return mappedOrganization;
  });
});

const getValidators = (organization: Organization) => {
  return organization.validators
    .map((publicKey) => store.network.getNodeByPublicKey(publicKey))
    .sort((a: Node, b: Node) => a.displayName.localeCompare(b.displayName));
};

useMetaTags("Organizations", "Search through all detected organizations");
</script>
