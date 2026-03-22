<template>
  <div
    class="sb-nav-title"
    :class="(hasDanger && completeDanger ? 'sb-danger ' : '') + classes"
  >
    {{ title }}
    <svg
      v-if="hasDanger"
      v-tooltip:top="danger"
      class="sb-danger mr-1 inline h-3.5 w-3.5"
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
    <svg
      v-else-if="hasWarnings"
      v-tooltip:top="warnings"
      class="sb-alert mr-1 inline h-3.5 w-3.5"
      fill="none" viewBox="0 0 24 24" stroke="currentColor"
    ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
  </div>
</template>
<script setup lang="ts">
defineProps({
  title: { type: String, default: "" },
  hasWarnings: { type: Boolean, default: false },
  warnings: { type: String, default: "" },
  hasDanger: { type: Boolean, default: false },
  danger: { type: String, default: "" },
  completeDanger: { type: Boolean, default: true },
  classes: { type: String, default: "" },
});
</script>

<style scoped>
.sb-nav-title {
  padding-top: 2px;
}

.sb-danger {
  color: #cd201f;
}

.sb-alert {
  color: #fec601;
}

.secondary {
  font-size: 14px;
}

.m-height {
  min-height: 26px;
}
</style>
