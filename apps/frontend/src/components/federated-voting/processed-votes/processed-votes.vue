<template>
  <div class="card">
    <div class="card-header">
      <BreadCrumbs root="Processed Votes" />
    </div>
    <div class="card-body processed-votes h-100">
      <div v-if="processedVotesByStatement.length === 0">
        <p>No votes processed yet</p>
      </div>
      <div v-else class="row h-100">
        <div class="statements-section col-lg-6 col-md-12 col-sm-12">
          <div
            v-for="(statementGroup, index) in processedVotesByStatement"
            :key="index"
            class="statement-group"
          >
            <h5 class="statement-title">
              Statement: {{ statementGroup.statement }}
            </h5>
            <div class="voter-groups">
              <!-- Regular votes column -->
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
                    @select="selectNodeId"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="events-section col-lg-6 col-md-12 col-sm-12 h-100">
          <ProcessedVotesNodeEvents
            class="events-component"
            :selected-node-id="selectedNodeId ?? undefined"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import BreadCrumbs from "../bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";
import ProcessedVotesNodeEvents from "./processed-votes-node-events.vue";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function selectNodeId(nodeId: string) {
  federatedVotingStore.selectedNodeId = nodeId;
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
.processed-votes {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.content-container {
  max-height: 100px;
}

.statements-section {
  overflow-y: auto;
  max-width: none;
  padding-right: 5px;
}

.events-section {
  height: 100%;
  width: 100%;
}

.events-divider-vertical {
  width: 1px;
  background-color: #dee2e6;
  margin: 0 5px;
}

.statement-group {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.statement-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.statement-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 6px;
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

.section-title {
  font-size: 1.1em;
  font-weight: bold;
  margin-bottom: 15px;
}

.event-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.empty-events {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #6c757d;
  font-style: italic;
  font-size: 0.9em;
}
</style>
