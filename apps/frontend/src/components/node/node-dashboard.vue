<template>
  <div v-if="selectedNode">
    <portal-target name="simulate-node-modal"> </portal-target>
    <portal-target name="quorum-set-modals" multiple></portal-target>
    <UiAlert :show="network.isNodeFailing(selectedNode)" variant="danger">
      {{ network.getNodeFailingReason(selectedNode).description }}
    </UiAlert>

    <UiAlert
      :show="NodeWarningDetector.nodeHasWarning(selectedNode, network)"
      variant="warning"
    >
      <strong>Detected warning(s)</strong>
      <ul class="pl-3 ml-0">
        <li
          v-for="reason in NodeWarningDetector.getNodeWarningReasons(
            selectedNode,
            network,
          )"
          :key="reason"
        >
          {{ reason }}.
        </li>
      </ul>
    </UiAlert>

    <UiAlert
      :show="network.historyArchiveHasError(selectedNode)"
      variant="warning"
    >
      <strong>History archive issue details</strong>
      <br />
      <p v-if="historyArchiveScan && historyArchiveScan.errors.length > 0">
        Archive verification errors detected. Start repair at ledger
        {{ historyArchiveScan.latestVerifiedLedger }} with
        <a
          href="https://github.com/stellar/go/tree/master/tools/stellar-archivist"
          target="_blank"
          >Stellar Archivist</a
        >
        and purge your cache afterwards.
      </p>
      <p v-else>
        Verification error in history archive detected. Repair with
        <a
          href="https://github.com/stellar/go/tree/master/tools/stellar-archivist"
          target="_blank"
          >Stellar Archivist</a
        >
        and purge your cache afterwards.
      </p>
      <history-archive-error-list
        v-if="historyArchiveScan"
        :errors="historyArchiveScan.errors"
      />
    </UiAlert>
    <UiAlert
      :show="historyArchiveScan ? historyArchiveScan.isSlow : false"
      variant="info"
    >
      Only latest ledgers in history archive are scanned for errors because
      archive has limited throughput.
    </UiAlert>
    <div v-if="!store.isSimulation" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div>
        <node-index :node="selectedNode" />
      </div>

      <div v-if="selectedNode.isValidator" class="">
        <NodeStatistics24HValidating :node="selectedNode" />
      </div>

      <div v-else class="">
        <NodeStatistics24HActive :node="selectedNode" />
      </div>

      <div v-if="selectedNode.isValidator" class="">
        <NodeStatistics30DValidating :node="selectedNode" />
      </div>

      <div v-else class="">
        <NodeStatistics30DActive :node="selectedNode" />
      </div>

      <div class="">
        <NodeStatistics30DOverloaded :node="selectedNode" />
      </div>

      <div v-if="selectedNode.isValidator" class="col-span-1">
        <history-card
          :subject="'Validating'"
          :entity-id="selectedNode.publicKey"
          :fetch-day-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getDayStatistics(publicKey, from, to)
          "
          :fetch-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getStatistics(publicKey, from, to)
          "
          :day-measurement-property="'isValidatingCount'"
          :measurement-property="'isValidating'"
          :chart-type="'bar'"
        >
        </history-card>
      </div>
      <div v-else class="col-span-1">
        <history-card
          :subject="'Active'"
          :entity-id="selectedNode.publicKey"
          :fetch-day-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getDayStatistics(publicKey, from, to)
          "
          :fetch-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getStatistics(publicKey, from, to)
          "
          :day-measurement-property="'isActiveCount'"
          :measurement-property="'isActive'"
          :chart-type="'bar'"
        >
        </history-card>
      </div>

      <div v-if="selectedNode.isValidator" class="col-span-1">
        <history-card
          :subject="'History Archive up-to-date'"
          :entity-id="selectedNode.publicKey"
          :fetch-day-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getDayStatistics(publicKey, from, to)
          "
          :fetch-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getStatistics(publicKey, from, to)
          "
          :day-measurement-property="'isFullValidatorCount'"
          :measurement-property="'isFullValidator'"
        >
        </history-card>
      </div>
      <div v-if="selectedNode.isValidator" class="col-span-1">
        <history-card
          :subject="'Crawler rejected'"
          :entity-id="selectedNode.publicKey"
          :fetch-day-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getDayStatistics(publicKey, from, to)
          "
          :fetch-measurements="
            (publicKey, from, to) =>
              nodeMeasurementStore.getStatistics(publicKey, from, to)
          "
          :day-measurement-property="'isOverloadedCount'"
          :measurement-property="'isOverLoaded'"
          :inverted="true"
        >
        </history-card>
      </div>

      <div class="col-span-1">
        <node-info :node="selectedNode" />
      </div>
      <div class="col-span-1">
        <node-extra-info :node="selectedNode" />
      </div>

      <div v-if="selectedNode.isValidator" class="col-span-1">
        <node-trusted-by :node="selectedNode" />
      </div>
    </div>
    <div class="grid grid-cols-1 gap-4 mt-4">
      <div v-if="selectedNode.isValidator">
        <node-quorum-set-validators :node="selectedNode" />
      </div>
      <div v-if="!store.isSimulation" class="">
        <node-latest-updates :node="selectedNode" />
      </div>
      <div v-else class="">
        <node-trusted-by :node="selectedNode" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import HistoryCard from "@/components/charts/history-card.vue";
