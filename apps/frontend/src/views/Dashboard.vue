<template>
  <div>
    <div v-if="!isDetailView" class="flex justify-between items-center py-3">
      <div class="flex items-center">
        <h2 class="text-xl font-semibold text-gray-900">Network explorer</h2>
        <simulation-badge />
        <time-travel-badge />
        <div v-if="store.networkAnalyzer.analyzing">
          <div class="loader"></div>
        </div>
      </div>
      <crawl-time v-if="!store.isSimulation" />
    </div>
    <div
      v-if="selectedNode && selectedNode.unknown"
      class="p-4 mb-4 rounded-xl text-sm text-amber-700 bg-amber-50/50 ring-1 ring-amber-200/60"
      role="alert"
    >
      Selected node with public key:
      <strong>{{
        selectedNode ? selectedNode.publicKey : "UNKNOWN PUBLIC KEY"
      }}</strong>
      is unknown or archived
    </div>

    <div
      v-if="selectedOrganization && selectedOrganization.unknown"
      class="p-4 mb-4 rounded-xl text-sm text-amber-700 bg-amber-50/50 ring-1 ring-amber-200/60"
      role="alert"
    >
      Selected organization with id:
      <strong>{{ selectedOrganization.id }}</strong>
      is unknown or archived
    </div>

    <div
      v-if="
        store.isHaltingAnalysisVisible &&
        store.haltingAnalysisPublicKey &&
        !network.getNodeByPublicKey(store.haltingAnalysisPublicKey).unknown
      "
      id="halting-analysis-card"
      class="grid grid-cols-12 gap-4 mb-4"
    >
      <div class="col-span-12">
        <HaltingAnalysis
          :public-key="store.haltingAnalysisPublicKey ?? 'unknown'"
        >
        </HaltingAnalysis>
      </div>
    </div>
    <div class="flex flex-col lg:flex-row gap-4 h-full">
      <aside v-if="!isDetailView" class="w-full lg:w-auto flex-shrink-0 mb-5 lg:mb-0">
        <div class="rounded-xl border border-gray-200 bg-white pt-0 sidebar-card h-full">
          <router-view v-slot="{ Component }" name="sideBar">
            <transition name="fade" mode="out-in">
              <component :is="Component" class="h-full side-bar" />
            </transition>
          </router-view>
        </div>
      </aside>
      <div id="content" class="flex-1 min-w-0">
        <div v-if="!isDetailView" class="mb-4">
          <network-visual-navigator :view="view" />
        </div>
        <div
          v-if="store.isNetworkAnalysisVisible"
          id="network-analysis-card"
          class="mb-4"
        >
          <network-analysis :dummy="'compiler_gives_error_if_no_props??'" />
        </div>
        <div>
          <router-view name="dashboard" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, watch } from "vue";
import HaltingAnalysis from "@/components/node/tools/halting-analysis/halting-analysis.vue";
import NetworkVisualNavigator from "@/components/visual-navigator/network-visual-navigator.vue";
import CrawlTime from "@/components/crawl-time.vue";
import SimulationBadge from "@/components/simulation-badge.vue";
import TimeTravelBadge from "@/components/time-travel-badge.vue";
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";
import useScrollTo from "@/composables/useScrollTo";

const NetworkAnalysis = defineAsyncComponent(
  () =>
    import("@/components/network/tools/network-analysis/network-analysis.vue"),
);

defineProps({
  view: {
    type: String,
    required: true,
    default: "graph",
  },
});

const store = useStore();
const network = store.network;

const route = useRoute();
const router = useRouter();

const scrollTo = useScrollTo();

const isNodeDetailView = computed(
  () => route.name === "node-dashboard" && !!store.selectedNode,
);

const isOrgDetailView = computed(
  () => route.name === "organization-dashboard" && !!store.selectedOrganization,
);

const isDetailView = computed(
  () => isNodeDetailView.value || isOrgDetailView.value,
);

watch(
  route,
  (to) => {
    if (to.params.publicKey && typeof to.params.publicKey === 'string') {
      store.selectedNode = network.getNodeByPublicKey(to.params.publicKey);
      if (!store.selectedNode) {
        router.push({
          name: "network-dashboard",
          query: {
            view: route.query.view,
            network: route.query.network,
            at: route.query.at,
          },
        });
      }
    } else store.selectedNode = undefined;
    if (to.params.organizationId && typeof to.params.organizationId === 'string') {
      store.selectedOrganization = network.getOrganizationById(
        to.params.organizationId,
      );
      if (!store.selectedOrganization) {
        router.push({
          name: "network-dashboard",
          query: {
            view: route.query.view,
            network: route.query.network,
            at: route.query.at,
          },
        });
      }
    } else store.selectedOrganization = undefined;

    if (to.query.center === "1" || !to.query.center) {
      store.centerNode = store.selectedNode;
    }
  },
  { immediate: true },
);

const selectedNode = computed(() => store.selectedNode);
const selectedOrganization = computed(() => store.selectedOrganization);

const haltingAnalysisPublicKey = computed(() => {
  return store.haltingAnalysisPublicKey;
});

watch(haltingAnalysisPublicKey, (publicKey) => {
  if (publicKey) scrollTo("halting-analysis-card");
});
</script>

<style scoped>
@media (min-width: 1279px) {
  .side-bar {
    width: 272px;
  }
}
</style>
