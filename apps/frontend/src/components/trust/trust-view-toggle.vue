<template>
  <div class="trust-view-toggle">
    <div class="d-flex align-items-center gap-3">
      <!-- View Mode Toggle -->
      <b-button-group size="sm">
        <b-button 
          :variant="viewMode === 'global' ? 'primary' : 'outline-primary'"
          @click="setViewMode('global')"
        >
          <b-icon-globe class="mr-1" />
          Global Trust
        </b-button>
        <b-button 
          :variant="viewMode === 'seeded' ? 'primary' : 'outline-primary'"
          @click="setViewMode('seeded')"
        >
          <b-icon-star class="mr-1" />
          {{ selectedOrganizationDisplayName }} Trust
        </b-button>
      </b-button-group>

      <!-- Organization Selector (only visible in seeded mode) -->
      <b-dropdown 
        v-if="viewMode === 'seeded'"
        :text="selectedOrganizationDisplayName"
        variant="outline-secondary"
        size="sm"
        class="organization-dropdown"
      >
        <b-dropdown-item 
          v-for="org in availableOrganizations"
          :key="org.name"
          :active="org.name === selectedOrganization"
          @click="selectOrganization(org.name)"
        >
          <div class="d-flex justify-content-between align-items-center">
            <span>{{ org.displayName }}</span>
            <small class="text-muted ml-2">{{ org.seedCount }} seeds</small>
          </div>
        </b-dropdown-item>
      </b-dropdown>

      <!-- Loading Indicator -->
      <b-spinner 
        v-if="isLoading" 
        small 
        variant="primary"
        class="ml-2"
      />

      <!-- Error Indicator -->
      <b-icon-exclamation-triangle 
        v-if="error" 
        v-b-tooltip.hover
        variant="danger"
        class="ml-2"
        :title="error"
      />

      <!-- Last Updated -->
      <small 
        v-if="lastUpdated && viewMode === 'seeded'" 
        class="text-muted ml-2"
      >
        Updated {{ formatLastUpdated }}
      </small>
    </div>

    <!-- Seeded Trust Info Panel -->
    <b-collapse v-model="showInfoPanel" class="mt-3">
      <b-card 
        v-if="viewMode === 'seeded' && summary" 
        class="seeded-trust-info"
        body-class="p-3"
      >
        <div class="row">
          <div class="col-md-6">
            <h6 class="mb-2">Network Coverage</h6>
            <div class="trust-stats">
              <div class="stat-item">
                <span class="stat-label">Total Nodes:</span>
                <span class="stat-value">{{ summary.totalNodes }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Seed Nodes:</span>
                <span class="stat-value text-warning">{{ summary.seedNodes }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Reachable:</span>
                <span class="stat-value text-success">{{ summary.reachableNodes }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Unreachable:</span>
                <span class="stat-value text-muted">{{ summary.unreachableNodes }}</span>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <h6 class="mb-2">Trust Propagation</h6>
            <div class="trust-stats">
              <div class="stat-item">
                <span class="stat-label">Avg Distance:</span>
                <span class="stat-value">{{ summary.averageDistance.toFixed(1) }} hops</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Max Distance:</span>
                <span class="stat-value">{{ summary.maxDistance }} hops</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Convergence:</span>
                <span :class="summary.convergenceAchieved ? 'text-success' : 'text-warning'">
                  {{ summary.convergenceAchieved ? 'Achieved' : 'Not Achieved' }}
                </span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Iterations:</span>
                <span class="stat-value">{{ summary.iterationsUsed }}</span>
              </div>
            </div>
          </div>
        </div>
      </b-card>
    </b-collapse>

    <!-- Info Toggle Button -->
    <div v-if="viewMode === 'seeded' && summary" class="text-center mt-2">
      <b-button
        variant="link"
        size="sm"
        @click="showInfoPanel = !showInfoPanel"
      >
        <b-icon-chevron-down v-if="!showInfoPanel" />
        <b-icon-chevron-up v-if="showInfoPanel" />
        {{ showInfoPanel ? 'Hide' : 'Show' }} Trust Details
      </b-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { 
  BButtonGroup, 
  BButton, 
  BDropdown, 
  BDropdownItem, 
  BSpinner,
  BCard,
  BCollapse,
  BIconGlobe,
  BIconStar,
  BIconExclamationTriangle,
  BIconChevronDown,
  BIconChevronUp
} from '@/components/bootstrap-compat';
import { useTrustStore } from '@/store/TrustStore';

const trustStore = useTrustStore();
const showInfoPanel = ref(false);

// Computed properties
const viewMode = computed(() => trustStore.viewMode);
const selectedOrganization = computed(() => trustStore.selectedOrganization);
const availableOrganizations = computed(() => trustStore.organizations);
const isLoading = computed(() => trustStore.isLoading);
const error = computed(() => trustStore.error);
const lastUpdated = computed(() => trustStore.lastUpdated);
const summary = computed(() => trustStore.summary);

const selectedOrganizationDisplayName = computed(() => {
  const org = trustStore.organizations.find(o => o.name === selectedOrganization.value);
  return org?.displayName || selectedOrganization.value;
});

const formatLastUpdated = computed(() => {
  if (!lastUpdated.value) return '';
  
  const now = new Date();
  const diff = now.getTime() - lastUpdated.value.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
});

// Methods
function setViewMode(mode: 'global' | 'seeded') {
  trustStore.setViewMode(mode);
  
  // Auto-show info panel when switching to seeded mode
  if (mode === 'seeded') {
    showInfoPanel.value = true;
  } else {
    showInfoPanel.value = false;
  }
}

function selectOrganization(organization: string) {
  trustStore.selectOrganization(organization);
}

function refreshData() {
  if (viewMode.value === 'seeded') {
    trustStore.refreshSeededData();
  }
}

// Initialize trust store on mount
onMounted(async () => {
  try {
    await trustStore.initialize();
  } catch (error) {
    console.error('Failed to initialize trust store:', error);
  }
});

// Watch for errors and auto-clear them
watch(error, (newError) => {
  if (newError) {
    setTimeout(() => {
      trustStore.clearError();
    }, 5000);
  }
});
</script>

<style scoped>
.trust-view-toggle {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  border: 1px solid #dee2e6;
}

.organization-dropdown {
  min-width: 200px;
}

.seeded-trust-info {
  border: 1px solid #e3f2fd;
  background-color: #f8fbff;
}

.trust-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid #e9ecef;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 500;
  color: #6c757d;
  font-size: 0.875rem;
}

.stat-value {
  font-weight: 600;
  color: #212529;
  font-size: 0.875rem;
}

.gap-3 {
  gap: 1rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .trust-view-toggle {
    padding: 0.75rem;
  }
  
  .d-flex.gap-3 {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .organization-dropdown {
    min-width: auto;
    width: 100%;
  }
  
  .row {
    margin: 0;
  }
  
  .col-md-6 {
    padding: 0 0.5rem;
  }
}


/* Animation for collapse */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>