import NodeInfo from "@/components/node/node-cards/node-info.vue";
import NodeExtraInfo from "@/components/node/node-cards/node-extra-info.vue";
import NodeQuorumSetValidators from "@/components/node/node-cards/node-quorum-set-validators.vue";
import NodeIndex from "@/components/node/node-cards/statistics/node-index.vue";
import NodeStatistics24HActive from "@/components/node/node-cards/statistics/node-statistics-24H-active.vue";
import NodeTrustedBy from "@/components/node/node-cards/node-trusted-by.vue";
import NodeLatestUpdates from "@/components/node/node-cards/node-latest-updates.vue";
import HistoryArchiveErrorList from "@/components/node/node-cards/history-archive-error-list.vue";
import { HistoryArchiveScan } from "shared";
import useStore from "@/store/useStore";
import NodeStatistics30DOverloaded from "@/components/node/node-cards/statistics/node-statistics-30D-overloaded.vue";
import NodeStatistics30DActive from "@/components/node/node-cards/statistics/node-statistics-30D-active.vue";
import NodeStatistics30DValidating from "@/components/node/node-cards/statistics/node-statistics-30D-validating.vue";
import NodeStatistics24HValidating from "@/components/node/node-cards/statistics/node-statistics-24H-validating.vue";
import useNodeMeasurementsStore from "@/store/useNodeMeasurementsStore";
import useHistoryArchiveScanRepository from "@/repositories/useHistoryArchiveScanRepository";
import { NodeWarningDetector } from "@/services/NodeWarningDetector";

const store = useStore();
const historyArchiveScanRepository = useHistoryArchiveScanRepository();
const nodeMeasurementStore = useNodeMeasurementsStore();
const network = store.network;
const selectedNode = computed(() => store.selectedNode);

const fetchingLatestHistoryArchiveScan = ref(false);
const historyArchiveScan = ref<HistoryArchiveScan | null>(null);

async function fetchHistoryArchiveScan() {
  if (!selectedNode.value) return;

  if (!selectedNode.value.historyUrl) return;

  fetchingLatestHistoryArchiveScan.value = true;
  historyArchiveScan.value = await historyArchiveScanRepository.findLatest(
    selectedNode.value.historyUrl,
  );

  fetchingLatestHistoryArchiveScan.value = false;
}

watch(
  selectedNode,
  () => {
    if (selectedNode.value && selectedNode.value.historyUrl)
      fetchHistoryArchiveScan();
  },
  { immediate: true },
);
</script>
