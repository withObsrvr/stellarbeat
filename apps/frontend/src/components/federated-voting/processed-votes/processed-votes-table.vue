<template>
  <div class="table-view">
    <table class="connections-table">
      <thead>
        <tr>
          <th>Node</th>
          <th>Votes</th>
          <th>Votes to Accept</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in paginatedTableData" :key="row.nodeId">
          <td class="processing-node">
            <FbasNodeBadge
              :node-id="row.nodeId"
              :visualize-phase="true"
              :show-vote="true"
              @select="selectNodeId"
            />
          </td>
          <td>
            <div class="node-list">
              <FbasNodeBadge
                v-for="voterId in row.processedVotes"
                :key="`vote-${voterId}`"
                :node-id="voterId"
                @select="selectNodeId"
              />
              <span
                v-if="row.processedVotes.length === 0"
                class="placeholder-text"
              >
                No votes processed
              </span>
            </div>
          </td>
          <td>
            <div class="node-list">
              <FbasNodeBadge
                v-for="voterId in row.processedAcceptVotes"
                :key="`accept-${voterId}`"
                :node-id="voterId"
                @select="selectNodeId"
              />
              <span
                v-if="row.processedAcceptVotes.length === 0"
                class="placeholder-text"
              >
                No accept votes processed
              </span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        class="btn btn-sm btn-secondary"
        :disabled="currentPage === 1"
        @click="previousPage"
      >
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button
        class="btn btn-sm btn-secondary"
        :disabled="currentPage === totalPages"
        @click="nextPage"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import FbasNodeBadge from "../fbas-node-badge.vue";

const props = defineProps<{
  statement: string;
}>();

const emit = defineEmits<{
  (e: "select-node", nodeId: string): void;
}>();

const currentPage = ref(1);
const itemsPerPage = 4;

function getTableDataForStatement(statement: string) {
  return federatedVotingStore.nodes
    .filter((node) =>
      node.processedVotes.some(
        (vote) => vote.statement.toString() === statement,
      ),
    )
    .sort((a, b) => a.publicKey.localeCompare(b.publicKey))
    .map((node) => {
      const processedVotes = node.processedVotes
        .filter(
          (vote) =>
            vote.statement.toString() === statement && !vote.isVoteToAccept,
        )
        .map((vote) => vote.publicKey);

      const processedAcceptVotes = node.processedVotes
        .filter(
          (vote) =>
            vote.statement.toString() === statement && vote.isVoteToAccept,
        )
        .map((vote) => vote.publicKey);

      return {
        nodeId: node.publicKey,
        processedVotes,
        processedAcceptVotes,
      };
    });
}

const tableData = computed(() => {
  return getTableDataForStatement(props.statement);
});

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return tableData.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() =>
  Math.ceil(tableData.value.length / itemsPerPage),
);

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function selectNodeId(nodeId: string) {
  emit("select-node", nodeId);
}

watch(
  () => props.statement,
  () => {
    currentPage.value = 1;
  },
);
</script>

<style scoped>
.connections-table {
  width: 100%;
  border-collapse: collapse;
}

.connections-table th,
.connections-table td {
  padding: 8px;
  border: 1px solid #ddd;
}

.connections-table th {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: left;
}

.node-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.placeholder-text {
  color: #6c757d;
  font-style: italic;
  display: block;
  padding: 4px 0;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.pagination button {
  padding: 4px 8px;
}

.table-view {
  margin-bottom: 10px;
}
.processing-node {
  min-width: 120px;
}
</style>
