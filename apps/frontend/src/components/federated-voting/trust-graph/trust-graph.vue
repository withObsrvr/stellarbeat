<template>
  <div class="card graph">
    <div class="card-header">
      <h4 class="card-title">Trust Graph</h4>
    </div>
    <div class="card-body pt-4 pb-0">
      <Graph
        ref="graph"
        :selected-vertices="selectedVertices"
        style="height: 250px"
        :full-screen="false"
        :view-graph="viewGraph"
        :is-loading="false"
        :option-show-failing-edges="true"
        :option-highlight-trusting-nodes="true"
        :option-highlight-trusted-nodes="true"
        :option-show-regular-edges="true"
        :option-transitive-quorum-set-only="false"
        :zoom-enabled="false"
        :initial-zoom="2"
        :propagation-enabled="false"
        @vertex-selected="handleVertexSelected"
      />
    </div>
    <div class="card-footer footer">
      <div v-if="selectedVertices.length > 0" class="legend">
        <span class="legend-item">
          <span class="legend-color incoming"></span> Incoming Connection
        </span>
        <span class="legend-item">
          <span class="legend-color outgoing"></span> Outgoing Connection
        </span>
      </div>
      <div v-else class="legend">
        <span class="legend-item">
          <span class="legend-circle active-node"></span> Active
        </span>
        <span class="legend-item">
          <span class="legend-color transitive-quorum-set-node"></span>
          Transitive Quorum Set
        </span>
        <span class="legend-item">
          <span class="legend-color strongly-connected-node"></span> Strongly
          Connected
        </span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import Graph from "@/components/visual-navigator/graph/graph.vue";
import ViewGraph from "@/components/visual-navigator/graph/view-graph";
import ViewVertex from "@/components/visual-navigator/graph/view-vertex";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { TrustGraph } from "shared";
import { ref, onMounted, watch, computed } from "vue";

const viewGraph = ref<ViewGraph>(new ViewGraph());
const selectedVertices = computed(() => {
  if (!federatedVotingStore.selectedNodeId) {
    return [];
  }
  const vertex = viewGraph.value.viewVertices.get(
    federatedVotingStore.selectedNodeId,
  );
  return vertex ? [vertex] : [];
});

onMounted(() => {
  viewGraph.value = ViewGraph.fromNodes(
    federatedVotingStore.trustGraph as TrustGraph,
    viewGraph.value,
  );
});

const handleVertexSelected = (vertex: ViewVertex) => {
  federatedVotingStore.selectedNodeId = vertex.key;
};
</script>

<style scoped>
.footer {
  height: 60px;
}
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}
.legend {
  display: flex;
  justify-content: center;
  align-items: center;
}

.legend-item {
  margin: 0 10px;
  display: flex;
  align-items: center;
}

.legend-color {
  width: 20px;
  height: 10px;
  display: inline-block;
  margin-right: 5px;
}

.legend-color.incoming {
  background-color: #73bfb8;
}

.legend-color.outgoing {
  background-color: #fec601;
}
.legend-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.legend-circle.active-node {
  background-color: #1687b2;
}

.legend-color.transitive-quorum-set-node {
  background-color: #1687b2;
  opacity: 0.25;
}

.legend-color.strongly-connected-node {
  border: 4px solid #1687b2;
  opacity: 0.25;
  background-color: transparent;
}
</style>
