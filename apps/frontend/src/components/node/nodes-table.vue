<template>
  <div class="d-flex flex-column align-items-center justify-content-end">
    <b-table
      striped
      hover
      :responsive="true"
      :items="nodes"
      :fields="fields"
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      :per-page="perPage"
      :current-page="currentPage"
      :filter="filter"
      class="mb-0"
    >
      <template #cell(name)="data">
        <div class="d-flex flex-row justify-content-start align-items-center">
          <span
            v-if="data.item.isFullValidator"
            v-tooltip="'Full validator'"
            class="badge sb-badge badge-success mr-1"
            title="Full validator"
          >
            <b-icon-shield />
          </span>
          <div class="mr-1">
            <router-link
              :to="{
                name: 'node-dashboard',
                params: { publicKey: data.item.publicKey },
                query: {
                  center: '1',
                  view: $route.query.view,
                  network: $route.query.network,
                  at: $route.query.at,
                },
              }"
            >
              {{ data.item.name }}
            </router-link>
          </div>
          <b-badge
            v-if="
              network.isNodeFailing(
                network.getNodeByPublicKey(data.item.publicKey),
              )
            "
            v-tooltip="
              network.getNodeFailingReason(
                network.getNodeByPublicKey(data.item.publicKey),
              ).description
            "
            variant="danger"
          >
            {{
              network.getNodeFailingReason(
                network.getNodeByPublicKey(data.item.publicKey),
              ).label
            }}
          </b-badge>
          <b-badge
            v-else-if="
              NodeWarningDetector.nodeHasWarning(
                network.getNodeByPublicKey(data.item.publicKey),
                network,
              )
            "
            v-tooltip="
              NodeWarningDetector.getNodeWarningReasonsConcatenated(
                network.getNodeByPublicKey(data.item.publicKey),
                network,
              )
            "
            variant="warning"
          >
            Warning
          </b-badge>
          
        </div>
      </template>
      
      <template #cell(trustScore)="data">
        <div class="d-flex align-items-center">
          <div class="trust-score-bar mr-2">
            <div 
              class="trust-score-fill"
              :style="{ 
                width: `${Math.min(100, data.item.trustCentralityScore || 0)}%`,
                backgroundColor: getTrustProgressColor(data.item.trustCentralityScore || 0)
              }"
            ></div>
          </div>
          <span class="trust-score-text">
            {{ formatTrustScore(data.item.trustCentralityScore) }}
          </span>
        </div>
      </template>

      <template #cell(trustRank)="data">
        <span class="trust-rank">
          {{ formatTrustRank(data.item.trustRank) }}
        </span>
      </template>

      <template #cell(trustedBy)="data">
        <span class="trusted-by">
          {{ data.item.incomingTrustCount || 0 }} 
          <small class="text-muted">connections</small>
        </span>
      </template>

      <template #cell(seededTrustScore)="data">
        <div v-if="trustStore.isSeededViewActive" class="seeded-trust-score">
          <div class="trust-progress">
            <div 
              class="trust-progress-bar" 
              :class="getSeededTrustColorClass(data.item)"
              :style="{ width: getSeededTrustScore(data.item) + '%' }"
            ></div>
          </div>
          <span class="seeded-trust-score-text">
            {{ formatTrustScore(getSeededTrustScore(data.item)) }}
          </span>
        </div>
        <span v-else class="text-muted">-</span>
      </template>

      <template #cell(seededTrustRank)="data">
        <span v-if="trustStore.isSeededViewActive" class="seeded-trust-rank">
          {{ formatSeededTrustRank(data.item) }}
        </span>
        <span v-else class="text-muted">-</span>
      </template>

      <template #cell(distanceFromSeeds)="data">
        <b-badge 
          v-if="trustStore.isSeededViewActive"
          :variant="getDistanceBadgeVariant(getDistanceFromSeeds(data.item))"
          class="distance-badge"
        >
          {{ getDistanceLabel(getDistanceFromSeeds(data.item)) }}
        </b-badge>
        <span v-else class="text-muted">-</span>
      </template>

      <template #cell(organization)="data">
        <router-link
          v-if="data.item.organizationId"
          :to="{
            name: 'organization-dashboard',
            params: {
              organizationId: data.item.organizationId,
            },
            query: {
              view: $route.query.view,
              network: $route.query.network,
              at: $route.query.at,
              center: true,
            },
          }"
        >
          {{ data.item.organization }}
        </router-link>
      </template>
      <template #cell(type)="row">
        {{ row.item.type }}
      </template>
      <template #cell(version)="data">
        {{ truncate(data.value, 28) || " " }}
      </template>
      <template #cell(action)="data">
        <node-actions
          :node="network.getNodeByPublicKey(data.item.publicKey)"
        ></node-actions>
      </template>
    </b-table>
    <div
      v-show="nodes.length >= perPage"
      class="d-flex justify-content-end m-1"
    >
      <b-pagination
        v-model="currentPage"
        size="sm"
        limit="3"
        class="mb-0"
        :total-rows="totalRows"
        :per-page="perPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRefs, withDefaults } from "vue";

