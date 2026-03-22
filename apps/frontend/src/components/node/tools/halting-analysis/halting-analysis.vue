<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h3 class="text-sm font-semibold text-gray-900">Halting analysis for {{ vertex?.label }}</h3>
      <a
        href="#"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        @click.prevent.stop="store.isHaltingAnalysisVisible = false"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </a>
    </div>
    <div class="p-4">
      <UiAlert :show="network.isNodeFailing(node)" variant="warning">
        {{ vertex?.label }} is failing.
      </UiAlert>
      <div v-if="!network.isNodeFailing(node)">
        <form class="flex items-center gap-2" @submit.prevent>
          <label for="nr-node-failures" class="text-sm text-gray-600 mr-1">Select number of node failures:</label>
          <input
            id="nr-node-failures"
            v-model="numberOfNodeFailures"
            class="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm w-12"
            type="number"
            min="2"
            max="9"
          />
        </form>

        <button
          class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors mt-2"
          @click="restartHaltingAnalysis"
        >
          Detect failures
        </button>
        <UiAlert
          :show="numberOfNodeFailures > 4"
          variant="warning"
          class="mt-3"
        >
          Analyzing combinations of {{ numberOfNodeFailures }} nodes could
          take some time. If possible try with a lower number first.
        </UiAlert>
      </div>

      <div :class="dimmerClass">
        <div class="loader"></div>
        <div class="dimmer-content">
          <div v-if="showAnalysisResult">
            <h3 v-if="nodeFailures.length === 0" class="mt-3 text-sm font-semibold">
              Great! No combination of
              {{ numberOfNodeFailures }} validators can bring down
              {{ vertex?.label }}
            </h3>
            <div v-else class="mt-3">
              <h3 class="text-sm font-semibold">
                Found {{ nodeFailures.length }} combinations of validators
                that can halt {{ vertex?.label }}
              </h3>
              <select
                v-model="selectedFailure"
                :disabled="simulated"
                :size="4"
                class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm w-full mt-2"
              >
                <option
                  v-for="failure in nodeFailures"
                  :key="failure.text"
                  :value="failure.value"
                >
                  {{ failure.text }}
                </option>
              </select>
              <button
                v-if="!simulated"
                class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors mt-2"
                @click.prevent.stop="simulateFailure"
              >
                Simulate failure
              </button>
              <button
                v-else
                class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mt-2"
                @click="resetFailureSimulation"
              >
                Reactivate nodes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from "vue";
import {
  type NetworkGraphNode,
  type QuorumSet as NetworkQuorumSet,
} from "@stellarbeat/stellar-halting-analysis";
import { type PublicKey, QuorumSet, Vertex } from "shared";
import { AggregateChange } from "@/services/change-queue/changes/aggregate-change";
import { EntityPropertyUpdate } from "@/services/change-queue/changes/entity-property-update";
import useStore from "@/store/useStore";

const props = defineProps({
  publicKey: { type: String, required: true },
});

const publicKey = toRefs(props).publicKey;

const store = useStore();
const network = store.network;
const showAnalysisResult = ref(false);
const numberOfNodeFailures = ref(2);
const numberOfNodeFailuresInputState = ref<boolean | null>(null);
const nodeFailures = ref<{ value: string[]; text: string }[]>([]);
const selectedFailure = ref<PublicKey[] | null>(null);
const isLoading = ref(false);
const simulated = ref(false);

const haltingAnalysisWorker = new Worker(
  new URL(
    "./../../../../workers/halting-analysisv1.worker.ts",
    import.meta.url,
  ),
  {
    type: import.meta.env.DEV ? "module" : "classic",
    /* @vite-ignore */
  },
);

const dimmerClass = computed(() => {
  return { dimmer: true, active: isLoading.value };
});

watch(publicKey, () => {
  nodeFailures.value = [];
  selectedFailure.value = null;
  simulated.value = false;
  showAnalysisResult.value = false;
});

const vertex = computed(() => {
  return network.nodesTrustGraph.getVertex(publicKey?.value);
});

const node = computed(() => {
  return network.getNodeByPublicKey(publicKey?.value);
});

function getNetworkGraphNodes() {
  return Array.from(network.nodesTrustGraph.vertices.values())
    .map((myVertex) =>
      mapVertexToNetworkGraphNode(myVertex, myVertex === vertex.value),
    );
}

function simulateFailure() {
  if (selectedFailure.value === null) return;
  simulated.value = true;
  const aggregateChange = new AggregateChange(
    selectedFailure.value.map(
      (failurePublicKey) =>
        new EntityPropertyUpdate(
          network.getNodeByPublicKey(failurePublicKey),
          "isValidating",
          false,
        ),
    ),
  );
  store.processChange(aggregateChange);
}

function resetFailureSimulation() {
  if (selectedFailure.value === null) return;
  const aggregateChange = new AggregateChange(
    selectedFailure.value.map(
      (failurePublicKey) =>
        new EntityPropertyUpdate(
          network.getNodeByPublicKey(failurePublicKey),
          "isValidating",
          true,
        ),
    ),
  );
  store.processChange(aggregateChange);
  simulated.value = false;
}

function restartHaltingAnalysis() {
  isLoading.value = true;
  simulated.value = false;
  haltingAnalysisWorker.postMessage({
    networkGraphNodes: getNetworkGraphNodes(),
    numberOfNodeFailures: numberOfNodeFailures.value,
  });
}

function mapVertexToNetworkGraphNode(vertex: Vertex, isRoot: boolean) {
  return {
    distance: isRoot ? 0 : 1,
    node: vertex.key,
    status: !network.isNodeFailing(network.getNodeByPublicKey(vertex.key))
      ? "tracking"
      : "missing",
    qset: !network.isNodeFailing(network.getNodeByPublicKey(vertex.key))
      ? mapQuorumSetToNetworkQuorumSet(
          network.getNodeByPublicKey(vertex.key).quorumSet,
        )
      : undefined,
  } as NetworkGraphNode;
}

function mapQuorumSetToNetworkQuorumSet(
  quorumSet: QuorumSet,
): NetworkQuorumSet {
  const innerQSets = quorumSet.innerQuorumSets.map((innerQSet) =>
    mapQuorumSetToNetworkQuorumSet(innerQSet),
  );
  const v: (string | NetworkQuorumSet)[] = [];
  v.push(...quorumSet.validators);
  innerQSets.forEach((innerQSet) => v.push(innerQSet));
  return { t: quorumSet.threshold, v: v };
}

onMounted(() => {
  haltingAnalysisWorker.onmessage = (event: {
    data: { type: string; failures: PublicKey[][] };
  }) => {
    switch (event.data.type) {
      case "end": {
        nodeFailures.value = event.data.failures.map(
          (failure: Array<PublicKey>) => {
            return {
              value: failure,
              text: failure
                .map((publicKey) =>
                  network.getNodeByPublicKey(publicKey).name
                    ? network.getNodeByPublicKey(publicKey).displayName
                    : publicKey.substring(0, 5),
                )
                .join(", "),
            };
          },
        );
        if (nodeFailures.value.length > 0) {
          selectedFailure.value = nodeFailures.value[0].value;
        }
        showAnalysisResult.value = true;
        isLoading.value = false;
        break;
      }
    }
  };
});
</script>

<style scoped>
.nr-node-failures-input {
  margin-left: 5px;
  margin-right: 5px;
  width: 45px !important;
}
</style>
