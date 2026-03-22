<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 pl-3 pr-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">
        <UiBadge variant="success">{{ numberOfActiveOrganizations }}</UiBadge>
        available organizations
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
    <organizations-table
      :filter="filter"
      :organizations="organizations"
      :fields="fields"
      :per-page="5"
    />
  </div>
</template>
<script setup lang="ts">
import { Organization } from "shared";
import OrganizationsTable from "@/components/organization/organizations-table.vue";
import useStore from "@/store/useStore";
import { computed, ref } from "vue";
const store = useStore();
const network = store.network;
const filter = ref("");

const fields = computed(() => {
  const fields = [{ key: "name", label: "Organization", sortable: true }];

  if (!store.isSimulation && store.networkContext.enableHistory) {
    fields.push({
      key: "subQuorum30DAvailability",
      label: "30D Availability",
      sortable: true,
    });
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

function getFailAt(organization: Organization): number {
  const nrOfValidatingNodes = organization.validators
    .map((validator) => network.getNodeByPublicKey(validator))
    .filter((node) => !network.isNodeFailing(node)).length;

  return nrOfValidatingNodes - organization.subQuorumThreshold + 1;
}

const numberOfActiveOrganizations = computed(() => {
  return network.organizations.filter(
    (organization) => organization.subQuorumAvailable,
  ).length;
});

const organizations = computed(() => {
  return network.organizations.map((organization) => {
    return {
      name: organization.name,
      id: organization.id,
      failAt: getFailAt(organization),
      dangers: store.getOrganizationFailingReason(organization),
      blocked: network.isOrganizationBlocked(organization),
      subQuorum30DAvailability: organization.subQuorum30DaysAvailability + "%",
      hasReliableUptime: organization.hasReliableUptime,
    };
  });
});
</script>
