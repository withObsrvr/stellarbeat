<template>
  <side-bar
    v-if="selectedOrganization"
    :sticky-key="selectedOrganization.id"
    icon="building"
  >
    <template #title>
      {{ selectedOrganization.name }}
    </template>
    <template #sub-title>
      {{ organizationType }}
      <b-badge
        v-if="network.isOrganizationFailing(selectedOrganization)"
        v-tooltip="store.getOrganizationFailingReason(selectedOrganization)"
        variant="danger"
      >
        {{
          network.isOrganizationBlocked(selectedOrganization)
            ? "Blocked"
            : "Failing"
        }}
      </b-badge>
      <b-badge
        v-else-if="
          OrganizationWarningDetector.organizationHasWarnings(
            selectedOrganization,
            store.network,
          )
        "
        v-tooltip="
          OrganizationWarningDetector.getOrganizationWarningReasons(
            selectedOrganization,
            store.network,
          ).join(' | ')
        "
        variant="warning"
      >
        Warning
      </b-badge>
    </template>
    <template #explore-list-items>
      <li class="sb-nav-item">
        <organization-validators-dropdown
          :organization="selectedOrganization"
          :expand="validatorsExpanded"
          @toggle-expand="validatorsExpanded = !validatorsExpanded"
        />
      </li>
      <li class="sb-nav-item">
        <trusted-organizations-dropdown
          :organization="selectedOrganization"
          :expand="trustedOrganizationsExpanded"
          @toggle-expand="trustedOrganizationsExpanded = !trustedOrganizationsExpanded"
        />
      </li>
    </template>
    <template #tool-list-items>
      <li
        v-if="!network.isOrganizationBlocked(selectedOrganization)"
        class="sb-nav-item"
      >
        <nav-link
          :title="
            selectedOrganization.subQuorumAvailable
              ? 'Halt this organization'
              : 'Start validating'
          "
          :show-icon="true"
          :icon="
            selectedOrganization.subQuorumAvailable
              ? 'lightning-fill'
              : 'lightning'
          "
          @click="store.toggleOrganizationAvailability(selectedOrganization)"
        />
      </li>
      <li v-if="store.networkContext.enableConfigExport" class="sb-nav-item">
        <nav-link
          v-b-modal.tomlExportModal
          :title="'Stellar core config'"
          :show-icon="true"
          icon="download"
        />
      </li>
      <li class="sb-nav-item">
        <nav-link
          data-toggle="modal"
          data-target="#simulate-node-modal"
          :title="'Simulate new node'"
          :show-icon="true"
          icon="plus"
        />
        <simulate-new-node />
      </li>
      <b-modal
        id="tomlExportModal"
        lazy
        size="lg"
        title="Stellar Core Config"
        ok-only
        ok-title="Close"
      >
        <pre><code>{{tomlNodesExport}}</code></pre>
      </b-modal>
    </template>
  </side-bar>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { StellarCoreConfigurationGenerator } from "shared";
import OrganizationValidatorsDropdown from "@/components/organization/sidebar/organization-validators-dropdown.vue";
import NavLink from "@/components/side-bar/nav-link.vue";
import SimulateNewNode from "@/components/node/tools/simulation/simulate-new-node.vue";
import SideBar from "@/components/side-bar/side-bar.vue";
import { BBadge, BModal, VBModal } from '@/components/bootstrap-compat';
import TrustedOrganizationsDropdown from "@/components/organization/sidebar/trusted-organizations-dropdown.vue";
import useStore from "@/store/useStore";
import { OrganizationWarningDetector } from "@/services/OrganizationWarningDetector";


const store = useStore();
const network = store.network;

const validatorsExpanded = ref(true);
const trustedOrganizationsExpanded = ref(true);

const selectedOrganization = computed(() => {
  if (!store.selectedOrganization) throw new Error("No organization selected");
  return store.selectedOrganization;
});

const validators = computed(() => {
  return selectedOrganization.value.validators.map((validator) =>
    network.getNodeByPublicKey(validator),
  );
});

const organizationType = computed(() => {
  return selectedOrganization.value.hasReliableUptime
    ? "Organization"
    : "Organization";
});

const tomlNodesExport = computed(() => {
  const stellarCoreConfigurationGenerator =
    new StellarCoreConfigurationGenerator(network);
  return stellarCoreConfigurationGenerator.nodesToToml(validators.value);
});
</script>
