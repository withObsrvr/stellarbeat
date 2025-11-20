<template>
  <div class="card">
    <div class="card-header processed-votes-header">
      <BreadCrumbs root="Processed Votes" />
      <button
        class="btn btn-sm btn-secondary ml-3"
        type="button"
        title="Show processed votes information"
        @click="showInfo"
      >
        <BIconInfoCircle class="text-muted" />
      </button>
    </div>
    <div class="card-body my-body">
      <div class="processed-votes mb-4">
        <div class="content-container">
          <div v-if="selectedNodeId" class="mb-2 events-section">
            <ProcessedVotesNodeEvents
              class="events-component"
              :selected-node-id="
                federatedVotingStore.selectedNodeId ?? undefined
              "
            />
          </div>

          <ul class="nav nav-tabs mb-3">
            <li
              v-for="(statement, index) in fixedStatements"
              :key="`tab-${index}`"
              class="nav-item"
            >
              <a
                class="nav-link"
                :class="{ active: activeTab === index }"
                href="#"
                @click.prevent="activeTab = index"
              >
                <span class="statement-tab">{{ statement }}</span>
              </a>
            </li>
          </ul>

          <div class="tab-content">
            <div
              v-for="(statement, index) in fixedStatements"
              :key="`content-${index}`"
              class="tab-pane fade"
              :class="{ 'show active': activeTab === index }"
            >
              <ProcessedVotesTable
                v-if="!selectedNodeId"
                :statement="statement"
                @select-node="selectNodeId"
              />

              <ProcessedVotesForNode
                v-else
                :statement="statement"
                @select-node="selectNodeId"
                @statement-selected="handleStatementSelected"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import BreadCrumbs from "../bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { BIconInfoCircle } from '@/components/bootstrap-compat';
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import ProcessedVotesInfo from "./processed-votes-info.vue";
import ProcessedVotesTable from "./processed-votes-table.vue";
import ProcessedVotesForNode from "./processed-votes-for-node.vue";
import ProcessedVotesNodeEvents from "./processed-votes-node-events.vue";

const fixedStatements = ["Burger", "Pizza", "Salad"];
const activeTab = ref(0);
const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function showInfo() {
  infoBoxStore.show(ProcessedVotesInfo);
}

function selectNodeId(nodeId: string) {
  federatedVotingStore.selectedNodeId = nodeId;
}

function handleStatementSelected(statement: string) {
  const tabIndex = fixedStatements.indexOf(statement);
  if (tabIndex !== -1) {
    activeTab.value = tabIndex;
  }
}
</script>

<style scoped>
.my-body {
  height: 100%;
  padding: 0 1rem;
}

.processed-votes {
  display: flex;
  flex-direction: column;
}

.content-container {
  display: flex;
  flex-direction: column;
}

.nav-tabs {
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.nav-tabs .nav-item {
  margin-bottom: -1px;
}

.nav-tabs .nav-link {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
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

/* Statement title and tabs */
.statement-tab {
  white-space: nowrap;
  font-size: 0.9em;
}

.statement-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 1rem;
}

/* Tab pane transitions */
.tab-pane {
  transition: opacity 0.15s linear;
  opacity: 0;
}

.tab-pane.show {
  opacity: 1;
}

.tab-content {
  margin-bottom: 1rem;
}

.processed-votes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
