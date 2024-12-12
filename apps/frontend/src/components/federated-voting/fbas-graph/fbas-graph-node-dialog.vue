<template>
  <transition name="fade-slide">
    <g
      v-if="showDialog"
      class="event-dialog"
      role="alert"
      aria-live="assertive"
    >
      <rect
        class="dialog-background"
        :x="dialogX"
        :y="dialogY"
        :width="dialogWidth"
        :height="computedDialogHeight"
        rx="8"
        ry="8"
      ></rect>
      <g class="dialog-content">
        <text
          v-for="(event, index) in events"
          :key="index"
          :x="dialogX + dialogWidth / 2"
          :y="dialogY + paddingTop + index * lineHeight + lineHeight / 2"
          text-anchor="middle"
          alignment-baseline="middle"
          font-family="Arial, sans-serif"
          font-size="12"
          :fill="getEventTextColor(event.fullDescription)"
          font-weight="bold"
          pointer-events="none"
        >
          {{ isHovered ? event.fullDescription : event.shortDescription }}
        </text>
      </g>
    </g>
  </transition>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";

const props = defineProps<{
  events: Array<{ shortDescription: string; fullDescription: string }>;
  isHovered: boolean;
  showDialog: boolean;
}>();

const { events, isHovered, showDialog } = toRefs(props);

const paddingTop = 10;
const lineHeight = 18;
const nodeRadius = 25;

const dialogWidth = computed(() => {
  const minWidth = 160;
  const maxEventLength = events.value.reduce((max, event) => {
    const text = isHovered.value
      ? event.fullDescription
      : event.shortDescription;
    return text.length > max ? text.length : max;
  }, 0);
  const calculatedWidth = maxEventLength * 7;
  return Math.max(calculatedWidth, minWidth);
});

const dialogX = computed(() => -dialogWidth.value / 2);
const dialogY = computed(() => nodeRadius + 10);
const computedDialogHeight = computed(
  () => paddingTop * 2 + events.value.length * lineHeight,
);

const getEventTextColor = (event: string): string => {
  if (event.toLowerCase().includes("error")) return "#FF4C4C";
  if (event.toLowerCase().includes("warning")) return "#FFA500";
  if (event.toLowerCase().includes("success")) return "#32CD32";
  return "#1E90FF";
};
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.5s ease-in-out,
    transform 0.5s ease-in-out;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.event-dialog {
  pointer-events: none;
}
.dialog-background {
  fill: #e0f7fa;
}

.event-dialog {
  pointer-events: none;
}

.dialog-background {
  fill: #e0f7fa;
  stroke: #0288d1;
}

.dialog-content text {
  pointer-events: none;
  user-select: none;
  fill: #0288d1;
}
</style>
