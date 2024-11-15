<template>
  <div class="card">
    <div class="card-title pt-2 pb-2">
      <div
        class="d-flex justify-content-start align-items-baseline border-bottom"
      >
        <div class="title mb-0 pb-0">
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb mb-0 bg-transparent">
              <li class="breadcrumb-item">
                <a href="#" @click.prevent="clearSelectedNode">Nodes</a>
              </li>
              <li
                v-if="federatedVotingStore.selectedNodeId"
                class="breadcrumb-item active"
                aria-current="page"
              >
                {{
                  federatedVotingStore.network.getNodeByPublicKey(
                    federatedVotingStore.selectedNodeId,
                  ).displayName
                }}
              </li>
            </ol>
          </nav>
        </div>
      </div>
      <ul class="list-group list-group-flush">
        <li
          v-for="node in mockupNodes"
          :key="node.id"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          {{ node.name }}
          <button class="btn btn-primary btn-sm" @click="vote(node)">
            Vote
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { ref } from "vue";
const mockupNodes = ref([
  { id: 1, name: "Node 1" },
  { id: 2, name: "Node 2" },
  { id: 3, name: "Node 3" },
]);
function vote(node) {
  console.log(node);
}
function clearSelectedNode() {
  federatedVotingStore.selectedNodeId = null;
}
</script>
