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
import { BIconInfoCircle } from '@/components/bootstrap-compat';

defineEmits(["click"]);
</script>

<style scoped>
.info {
  align-self: center;
}
</style>
