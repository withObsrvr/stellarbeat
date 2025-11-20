<template>
  <div class="card">
    <div class="card-header">
      <h1 class="card-title">
        Trusts
        <b-badge variant="success">{{ validators.length }}</b-badge>
        nodes
      </h1>
      <div class="card-options">
        <form>
          <div class="input-group">
            <input
              v-model="filter"
              type="text"
              class="form-control form-control-sm"
              placeholder="Search"
              name="s"
            />
            <div class="input-icon-addon">
              <b-icon-search />
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
import { BBadge } from '@/components/bootstrap-compat';
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
