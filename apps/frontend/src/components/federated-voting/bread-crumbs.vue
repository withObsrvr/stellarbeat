<template>
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <a href="#" @click.prevent="unselectNode">{{ root }}</a>
      </li>
      <li
        v-if="selectedNodeId"
        class="breadcrumb-item active"
        aria-current="page"
      >
        View of {{ selectedNodeId }}
        <span
          v-tooltip="'Return to System view'"
          class="btn btn-sm btn-secondary"
        >
          <BIconArrowCounterclockwise @click="unselectNode" />
        </span>
      </li>
      <li v-else class="breadcrumb-item active" aria-current="page">
        View of System
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { BIconArrowCounterclockwise, BIconX } from '@/components/bootstrap-compat';

withDefaults(
  defineProps<{
    root?: string;
  }>(),
  {
    root: "FBAS",
  },
);

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
  min-height: 31px; /* Match the height of breadcrumb when button is shown */
  display: flex;
  align-items: center;
}

.breadcrumb-item {
  padding-left: 0px;
  display: flex;
  align-items: center;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: ">";
  padding-left: 4px;
  padding-right: 4px;
}

.active {
  color: #6c757d;
  text-decoration: none;
  cursor: default;
}

/* Ensure button doesn't change overall height */
.btn-sm {
  margin: -3px 0 -3px 8px;
  vertical-align: middle;
}
</style>
