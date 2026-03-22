<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h3 class="text-sm font-semibold text-gray-900">
        Trusts
        <UiBadge variant="success">{{ validators.length }}</UiBadge>
        nodes
      </h3>
      <div>
        <input
          v-model="filter"
          type="text"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 w-40"
          placeholder="Search"
        />
      </div>
    </div>
    <nodes-table
      :filter="filter"
      :nodes="validators"
      :fields="fields"
      :per-page="10"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Node, QuorumSet } from 'shared';
import NodesTable, { type TableNode } from '@/components/node/nodes-table.vue';
import useStore from '@/store/useStore';

const props = defineProps<{
  node: Node;
}>();

const store = useStore();
const network = store.network;
const filter = ref('');

const fields = computed(() => {
  if (!store.isSimulation) {
    return [
      { key: 'name', label: 'Quorumset validator', sortable: true },
      { key: 'index', label: 'index', sortable: true },
      { key: 'trustScore', label: 'Trust', sortable: true },
      { key: 'validating24Hour', label: '24H validating', sortable: true },
      { key: 'validating30Days', label: '30D validating', sortable: true },
      { key: 'version', label: 'version', sortable: true },
      { key: 'country', label: 'country', sortable: true },
      { key: 'isp', label: 'isp', sortable: true },
      { key: 'action', label: '', sortable: false, tdClass: 'action' },
    ];
  }
  return [
    { key: 'name', label: 'Quorumset validator', sortable: true },
    { key: 'action', label: '', sortable: false, tdClass: 'action' },
  ];
});

const validators = computed<TableNode[]>(() => {
  return QuorumSet.getAllValidators(props.node.quorumSet)
    .map((publicKey) => network.getNodeByPublicKey(publicKey))
    .map((validator) => {
      const trustingNodes = network.getTrustingNodes(validator);
      const trustingOrganizations = new Set<string>();
      trustingNodes.forEach((n) => {
        if (n.organizationId) trustingOrganizations.add(n.organizationId);
      });

      return {
        isFullValidator: validator.isFullValidator,
        name: validator.displayName,
        version: validator.versionStr || undefined,
        index: validator.index,
        validating24Hour: validator.statistics.has24HourStats
          ? validator.statistics.validating24HoursPercentage + '%'
          : 'NA',
        validating30Days: validator.statistics.has30DayStats
          ? validator.statistics.validating30DaysPercentage + '%'
          : 'NA',
        country: validator.geoData.countryName || undefined,
        isp: validator.isp || undefined,
        publicKey: validator.publicKey,
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
