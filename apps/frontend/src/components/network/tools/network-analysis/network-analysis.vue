<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 p-3">
      <h3 class="text-sm font-semibold text-gray-900">Network analysis</h3>
      <a
        href="#"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        @click.prevent.stop="store.isNetworkAnalysisVisible = false"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </a>
    </div>
    <div class="px-3 pt-4 pb-2">
      <div :class="dimmerClass">
        <div class="loader mt-2"></div>
        <div class="dimmer-content">
          <div v-if="hasResult">
            <!-- Accordion sections -->
            <div v-if="quorumIntersectionAnalyzed" class="mb-1">
              <button
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                @click="activeSection = activeSection === 'quorum' ? '' : 'quorum'"
              >
                Quorum intersection
              </button>
              <div v-show="activeSection === 'quorum'" class="px-0 pb-0">
                <analysis
                  title="Minimal quorums"
                  :items="minimalQuorums"
                  :nodes-partition="nodesPartition"
                  :show-nodes-partition="resultMergedBy !== MyMergeBy.DoNotMerge"
                >
                  <template #title>
                    <div class="flex justify-between items-baseline">
                      <h3>
                        <UiBadge :variant="hasQuorumIntersection ? 'success' : 'danger'">
                          {{ hasQuorumIntersection ? "All quorums intersect" : "No quorum intersection" }}
                        </UiBadge>
                      </h3>
                      <button class="p-1 text-gray-400 hover:text-gray-600 transition-colors" @click="showQiInfo = true">
                        <svg v-tooltip:top="'Info'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <quorum-intersection-info />
                    </div>
                  </template>
                </analysis>
              </div>
            </div>

            <div v-if="livenessAnalyzed" class="mb-1">
              <button
                class="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors text-left"
                @click="activeSection = activeSection === 'liveness' ? '' : 'liveness'"
              >
                Liveness risk
              </button>
              <div v-show="activeSection === 'liveness'" class="px-0 pb-0">
                <analysis
                  title="Blocking sets"
                  :items="blockingSets"
                  :nodes-partition="nodesPartition"
                  :show-nodes-partition="resultMergedBy !== MyMergeBy.DoNotMerge"
                >
                  <template #title>
                    <div class="flex justify-between items-baseline">
                      <h3 v-if="blockingSetsMinSize <= 0">Network halted.</h3>
                      <h3 v-else>Found set(s) of size {{ blockingSetsMinSize }} that could impact liveness.</h3>
                      <button class="p-1 text-gray-400 hover:text-gray-600 transition-colors" @click="showLivenessInfo = true">
                        <svg v-tooltip:top="'Info'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </div>
                    <liveness-info />
                  </template>
                </analysis>
              </div>
            </div>

            <div v-if="safetyAnalyzed" class="mb-1">
              <button
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                @click="activeSection = activeSection === 'safety' ? '' : 'safety'"
              >
                Safety risk
              </button>
              <div v-show="activeSection === 'safety'" class="px-0 pb-0">
                <analysis
                  title="Splitting sets"
                  :items="splittingSets"
                  :nodes-partition="nodesPartition"
                  :show-nodes-partition="resultMergedBy !== MyMergeBy.DoNotMerge"
                >
                  <template #title>
                    <div class="flex justify-between items-baseline">
                      <h3 v-if="splittingSetsMinSize <= 0">No intersection between quorums found.</h3>
                      <h3 v-else>Found set(s) of size {{ splittingSetsMinSize }} that could impact safety.</h3>
                      <button class="p-1 text-gray-400 hover:text-gray-600 transition-colors" @click="showSafetyInfo = true">
                        <svg v-tooltip:top="'Info'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </div>
                    <safety-info />
                  </template>
                </analysis>
              </div>
            </div>

            <div v-if="topTierAnalyzed" class="mb-1">
              <button
                class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                @click="activeSection = activeSection === 'top-tier' ? '' : 'top-tier'"
              >
                Top tier
              </button>
              <div v-show="activeSection === 'top-tier'" class="px-0 pb-0">
                <analysis
                  title="Top tier"
                  :items="topTier"
                  :nodes-partition="nodesPartition"
                  :show-nodes-partition="resultMergedBy !== MyMergeBy.DoNotMerge"
                >
                  <template #title>
                    <div class="flex justify-between items-baseline">
                      <h3 class="mb-0">Top tier has size {{ topTier.length }}</h3>
                      <button class="p-1 text-gray-400 hover:text-gray-600 transition-colors" @click="showTopTierInfo = true">
                        <svg v-tooltip:top="'Info'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <top-tier-info />
                    </div>
                    <UiBadge variant="info">
                      {{ topTierIsSymmetric ? "Symmetric" : "Not symmetric" }}
                    </UiBadge>
                  </template>
                </analysis>
              </div>
            </div>
          </div>
        </div>
        <div class="mb-2">
          <UiAlert
            :show="!store.network.networkStatistics.hasSymmetricTopTier"
            variant="warning"
          >
            Warning: top tier is not symmetric, analysis could be slow.
            Execution time increases exponentially with top tier size. For very
            large networks you can export the current network through the
            'modify network' tool and run the analysis offline with the
            <a href="https://github.com/wiberlin/fbas_analyzer" target="_blank" class="underline">fbas analyzer tool</a>
          </UiAlert>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Analysis target:</label>
            <label
              v-if="store.selectedNode"
              class="flex items-center gap-2 text-sm cursor-pointer pb-1"
            >
              <input v-model="analyzeTrustCluster" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              Analyze trust cluster of selected node (Could be slow!)
            </label>
            <div class="flex flex-col gap-1 mt-1">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="store.networkAnalysisMergeBy" :value="MyMergeBy.DoNotMerge" type="radio" name="merge-by" class="h-4 w-4 text-gray-900 focus:ring-gray-500" />
                {{ getMergeByFriendlyName(MyMergeBy.DoNotMerge) }}
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="store.networkAnalysisMergeBy" :value="MyMergeBy.Orgs" type="radio" name="merge-by" class="h-4 w-4 text-gray-900 focus:ring-gray-500" />
                {{ getMergeByFriendlyName(MyMergeBy.Orgs) }}
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="store.networkAnalysisMergeBy" :value="MyMergeBy.Countries" type="radio" name="merge-by" class="h-4 w-4 text-gray-900 focus:ring-gray-500" />
                {{ getMergeByFriendlyName(MyMergeBy.Countries) }}
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="store.networkAnalysisMergeBy" :value="MyMergeBy.ISPs" type="radio" name="merge-by" class="h-4 w-4 text-gray-900 focus:ring-gray-500" />
                {{ getMergeByFriendlyName(MyMergeBy.ISPs) }}
              </label>
            </div>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Analysis type:</label>
            <div class="flex flex-col gap-1">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="analyzeQuorumIntersection" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                Quorum Intersection
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="analyzeLiveness" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                Liveness
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="analyzeSafety" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                Safety
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="analyzeTopTier" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
                Top Tier
              </label>
            </div>
          </div>

          <button
            v-if="!isLoading"
            class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            @click="performAnalysis"
          >
            Perform analysis
          </button>
          <button
            v-else
            class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            @click="stopAnalysis"
          >
            Stop analysis
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  BaseQuorumSet,
  Node,
  TransitiveQuorumSetFinder,
  type PublicKey,
} from "shared";
import Analysis from "@/components/network/tools/network-analysis/analysis.vue";
import QuorumIntersectionInfo from "@/components/network/tools/network-analysis/info/quorum-intersection-info.vue";
import SafetyInfo from "@/components/network/tools/network-analysis/info/safety-info.vue";
import LivenessInfo from "@/components/network/tools/network-analysis/info/liveness-info.vue";
import TopTierInfo from "@/components/network/tools/network-analysis/info/top-tier-info.vue";
import { MergeBy } from "@stellarbeat/stellar_analysis_web";
import { type FbasAnalysisWorkerResult } from "@/workers/fbas-analysis-v3.worker";
import { onMounted, type Ref, ref } from "vue";
import { useIsLoading } from "@/composables/useIsLoading";
import useStore from "@/store/useStore";
import useScrollTo from "@/composables/useScrollTo";

