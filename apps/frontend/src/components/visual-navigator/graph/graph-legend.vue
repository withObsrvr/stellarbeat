<template>
  <div
    class="d-flex flex-column align-items-start justify-content-start legend"
  >
    <div class="legend-link mr-2">
      <a v-show="!showLegend" href="#" @click.prevent.stop="showLegend = true"
        >Legend</a
      >
      <a v-show="showLegend" href="#" @click.prevent.stop="showLegend = false"
        >Legend</a
      >
    </div>
    <div v-if="showLegend" class="d-flex flex-wrap quorum-graph-legend">
      <div class="d-flex align-items-center">
        <div class="element selected-node m-2"></div>
        <div>Selected</div>
      </div>

      <div class="d-flex align-items-center">
        <div class="element active-node m-2"></div>
        <div>Validating</div>
      </div>

      <div class="d-flex align-items-center">
        <div class="element failing-node m-2"></div>
        <div>Failing</div>
      </div>

      <div class="d-flex align-items-center">
        <div class="element incoming-connection m-2"></div>
        <div>Incoming Link</div>
      </div>

      <div class="d-flex align-items-center">
        <div class="element outgoing-connection m-2"></div>
        <div>Outgoing Link</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const showLegend = ref(false);
</script>

<style scoped>
div {
  color: #797979;
}

.quorum-graph-legend .element {
  color: white;
  border-radius: 50px;
  width: 10px;
  height: 10px;
}

.quorum-graph-legend .connection {
  background: #1997c6;
}

.quorum-graph-legend .incoming-connection {
  background: #73bfb8;
}

.quorum-graph-legend .outgoing-connection {
  background: #fec601;
}

.quorum-graph-legend .active-node {
  background: #1687b2;
}

.quorum-graph-legend .selected-node {
  background: #f1c40f;
}

.quorum-graph-legend .inactive-node {
  background: #f8f9fa;
}

.quorum-graph-legend .failing-node {
  background: #cd201f;
}

.legend-link {
  font-size: 0.8rem;
}
</style>
