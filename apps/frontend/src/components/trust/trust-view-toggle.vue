<template>
  <div class="trust-view-toggle">
    <div class="flex items-center gap-3">
      <!-- View Mode Toggle -->
      <div class="inline-flex rounded-lg shadow-sm">
        <button
          class="rounded-l-lg border border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors"
          :class="viewMode === 'global' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          @click="setViewMode('global')"
        >
          <svg class="inline h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Global Trust
        </button>
        <button
          class="rounded-r-lg border border-gray-200 px-3 py-1.5 text-xs font-medium transition-colors"
          :class="viewMode === 'seeded' ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          @click="setViewMode('seeded')"
        >
          <svg class="inline h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
          {{ selectedOrganizationDisplayName }} Trust
        </button>
      </div>

      <!-- Organization Selector (only visible in seeded mode) -->
      <div v-if="viewMode === 'seeded'" class="relative">
        <button
          class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          @click="orgDropdownOpen = !orgDropdownOpen"
        >
          {{ selectedOrganizationDisplayName }}
          <svg class="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div
          v-show="orgDropdownOpen"
          class="absolute left-0 top-full mt-1 z-50 w-56 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          <a
            v-for="org in availableOrganizations"
            :key="org.name"
            class="flex justify-between items-center px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer transition-colors"
            :class="org.name === selectedOrganization ? 'bg-gray-50 font-semibold' : ''"
            @click="selectOrganization(org.name); orgDropdownOpen = false"
          >
            <span>{{ org.displayName }}</span>
            <small class="text-gray-400 ml-2">{{ org.seedCount }} seeds</small>
          </a>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="ml-2">
        <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
      </div>

      <!-- Error Indicator -->
      <svg
        v-if="error"
        v-tooltip="error"
        class="ml-2 h-4 w-4 text-red-500"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>

      <!-- Last Updated -->
      <small
        v-if="lastUpdated && viewMode === 'seeded'"
        class="text-gray-400 ml-2"
      >
        Updated {{ formatLastUpdated }}
      </small>
    </div>

    <!-- Seeded Trust Info Panel -->
    <div v-if="viewMode === 'seeded' && summary && showInfoPanel" class="mt-3 rounded-xl border border-gray-200 bg-white p-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h6 class="mb-2 text-sm font-semibold">Network Coverage</h6>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
              <span class="font-medium text-gray-500">Total Nodes:</span>
              <span class="font-semibold">{{ summary.totalNodes }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
              <span class="font-medium text-gray-500">Seed Nodes:</span>
              <span class="font-semibold text-amber-600">{{ summary.seedNodes }}</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
              <span class="font-medium text-gray-500">Reachable:</span>
              <span class="font-semibold text-emerald-600">{{ summary.reachableNodes }}</span>
            </div>
            <div class="flex justify-between items-center py-1 text-sm">
              <span class="font-medium text-gray-500">Unreachable:</span>
              <span class="font-semibold text-gray-400">{{ summary.unreachableNodes }}</span>
            </div>
          </div>
        </div>
        <div>
          <h6 class="mb-2 text-sm font-semibold">Trust Propagation</h6>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
              <span class="font-medium text-gray-500">Avg Distance:</span>
              <span class="font-semibold">{{ summary.averageDistance.toFixed(1) }} hops</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
              <span class="font-medium text-gray-500">Max Distance:</span>
              <span class="font-semibold">{{ summary.maxDistance }} hops</span>
            </div>
            <div class="flex justify-between items-center py-1 border-b border-gray-100 text-sm">
              <span class="font-medium text-gray-500">Convergence:</span>
              <span :class="summary.convergenceAchieved ? 'text-emerald-600' : 'text-amber-600'" class="font-semibold">
                {{ summary.convergenceAchieved ? 'Achieved' : 'Not Achieved' }}
              </span>
            </div>
            <div class="flex justify-between items-center py-1 text-sm">
              <span class="font-medium text-gray-500">Iterations:</span>
              <span class="font-semibold">{{ summary.iterationsUsed }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Info Toggle Button -->
    <div v-if="viewMode === 'seeded' && summary" class="text-center mt-2">
      <button
        class="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        @click="showInfoPanel = !showInfoPanel"
      >
        <svg v-if="!showInfoPanel" class="inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
        <svg v-else class="inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
        {{ showInfoPanel ? 'Hide' : 'Show' }} Trust Details
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { useTrustStore } from '@/store/TrustStore';

const trustStore = useTrustStore();
const showInfoPanel = ref(false);
const orgDropdownOpen = ref(false);

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

function setViewMode(mode: 'global' | 'seeded') {
  trustStore.setViewMode(mode);
  showInfoPanel.value = mode === 'seeded';
}

function selectOrganization(organization: string) {
  trustStore.selectOrganization(organization);
}

onMounted(async () => {
  try {
    await trustStore.initialize();
  } catch (error) {
    console.error('Failed to initialize trust store:', error);
  }
});

watch(error, (newError) => {
  if (newError) {
    setTimeout(() => { trustStore.clearError(); }, 5000);
  }
});
</script>

<style scoped>
.trust-view-toggle {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .trust-view-toggle {
    padding: 0.75rem;
  }
}
</style>
