<template>
  <div class="card">
    <div class="card-header consensus-topology-header">
      <div class="card-header-content">
        <BreadCrumbs root="Consensus Topology"></BreadCrumbs>
        <div>
          <span
            v-if="federatedVotingStore.networkAnalysis.hasQuorumIntersection()"
            v-tooltip="'Quorum intersection'"
            class="badge badge-success ms-2"
            >Quorum Intersection</span
          >
          <span
            v-else
            v-tooltip="'No quorum intersection'"
            class="badge badge-danger ms-2"
          >
            No Quorum Intersection</span
          >
        </div>
      </div>
      <button
        class="btn btn-sm btn-secondary ml-4"
        type="button"
        title="Show consensus topology information"
        @click="showInfo"
      >
        <BIconInfoCircle class="text-muted" />
      </button>
    </div>

    <div class="card-body content h-100">
      <ul class="nav nav-tabs mb-3">
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'quorums' }"
            href="#"
            @click.prevent="activeTab = 'quorums'"
          >
            <span>Quorums</span>
            <BIconInfoCircle
              v-tooltip.top="'A quorum contains a slice for each node'"
              class="info-icon text-secondary"
            />
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === 'quorum-intersections' }"
            href="#"
            @click.prevent="activeTab = 'quorum-intersections'"
          >
            <span>Quorum Intersections</span>
            <BIconInfoCircle
              v-tooltip.top="'Overlapping nodes between different quorums'"
              class="info-icon text-secondary"
            />
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: activeTab === 'quorum-slices',
              disabled: !selectedNodeId,
            }"
            href="#"
            @click.prevent="selectedNodeId && (activeTab = 'quorum-slices')"
          >
            <span>Quorum Slices</span>
            <BIconInfoCircle
              v-tooltip.top="'Combinations of nodes the selected node trusts'"
              class="info-icon text-secondary"
            />
          </a>
        </li>
        <li class="nav-item">
          <a
            class="nav-link"
            :class="{
              active: activeTab === 'vblocking-sets',
              disabled: !selectedNodeId,
            }"
            href="#"
            @click.prevent="selectedNodeId && (activeTab = 'vblocking-sets')"
          >
            <span>V-Blocking Sets</span>
            <BIconInfoCircle
              v-tooltip.top="
                'Sets of nodes that can block the selected node from making progress'
              "
              class="info-icon text-secondary"
            />
          </a>
        </li>
      </ul>

      <div class="tab-content">
        <div
          v-if="activeTab === 'quorums'"
          class="tab-pane fade"
          :class="{ 'show active': activeTab === 'quorums' }"
        >
          <QuorumsTab />
        </div>

        <div
          v-if="activeTab === 'quorum-intersections'"
          class="tab-pane fade"
          :class="{ 'show active': activeTab === 'quorum-intersections' }"
        >
          <QuorumIntersections />
        </div>

        <div
          v-if="activeTab === 'quorum-slices' && selectedNodeId"
          class="tab-pane fade"
          :class="{
            'show active': activeTab === 'quorum-slices' && selectedNodeId,
          }"
        >
          <QuorumSlicesTab :selected-node-id="selectedNodeId" />
        </div>

        <div
          v-if="activeTab === 'vblocking-sets' && selectedNodeId"
          class="tab-pane fade"
          :class="{
            'show active': activeTab === 'vblocking-sets' && selectedNodeId,
          }"
        >
          <VBlockingSetsTab :selected-node-id="selectedNodeId" />
        </div>

        <div
          v-show="
            (activeTab === 'quorum-slices' || activeTab === 'vblocking-sets') &&
            !selectedNodeId
          "
          class="tab-pane fade show active"
        >
          <div class="node-selection-placeholder">
            <div class="placeholder-content">
              <BIconPerson class="placeholder-icon" />
              <p>
                Please select a node to view
                {{
                  activeTab === "quorum-slices"
                    ? "quorum slices"
                    : "v-blocking sets"
                }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import BreadCrumbs from "../bread-crumbs.vue";
import { BIconInfoCircle, BIconPerson } from "bootstrap-vue";
import QuorumsTab from "./quorums.vue";
import QuorumSlicesTab from "./quorum-slices.vue";
import VBlockingSetsTab from "./v-blocking-sets.vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import ConsensusTopologyInfo from "./consensus-topology-info.vue";
import QuorumIntersections from "./quorum-intersections.vue";

// Tab management
const activeTab = ref("quorums");

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function showInfo() {
  infoBoxStore.show(ConsensusTopologyInfo);
}

// Watch for changes in selectedNodeId and reset to quorums tab if node is unselected
watch(
  () => selectedNodeId.value,
  (newValue) => {
    if (!newValue) {
      activeTab.value = "quorums";
    }
  },
);
</script>

<style scoped>
.content {
  overflow-y: auto;
  max-height: 100%;
  padding: 1rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
}

/* Tab styling - replaces pills styling */
.nav-tabs {
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 1rem;
}

.nav-tabs .nav-item {
  margin-bottom: -1px;
  padding: 0 0.6rem;
}

.nav-tabs .nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem;
  border: 1px solid transparent;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  color: #495057;
  background-color: transparent;
  cursor: pointer;
}

.nav-tabs .nav-link:hover {
  color: #1d8ab4;
  border-color: #fff;
  text-decoration: none;
}

.nav-tabs .nav-link.active {
  color: #1d8ab4;
  background-color: #fff;
  border-color: #dee2e6 #dee2e6 #fff;
}

.nav-tabs .nav-link.disabled {
  color: #6c757d;
  pointer-events: none;
  cursor: not-allowed;
}

.info-icon {
  margin-left: 5px;
  font-size: 0.8em;
}

.node-selection-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px dashed #dee2e6;
}

.placeholder-content {
  text-align: center;
  color: #6c757d;
}

.placeholder-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* For tab transitions */
.tab-pane {
  transition: opacity 0.15s linear;
  opacity: 0;
}

.tab-pane.show {
  opacity: 1;
}
.consensus-topology-header {
  display: flex;
  align-items: center;
}
.card-header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