const { isLoading, dimmerClass } = useIsLoading();
const store = useStore();

const showModal = ref(false);
const showQiInfo = ref(false);
const showLivenessInfo = ref(false);
const showSafetyInfo = ref(false);
const showTopTierInfo = ref(false);
const activeSection = ref('quorum');

const MyMergeBy: {
  DoNotMerge: number;
  Orgs: number;
  ISPs: number;
  Countries: number;
} = MergeBy;

const fbasAnalysisWorker = new Worker(
  new URL("./../../../../workers/fbas-analysis-v3.worker.ts", import.meta.url),
  {
    type: import.meta.env.DEV ? "module" : "classic",
    /* @vite-ignore */
  },
);
const scrollTo = useScrollTo();
const hasResult = ref(false);
const resultMergedBy = ref(MyMergeBy.DoNotMerge);
const hasQuorumIntersection = ref(false);
const minimalQuorums: Ref<Array<Array<string>>> = ref([]);
const blockingSets: Ref<Array<Array<string>>> = ref([]);
const blockingSetsMinSize = ref(0);
const splittingSets: Ref<Array<Array<string>>> = ref([]);
const splittingSetsMinSize = ref(0);
const topTier: Ref<Array<Array<string>>> = ref([]);
const topTierIsSymmetric = ref(false);

