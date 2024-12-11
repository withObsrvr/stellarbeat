<template>
  <circle :cx="startX" :cy="startY" r="6" fill="#f1c40f">
    <animate
      ref="animateX"
      attributeName="cx"
      :from="startX"
      :to="endX"
      :dur="duration + 's'"
      fill="freeze"
    />
    <animate
      ref="animateY"
      attributeName="cy"
      :from="startY"
      :to="endY"
      :dur="duration + 's'"
      fill="freeze"
      @endEvent="emitAnimationEnd"
    />
  </circle>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, onMounted, ref } from "vue";

const props = defineProps<{
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
}>();

const emit = defineEmits<{
  (e: "animationEnd"): void;
}>();

const animateX = ref<SVGAnimateElement | null>(null);
const animateY = ref<SVGAnimateElement | null>(null);

function emitAnimationEnd() {
  emit("animationEnd");
}

onMounted(() => {
  if (animateX.value && animateY.value) {
    animateX.value.beginElement();
    animateY.value.beginElement();
  }
});
</script>
<style scoped>
.message-dot {
  width: 8px;
  height: 8px;
  fill: #f1c40f;
}
</style>
