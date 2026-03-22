<template>
  <div>
    <div>
      <div class="flex justify-between items-center py-3">
        <div class="flex items-center">
          <h1 class="text-xl font-semibold text-gray-900">Nodes</h1>
          <simulation-badge />
          <time-travel-badge />
        </div>
        <crawl-time />
      </div>
      <div class="rounded-xl border border-gray-200 bg-white mb-2 p-1">
        <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
          <div class="flex flex-col sm:flex-row gap-3 w-full">
            <div class="flex gap-4">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="optionShowInactive"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                Include inactive nodes
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  v-model="optionShowAllConnectableNodes"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                Include all connectable nodes
              </label>
            </div>
            <div class="sm:ml-auto">
              <input
                id="searchInput"
                v-model="filter"
                class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 w-full sm:w-64"
                type="text"
                placeholder="Type public key, name, ... to search"
              />
            </div>
          </div>
        </div>
        <div class="p-4">
          <nodes-table :fields="fields" :nodes="nodes" :filter="filter" />
        </div>
      </div>
      <div v-if="store.networkContext.enableIndex" class="rounded-xl border border-gray-200 bg-white mb-2">
        <div class="p-4">
          <div class="text-wrap">
            <h2 class="mt-0 mb-4 text-lg font-semibold">Index formula</h2>
            <pre class="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto"><code>
Index = (TypeIndex + ActiveIndex + ValidationIndex + VersionIndex + TrustIndex + AgeIndex)/6

TypeIndex = Full validator | Basic validator | Connectable node
ActiveIndex = Active percentage last 30 days
ValidationIndex = Validation percentage last 30 days
Version = How far away from the latest stable Stellar core version
Trust = How many active validators trust this node
Age = Time since discovery
                        </code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Node } from "shared";
import CrawlTime from "@/components/crawl-time.vue";
import SimulationBadge from "@/components/simulation-badge.vue";
import NodesTable, { type TableNode } from "@/components/node/nodes-table.vue";
import TimeTravelBadge from "@/components/time-travel-badge.vue";
import { computed, type ComputedRef, ref } from "vue";
import useStore from "@/store/useStore";
import useMetaTags from "@/composables/useMetaTags";

defineProps({
  isLoading: {
    type: Boolean,
    required: true,
  },
});

const store = useStore();

const optionShowInactive = ref(false);
const optionShowAllConnectableNodes = ref(false);
const filter = ref("");

const fieldsBase = [
  { key: "name", sortable: true },
  { key: "organization", sortable: true },
  { key: "country", sortable: true },
  { key: "isp", sortable: true },
  { key: "type", label: "type", sortable: true },
  { key: "ip", sortable: true },
  { key: "version", sortable: true },
  { key: "validating", sortable: true },
];

if (!store.isSimulation) {
  if (store.networkContext.enableHistory) {
    fieldsBase.push({ key: "active24Hour", label: "24H active", sortable: true });
    fieldsBase.push({ key: "active30Days", label: "30D active", sortable: true });
    fieldsBase.push({ key: "validating24Hour", label: "24H validating", sortable: true });
    fieldsBase.push({ key: "validating30Days", label: "30D validating", sortable: true });
    fieldsBase.push({ key: "overLoaded24Hour", label: "24H Crawler rejected", sortable: true });
    fieldsBase.push({ key: "lag", label: "Lag", sortable: true });
  }

  if (store.networkContext.enableIndex) {
    fieldsBase.push({ key: "index", label: "index", sortable: true });
  }

  fieldsBase.push({ key: "trustScore", label: "Trust Score", sortable: true });
  fieldsBase.push({ key: "trustRank", label: "Trust Rank", sortable: true });
  fieldsBase.push({ key: "seededTrustScore", label: "Seeded Trust Score", sortable: true });
  fieldsBase.push({ key: "seededTrustRank", label: "Seeded Rank", sortable: true });
  fieldsBase.push({ key: "distanceFromSeeds", label: "Distance from Seeds", sortable: true });
}

const fields = computed(() => {
  return fieldsBase;
});

const getNodeType = (node: Node): string => {
  if (node.isFullValidator) return "Full validator";
  if (node.isValidator) return "Validator";
  return "Connectable Node";
};

const nodes: ComputedRef<TableNode[]> = computed(() => {
  return store.network.nodes
    .filter((node) => node.active || optionShowInactive.value)
    .filter((node) => node.isValidator || optionShowAllConnectableNodes.value)
    .map((node) => {
      const trustingNodes = store.network.getTrustingNodes(node);
      const incomingTrustCount = trustingNodes.length;
      const trustingOrganizations = new Set<string>();
      trustingNodes.forEach(trustingNode => {
        if (trustingNode.organizationId) {
          trustingOrganizations.add(trustingNode.organizationId);
        }
      });
      const organizationalDiversity = trustingOrganizations.size;

      const mappedNode: TableNode = {
        name: node.displayName,
        type: getNodeType(node),
        active24Hour: node.statistics.has24HourStats ? node.statistics.active24HoursPercentage + "%" : "NA",
        active30Days: node.statistics.has30DayStats ? node.statistics.active30DaysPercentage + "%" : "NA",
        validating24Hour: node.statistics.has24HourStats ? node.statistics.validating24HoursPercentage + "%" : "NA",
        validating30Days: node.statistics.has30DayStats ? node.statistics.validating30DaysPercentage + "%" : "NA",
        overLoaded24Hour: node.statistics.has24HourStats ? node.statistics.overLoaded24HoursPercentage + "%" : "NA",
        ip: node.key,
        publicKey: node.publicKey,
        country: node.geoData.countryName || undefined,
        isp: node.isp || undefined,
        version: node.versionStr || undefined,
        lag: node.lag !== null ? node.lag + " ms" : "Not detected",
        isFullValidator: node.isFullValidator,
        isValidator: node.isValidator,
        index: node.index,
        validating: node.isValidating,
        organization: getOrganization(node),
        organizationId: node.organizationId || undefined,
        trustCentralityScore: node.trustCentralityScore,
        pageRankScore: node.pageRankScore,
        trustRank: node.trustRank,
        lastTrustCalculation: node.lastTrustCalculation || undefined,
        organizationalDiversity,
        incomingTrustCount,
      };
      return mappedNode;
    });
});

const getOrganization = (node: Node) => {
  if (!node.organizationId) return "-";
  const organization = store.network.getOrganizationById(node.organizationId);
  return organization ? organization.name : "-";
};

useMetaTags("Nodes", "Search through all available nodes");
</script>