const analyzeTrustCluster = ref(false);
const analyzeQuorumIntersection = ref(true);
const quorumIntersectionAnalyzed = ref(false);
const analyzeSafety = ref(true);
const safetyAnalyzed = ref(false);
const analyzeLiveness = ref(true);
const livenessAnalyzed = ref(false);
const analyzeTopTier = ref(true);
const topTierAnalyzed = ref(false);

const nodesPartition: Ref<Map<string, string[]>> = ref(
  new Map<string, string[]>(),
);

function getMergeByFriendlyName(mergeBy = MyMergeBy.DoNotMerge) {
  switch (mergeBy) {
    case MyMergeBy.Countries:
      return "Countries";
    case MyMergeBy.DoNotMerge:
      return "Nodes";
    case MyMergeBy.ISPs:
      return "ISP's";
    case MyMergeBy.Orgs:
      return "Organizations";
  }
}

function stopAnalysis() {
  fbasAnalysisWorker.terminate();
  isLoading.value = false;
}

function performAnalysis() {
  const nodesToAnalyze: Node[] = Array.from(
    new Set(
      analyzeTrustCluster.value && store.selectedNode
        ? [
            ...Array.from(
              TransitiveQuorumSetFinder.find(
                store.selectedNode?.quorumSet,
                getNodesToQuorumSetMap(store.network.nodes),
              ),
            ).map((publicKey) => store.network.getNodeByPublicKey(publicKey)),
            store.selectedNode,
          ]
        : store.networkAnalyzer.nodesToAnalyze,
    ),
  );

  isLoading.value = true;
  fbasAnalysisWorker.postMessage({
    id: 1,
    nodes: nodesToAnalyze,
    organizations: store.network.organizations,
    mergeBy: store.networkAnalysisMergeBy,
    failingNodePublicKeys: store.network.nodes
      .filter((node) => store.network.isNodeFailing(node))
      .map((node) => node.publicKey),
    analyzeQuorumIntersection: analyzeQuorumIntersection,
    analyzeSafety: analyzeSafety,
    analyzeLiveness: analyzeLiveness,
    analyzeTopTier: analyzeTopTier,
    analyzeSymmetricTopTier: true,
  });
}

function getNodesToQuorumSetMap(nodes: Node[]): Map<PublicKey, BaseQuorumSet> {
  return new Map<string, BaseQuorumSet>(
    nodes
      .filter((node) => node.quorumSet)
      .map((node: Node) => [node.publicKey, node.quorumSet]),
  );
}

