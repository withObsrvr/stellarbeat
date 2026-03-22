<template>
  <div class="flex flex-col items-center justify-end">
    <UiTable
      striped
      hover
      responsive
      :items="nodes"
      :fields="fields"
      :sort-by="sortByRef"
      :sort-desc="sortDesc"
      :per-page="perPage"
      :current-page="currentPage"
      :filter="filter"
      class="mb-0"
      @update:sort-by="sortByRef = $event"
      @update:sort-desc="sortDesc = $event"
    >
      <template #cell(name)="{ item }">
        <div class="flex items-center">
          <span
            v-if="item.isFullValidator"
            v-tooltip="'Full validator'"
            class="inline-flex items-center justify-center rounded bg-emerald-500 text-white mr-1 p-0.5"
            title="Full validator"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </span>
          <div class="mr-1">
            <router-link
              :to="{
                name: 'node-dashboard',
                params: { publicKey: item.publicKey },
                query: {
                  center: '1',
                  view: $route.query.view,
                  network: $route.query.network,
                  at: $route.query.at,
                },
              }"
            >
              {{ item.name }}
            </router-link>
          </div>
          <UiBadge
            v-if="
              network.isNodeFailing(
                network.getNodeByPublicKey(item.publicKey),
              )
            "
            v-tooltip="
              network.getNodeFailingReason(
                network.getNodeByPublicKey(item.publicKey),
              ).description
            "
            variant="danger"
          >
            {{
              network.getNodeFailingReason(
                network.getNodeByPublicKey(item.publicKey),
              ).label
            }}
          </UiBadge>
          <UiBadge
            v-else-if="
              NodeWarningDetector.nodeHasWarning(
                network.getNodeByPublicKey(item.publicKey),
                network,
              )
            "
            v-tooltip="
              NodeWarningDetector.getNodeWarningReasonsConcatenated(
                network.getNodeByPublicKey(item.publicKey),
                network,
              )
            "
            variant="warning"
          >
            Warning
          </UiBadge>
        </div>
      </template>

      <template #cell(trustScore)="{ item }">
        <div class="flex items-center">
          <div class="trust-score-bar mr-2">
            <div
              class="trust-score-fill"
              :style="{
                width: `${Math.min(100, item.trustCentralityScore || 0)}%`,
                backgroundColor: getTrustProgressColor(item.trustCentralityScore || 0)
              }"
            ></div>
          </div>
          <span class="trust-score-text">
            {{ formatTrustScore(item.trustCentralityScore) }}
          </span>
        </div>
      </template>

      <template #cell(trustRank)="{ item }">
        <span class="trust-rank">
          {{ formatTrustRank(item.trustRank) }}
        </span>
      </template>

      <template #cell(trustedBy)="{ item }">
        <span class="trusted-by">
          {{ item.incomingTrustCount || 0 }}
          <small class="text-gray-500">connections</small>
        </span>
      </template>

      <template #cell(seededTrustScore)="{ item }">
        <div v-if="trustStore.isSeededViewActive" class="seeded-trust-score">
          <div class="trust-progress">
            <div
              class="trust-progress-bar"
              :class="getSeededTrustColorClass(item)"
              :style="{ width: getSeededTrustScore(item) + '%' }"
            ></div>
          </div>
          <span class="seeded-trust-score-text">
            {{ formatTrustScore(getSeededTrustScore(item)) }}
          </span>
        </div>
        <span v-else class="text-gray-500">-</span>
      </template>

      <template #cell(seededTrustRank)="{ item }">
        <span v-if="trustStore.isSeededViewActive" class="seeded-trust-rank">
          {{ formatSeededTrustRank(item) }}
        </span>
        <span v-else class="text-gray-500">-</span>
      </template>

      <template #cell(distanceFromSeeds)="{ item }">
        <UiBadge
          v-if="trustStore.isSeededViewActive"
          :variant="getDistanceBadgeVariant(getDistanceFromSeeds(item))"
          class="distance-badge"
        >
          {{ getDistanceLabel(getDistanceFromSeeds(item)) }}
        </UiBadge>
        <span v-else class="text-gray-500">-</span>
      </template>

      <template #cell(organization)="{ item }">
        <router-link
          v-if="item.organizationId"
          :to="{
            name: 'organization-dashboard',
            params: {
              organizationId: item.organizationId,
            },
            query: {
              view: $route.query.view,
              network: $route.query.network,
              at: $route.query.at,
              center: '1',
            },
          }"
        >
          {{ item.organization }}
        </router-link>
      </template>
      <template #cell(type)="{ item }">
        {{ item.type }}
      </template>
      <template #cell(version)="{ value }">
        {{ truncate(value, 28) || " " }}
      </template>
      <template #cell(action)="{ item }">
        <node-actions
          :node="network.getNodeByPublicKey(item.publicKey)"
        ></node-actions>
      </template>
    </UiTable>
    <div
      v-show="nodes.length >= perPage"
      class="flex justify-end m-1"
    >
      <UiPagination
        v-model="currentPage"
        size="sm"
        :limit="3"
        class="mb-0"
        :total-rows="totalRows"
        :per-page="perPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, withDefaults } from "vue";

