<template>
  <div
    class="rounded-xl border border-gray-200 bg-white relative overflow-hidden"
    :class="{
      'card-fullscreen': fullScreen,
      'sb-card-fullscreen': fullScreen,
    }"
    style="height: 600px"
  >
    <div v-show="menuVisible" class="menu border-r border-gray-200 p-3">
      <div
        class="text-gray-500 cursor-pointer absolute right-2 top-2.5"
        role="button"
        tabindex="0"
        @click="menuVisible = false"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
      </div>
      <div class="flex flex-col justify-between h-full">
        <div>
          <h6 class="sb-navbar-heading mt-3 ml-0 pl-0">View</h6>
          <div class="mt-3">
            <ul class="list-none pl-0">
              <li
                class="pl-3 mb-1 view-link"
                :class="isString($route.query.view) && ['graph', undefined].includes($route.query.view) && 'router-link-exact-active'"
                role="button"
                tabindex="0"
                @click="navigateToViewOption('graph')"
              >
                Node trust graph
              </li>
              <li
                class="pl-3 mb-1 view-link"
                :class="isString($route.query.view) && ['graph-org'].includes($route.query.view) && 'router-link-exact-active'"
                role="button"
                tabindex="0"
                @click="navigateToViewOption('graph-org')"
              >
                Organization trust graph
              </li>
              <li
                class="pl-3 mb-1 view-link"
                :class="$route.query.view === 'map' && 'router-link-exact-active'"
                role="button"
                tabindex="0"
                @click="navigateToViewOption('map')"
              >
                Map
              </li>
            </ul>
          </div>
          <h6
            v-if="view === 'graph' || view === 'graph-org'"
            class="sb-navbar-heading mt-3 ml-0 pl-0"
          >
            Options
          </h6>
          <div v-if="view === 'graph' || view === 'graph-org'" class="space-y-1">
            <label
              v-show="selectedNode || selectedOrganization"
              class="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input v-model="optionHighlightTrustedNodes" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              Highlight trusted nodes
            </label>
            <label
              v-show="selectedNode || selectedOrganization"
              class="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input v-model="optionHighlightTrustingNodes" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              Highlight trusting nodes
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="optionShowFailingEdges" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              Show failing edges
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="optionTransitiveQuorumSetOnly" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              Transitive quorum set only
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input v-model="optionFilterTrustCluster" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500" />
              Filter trust cluster
            </label>
          </div>
        </div>
        <div>
          <graph-legend v-if="view === 'graph' || view === 'graph-org'" />
        </div>
      </div>
    </div>
    <div class="flex items-center m-0 p-0 border-0">
      <div
        class="ml-3 text-gray-500 cursor-pointer"
        role="button"
        tabindex="0"
        @click="menuVisible = true"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
      </div>
      <div class="pl-3 flex-1 flex items-center overflow-hidden min-w-0 py-1">
        <nav class="flex items-center text-sm text-gray-500">
          <template v-for="(crumb, i) in breadCrumbs">
            <span v-if="i > 0" :key="'sep-' + i" class="mx-1.5 text-gray-300">/</span>
            <router-link
              v-if="crumb.to && !crumb.active"
              :key="'link-' + i"
              :to="crumb.to"
              class="hover:text-gray-900 transition-colors truncate"
            >{{ crumb.text }}</router-link>
            <span v-else :key="'text-' + i" class="text-gray-900 font-medium truncate">{{ crumb.text }}</span>
          </template>
        </nav>
      </div>
      <a
        v-if="!zoomEnabled"
        v-tooltip="'Toggle scroll to zoom'"
        href="#"
        class="mx-4 text-gray-400 hover:text-gray-700 transition-colors"
        @click.prevent.stop="zoomEnabled = true"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
      </a>
      <a
        v-else
        v-tooltip="'Toggle scroll to zoom'"
        href="#"
        class="mx-4 text-emerald-600 hover:text-emerald-700 transition-colors"
        @click.prevent.stop="zoomEnabled = false"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
      </a>

      <a
        v-if="!fullScreen"
        v-tooltip="'Fullscreen'"
        href="#"
        class="mx-4 text-gray-400 hover:text-gray-700 transition-colors"
        @click.prevent.stop="fullScreen = true"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
      </a>
      <a
        v-else
        v-tooltip="'Exit fullscreen'"
        href="#"
        class="mx-4 text-gray-400 hover:text-gray-700 transition-colors"
        @click.prevent.stop="fullScreen = false"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </a>
    </div>
    <div class="p-0 h-full">
      <div
        v-if="network.nodesTrustGraph.networkTransitiveQuorumSet.size === 0"
        class="p-4 text-sm text-red-600 bg-red-50/50 ring-1 ring-red-200/60"
      >
        No transitive quorum set detected in network!
      </div>
      <div v-if="view === 'map'" style="height: 100%">
        <div class="world-loader">
          <div class="loader"></div>
        </div>
        <WorldMap :full-screen="fullScreen" />
      </div>
      <network-graph-card
        v-else
        :full-screen="fullScreen"
        :zoom-enabled="zoomEnabled"
        :option-show-failing-edges="optionShowFailingEdges"
        :option-highlight-trusting-nodes="optionHighlightTrustingNodes"
        :option-highlight-trusted-nodes="optionHighlightTrustedNodes"
        :option-show-regular-edges="optionShowRegularEdges"
        :option-transitive-quorum-set-only="optionTransitiveQuorumSetOnly"
        :option-filter-trust-cluster="optionFilterTrustCluster"
        :type="view === 'graph' ? 'node' : 'organization'"
      >
      </network-graph-card>

      <div v-show="!menuVisible" class="preview" @click="navigateToView">
        <img
          v-if="view === 'map'"
          src="@/assets/graph-preview.png"
          alt="graph-preview"
          class="preview-image"
          width="60"
          height="60"
        />
        <img
          v-else
          src="@/assets/map-preview.png"
          alt="map-preview"
          class="preview-image"
          width="60"
          height="60"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from "vue";