import {
  BBadge,
  BIconShield,
  BPagination,
  BTable,
  type BvTableFieldArray,
} from "bootstrap-vue";
import NodeActions from "@/components/node/sidebar/node-actions.vue";
import useStore from "@/store/useStore";
import { useTruncate } from "@/composables/useTruncate";
import { NodeWarningDetector } from "@/services/NodeWarningDetector";
import { TrustStyleCalculator } from "@/utils/TrustStyleCalculator";
import { useTrustStore } from "@/store/TrustStore";
import { Node } from "shared";

export interface Props {
  filter?: string;
  fields: BvTableFieldArray;
  nodes: TableNode[];
  perPage?: number;
  sortBy?: string;
}

const props = withDefaults(defineProps<Props>(), {
  filter: "",
  perPage: 200,
  sortBy: "index",
});

const { filter, fields, nodes, perPage, sortBy } = toRefs(props);

const truncate = useTruncate();

const sortDesc = ref(true);

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

// Trust-related computed properties and methods
const networkAverageTrust = computed(() => {
  const trustScores = nodes.value
    .map(node => node.trustCentralityScore || 0)
    .filter(score => score > 0);
  
  if (trustScores.length === 0) return 50;
  
  return trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length;
});

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

const getNodeObject = (tableNode: TableNode): Node => {
  // Convert TableNode to Node object for trust calculations
  const node = network.getNodeByPublicKey(tableNode.publicKey);
  if (node) {
    // Ensure trust properties are available
    node.trustCentralityScore = tableNode.trustCentralityScore || 0;
    node.pageRankScore = tableNode.pageRankScore || 0;
    node.trustRank = tableNode.trustRank || 0;
    node.lastTrustCalculation = tableNode.lastTrustCalculation || null;
    return node;
  }
  
  // Create a minimal Node-like object for trust calculations
  return {
    trustCentralityScore: tableNode.trustCentralityScore || 0,
    pageRankScore: tableNode.pageRankScore || 0,
    trustRank: tableNode.trustRank || 0,
    lastTrustCalculation: tableNode.lastTrustCalculation || null
  } as unknown as Node;
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
  if (distance === 0) return 'warning'; // Orange for seeds
  if (distance === 1) return 'info';    // Blue for direct
  if (distance === 2) return 'secondary'; // Gray for 2nd degree
  if (distance >= 3) return 'light';     // Light gray for distant
  return 'dark'; // Dark for unreachable
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

/* Trust rank styling */
.trust-rank {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
}

/* Trusted by styling */
.trusted-by {
  font-size: 0.875rem;
  color: #212529;
}

/* Trust badge styling in table */
.ml-1 {
  margin-left: 0.25rem;
}

/* Mobile responsive */
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

/* High contrast mode */
@media (prefers-contrast: high) {
  .trust-score-bar {
    border: 1px solid #000;
  }
  
  .trust-score-fill {
    border: 1px solid #000;
  }
}


/* Seeded trust styling */
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
