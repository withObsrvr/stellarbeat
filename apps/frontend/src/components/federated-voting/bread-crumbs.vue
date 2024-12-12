<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <a href="#" @click.prevent="unselectNode">FBAS</a>
      </li>
      <li
        v-if="selectedNodeId"
        class="breadcrumb-item active"
        aria-current="page"
      >
        {{ selectedNodeId }}
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);

function unselectNode() {
  federatedVotingStore.selectedNodeId = null;
}
</script>

<style scoped>
.breadcrumb {
  background-color: transparent;
  padding: 0;
  margin-bottom: 0;
}
.breadcrumb-item + .breadcrumb-item::before {
  content: ">";
  padding: 0 5px;
}
</style>
