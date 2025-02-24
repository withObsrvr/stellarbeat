<template>
  <button
    class="btn btn-sm btn-secondary info"
    type="button"
    title="Show help"
    @click="$emit('click')"
  >
    <BIconInfoCircle class="text-muted" />
  </button>
</template>

<script setup lang="ts">
import { BIconInfoCircle } from "bootstrap-vue";

defineEmits(["click"]);
</script>

<style scoped>
.info {
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 32px;
}

.text-muted {
  width: 16px;
  height: 16px;
}
</style>
