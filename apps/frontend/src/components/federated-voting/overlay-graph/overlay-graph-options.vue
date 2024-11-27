<template>
  <div
    id="overlay-graph-options"
    class="d-flex justify-content-around align-items-baseline"
  >
    <div class="d-flex align-items-center">
      <label for="repelling-force" class="repelling-force-label mb-0 pb-0 mr-1"
        >Size
      </label>
      <input
        id="repelling-force"
        v-model="repellingForce"
        type="range"
        min="100"
        max="10000"
        @change="$emit('updateRepellingForce', repellingForce)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { isString } from "shared";
import { isNumber } from "chart.js/helpers";
import { ref, toRefs, watch } from "vue";

const props = defineProps<{
  initialRepellingForce: number;
}>();

const { initialRepellingForce } = toRefs(props);
const repellingForce = ref(initialRepellingForce.value);

const emit = defineEmits({
  updateRepellingForce: (repellingForce: number) => {
    return isNumber(repellingForce);
  },
});
</script>
<style scoped>
.graph-topology-label {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.repelling-force-label {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.title {
  color: #333;
  font-size: 24px;
  font-weight: bold;
}

.graph-topology-label {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}

.repelling-force-label {
  color: #333;
  font-size: 16px;
  font-weight: bold;
}
</style>
