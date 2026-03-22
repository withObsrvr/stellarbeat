<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">
        Trusts
        <UiBadge variant="success">{{ validators.length }}</UiBadge>
        nodes
      </h1>
      <div class="ml-auto">
        <form>
          <div class="relative">
            <input
              v-model="filter"
              type="text"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 w-40"
              placeholder="Search"
              name="s"
            />
            <div class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
        </form>
      </div>
    </div>
    <nodes-table
      :filter="filter"
      :nodes="validators"
      :fields="fields"
      :per-page="5"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, type ComputedRef, ref } from "vue";
import { Node, QuorumSet } from "shared";

import NodesTable, { type TableNode } from "@/components/node/nodes-table.vue";
import useStore from "@/store/useStore";

const props = defineProps<{
  node: Node;
}>();
const store = useStore();
const network = store.network;
const filter = ref("");

const fields = computed(() => {
  if (!store.isSimulation) {
    return [
      { key: "name", label: "Quorumset validator", sortable: true },
      { key: "index", label: "index", sortable: true },
      { key: "trustScore", label: "Trust", sortable: true },
      {
        key: "validating24Hour",
        label: "24H validating",
        sortable: true,
      },
      {
        key: "validating30Days",
        label: "30D validating",
        sortable: true,
      },
      { key: "version", label: "version", sortable: true },
      { key: "country", label: "country", sortable: true },
      { key: "isp", label: "isp", sortable: true },
      { key: "action", label: "", sortable: false, tdClass: "action" },
    ];
  } else {
    return [
      { key: "name", label: "Quorumset validator", sortable: true },
      { key: "action", label: "", sortable: false, tdClass: "action" },
    ];
  }
});

const validators: ComputedRef<TableNode[]> = computed(() => {
  return QuorumSet.getAllValidators(props.node.quorumSet)
    .map((publicKey) => network.getNodeByPublicKey(publicKey))
    .map((validator) => {
      // Calculate incoming trust count for this validator
      const trustingNodes = network.getTrustingNodes(validator);
      const incomingTrustCount = trustingNodes.length;
      
      // Calculate organizational diversity for this validator
      const trustingOrganizations = new Set<string>();
      trustingNodes.forEach(trustingNode => {
        if (trustingNode.organizationId) {
          trustingOrganizations.add(trustingNode.organizationId);
        }
      });
      const organizationalDiversity = trustingOrganizations.size;

      const mappedNode: TableNode = {
        isFullValidator: validator.isFullValidator,
        name: validator.displayName,
        version: validator.versionStr || undefined,
        index: validator.index,
        validating24Hour: validator.statistics.has24HourStats
          ? validator.statistics.validating24HoursPercentage + "%"
          : "NA",
        validating30Days: validator.statistics.has30DayStats
          ? validator.statistics.validating30DaysPercentage + "%"
          : "NA",
        country: validator.geoData.countryName || undefined,
        isp: validator.isp || undefined,
        publicKey: validator.publicKey,
        validating: validator.isValidating,
        // Trust metrics
        trustCentralityScore: validator.trustCentralityScore,
        pageRankScore: validator.pageRankScore,
        trustRank: validator.trustRank,
        lastTrustCalculation: validator.lastTrustCalculation || undefined,
        organizationalDiversity,
        incomingTrustCount,
      };
      return mappedNode;
    });
});
</script>
