<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 pl-3 pr-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">
        <UiBadge variant="success">{{ numberOfActiveNodes }}</UiBadge>
        active
        {{ store.includeAllNodes ? "nodes" : "validators" }}
      </h1>
      <div class="ml-auto">
        <form>
          <div class="relative">
            <input
              v-model="filter"
              type="text"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-200 w-40"
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
      :sort-by="'index'"
      :sort-by-desc="true"
    />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import NodesTable, { type TableNode } from "@/components/node/nodes-table.vue";
import useStore from "@/store/useStore";

const store = useStore();
const network = store.network;

const filter = ref("");

const fields = computed(() => {
  const fields = [{ key: "name", label: "Node", sortable: true }];

  if (store.networkContext.enableIndex && !store.isSimulation) {
    fields.push({ key: "index", label: "Index", sortable: true });
  }

  // Add trust score for this network overview
  fields.push({ key: "trustScore", label: "Trust", sortable: true });

  fields.push({
    key: "action",
    label: "",
    sortable: false,
    //@ts-ignore
    tdClass: "action",
  });

  return fields;
});

const numberOfActiveNodes = computed(() => {
  if (store.includeAllNodes)
    return network.nodes.filter((node) => !network.isNodeFailing(node)).length;
  else
    return network.nodes.filter(
      (node) => node.isValidator && !network.isNodeFailing(node),
    ).length;
});

const validators = computed(() => {
  return network.nodes
    .filter((node) => node.isValidator || store.includeAllNodes)
    .map((node) => {
      // Calculate incoming trust count
      const trustingNodes = network.getTrustingNodes(node);
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
        index: node.index,
        isFullValidator: node.isFullValidator,
        publicKey: node.publicKey,
        validating: node.isValidating,
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
</script>
