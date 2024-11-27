<template>
  <div class="card graph">
    <div class="card-body pt-4 pb-0">
      <div
        class="d-flex justify-content-around align-items-baseline border-bottom pt-0 pb-4"
      >
        <div class="title mb-0 pb-0">Trust Graph</div>
      </div>
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
        :propagation-enabled="true"
        @vertex-selected="handleVertexSelected"
      />
    </div>
    <div class="card-footer footer"></div>
  </div>
</template>
<script setup lang="ts">
import Graph from "@/components/visual-navigator/graph/graph.vue";
import ViewGraph from "@/components/visual-navigator/graph/view-graph";
import ViewVertex from "@/components/visual-navigator/graph/view-vertex";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { Network, TrustGraph } from "shared";
import { ref, onMounted } from "vue";

const viewGraph = ref<ViewGraph>(new ViewGraph());
const selectedVertices = ref<ViewVertex[]>([]);

const trustGraph = federatedVotingStore.network.nodesTrustGraph;

onMounted(() => {
  viewGraph.value = ViewGraph.fromNodes(
    federatedVotingStore.network as Network,
    trustGraph as TrustGraph,
    viewGraph.value,
  );
});

const handleVertexSelected = (vertex: ViewVertex) => {
  selectedVertices.value = [vertex];
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
