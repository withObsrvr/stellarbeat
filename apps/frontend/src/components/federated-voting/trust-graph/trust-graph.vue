<template>
  <div class="card graph">
    <div class="card-header">
      <h4 class="card-title">Trust Graph</h4>
    </div>
    <div class="card-body pt-4 pb-0">
      <Graph
        ref="graph"
        :selected-vertices="selectedVertices"
        style="height: 400px"
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
    <!--div class="card-footer footer"></div!-->
  </div>
</template>
<script setup lang="ts">
import Graph from "@/components/visual-navigator/graph/graph.vue";
import ViewGraph from "@/components/visual-navigator/graph/view-graph";
import ViewVertex from "@/components/visual-navigator/graph/view-vertex";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { ref, onMounted, watch, computed } from "vue";
import { TrustGraphBuilder } from "./TrustGraphBuilder";
import { FederatedVotingProtocolState } from "scp-simulation";

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

const trustGraph = () => {
  return TrustGraphBuilder.buildTrustGraph(
    federatedVotingStore.protocolContextState
      .protocolStates as FederatedVotingProtocolState[],
  );
};

watch(federatedVotingStore.protocolContextState, () => {
  viewGraph.value = ViewGraph.fromNodes(trustGraph(), viewGraph.value);
});

onMounted(() => {
  viewGraph.value = ViewGraph.fromNodes(trustGraph(), viewGraph.value);
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
</style>
