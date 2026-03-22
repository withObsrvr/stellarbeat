<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h3 class="text-sm font-semibold text-gray-900">
        Validators
        <UiBadge variant="success">{{ validators.length }}</UiBadge>
      </h3>
    </div>
    <nodes-table :nodes="validators" :fields="fields" :per-page="25" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Organization } from 'shared';
import NodesTable, { type TableNode } from '@/components/node/nodes-table.vue';
import useStore from '@/store/useStore';

const props = defineProps<{
  organization: Organization;
}>();

const store = useStore();
const network = store.network;

const fields = computed(() => {
  const f: any[] = [
    { key: 'name', label: 'Validator', sortable: true },
  ];
  if (!store.isSimulation) {
    f.push(
      { key: 'index', label: 'index', sortable: true },
      { key: 'trustScore', label: 'Trust', sortable: true },
      { key: 'validating24Hour', label: '24H validating', sortable: true },
      { key: 'validating30Days', label: '30D validating', sortable: true },
      { key: 'version', label: 'version', sortable: true },
      { key: 'country', label: 'country', sortable: true },
      { key: 'isp', label: 'isp', sortable: true },
    );
  }
  f.push({ key: 'action', label: '', sortable: false, tdClass: 'action' });
  return f;
});

const validators = computed<TableNode[]>(() => {
  return props.organization.validators
    .map((pk) => network.getNodeByPublicKey(pk))
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
        lag: validator.lag !== null ? validator.lag + ' ms' : 'Not detected',
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