import NetworkGraphCard from "@/components/visual-navigator/network-graph-card.vue";
import GraphLegend from "@/components/visual-navigator/graph/graph-legend.vue";
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";
import { isString } from "shared";

const WorldMap = defineAsyncComponent(
  () => import("@/components/visual-navigator/world-map.vue"),
);

const props = defineProps({
  view: {
    type: String,
    default: "map",
  },
});
const view = computed(() => props.view);

const store = useStore();
const network = store.network;
const route = useRoute();
const router = useRouter();

const selectedNode = computed(() => {
  return store.selectedNode;
});

const selectedOrganization = computed(() => {
  return store.selectedOrganization;
});

const optionShowFailingEdges = ref(false);
const optionHighlightTrustingNodes = ref(true);
const optionHighlightTrustedNodes = ref(true);
const optionShowRegularEdges = ref(true);
const optionTransitiveQuorumSetOnly = ref(false);
const optionFilterTrustCluster = ref(false);

const menuVisible = ref(false);
const fullScreen = ref(false);
const zoomEnabled = ref(false);

const breadCrumbs = computed(() => {
  const crumbs: {
    active?: boolean;
    text?: string;
    to?: {
      params?: {
        organizationId: string;
      };
      name: string;
      query: {
        view: string;
        network: string;
        at: string;
      };
    };
  }[] = [];
  crumbs.push({
    text: store.getNetworkContextName(),
    to: {
      name: "network-dashboard",
      query: {
        view: route.query.view as string,
        network: route.query.network as string,
        at: route.query.at as string,
      },
    },
  });

  if (selectedNode.value) {
    if (
      selectedNode.value.organizationId &&
      network.getOrganizationById(selectedNode.value.organizationId)
    )
      crumbs.push({
        text: network.getOrganizationById(selectedNode.value.organizationId)
          .name,
        to: {
          name: "organization-dashboard",
          params: {
            organizationId: selectedNode.value.organizationId,
          },
          query: {
            view: route.query.view as string,
            network: route.query.network as string,
            at: route.query.at as string,
          },
        },
        active: false,
      });
    crumbs.push({
      text: selectedNode.value.displayName,
      active: true,
    });
  } else if (selectedOrganization.value)
    crumbs.push({
      text: selectedOrganization.value.name,
      active: true,
    });
  return crumbs;
});

function navigateToViewOption(viewName: string) {
  menuVisible.value = false;
  router.push({
    name: route.name ? route.name : undefined,
    params: route.params,
    query: {
      view: viewName,
      "no-scroll": "1",
      network: route.query.network,
      at: route.query.at,
    },
  });
}

function navigateToView() {
  const toView = view.value === "map" ? "graph" : "map";
  router.push({
    name: route.name ? route.name : undefined,
    params: route.params,
    query: {
      view: toView,
      "no-scroll": "1",
      network: route.query.network,
      at: route.query.at,
    },
  });
}
</script>
<style scoped>
.sb-card-fullscreen {
  z-index: 4;
  height: 100% !important;
}

.menu {
  z-index: 5000;
  position: absolute;
  background: white;
  width: 250px;
  height: 100%;
}

.view-link {
  text-decoration: none;
  padding-left: 7px;
  color: #818181;
  cursor: pointer;
}

.view-link:hover {
  background-color: #f8f9fa;
}

.router-link-exact-active {
  color: #206bc4 !important;
  background-color: rgba(32, 107, 196, 0.06);
}

.preview-image {
  border-radius: 5px;
}

.preview {
  z-index: 1000;
  position: absolute;
  left: 10px;
  bottom: 10px;
  width: 60px;
  height: 60px;
  border-radius: 5px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  background: white;
}

.world-loader {
  position: absolute;
  left: 50%;
  right: 50%;
  top: 30%;
}
</style>
