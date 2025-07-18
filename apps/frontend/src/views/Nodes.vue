<template>
  <div>
    <!--consent /!-->
    <div>
      <div class="page-header d-flex justify-content-between py-3">
        <div class="d-flex align-items-center">
          <h1 class="page-title">Nodes</h1>
          <simulation-badge />
          <time-travel-badge />
        </div>
        <crawl-time class="" />
      </div>
      <div class="card mb-2 p-1">
        <div class="card-header">
          <div class="row header-row">
            <div class="col-12 col-sm-6">
              <div class="row">
                <div class="col-sm-6">
                  <label class="custom-switch mt-2">
                    <input
                      v-model="optionShowInactive"
                      name="custom-switch-checkbox"
                      class="custom-switch-input"
                      type="checkbox"
                    />
                    <span class="custom-switch-indicator"></span>
                    <span class="custom-switch-description"
                      >Include inactive nodes</span
                    >
                  </label>
                </div>
                <div class="col-sm-6">
                  <label class="custom-switch mt-2">
                    <input
                      v-model="optionShowAllConnectableNodes"
                      name="custom-switch-checkbox"
                      class="custom-switch-input"
                      type="checkbox"
                    />
                    <span class="custom-switch-indicator"></span>
                    <span class="custom-switch-description"
                      >Include all connectable nodes</span
                    >
                  </label>
                </div>
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <input
                id="searchInput"
                v-model="filter"
                class="form-control search mr-0"
                type="text"
                placeholder="Type public key, name, ... to search"
              />
            </div>
          </div>
        </div>
        <div class="card-body">
          <nodes-table :fields="fields" :nodes="nodes" :filter="filter" />
        </div>
      </div>
      <div v-if="store.networkContext.enableIndex" class="card mb-2">
        <div class="card-body">
          <div class="text-wrap">
            <h2 class="mt-0 mb-4">Index formula</h2>
            <pre><code>
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
    fieldsBase.push({
      key: "active24Hour",
      label: "24H active",
      sortable: true,
    });
    fieldsBase.push({
      key: "active30Days",
      label: "30D active",
      sortable: true,
    });
    fieldsBase.push({
      key: "validating24Hour",
      label: "24H validating",
      sortable: true,
    });
    fieldsBase.push({
      key: "validating30Days",
      label: "30D validating",
      sortable: true,
    });
    fieldsBase.push({
      key: "overLoaded24Hour",
      label: "24H Crawler rejected",
      sortable: true,
    });
    fieldsBase.push({
      key: "lag",
      label: "Lag",
      sortable: true,
    });
  }

  if (store.networkContext.enableIndex) {
    fieldsBase.push({ key: "index", label: "index", sortable: true });
  }

  // Add trust visualization columns
  fieldsBase.push({ key: "trustScore", label: "Trust Score", sortable: true });
  fieldsBase.push({ key: "trustRank", label: "Trust Rank", sortable: true });
  
  // Add seeded trust columns (will be shown/hidden based on view mode)
  fieldsBase.push({ key: "seededTrustScore", label: "Seeded Trust Score", sortable: true });
  fieldsBase.push({ key: "seededTrustRank", label: "Seeded Rank", sortable: true });
  fieldsBase.push({ key: "distanceFromSeeds", label: "Distance from Seeds", sortable: true });
}

const fields = computed(() => {
  return fieldsBase;
});

const getNodeType = (node: Node): string => {
  if (node.isFullValidator) {
    return "Full validator";
  }
  if (node.isValidator) return "Validator";

  return "Connectable Node";
};

const nodes: ComputedRef<TableNode[]> = computed(() => {
  return store.network.nodes
    .filter((node) => node.active || optionShowInactive.value)
    .filter((node) => node.isValidator || optionShowAllConnectableNodes.value)
    .map((node) => {
      // Calculate incoming trust count
      const trustingNodes = store.network.getTrustingNodes(node);
      const incomingTrustCount = trustingNodes.length;
      
      // Calculate organizational diversity
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
        active24Hour: node.statistics.has24HourStats
          ? node.statistics.active24HoursPercentage + "%"
          : "NA",
        active30Days: node.statistics.has30DayStats
          ? node.statistics.active30DaysPercentage + "%"
          : "NA",
        validating24Hour: node.statistics.has24HourStats
          ? node.statistics.validating24HoursPercentage + "%"
          : "NA",
        validating30Days: node.statistics.has30DayStats
          ? node.statistics.validating30DaysPercentage + "%"
          : "NA",
        overLoaded24Hour: node.statistics.has24HourStats
          ? node.statistics.overLoaded24HoursPercentage + "%"
          : "NA",
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
        // Trust metrics
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
  if (!node.organizationId) {
    return "-";
  }
  const organization = store.network.getOrganizationById(node.organizationId);
  if (organization) {
    return organization.name;
  } else {
    return "-";
  }
};

useMetaTags("Nodes", "Search through all available nodes");
</script>

<style scoped>
.header-row {
  width: 100%;
}
</style>
