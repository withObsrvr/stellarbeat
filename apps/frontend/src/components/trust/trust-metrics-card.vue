<template>
  <b-card class="trust-metrics-card">
    <b-card-header class="d-flex justify-content-between align-items-center">
      <h5 class="mb-0">
        <b-icon-shield-check class="mr-2" />
        Trust Metrics
      </h5>
      <small v-if="lastCalculation" class="text-muted">
        Updated {{ lastCalculationFormatted }}
      </small>
    </b-card-header>
    
    <b-card-body>
      <div v-if="hasTrustData" class="trust-content">
        <!-- Trust Score Display -->
        <div class="trust-score-display mb-4">
          <div class="trust-score-circle">
            <div class="trust-score-value">{{ formattedTrustScore }}</div>
            <div class="trust-score-label">Trust Score</div>
          </div>
          
          <div class="trust-rank-display">
            <div class="trust-rank-value">{{ formattedTrustRank }}</div>
            <div class="trust-rank-label">Network Rank</div>
          </div>
        </div>

        <!-- Trust Level Indicator -->
        <div class="trust-level-indicator mb-3">
          <div class="trust-level-bar">
            <div 
              class="trust-level-fill"
              :style="{ width: `${trustScore}%`, backgroundColor: trustProgressColor }"
            ></div>
          </div>
          <div class="trust-level-text">
            <span class="trust-level-description">{{ trustLevelDescription }}</span>
          </div>
        </div>

        <!-- Trust Breakdown -->
        <div class="trust-breakdown mb-3">
          <div class="metric-row">
            <span class="metric-label">PageRank Score:</span>
            <span class="metric-value">{{ formattedPageRankScore }}</span>
          </div>
          <div v-if="organizationalDiversity !== undefined" class="metric-row">
            <span class="metric-label">Organizational Diversity:</span>
            <span class="metric-value">{{ organizationalDiversity }} orgs</span>
          </div>
          <div v-if="incomingTrustCount !== undefined" class="metric-row">
            <span class="metric-label">Incoming Trust:</span>
            <span class="metric-value">{{ incomingTrustCount }} connections</span>
          </div>
        </div>

        <!-- Trust Quality Assessment -->
        <div class="trust-quality-assessment">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <trust-quality-badge 
                :node="node" 
                :organizational-diversity="organizationalDiversity"
                :network-average="networkAverage"
                :show-diversity-indicator="true"
              />
            </div>
            <small class="text-muted">{{ trustQualityText }}</small>
          </div>
        </div>

        <!-- Trust Warnings -->
        <div v-if="hasWarnings" class="trust-warnings mt-3">
          <b-alert variant="warning" show class="mb-0">
            <b-icon-exclamation-triangle class="mr-1" />
            <small>{{ warningMessage }}</small>
          </b-alert>
        </div>
      </div>

      <!-- No Trust Data State -->
      <div v-else class="no-trust-data text-center py-4">
        <b-icon-info-circle class="mb-2" font-scale="2" />
        <p class="text-muted mb-0">Trust metrics not available</p>
        <small class="text-muted">Trust calculation may be in progress</small>
      </div>
    </b-card-body>
  </b-card>
</template>

<script setup lang="ts">
import { computed, toRefs, withDefaults } from 'vue';
import { Node } from 'shared';
import { TrustStyleCalculator } from '@/utils/TrustStyleCalculator';
import TrustQualityBadge from './trust-quality-badge.vue';

export interface Props {
  node: Node;
  organizationalDiversity?: number;
  incomingTrustCount?: number;
  networkAverage?: number;
}

const props = withDefaults(defineProps<Props>(), {
  organizationalDiversity: 0,
  incomingTrustCount: 0,
  networkAverage: 50
});

const { node, organizationalDiversity, incomingTrustCount, networkAverage } = toRefs(props);

const hasTrustData = computed((): boolean => {
  return node.value.trustCentralityScore !== undefined && 
         node.value.trustCentralityScore !== null;
});

const trustScore = computed((): number => {
  return node.value.trustCentralityScore || 0;
});

const pageRankScore = computed((): number => {
  return node.value.pageRankScore || 0;
});

const trustRank = computed((): number => {
  return node.value.trustRank || 0;
});

const lastCalculation = computed((): Date | null => {
  return node.value.lastTrustCalculation || null;
});

const formattedTrustScore = computed((): string => {
  return TrustStyleCalculator.formatTrustScore(trustScore.value);
});

const formattedPageRankScore = computed((): string => {
  return pageRankScore.value.toFixed(6);
});

const formattedTrustRank = computed((): string => {
  return TrustStyleCalculator.formatTrustRank(trustRank.value);
});

const lastCalculationFormatted = computed((): string => {
  if (!lastCalculation.value) return '';
  return new Date(lastCalculation.value).toLocaleString();
});

const trustLevelDescription = computed((): string => {
  return TrustStyleCalculator.getTrustLevelDescription(trustScore.value);
});

const trustProgressColor = computed((): string => {
  return TrustStyleCalculator.getTrustProgressColor(trustScore.value);
});

const trustQualityText = computed((): string => {
  const badgeType = TrustStyleCalculator.getTrustBadgeType(node.value, organizationalDiversity.value);
  
  switch (badgeType) {
    case 'gold':
      return 'Excellent cross-organizational trust';
    case 'silver':
      return 'Good organizational diversity';
    case 'warning':
      return 'No incoming trust connections';
    default:
      return 'Standard trust level';
  }
});

const hasWarnings = computed((): boolean => {
  return TrustStyleCalculator.hasZeroTrust(node.value) ||
         TrustStyleCalculator.hasLowDiversity(node.value, organizationalDiversity.value);
});

const warningMessage = computed((): string => {
  if (TrustStyleCalculator.hasZeroTrust(node.value)) {
    return 'This node has no incoming trust from other organizations';
  }
  if (TrustStyleCalculator.hasLowDiversity(node.value, organizationalDiversity.value)) {
    return 'This node has limited trust from different organizations';
  }
  return '';
});
</script>

<style scoped>
.trust-metrics-card {
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.trust-score-display {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 2rem;
}

.trust-score-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #1997c6;
  position: relative;
}

.trust-score-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1997c6;
  line-height: 1;
}

.trust-score-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.trust-rank-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trust-rank-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #212529;
  line-height: 1;
}

.trust-rank-label {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.trust-level-indicator {
  text-align: center;
}

.trust-level-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.trust-level-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 4px;
}

.trust-level-description {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
}

.trust-breakdown {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.metric-row:last-child {
  margin-bottom: 0;
}

.metric-label {
  font-size: 0.875rem;
  color: #6c757d;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #212529;
}

.trust-quality-assessment {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.trust-warnings {
  border-top: 1px solid #dee2e6;
  padding-top: 1rem;
}

.no-trust-data {
  color: #6c757d;
}

/* Mobile responsive */
@media (max-width: 576px) {
  .trust-score-display {
    flex-direction: column;
    gap: 1rem;
  }
  
  .trust-score-circle {
    width: 80px;
    height: 80px;
  }
  
  .trust-score-value {
    font-size: 1.25rem;
  }
  
  .trust-rank-value {
    font-size: 1.1rem;
  }
  
  .metric-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .trust-score-circle {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    border-color: #4299e1;
  }
  
  .trust-score-value {
    color: #4299e1;
  }
  
  .trust-level-bar {
    background-color: #2d3748;
  }
}
</style>