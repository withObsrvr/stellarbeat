<template>
  <div>
    <div class="flex justify-between items-center py-3">
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-900">Nodes</h1>
        <simulation-badge />
        <time-travel-badge />
      </div>
      <crawl-time />
    </div>
    <div class="rounded-xl border border-gray-200 bg-white mb-2">
      <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
        <div class="flex flex-col sm:flex-row gap-3 w-full">
          <div class="flex gap-4">
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                v-model="optionShowInactive"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              Include inactive nodes
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer">
              <input
                v-model="optionShowAllConnectableNodes"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              Include all connectable nodes
            </label>
          </div>
          <div class="sm:ml-auto">
            <input
              id="searchInput"
              v-model="filter"
              class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 w-full sm:w-64"
              type="text"
              placeholder="Type public key, name, ... to search"
            />
          </div>
        </div>
      </div>
      <!-- Prism-style table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-2xs font-mono text-gray-400 uppercase tracking-widest bg-gray-50/80">
              <th class="px-5 py-3 font-medium">Validator</th>
              <th class="px-4 py-3 font-medium hidden md:table-cell">Organization</th>
              <th class="px-4 py-3 font-medium text-right">Uptime</th>
              <th class="px-4 py-3 font-medium text-right hidden md:table-cell">Version</th>
              <th class="px-4 py-3 font-medium text-right hidden lg:table-cell">Country</th>
              <th class="px-4 py-3 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="node in paginatedNodes"
              :key="node.publicKey"
              class="group hover:bg-gray-50/50 transition-colors cursor-pointer"
              @click="openSlideOut(node.publicKey)"
            >
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <UiStatusDot :color="node.isValidating ? 'emerald' : node.active ? 'amber' : 'red'" />
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-medium text-gray-900">{{ node.displayName }}</span>
                      <UiBadge
                        v-if="network.isNodeFailing(node)"
                        v-tooltip="network.getNodeFailingReason(node).description"
                        variant="danger"
                      >{{ network.getNodeFailingReason(node).label }}</UiBadge>
                      <UiBadge
                        v-else-if="NodeWarningDetector.nodeHasWarning(node, network)"
                        v-tooltip="NodeWarningDetector.getNodeWarningReasonsConcatenated(node, network)"
                        variant="warning"
                      >Warning</UiBadge>
                    </div>
                    <div class="font-mono text-2xs text-gray-400">
                      {{ node.publicKey.substring(0, 6) }}...{{ node.publicKey.substring(52) }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 hidden md:table-cell">
                <span class="text-xs text-gray-700">{{ getOrganization(node) }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span class="text-xs text-gray-700 tabular">
                  {{ node.statistics.has30DayStats ? node.statistics.validating30DaysPercentage + '%' : 'N/A' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right hidden md:table-cell">
                <span class="font-mono text-2xs text-gray-500">{{ truncateVersion(node.versionStr) }}</span>
              </td>
              <td class="px-4 py-3 text-right hidden lg:table-cell">
                <span class="text-xs text-gray-700">{{ node.geoData.countryName || 'N/A' }}</span>
              </td>
              <td class="px-4 py-3 text-right">
                <UiBadge
                  v-if="node.isValidating"
                  variant="emerald"
                >Validating</UiBadge>
                <UiBadge
                  v-else-if="network.isNodeFailing(node)"
                  variant="red"
                >{{ network.getNodeFailingReason(node).label }}</UiBadge>
                <UiBadge
                  v-else
                  variant="gray"
                >Inactive</UiBadge>
              </td>
            </tr>
            <tr v-if="paginatedNodes.length === 0">
              <td colspan="6" class="px-5 py-8 text-center text-sm text-gray-400">
                No nodes found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="filteredNodes.length > perPage" class="flex justify-between items-center px-5 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">
          Showing {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filteredNodes.length) }} of {{ filteredNodes.length }}
        </span>
        <UiPagination
          v-model="currentPage"
          size="sm"
          :limit="3"
          :total-rows="filteredNodes.length"
          :per-page="perPage"
        />
      </div>
    </div>

    <div v-if="store.networkContext.enableIndex" class="rounded-xl border border-gray-200 bg-white mb-2">
      <div class="p-4">
        <div class="text-wrap">
          <h2 class="mt-0 mb-4 text-lg font-semibold">Index formula</h2>
          <pre class="text-xs bg-gray-50 rounded-lg p-4 overflow-x-auto"><code>
Index = (TypeIndex + ActiveIndex + ValidationIndex + VersionIndex + TrustIndex + AgeIndex)/6

TypeIndex = Full validator | Basic validator | Connectable node
ActiveIndex = Active percentage last 30 days
ValidationIndex = Validation percentage last 30 days
Version = How far away from the latest stable Stellar core version
Trust = How many active validators trust this node
Age = Time since discovery
                    </code></pre>
        </div>
      </div>
    </div>

    <!-- Slide-out -->
    <NodeSlideOut
      :node="slideOutNode"
      :visible="slideOutVisible"
      @close="slideOutVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { Node } from "shared";
import CrawlTime from "@/components/crawl-time.vue";
import SimulationBadge from "@/components/simulation-badge.vue";
import TimeTravelBadge from "@/components/time-travel-badge.vue";
import NodeSlideOut from "@/components/node/NodeSlideOut.vue";
import { computed, ref } from "vue";
import useStore from "@/store/useStore";
import { NodeWarningDetector } from "@/services/NodeWarningDetector";
import useMetaTags from "@/composables/useMetaTags";

const store = useStore();
const network = store.network;

const optionShowInactive = ref(false);
const optionShowAllConnectableNodes = ref(false);
const filter = ref("");
const currentPage = ref(1);
const perPage = 25;

const slideOutVisible = ref(false);
const slideOutNode = ref<Node | null>(null);

function openSlideOut(publicKey: string) {
  slideOutNode.value = network.getNodeByPublicKey(publicKey);
  slideOutVisible.value = true;
}

const getOrganization = (node: Node) => {
  if (!node.organizationId) return "-";
  const org = network.getOrganizationById(node.organizationId);
  return org ? org.name : "-";
};

function truncateVersion(versionStr: string | null): string {
  if (!versionStr) return 'N/A';
  // Extract version number like "25.2.0" from full string
  const match = versionStr.match(/v?(\d+\.\d+\.\d+)/);
  return match ? match[1] : versionStr.substring(0, 20);
}

const filteredNodes = computed(() => {
  const lowerFilter = filter.value.toLowerCase();
  return network.nodes
    .filter((node) => node.active || optionShowInactive.value)
    .filter((node) => node.isValidator || optionShowAllConnectableNodes.value)
    .filter((node) => {
      if (!lowerFilter) return true;
      return (
        node.displayName.toLowerCase().includes(lowerFilter) ||
        node.publicKey.toLowerCase().includes(lowerFilter) ||
        (node.organizationId &&
          network.getOrganizationById(node.organizationId)?.name
            ?.toLowerCase()
            .includes(lowerFilter)) ||
        (node.geoData.countryName?.toLowerCase().includes(lowerFilter)) ||
        (node.isp?.toLowerCase().includes(lowerFilter)) ||
        (node.host?.toLowerCase().includes(lowerFilter))
      );
    })
    .sort((a, b) => (b.index ?? 0) - (a.index ?? 0));
});

const paginatedNodes = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filteredNodes.value.slice(start, start + perPage);
});

// Reset page when filter changes
import { watch } from "vue";
watch(filter, () => { currentPage.value = 1; });
watch(optionShowInactive, () => { currentPage.value = 1; });
watch(optionShowAllConnectableNodes, () => { currentPage.value = 1; });

useMetaTags("Nodes", "Search through all available nodes");
</script>
