<template>
  <div class="card">
    <div class="card-header">
      <BreadCrumbs root="Processed Votes" />
    </div>
    <div class="card-body processed-votes">
      <div v-if="processedVotesByStatement.length === 0">
        <p>No votes processed yet</p>
      </div>
      <div
        v-for="(statementGroup, index) in processedVotesByStatement"
        :key="index"
        class="statement-group"
      >
        <h5 class="statement-title">
          Statement: {{ statementGroup.statement }}
        </h5>
        <div class="voter-groups">
          <div class="voter-group">
            <strong>Votes:</strong>
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
            <strong>Votes to Accept:</strong>
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
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import BreadCrumbs from "../bread-crumbs.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";

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
  gap: 16px;
}
.statement-group {
  margin-bottom: 16px;
}
.statement-title {
  font-size: 1.2em;
  font-weight: bold;
  margin-bottom: 8px;
}
.voter-groups {
  display: flex;
  gap: 24px;
}
.voter-group {
  flex: 1;
}
.voter-group strong {
  display: block;
  margin-bottom: 6px;
  font-size: 1em;
  font-weight: bold;
}
.voter-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
