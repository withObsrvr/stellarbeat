<template>
  <div>
    <div class="page-header d-flex justify-content-between py-3">
      <div class="d-flex align-items-center">
        <h2 class="page-title">Federated Voting</h2>
      </div>
      <div>
        <scenario-selector />
      </div>
    </div>
    <div class="row">
      <div class="col-md-12">
        <simulation-control class="card-spacing" />
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
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
          <div class="card-footer pt-0 footer"></div>
        </div>
      </div>
      <div class="col-md-6">
        <overlay-graph-base class="card-spacing" />
      </div>
    </div>
    <div class="row">
      <div class="col-md-6"><nodes-panel></nodes-panel></div>
      <div class="col-md-6">
        <div class="card mt-2">
          <div
            class="card-header d-flex justify-content-between align-items-center"
          >
            <h5 class="card-title mb-0">Next Events</h5>
            <input
              v-model="filterQuery"
              type="text"
              class="form-control form-control-sm"
              placeholder="Search events"
              style="width: 150px; height: 30px; font-size: 12px"
            />
          </div>
          <div
            class="card-body p-0"
            style="max-height: 150px; overflow-y: auto"
          >
            <ul class="list-group list-group-flush mb-0">
              <li
                v-for="(event, index) in filteredEvents"
                :key="index"
                class="list-group-item d-flex justify-content-between align-items-center py-1"
              >
                {{ event }}
                <button
                  class="btn btn-danger btn-sm"
                  @click="disruptEvent(index)"
                >
                  Disrupt
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <!-- Nodes List -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import NodesPanel from "@/components/federated-voting/nodes-panel.vue";
import ScenarioSelector from "@/components/federated-voting/scenario-selector.vue";
import SimulationControl from "@/components/federated-voting/simulation-control.vue";
import OverlayGraphBase from "@/components/federated-voting/overlay-graph-base.vue";
import Graph from "@/components/visual-navigator/graph/graph.vue";
import ViewGraph from "@/components/visual-navigator/graph/view-graph";
import { Network, TrustGraph } from "shared";
import ViewVertex from "@/components/visual-navigator/graph/view-vertex";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

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
const events = ref([
  "Node 1 sends message: Vote(pizza)",
  "Node 2 sends message: Vote(pasta)",
  "Node 3 sends message: Vote(sushi)",
  "Node 4 sends message: Vote(burger)",
  "Node 5 sends message: Vote(salad)",
]);

const filterQuery = ref("");

const filteredEvents = computed(() => {
  if (!filterQuery.value) {
    return events.value;
  }
  return events.value.filter((event) =>
    event.toLowerCase().includes(filterQuery.value.toLowerCase()),
  );
});

function disruptEvent(index: number) {
  // Handle event disruption
  console.log(`Disrupted: ${events.value[index]}`);
  // Implement disruption logic
}
</script>

<style scoped>
.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}
.card-spacing {
  margin-bottom: 10px;
}
.footer {
  height: 60px;
}
</style>
