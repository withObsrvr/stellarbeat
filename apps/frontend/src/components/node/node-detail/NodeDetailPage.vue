<template>
  <div v-if="selectedNode">
    <portal-target name="simulate-node-modal"></portal-target>
    <portal-target name="quorum-set-modals" multiple></portal-target>

    <!-- Header (includes inline warning indicators) -->
    <NodeDetailHeader
      :node="selectedNode"
      @simulate-node="openSimulateModal"
      @quorum-slices="quorumSlicesRef?.show()"
      @stellar-config="showTomlModal = true; loadTomlExport()"
    >
      <template #history-archive-details>
        <template v-if="historyArchiveScan && historyArchiveScan.errors.length > 0">
          Start repair at ledger {{ historyArchiveScan.latestVerifiedLedger }} with
          <a href="https://github.com/stellar/go/tree/master/tools/stellar-archivist" target="_blank" class="underline">Stellar Archivist</a>.
        </template>
        <template v-else>
          Repair with
          <a href="https://github.com/stellar/go/tree/master/tools/stellar-archivist" target="_blank" class="underline">Stellar Archivist</a>.
        </template>
      </template>
    </NodeDetailHeader>

    <!-- Tab Bar -->
    <UiTabBar
      v-model="activeTab"
      :tabs="tabs"
    />

    <!-- Tab Content -->
    <div v-show="activeTab === 'overview'">
      <NodeOverviewTab :node="selectedNode" />
    </div>
    <div v-show="activeTab === 'quorum-set'">
      <NodeQuorumSetTab v-if="selectedNode.isValidator" :node="selectedNode" />
      <div v-else class="text-sm text-gray-400 py-8 text-center">
        Quorum set is only available for validator nodes.
      </div>
    </div>
    <div v-show="activeTab === 'trusts'">
      <NodeTrustsTab v-if="selectedNode.isValidator" :node="selectedNode" />
      <div v-else class="text-sm text-gray-400 py-8 text-center">
        Trust information is only available for validator nodes.
      </div>
    </div>
    <div v-show="activeTab === 'trusted-by'">
      <NodeTrustedByTab :node="selectedNode" />
    </div>
    <div v-show="activeTab === 'updates'">
      <NodeUpdatesTab v-if="!store.isSimulation" :node="selectedNode" />
      <div v-else class="text-sm text-gray-400 py-8 text-center">
        Updates are not available in simulation mode.
      </div>
    </div>

    <!-- Modals -->
    <simulate-new-node />
    <quorum-slices ref="quorumSlicesRef" :selected-node="selectedNode" />
    <UiModal
      v-model="showTomlModal"
      :lazy="true"
      size="lg"
      title="Stellar Core Config"
      :ok-only="true"
      ok-title="Close"
    >
      <pre class="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto"><code>{{ tomlNodesExport }}</code></pre>
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { QuorumSet, StellarCoreConfigurationGenerator, type HistoryArchiveScan } from 'shared';
import useStore from '@/store/useStore';
import useHistoryArchiveScanRepository from '@/repositories/useHistoryArchiveScanRepository';
import SimulateNewNode from '@/components/node/tools/simulation/simulate-new-node.vue';
import QuorumSlices from '@/components/node/tools/quorum-slices.vue';
import NodeDetailHeader from './NodeDetailHeader.vue';
import NodeOverviewTab from './NodeOverviewTab.vue';
import NodeQuorumSetTab from './NodeQuorumSetTab.vue';
import NodeTrustsTab from './NodeTrustsTab.vue';
import NodeTrustedByTab from './NodeTrustedByTab.vue';
import NodeUpdatesTab from './NodeUpdatesTab.vue';

const store = useStore();
const network = store.network;
const historyArchiveScanRepository = useHistoryArchiveScanRepository();

const selectedNode = computed(() => store.selectedNode);

const activeTab = ref('overview');

const tabs = computed(() => {
  const node = selectedNode.value;
  if (!node) return [];

  const trustsCount = node.isValidator
    ? QuorumSet.getAllValidators(node.quorumSet).length
    : 0;
  const trustedByCount = network.getTrustingNodes(node).length;

  return [
    { key: 'overview', label: 'Overview' },
    { key: 'quorum-set', label: 'Quorum Set' },
    { key: 'trusts', label: 'Trusts', count: trustsCount },
    { key: 'trusted-by', label: 'Trusted By', count: trustedByCount },
    { key: 'updates', label: 'Updates' },
  ];
});

// History archive scan
const historyArchiveScan = ref<HistoryArchiveScan | null>(null);

async function fetchHistoryArchiveScan() {
  if (!selectedNode.value) return;
  if (!selectedNode.value.historyUrl) return;
  historyArchiveScan.value = await historyArchiveScanRepository.findLatest(
    selectedNode.value.historyUrl,
  );
}

watch(
  selectedNode,
  () => {
    if (selectedNode.value && selectedNode.value.historyUrl)
      fetchHistoryArchiveScan();
  },
  { immediate: true },
);

// Reset tab when node changes
watch(
  () => selectedNode.value?.publicKey,
  () => {
    activeTab.value = 'overview';
  },
);

// Tools
const quorumSlicesRef = ref<{ show: () => void } | null>(null);
const tomlNodesExport = ref('');
const showTomlModal = ref(false);

function loadTomlExport() {
  if (!selectedNode.value) return;
  const gen = new StellarCoreConfigurationGenerator(network);
  tomlNodesExport.value = gen.nodesToToml([selectedNode.value]);
}

function openSimulateModal() {
  // The SimulateNewNode component listens for Bootstrap modal events
  const modalEl = document.getElementById('simulate-node-modal');
  if (modalEl) {
    // Trigger via data attributes - the portal renders the modal
    const event = new Event('click');
    const trigger = document.querySelector('[data-target="#simulate-node-modal"]');
    if (trigger) trigger.dispatchEvent(event);
  }
}
</script>