function updatePartitions() {
  const removeSpecialCharsFromGroupingName = (name: string) => {
    name = name.replace(",", "");
    const start = name.substring(0, name.length - 1);
    let end = name.substring(name.length - 1);
    end = end.replace(".", "");
    name = start + end;
    return name;
  };
  nodesPartition.value = new Map<string, string[]>();
  store.network.nodes
    .filter((node) =>
      store.network.nodesTrustGraph.isVertexPartOfNetworkTransitiveQuorumSet(
        node.publicKey,
      ),
    )
    .forEach((node) => {
      let value = "N/A";
      if (resultMergedBy.value === MyMergeBy.Countries) {
        value = node.geoData.countryName
          ? removeSpecialCharsFromGroupingName(node.geoData.countryName)
          : "N/A";
      } else if (resultMergedBy.value === MyMergeBy.ISPs) {
        value = node.isp ? removeSpecialCharsFromGroupingName(node.isp) : "N/A";
      } else if (resultMergedBy.value === MyMergeBy.Orgs) {
        value = node.organizationId
          ? store.network.getOrganizationById(node.organizationId).name
          : "N/A";
      }

      const nodes = nodesPartition.value.has(value)
        ? (nodesPartition.value.get(value) as string[])
        : [];
      nodes.push(node.displayName);
      nodesPartition.value.set(value, nodes);
    });
}

function mapPublicKeysToNames(items: Array<Array<PublicKey>>) {
  return items.map((row) =>
    row.map(
      (publicKey) => store.network.getNodeByPublicKey(publicKey).displayName,
    ),
  );
}

onMounted(() => {
  isLoading.value = false;
  scrollTo("network-analysis-card");

  fbasAnalysisWorker.onmessage = (event: {
    data: {
      type: string;
      result: {
        analysis: FbasAnalysisWorkerResult;
        mergeBy: MergeBy;
        jobId: number;
      };
    };
  }) => {
    switch (event.data.type) {
      case "end":
        {
          if (event.data.result) {
            hasResult.value = true;
            resultMergedBy.value = event.data.result.mergeBy;
            updatePartitions();
            const analysisResult: FbasAnalysisWorkerResult =
              event.data.result.analysis;
            topTierIsSymmetric.value = analysisResult.hasSymmetricTopTier;
            quorumIntersectionAnalyzed.value =
              analysisResult.quorumIntersectionAnalyzed;

            if (analysisResult.quorumIntersectionAnalyzed) {
              hasQuorumIntersection.value =
                analysisResult.hasQuorumIntersection as boolean;
              minimalQuorums.value =
                analysisResult.minimalQuorums as string[][];
              if (resultMergedBy.value === MyMergeBy.DoNotMerge)
                minimalQuorums.value = mapPublicKeysToNames(
                  minimalQuorums.value,
                );
            }

            livenessAnalyzed.value = analysisResult.livenessAnalyzed;
            if (analysisResult.livenessAnalyzed) {
              const blockingSetsTemp =
                analysisResult.minimalBlockingSets as string[][];
              if (blockingSetsTemp.length > 0) {
                blockingSetsMinSize.value =
                  analysisResult.minimalBlockingSetsMinSize as number;
                blockingSets.value =
                  analysisResult.minimalBlockingSets as string[][];
                if (resultMergedBy.value === MyMergeBy.DoNotMerge) {
                  blockingSets.value = mapPublicKeysToNames(blockingSets.value);
                }
              }
            }

            safetyAnalyzed.value = analysisResult.safetyAnalyzed;
            if (analysisResult.safetyAnalyzed) {
              const splittingSetsTemp =
                analysisResult.minimalSplittingSets as string[][];
              if (splittingSetsTemp.length > 0) {
                splittingSetsMinSize.value =
                  analysisResult.minimalSplittingSetsMinSize as number;
                splittingSets.value =
                  analysisResult.minimalSplittingSets as string[][];
                if (resultMergedBy.value === MyMergeBy.DoNotMerge)
                  splittingSets.value = mapPublicKeysToNames(
                    splittingSets.value,
                  );
              }
            }

            topTierAnalyzed.value = analysisResult.topTierAnalyzed;
            if (analysisResult.topTierAnalyzed) {
              topTier.value = analysisResult.topTier.map((member) => [member]);
              if (resultMergedBy.value === MyMergeBy.DoNotMerge)
                topTier.value = mapPublicKeysToNames(topTier.value);
            }
          }

          isLoading.value = false;
        }
        break;
    }
  };
});
</script>
