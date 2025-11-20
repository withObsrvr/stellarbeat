<template>
  <div v-if="totalRows > 10" class="sb-nav-pagination">
    <b-pagination
      size="sm"
      :model-value="modelValue"
      :total-rows="totalRows"
      :per-page="10"
      first-number
      last-number
      align="left"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>
<script setup lang="ts">
import { BPagination } from '@/components/bootstrap-compat';

defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  totalRows: {
    type: Number,
    required: true,
  },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.sb-nav-pagination {
  margin-top: 1px;
  margin-left: 20px;
}
</style>
