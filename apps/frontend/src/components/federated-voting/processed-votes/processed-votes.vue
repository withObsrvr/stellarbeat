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
        <div v-if="processedVotesByStatement.length === 0">
          <div class="content-container">
            <p>No votes processed yet</p>
          </div>
        </div>
        <div v-else class="content-container">
          <ul class="nav nav-tabs mb-3">
            <li
              v-for="(statementGroup, index) in processedVotesByStatement"
              :key="`tab-${index}`"
              class="nav-item"
            >
              <a
                class="nav-link"
                :class="{ active: activeTab === index }"
                href="#"
                @click.prevent="activeTab = index"
              >
                <span class="statement-tab"
                  >{{ statementGroup.statement }}
                </span>
              </a>
            </li>
          </ul>

          <div class="tab-content">
            <div
              v-for="(statementGroup, index) in processedVotesByStatement"
              :key="`content-${index}`"
              class="tab-pane fade"
              :class="{ 'show active': activeTab === index }"
            >
              <div class="voter-groups">
                <div class="voter-group">
                  <strong>Votes</strong>
                  <div class="voter-list">
                    <FbasNodeBadge
                      v-for="(publicKey, idx) in statementGroup.votes"
                      :key="`vote-${idx}`"
                      :node-id="publicKey"
                      @select="selectNodeId"
                    />
                  </div>
                </div>

                <div class="voter-group">
                  <strong>Votes to Accept</strong>
                  <div class="voter-list">
                    <FbasNodeBadge
                      v-for="(publicKey, idx) in statementGroup.votesToAccept"
                      :key="`accept-${idx}`"
                      :node-id="publicKey"
                      :visualize-phase="true"
                      @select="selectNodeId"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="events-section">
        <h5>Events</h5>
        <ProcessedVotesNodeEvents
          class="events-component"
          :selected-node-id="selectedNodeId ?? undefined"
          @statement-selected="selectTabByStatement"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import BreadCrumbs from "../bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";
import ProcessedVotesNodeEvents from "./processed-votes-node-events.vue";
import { BIconInfoCircle } from "bootstrap-vue";
import { infoBoxStore } from "../info-box/useInfoBoxStore";
import ProcessedVotesInfo from "./processed-votes-info.vue";

const activeTab = ref(0);
const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function showInfo() {
  infoBoxStore.show(ProcessedVotesInfo);
}

function selectNodeId(nodeId: string) {
  federatedVotingStore.selectedNodeId = nodeId;
}

function selectTabByStatement(statement: string) {
  const tabIndex = processedVotesByStatement.value.findIndex(
    (group) => group.statement === statement,
  );

  if (tabIndex >= 0) {
    activeTab.value = tabIndex;
  }
}

const processedVotesByStatement = computed(() => {
  const votes = federatedVotingStore.nodes
    .filter((node) =>
      selectedNodeId.value ? node.publicKey === selectedNodeId.value : true,
    )
    .flatMap((node) => node.processedVotes);

  const grouped = votes.reduce(
    (acc, vote) => {
      let group = acc.find((g) => g.statement === vote.statement);
      if (!group) {
        group = {
          statement: vote.statement.toString(),
          votesToAccept: new Set<string>(),
          votes: new Set<string>(),
        };
        acc.push(group);
      }
      if (vote.isVoteToAccept) {
        group.votesToAccept.add(vote.publicKey);
      } else {
        group.votes.add(vote.publicKey);
      }
      return acc;
    },
    [] as Array<{
      statement: string;
      votesToAccept: Set<string>;
      votes: Set<string>;
    }>,
  );

  return grouped
    .map((group) => ({
      statement: group.statement,
      votesToAccept: Array.from(group.votesToAccept).sort(),
      votes: Array.from(group.votes).sort(),
    }))
    .sort((a, b) => a.statement.localeCompare(b.statement));
});
</script>

<style scoped>
.my-body {
  height: 100%;
  padding: 0 1rem;
}
.processed-votes {
  display: flex;
  flex-direction: column;
  height: 200px;
  border-bottom: 1px solid #dee2e6;
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

.events-section {
  height: 180px;
  flex-shrink: 0;
}

.events-component {
  height: 100%;
  overflow-y: auto;
}

.voter-groups {
  display: flex;
}

.voter-group {
  flex: 1;
  position: relative;
  padding-right: 15px;
}

.voter-group strong {
  display: block;
  margin-bottom: 4px;
  font-size: 1em;
  font-weight: bold;
}

.voter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.processed-votes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
