<template>
  <div v-if="organization">
    <portal-target name="simulate-node-modal"></portal-target>

    <!-- Header -->
    <OrganizationDetailHeader
      :organization="organization"
      @simulate-node="openSimulateModal"
      @stellar-config="showTomlModal = true"
    />

    <!-- Tab Bar -->
    <UiTabBar v-model="activeTab" :tabs="tabs" />

    <!-- Tab Content -->
    <div v-show="activeTab === 'overview'">
      <OrganizationOverviewTab :organization="organization" />
    </div>
    <div v-show="activeTab === 'validators'">
      <OrganizationValidatorsTab :organization="organization" />
    </div>
    <div v-show="activeTab === 'updates'">
      <organization-latest-updates
        v-if="!store.isSimulation"
        :organization="organization"
      />
      <div v-else class="text-sm text-gray-400 py-8 text-center">
        Updates are not available in simulation mode.
      </div>
    </div>

    <!-- Modals -->
    <simulate-new-node />
    <UiModal
      v-model="showTomlModal"
      :lazy="true"
      size="lg"
      title="Stellar Core Config"
      :ok-only="true"
      ok-title="Close"
    >
      <pre class="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto"><code>{{ tomlExport }}</code></pre>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { StellarCoreConfigurationGenerator } from 'shared';
import useStore from '@/store/useStore';
import SimulateNewNode from '@/components/node/tools/simulation/simulate-new-node.vue';
import OrganizationLatestUpdates from '@/components/organization/organization-cards/organization-latest-updates.vue';
import OrganizationDetailHeader from './OrganizationDetailHeader.vue';
import OrganizationOverviewTab from './OrganizationOverviewTab.vue';
import OrganizationValidatorsTab from './OrganizationValidatorsTab.vue';

const store = useStore();
const network = store.network;

const organization = computed(() => {
  if (!store.selectedOrganization) throw new Error('No organization selected');
  return store.selectedOrganization;
});

const activeTab = ref('overview');

const tabs = computed(() => {
  const org = organization.value;
  return [
    { key: 'overview', label: 'Overview' },
    { key: 'validators', label: 'Validators', count: org.validators.length },
    { key: 'updates', label: 'Updates' },
  ];
});

const showTomlModal = ref(false);

const tomlExport = computed(() => {
  const validators = organization.value.validators.map((pk) =>
    network.getNodeByPublicKey(pk),
  );
  const gen = new StellarCoreConfigurationGenerator(network);
  return gen.nodesToToml(validators);
});

function openSimulateModal() {
  const trigger = document.querySelector('[data-target="#simulate-node-modal"]');
  if (trigger) trigger.dispatchEvent(new Event('click'));
}
</script>
