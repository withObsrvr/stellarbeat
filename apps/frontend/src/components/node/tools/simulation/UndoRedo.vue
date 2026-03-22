<template>
  <div class="inline-flex rounded-lg shadow-sm undo-redo" role="group" aria-label="UndoRedo">
    <div v-tooltip:bottom="'Undo change'">
      <button
        type="button"
        class="rounded-l-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        :disabled="!store.hasUndo"
        @click="onUndoUpdate"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
      </button>
    </div>
    <button
      type="button"
      class="border-y border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      :disabled="!store.hasUndo"
      @click="onReset"
    >
      Reset simulation
    </button>
    <div v-tooltip:bottom="'Redo change'">
      <button
        type="button"
        class="rounded-r-lg border border-gray-200 bg-white px-2 py-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        :disabled="!store.hasRedo"
        @click="onRedoUpdate"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";

const store = useStore();
const router = useRouter();
const route = useRoute();

function onUndoUpdate() {
  store.undoUpdate();
  resetRouteIfNoSelectedNode();
}

function onRedoUpdate() {
  store.redoUpdate();
}

function onReset() {
  store.resetUpdates();
  resetRouteIfNoSelectedNode();
}

function resetRouteIfNoSelectedNode() {
  if (
    store.selectedNode &&
    !store.network.getNodeByPublicKey(store.selectedNode.publicKey)
  ) {
    router.push({
      name: "network-dashboard",
      query: {
        "no-scroll": "1",
        network: route.query.network,
        view: route.query.view,
        at: route.query.at,
      },
    });
  }
}
</script>

<style scoped>
.undo-redo {
  opacity: 0.75;
}
</style>
