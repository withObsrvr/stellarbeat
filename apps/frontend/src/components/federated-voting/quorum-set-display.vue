<template>
  <div class="quorum-set">
    <div v-if="quorumSet">
      <p><strong>Threshold:</strong> {{ quorumSet.threshold }}</p>
      <p><strong>Validators:</strong></p>
      <ul>
        <li v-for="(validator, index) in quorumSet.validators" :key="index">
          {{ validator }}
        </li>
      </ul>
      <div
        v-if="
          quorumSet.innerQuorumSets &&
          quorumSet.innerQuorumSets.length > 0 &&
          level < 3
        "
        class="inner-quorum-sets"
      >
        <p><strong>Inner Quorum Sets:</strong></p>
        <div
          v-for="(innerSet, index) in quorumSet.innerQuorumSets"
          :key="index"
          class="ml-3"
        >
          <quorum-set-display :quorum-set="innerSet" :level="level + 1" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { QuorumSet } from "scp-simulation";

defineProps<{
  quorumSet: QuorumSet | null;
  level: number;
}>();
</script>

<style scoped>
.quorum-set {
  margin-bottom: 1rem;
}

.ml-3 {
  margin-left: 1rem;
}

.inner-quorum-sets {
  margin-top: 1rem;
}
</style>
