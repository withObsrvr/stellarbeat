<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">
        Trusted by
        <UiBadge variant="success">{{ nodes.length }}</UiBadge> nodes
      </h1>
    </div>
    <nodes-table :nodes="nodes" :fields="fields" :per-page="5" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { Node } from "shared";
import NodesTable, { type TableNode } from "@/components/node/nodes-table.vue";

import useStore from "@/store/useStore";

const props = defineProps<{
  node: Node;
}>();

const store = useStore();
const network = store.network;

const fields = computed(() => {
  const fields = [{ key: "name", label: "Node", sortable: true }];

  if (!store.isSimulation) {
    fields.push({ key: "index", label: "index", sortable: true });
    fields.push({ key: "trustScore", label: "Trust", sortable: true });
  }

  fields.push({
    key: "action",
    label: "",
    sortable: false,
    //@ts-ignore
    tdClass: "action",
  });
  return fields;
});

const nodes = computed(() => {
  return network.getTrustingNodes(props.node).map((validator) => {
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
      publicKey: validator.publicKey,
      index: validator.index,
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
