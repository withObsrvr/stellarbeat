<template>
  <side-bar
    v-if="selectedNode"
    :sticky-key="selectedNode.publicKey"
    icon="bullseye"
    :has-explore-section="selectedNode.isValidator"
  >
    <template #title>
      {{ getDisplayName(selectedNode) }}
    </template>
    <template #sub-title>
      {{ nodeType }}
      <b-badge
        v-if="network.isNodeFailing(selectedNode)"
        v-tooltip="network.getNodeFailingReason(selectedNode).description"
        variant="danger"
        style="vertical-align: bottom"
        >{{ network.getNodeFailingReason(selectedNode).label }}
      </b-badge>
      <b-badge
        v-else-if="NodeWarningDetector.nodeHasWarning(selectedNode, network)"
        v-tooltip="
          NodeWarningDetector.getNodeWarningReasonsConcatenated(
            selectedNode,
            network,
          )
        "
        variant="warning"
      >
        Warning
      </b-badge>
    </template>
    <template #explore-list-items>
      <li v-if="hasOrganization && organization" class="sb-nav-item">
        <organization-validators-dropdown
          :organization="organization"
          :expand="organizationValidatorsExpanded"
          @toggle-expand="organizationValidatorsExpanded = !organizationValidatorsExpanded"
        />
      </li>
      <li class="sb-nav-item">
        <quorum-set-dropdown
          v-if="selectedNode.isValidator"
          :quorum-set="selectedNode.quorumSet"
          :expand="quorumSetExpanded"
          @toggle-expand="quorumSetExpanded = !quorumSetExpanded"
        />
      </li>
    </template>
    <template #tool-list-items>
      <li
        v-if="
          selectedNode.isValidator && !network.isValidatorBlocked(selectedNode)
        "
        class="sb-nav-item"
      >
        <nav-link
          :title="
            selectedNode.isValidating ? 'Halt this node' : 'Start validating'
          "
          :show-icon="true"
          :icon="selectedNode.isValidating ? 'lightning-fill' : 'lightning'"
          @click="store.toggleValidating(selectedNode)"
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
      <li class="sb-nav-item">
        <nav-link
          data-toggle="modal"
          data-target="#quorumSlicesModal"
          :title="'Quorum slices'"
          :show-icon="true"
          icon="search"
        />
      </li>
      <li v-if="selectedNode.isValidator" class="sb-nav-item">
        <nav-link
          title="Network analysis"
          :show-icon="true"
          icon="gear-wide"
          @click="store.isNetworkAnalysisVisible = true"
        />
      </li>
      <li v-if="selectedNode.isValidator" class="sb-nav-item">
        <nav-link
          title="Halting analysis"
          :show-icon="true"
          icon="gear-wide"
          @click="store.showHaltingAnalysis(selectedNode)"
        />
      </li>
      <quorum-slices :selected-node="selectedNode" />
      <li
        v-if="
          selectedNode.isValidator && store.networkContext.enableConfigExport
        "
        class="sb-nav-item"
      >
        <nav-link
          data-toggle="modal"
          data-target="#tomlExportModal"
          :title="'Stellar core config'"
          :show-icon="true"
          icon="download"
        />
      </li>
      <b-modal
        id="tomlExportModal"
        size="lg"
        title="Stellar Core Config"
        ok-only
        ok-title="Close"
        @show="loadTomlExport()"
      >
        <pre><code>{{tomlNodesExport}}</code></pre>
      </b-modal>
    </template>
  </side-bar>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { StellarCoreConfigurationGenerator } from "shared";
import QuorumSetDropdown from "@/components/node/sidebar/quorum-set-dropdown.vue";
import NavLink from "@/components/side-bar/nav-link.vue";
import SimulateNewNode from "@/components/node/tools/simulation/simulate-new-node.vue";
import { Node } from "shared";
import OrganizationValidatorsDropdown from "@/components/node/sidebar/organization-validators-dropdown.vue";
import SideBar from "@/components/side-bar/side-bar.vue";
import { BBadge, BModal } from '@/components/bootstrap-compat';
import QuorumSlices from "@/components/node/tools/quorum-slices.vue";
import useStore from "@/store/useStore";
import { NodeWarningDetector } from "@/services/NodeWarningDetector";


const store = useStore();
const quorumSetExpanded = ref(true);
const organizationValidatorsExpanded = ref(true);
const tomlNodesExport = ref("");

const selectedNode = computed(() => {
  if (!store.selectedNode) throw new Error("No node selected");
  return store.selectedNode;
});

const hasOrganization = computed(() => {
  return (
    selectedNode.value &&
    selectedNode.value.organizationId &&
    store.network.getOrganizationById(selectedNode.value.organizationId)
  );
});

const organization = computed(() => {
  if (hasOrganization.value && selectedNode.value)
    return store.network.getOrganizationById(
      selectedNode.value.organizationId as string,
    );
  else return null;
});

const network = store.network;

const nodeType = computed(() => {
  if (selectedNode.value.isValidator)
    return selectedNode.value.isFullValidator ? "Full Validator" : "Validator";
  else return "Connectable Node";
});

function loadTomlExport() {
  const stellarCoreConfigurationGenerator =
    new StellarCoreConfigurationGenerator(network);
  tomlNodesExport.value = stellarCoreConfigurationGenerator.nodesToToml([
    selectedNode.value,
  ]);
}

function getDisplayName(node: Node) {
  return node.displayName;
}
</script>
<style scoped></style>
