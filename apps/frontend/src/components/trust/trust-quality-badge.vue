<template>
  <div class="trust-badges">
    <b-badge 
      v-if="showGoldStar" 
      v-b-tooltip.hover
      :title="goldStarTooltip"
      variant="warning" 
      class="trust-badge trust-badge-gold"
    >
      <b-icon-star-fill />
    </b-badge>
    
    <b-badge 
      v-if="showSilverStar" 
      v-b-tooltip.hover
      :title="silverStarTooltip"
      variant="secondary" 
      class="trust-badge trust-badge-silver"
    >
      <b-icon-star />
    </b-badge>
    
    <b-badge 
      v-if="showWarning" 
      v-b-tooltip.hover
      :title="warningTooltip"
      variant="danger" 
      class="trust-badge trust-badge-warning"
    >
      <b-icon-exclamation-triangle />
    </b-badge>
    
    <b-badge 
      v-if="showCaution" 
      v-b-tooltip.hover
      :title="cautionTooltip"
      variant="warning" 
      class="trust-badge trust-badge-caution"
    >
      <b-icon-info-circle />
    </b-badge>
    
    <b-badge 
      v-if="showDiversityRing" 
      v-b-tooltip.hover
      :title="diversityTooltip"
      variant="info" 
      class="trust-badge trust-badge-diversity"
    >
      <b-icon-arrow-repeat />
    </b-badge>
  </div>
</template>

<script setup lang="ts">
import { computed, toRefs, withDefaults } from 'vue';
import { Node } from 'shared';
import { TrustStyleCalculator } from '@/utils/TrustStyleCalculator';

export interface Props {
  node: Node;
  organizationalDiversity?: number;
  networkAverage?: number;
  showDiversityIndicator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  organizationalDiversity: 0,
  networkAverage: 50,
  showDiversityIndicator: false
});

const { node, organizationalDiversity, networkAverage, showDiversityIndicator } = toRefs(props);

const showGoldStar = computed((): boolean => {
  return organizationalDiversity.value >= 5;
});

const showSilverStar = computed((): boolean => {
  return organizationalDiversity.value >= 3 && organizationalDiversity.value < 5;
});

const showWarning = computed((): boolean => {
  return TrustStyleCalculator.hasZeroTrust(node.value);
});

const showCaution = computed((): boolean => {
  return TrustStyleCalculator.hasLowDiversity(node.value, organizationalDiversity.value) ||
         TrustStyleCalculator.hasBelowAverageTrust(node.value, networkAverage.value);
});

const showDiversityRing = computed((): boolean => {
  return showDiversityIndicator.value && organizationalDiversity.value >= 2;
});

const goldStarTooltip = computed((): string => {
  return `High Trust Authority: Trusted by ${organizationalDiversity.value} different organizations`;
});

const silverStarTooltip = computed((): string => {
  return `Good Trust Authority: Trusted by ${organizationalDiversity.value} different organizations`;
});

const warningTooltip = computed((): string => {
  return 'No Incoming Trust: This node has no trust connections from other organizations';
});

const cautionTooltip = computed((): string => {
  if (TrustStyleCalculator.hasLowDiversity(node.value, organizationalDiversity.value)) {
    return 'Low Organizational Diversity: Limited trust from different organizations';
  }
  if (TrustStyleCalculator.hasBelowAverageTrust(node.value, networkAverage.value)) {
    return 'Below Average Trust: Trust score below network average';
  }
  return 'Trust Quality Notice';
});

const diversityTooltip = computed((): string => {
  return `Cross-Organizational Trust: Trusted by ${organizationalDiversity.value} different organizations`;
});

const trustLevel = computed((): string => {
  return TrustStyleCalculator.getTrustLevelDescription(node.value.trustCentralityScore || 0);
});

const badgeType = computed((): string => {
  return TrustStyleCalculator.getTrustBadgeType(node.value, organizationalDiversity.value);
});
</script>

<style scoped>
.trust-badges {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.trust-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.4rem;
  border-radius: 0.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
}

.trust-badge-gold {
  background-color: #ffd700;
  color: #000;
  border-color: #ffc107;
}

.trust-badge-silver {
  background-color: #c0c0c0;
  color: #000;
  border-color: #6c757d;
}

.trust-badge-warning {
  background-color: #dc3545;
  color: #fff;
  border-color: #dc3545;
}

.trust-badge-caution {
  background-color: #ffc107;
  color: #000;
  border-color: #ffc107;
}

.trust-badge-diversity {
  background-color: #17a2b8;
  color: #fff;
  border-color: #17a2b8;
}

/* Mobile responsive */
@media (max-width: 576px) {
  .trust-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.3rem;
  }
}

/* Hover effects */
.trust-badge:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Accessibility */
.trust-badge:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
</style>