import NodeActions from "@/components/node/sidebar/node-actions.vue";
import useStore from "@/store/useStore";
import { useTruncate } from "@/composables/useTruncate";
import { NodeWarningDetector } from "@/services/NodeWarningDetector";
import { TrustStyleCalculator } from "@/utils/TrustStyleCalculator";
import { useTrustStore } from "@/store/TrustStore";
import { Node } from "shared";

interface TableField {
  key: string;
  label?: string;
  sortable?: boolean;
  class?: string;
  tdClass?: string;
}

export interface Props {
  filter?: string;
  fields: (string | TableField)[];
  nodes: TableNode[];
  perPage?: number;
  sortBy?: string;
  sortByDesc?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  filter: "",
  perPage: 200,
  sortBy: "index",
  sortByDesc: true,
});

const { filter, fields, nodes, perPage } = toRefs(props);

const truncate = useTruncate();

const sortByRef = ref(props.sortBy);
const sortDesc = ref(props.sortByDesc);

const currentPage = ref(1);

const store = useStore();
const network = store.network;
const trustStore = useTrustStore();

const totalRows = computed(() => nodes.value.length);

export type TableNode = {
  name: string;
  publicKey: string;
  organization?: string;
  organizationId?: string;
  type?: string;
  version?: string;
  lag?: string;
  action?: string;
  isFullValidator?: boolean;
  active24Hour?: string;
  active30Days?: string;
  validating24Hour?: string;
  validating30Days?: string;
  isp?: string;
  country?: string;
  overLoaded24Hour?: string;
  ip?: string;
  isValidator?: boolean;
  index?: number;
  validating: boolean;
  // Trust metrics
  trustCentralityScore?: number;
  pageRankScore?: number;
  trustRank?: number;
  organizationalDiversity?: number;
  incomingTrustCount?: number;
  lastTrustCalculation?: Date;
};

// Trust helper functions

const formatTrustScore = (score: number | undefined): string => {
  return TrustStyleCalculator.formatTrustScore(score || 0);
};

const formatTrustRank = (rank: number | undefined): string => {
  return TrustStyleCalculator.formatTrustRank(rank || 0);
};

const getTrustProgressColor = (score: number): string => {
  return TrustStyleCalculator.getTrustProgressColor(score);
};

// Seeded trust helper functions
const getSeededTrustScore = (tableNode: TableNode): number => {
  const seededMetrics = trustStore.getSeededMetrics(tableNode.publicKey);
  return seededMetrics?.seededTrustCentralityScore || 0;
};

const getSeededTrustRank = (tableNode: TableNode): number => {
  const seededMetrics = trustStore.getSeededMetrics(tableNode.publicKey);
  return seededMetrics?.seededTrustRank || 0;
};

const getDistanceFromSeeds = (tableNode: TableNode): number => {
  const seededMetrics = trustStore.getSeededMetrics(tableNode.publicKey);
  return seededMetrics?.distanceFromSeeds ?? -1;
};

const getSeededTrustColorClass = (tableNode: TableNode): string => {
  const seededMetrics = trustStore.getSeededMetrics(tableNode.publicKey);
  if (!seededMetrics) return 'node-inactive';
  return TrustStyleCalculator.getSeededColorClass(seededMetrics);
};

const formatSeededTrustRank = (tableNode: TableNode): string => {
  const rank = getSeededTrustRank(tableNode);
  return rank > 0 ? `#${rank}` : 'N/A';
};

const getDistanceLabel = (distance: number): string => {
  if (distance === 0) return 'Seed';
  if (distance === 1) return '1 hop';
  if (distance === 2) return '2 hops';
  if (distance >= 3) return `${distance} hops`;
  return 'Unreachable';
};

const getDistanceBadgeVariant = (distance: number): string => {
  if (distance === 0) return 'warning';
  if (distance === 1) return 'info';
  if (distance === 2) return 'secondary';
  if (distance >= 3) return 'default';
  return 'default';
};
</script>

<style scoped>
/* Trust score bar styling */
.trust-score-bar {
  width: 60px;
  height: 6px;
  background-color: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
}

.trust-score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.trust-score-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
  min-width: 35px;
  text-align: right;
}

.trust-rank {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
}

.trusted-by {
  font-size: 0.875rem;
  color: #212529;
}

@media (max-width: 768px) {
  .trust-score-bar {
    width: 40px;
    height: 4px;
  }

  .trust-score-text {
    font-size: 0.75rem;
    min-width: 30px;
  }

  .trust-rank,
  .trusted-by {
    font-size: 0.75rem;
  }
}

.seeded-trust-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.seeded-trust-score-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: #ff6b35;
}

.seeded-trust-rank {
  font-weight: 600;
  color: #f7931e;
}

.distance-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
</style>
