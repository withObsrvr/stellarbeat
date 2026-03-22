<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h3 class="text-sm font-semibold text-gray-900">
        Trusted by
        <UiBadge variant="success">{{ nodes.length }}</UiBadge>
        nodes
      </h3>
    </div>
    <nodes-table :nodes="nodes" :fields="fields" :per-page="10" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Node } from 'shared';
import NodesTable, { type TableNode } from '@/components/node/nodes-table.vue';
import useStore from '@/store/useStore';

const props = defineProps<{
  node: Node;
}>();

const store = useStore();
const network = store.network;

const fields = computed(() => {
  const f = [{ key: 'name', label: 'Node', sortable: true }];
  if (!store.isSimulation) {
    f.push({ key: 'index', label: 'index', sortable: true });
    f.push({ key: 'trustScore', label: 'Trust', sortable: true });
  }
  f.push({ key: 'action', label: '', sortable: false, tdClass: 'action' } as any);
  return f;
});

const nodes = computed<TableNode[]>(() => {
  return network.getTrustingNodes(props.node).map((validator) => {
    const trustingNodes = network.getTrustingNodes(validator);
    const trustingOrganizations = new Set<string>();
    trustingNodes.forEach((n) => {
      if (n.organizationId) trustingOrganizations.add(n.organizationId);
    });

    return {
      isFullValidator: validator.isFullValidator,
      name: validator.displayName,
      publicKey: validator.publicKey,
      index: validator.index,
      validating: validator.isValidating,
      trustCentralityScore: validator.trustCentralityScore,
      pageRankScore: validator.pageRankScore,
      trustRank: validator.trustRank,
      lastTrustCalculation: validator.lastTrustCalculation || undefined,
      organizationalDiversity: trustingOrganizations.size,
      incomingTrustCount: trustingNodes.length,
    } as TableNode;
  });
});
</script>
