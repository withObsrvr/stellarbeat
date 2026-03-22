<template>
  <side-bar
    :sticky-key="'stellar-public'"
    icon="house"
    :has-info-section="true"
  >
    <template #title>
      {{ store.getNetworkContextName() }}
    </template>
    <template #sub-title>
      Overview
      <UiBadge v-if="store.networkAnalyzer.manualMode" variant="default"
        >Risks not analyzed</UiBadge
      >
      <UiBadge
        v-else-if="store.networkHasDangers()"
        v-tooltip:right="store.getNetworkDangers().description"
        variant="danger"
        style="vertical-align: bottom"
        >{{ store.getNetworkDangers().label }}
      </UiBadge>
      <UiBadge
        v-else-if="store.networkHasWarnings()"
        v-tooltip:right="store.getNetworkWarnings().description"
        variant="warning"
        style="vertical-align: bottom"
        >{{ store.getNetworkWarnings().label }}
      </UiBadge>
    </template>
    <template #explore-list-items>
      <li
        v-if="networkTransitiveQuorumSetOrganizations.length > 0"
        class="sb-nav-item"
      >
        <organizations-dropdown
          :organizations="networkTransitiveQuorumSetOrganizations"
          :expand="organizationsExpanded"
          @toggle-expand="organizationsExpanded = !organizationsExpanded"
        />
      </li>
      <li class="sb-nav-item">
        <validators-dropdown
          :nodes="networkTransitiveQuorumSetNodes"
          :expand="validatorsExpanded"
          @toggle-expand="handleValidatorsToggle"
        />
      </li>
    </template>
    <template #tool-list-items>
      <li v-if="store.networkContext.enableConfigExport" class="sb-nav-item">
        <nav-link
          @click="showTomlModal = true"
          :title="'Stellar core quorum set'"
          :show-icon="true"
          icon="download"
        />
      </li>
      <UiModal
        v-model="showTomlModal"
        :lazy="true"
        size="lg"
        title="Stellar Core quorum set"
        :ok-only="true"
        ok-title="Close"
      >
        <pre class="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto"><code>{{tomlNodesExport}}</code></pre>
      </UiModal>
      <li class="sb-nav-item">
        <nav-link
          title="Horizon APIs"
          :show-icon="true"
          icon="broadcast"
          @click="scrollToHorizonCard()"
        ></nav-link>
      </li>
      <li class="sb-nav-item">
        <nav-link
          :title="'Simulate new node'"
          :show-icon="true"
          icon="plus"
        />
        <simulate-new-node />
      </li>
      <li class="sb-nav-item">
        <nav-link
          title="Network analysis"
          :show-icon="true"
          icon="gear"
          @click="store.isNetworkAnalysisVisible = true"
        />
      </li>
      <li class="sb-nav-item">
        <nav-link
          title="Modify Network"
          :show-icon="true"
          icon="pencil"
          @click="handleModifyNetworkClick()"
        />
        <modify-network ref="modifyNetwork" />
      </li>
    </template>
  </side-bar>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { StellarCoreConfigurationGenerator } from "shared";
import SimulateNewNode from "@/components/node/tools/simulation/simulate-new-node.vue";
import ValidatorsDropdown from "@/components/network/sidebar/validators-dropdown.vue";
import NavLink from "@/components/side-bar/nav-link.vue";
import OrganizationsDropdown from "@/components/network/sidebar/organizations-dropdown.vue";
import SideBar from "@/components/side-bar/side-bar.vue";

// Components and directives registered globally in app.ts
import useStore from "@/store/useStore";
import useScrollTo from "@/composables/useScrollTo";
import ModifyNetwork from "@/components/network/tools/modify-network.vue";

const organizationsExpanded = ref(true);
const showTomlModal = ref(false);
const store = useStore();
const network = store.network;
const scrollTo = useScrollTo();
const modifyNetwork = ref<typeof ModifyNetwork | null>(null);

const handleModifyNetworkClick = () => {
  if (modifyNetwork.value) {
    modifyNetwork.value.showModal();
  }
};

const networkTransitiveQuorumSetNodes = computed(() => {
  return Array.from(network.nodesTrustGraph.networkTransitiveQuorumSet).map(
    (publicKey) => network.getNodeByPublicKey(publicKey),
  );
});

const networkTransitiveQuorumSetOrganizations = computed(() => {
  return [
    ...new Set(
      networkTransitiveQuorumSetNodes.value
        .filter((node) => node && node.organizationId)
        .map((node) =>
          network.getOrganizationById(node.organizationId as string),
        ),
    ),
  ];
});
const validatorsExpanded = ref(
  networkTransitiveQuorumSetOrganizations.value.length === 0,
);
const tomlNodesExport = computed(() => {
  const stellarCoreConfigurationGenerator =
    new StellarCoreConfigurationGenerator(network);
  return stellarCoreConfigurationGenerator.nodesToToml(
    networkTransitiveQuorumSetNodes.value,
  );
});

function scrollToHorizonCard() {
  scrollTo("public-horizon-apis-card");
}

function handleValidatorsToggle() {
  validatorsExpanded.value = !validatorsExpanded.value;
}
</script>
