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
      <path class="dialog-pointer" :d="trianglePath"></path>
      <g class="dialog-content">
        <foreignObject
          v-for="(event, index) in events"
          :key="index"
          :x="dialogX + padding"
          :y="
            index === 0
              ? dialogY + padding + 1
              : dialogY +
                padding +
                eventSpacing +
                1 * (lineHeight * linesPerEvent[index - 1])
          "
          :width="dialogWidth - padding * 2"
          :height="lineHeight * linesPerEvent[index]"
        >
          <div xmlns="http://www.w3.org/1999/xhtml" class="event-text">
            {{ event.shortDescription }}
          </div>
        </foreignObject>
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

const { events, showDialog } = toRefs(props);

const maxWidth = 120;
const padding = 6;
const lineHeight = 15;
const eventSpacing = 10;
const nodeRadius = 25;

const dialogWidth = computed(() => maxWidth);

const dialogX = computed(() => -dialogWidth.value / 2 - maxWidth / 2 + 20);

const linesPerEvent = computed(() => {
  return events.value.map((event) => {
    const text = event.shortDescription;
    const charsPerLine = maxWidth / 6;
    return Math.ceil(text.length / charsPerLine);
  });
});

const computedDialogHeight = computed(() => {
  const totalLines = linesPerEvent.value.reduce((acc, val) => acc + val, 0);
  const totalEventSpacing = eventSpacing * (events.value.length - 1);
  return padding * 2.5 + totalLines * lineHeight + totalEventSpacing;
});

const dialogY = computed(() => -nodeRadius - computedDialogHeight.value - 10);

const trianglePath = computed(() => {
  const triangleWidth = 12;
  const triangleHeight = 8;
  const centerX = 0;
  const x1 = centerX - triangleWidth / 2;
  const x2 = centerX + triangleWidth / 2;
  const y1 = dialogY.value + computedDialogHeight.value;
  const y2 = y1 + triangleHeight;
  return `M ${x1},${y1} L ${centerX},${y2} L ${x2},${y1} Z`;
});
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

.event-text {
  font-family: Arial, sans-serif;
  font-size: 12px;
  font-weight: bold;
  word-wrap: break-word;
  overflow-wrap: break-word;
  text-align: center;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  color: #1f77b4;
  justify-content: center;
}
.dialog-background {
  fill: #e0f7fa;
}

.event-dialog {
  pointer-events: none;
}

.dialog-background {
  fill: #e0f7fa;
}

.dialog-content text {
  pointer-events: none;
  user-select: none;
  fill: #0288d1;
}

.dialog-pointer {
  fill: #e0f7fa;
}
</style>
