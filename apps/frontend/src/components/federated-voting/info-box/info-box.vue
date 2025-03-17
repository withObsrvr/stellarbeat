<template>
  <BModal
    v-model="isOpen"
    size="lg"
    ok-only
    hide-header
    @hide="infoBoxStore.hide()"
  >
    <component
      :is="infoBoxStore.state.component"
      v-if="infoBoxStore.state.component"
    />
  </BModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { infoBoxStore } from "./useInfoBoxStore";
import { BModal } from "bootstrap-vue";

const isOpen = computed({
  get: () => infoBoxStore.state.isOpen,
  set: () => infoBoxStore.hide(),
});
</script>
