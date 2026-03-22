<template>
  <div>
    <div id="sticky">
      <transition name="fade" mode="out-in">
        <div :key="stickyKey">
          <div class="flex items-start border-none mt-[18px] mb-0 ml-0 pl-[21px]">
            <div class="flex items-start">
              <h3 class="text-2xl mb-0 mr-1">
                <span class="bg-emerald-500 rounded text-white inline-flex items-center justify-center w-6 h-6 text-sm">
                  <svg v-if="icon === 'bullseye'" class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="8" cy="8" r="4" stroke="currentColor" stroke-width="1" fill="none"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>
                  <svg v-else-if="icon === 'building'" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <svg v-else class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
              </h3>
              <div class="flex flex-col">
                <h3 class="text-sm font-semibold leading-none mb-0.5">
                  <slot name="title" />
                </h3>
                <h6 class="text-xs font-medium opacity-70 mb-0">
                  <slot name="sub-title" />
                </h6>
              </div>
            </div>
          </div>
          <div class="px-4 pt-1">
            <div class="sb-nav-bar">
              <h6 v-if="hasExploreSection" class="sb-navbar-heading">
                Explore
              </h6>
              <div v-if="hasExploreSection" class="overflow">
                <div>
                  <ul v-if="!store.isLoading" class="sb-nav-list">
                    <slot name="explore-list-items"></slot>
                  </ul>
                </div>
              </div>
              <h6 class="sb-navbar-heading mt-4">Tools</h6>
              <ul class="sb-nav-list">
                <slot name="tool-list-items"></slot>
              </ul>

              <h6 class="sb-navbar-heading">Info</h6>
              <div class="overflow">
                <div>
                  <ul class="sb-nav-list">
                    <li class="sb-nav-item">
                      <nav-link
                        :title="'Radar configuration'"
                        :show-icon="true"
                        icon="info-circle"
                        @click="showNetworkPropsModal = true"
                      ></nav-link>
                      <UiModal
                        v-model="showNetworkPropsModal"
                        :lazy="true"
                        size="lg"
                        title="Radar configuration"
                        :ok-only="true"
                        ok-title="Close"
                      >
                        <table class="w-full text-sm">
                          <tbody class="text-gray-500">
                            <tr class="border-b border-gray-100">
                              <td class="px-0 py-2 font-semibold">
                                <svg v-tooltip="'Overlay version radar uses to connect to other nodes'" class="inline h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Overlay version
                              </td>
                              <td class="px-0 py-2 text-right">
                                {{ store.network.overlayVersion }}
                              </td>
                            </tr>
                            <tr class="border-b border-gray-100">
                              <td class="px-0 py-2 font-semibold">
                                <svg v-tooltip="'Minimum allowed overlay version for nodes'" class="inline h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Minimum overlay version
                              </td>
                              <td class="px-0 py-2 text-right">
                                {{ store.network.overlayMinVersion }}
                              </td>
                            </tr>
                            <tr class="border-b border-gray-100">
                              <td class="px-0 py-2 font-semibold">
                                <svg v-tooltip="'Stellar core version to determine if a node is outdated'" class="inline h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Stellar Core version
                              </td>
                              <td class="px-0 py-2 text-right">
                                {{ store.network.stellarCoreVersion }}
                              </td>
                            </tr>
                            <tr class="border-b border-gray-100">
                              <td class="px-0 py-2 font-semibold">
                                <svg v-tooltip="'Maximum supported ledger version'" class="inline h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Maximum ledger version
                              </td>
                              <td class="px-0 py-2 text-right">
                                {{ store.network.maxLedgerVersion }}
                              </td>
                            </tr>
                            <tr v-if="store.network.quorumSetConfiguration">
                              <td class="px-0 py-2 font-semibold">
                                <svg v-tooltip="'Quorum set to decide the correct externalized ledger values and basis for network analysis'" class="inline h-3.5 w-3.5 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Quorum set
                              </td>
                              <td class="text-left">
                                <pre class="text-xs bg-gray-50 rounded p-2 overflow-x-auto"><code>{{
                                  prettifyBaseQuorumSet(store.network.quorumSetConfiguration, store.network)
                                }}</code></pre>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </UiModal>
                    </li>
                    <slot name="info"></slot>
                  </ul>
                </div>
              </div>
              <h6 class="sb-navbar-heading mt-3">Options</h6>
              <ul class="sb-nav-list">
                <li class="sb-nav-item">
                  <label class="sb-nav-item sb-nav-toggle flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      v-model="store.includeAllNodes"
                      type="checkbox"
                      class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      name="include-watcher-nodes-button"
                    />
                    All connectable nodes
                  </label>
                </li>
              </ul>
              <undo-redo v-if="store.isSimulation || store.hasRedo" />
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import UndoRedo from "@/components/node/tools/simulation/UndoRedo.vue";
import useStore from "@/store/useStore";
import NavLink from "@/components/side-bar/nav-link.vue";
import { type BaseQuorumSet, Network } from "shared";
import { ref } from "vue";

defineProps({
  stickyKey: {
    type: String,
    required: false,
    default: undefined,
  },
  icon: {
    type: String,
    required: false,
    default: undefined,
  },
  hasExploreSection: {
    type: Boolean,
    default: true,
  },
});

const store = useStore();
const showNetworkPropsModal = ref(false);

function prettifyBaseQuorumSet(
  qSet: BaseQuorumSet,
  network: Network,
): Record<string, unknown> {
  return {
    threshold: qSet.threshold,
    validators: qSet.validators.map((validator) =>
      network.getNodeByPublicKey(validator).name
        ? network.getNodeByPublicKey(validator).name +
          " (" +
          network.getNodeByPublicKey(validator).publicKey.substring(0, 4) +
          "..." +
          network
            .getNodeByPublicKey(validator)
            .publicKey.substring(
              50,
              network.getNodeByPublicKey(validator).publicKey.length,
            ) +
          ")"
        : network.getNodeByPublicKey(validator).displayName,
    ),
    innerQuorumSets: qSet.innerQuorumSets.map((innerQSet) =>
      prettifyBaseQuorumSet(innerQSet, network),
    ),
  };
}
</script>
<style scoped>
.overflow {
  overflow-y: auto;
  max-height: calc(100vh - 22rem);
}

.sb-nav-bar {
  list-style: none;
  flex: 0 0 220px;
}

.sb-nav-list {
  padding-left: 0;
}

#sticky {
  position: sticky;
  top: 0;
}
</style>
