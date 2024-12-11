<template>
  <g
    :transform="transform"
    style="cursor: grab"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
  >
    <circle
      :r="nodeRadius"
      :fill="nodeFillColor"
      stroke="#fff"
      stroke-width="1.5"
      ref="nodeCircle"
      role="img"
      :aria-label="
        currentEvents.length > 0
          ? `Node ${node.id} has ${currentEvents.length} event(s)`
          : `Node ${node.id}`
      "
      :class="{ 'pulse-animation': isPulseActive }"
    ></circle>

    <g class="default-text">
      <text
        class="node-label name"
        text-anchor="middle"
        dy="-0.6em"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#fff"
        font-weight="bold"
        pointer-events="none"
      >
        {{ node.id }}
      </text>

      <text
        v-if="statusText"
        class="node-label status"
        text-anchor="middle"
        dy="0.5em"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#fff"
        font-weight="bold"
        pointer-events="none"
      >
        {{ statusText }}
      </text>

      <text
        class="node-label threshold"
        text-anchor="middle"
        dy="1.7em"
        font-family="Arial, sans-serif"
        font-size="12"
        fill="#fff"
        font-weight="bold"
        pointer-events="none"
      >
        {{
          node.threshold && node.validators
            ? `${node.threshold}/${node.validators.length}`
            : ""
        }}
      </text>
    </g>

    <!-- Event Dialog -->
    <transition name="fade-slide">
      <g
        v-if="showDialog"
        class="event-dialog"
        role="alert"
        aria-live="assertive"
      >
        <!-- Dialog Background -->
        <rect
          class="dialog-background"
          :x="dialogX"
          :y="dialogY"
          :width="dialogWidth"
          :height="computedDialogHeight"
          rx="8"
          ry="8"
        ></rect>

        <!-- Event Texts -->
        <g class="dialog-content">
          <text
            v-for="(event, index) in currentEvents"
            :key="index"
            :x="dialogX + dialogWidth / 2"
            :y="dialogY + paddingTop + index * lineHeight + lineHeight / 2"
            text-anchor="middle"
            alignment-baseline="middle"
            font-family="Arial, sans-serif"
            font-size="12"
            :fill="getEventTextColor(event)"
            font-weight="bold"
            pointer-events="none"
          >
            {{ event }}
          </text>
        </g>
      </g>
    </transition>
  </g>
</template>

<script setup lang="ts">
import {
  ref,
  defineProps,
  defineEmits,
  watch,
  toRef,
  computed,
  PropType,
} from "vue";
import { SimulationNodeDatum } from "d3-force";
import {
  AcceptVoteRatified,
  AcceptVoteVBlocked,
  ConsensusReached,
  OverlayEvent,
  ProtocolEvent,
  Voted,
  VoteRatified,
} from "scp-simulation";

export interface Node extends SimulationNodeDatum {
  id: string;
  validators?: readonly string[];
  threshold?: number;
  vote: string | null;
  accept: string | null;
  confirm: string | null;
  fx?: number | null;
  fy?: number | null;
  events: (ProtocolEvent | OverlayEvent)[];
}

const props = defineProps({
  node: {
    type: Object as PropType<Node>,
    required: true,
  },
});

const emit = defineEmits(["mouseover", "mouseout"]);

const nodeCircle = ref<SVGCircleElement | null>(null);

const currentEvents = ref<string[]>([]);

// Flags to control pulse animation and hover state
const isPulseActive = ref(false);
const isHovered = ref(false);
const initialDialogShow = ref(false);
let hideDialogTimeout: NodeJS.Timeout | null = null;

const showDialog = computed(() => {
  return (
    (currentEvents.value.length > 0 && isHovered.value) ||
    initialDialogShow.value
  );
});

const statusText = computed(() => {
  if (props.node.confirm) {
    return `c: ${props.node.confirm}`;
  } else if (props.node.accept) {
    return `a: ${props.node.accept}`;
  } else if (props.node.vote) {
    return `v: ${props.node.vote}`;
  } else {
    return "";
  }
});

const getEventTextColor = (event: string): string => {
  if (event.toLowerCase().includes("error")) return "#FF4C4C"; // Brighter Red
  if (event.toLowerCase().includes("warning")) return "#FFA500"; // Brighter Orange
  if (event.toLowerCase().includes("success")) return "#32CD32"; // Lime Green
  return "#1E90FF";
};

// Dialog Dimensions and Positioning
const paddingTop = 10;
const lineHeight = 18;

const dialogWidth = computed(() => {
  // Ensure a minimum width
  const minWidth = 160;
  // Calculate based on the longest event string
  const maxEventLength = currentEvents.value.reduce(
    (max, event) => (event.length > max ? event.length : max),
    0,
  );
  const calculatedWidth = maxEventLength * 7; // Approximate width per character
  return Math.max(calculatedWidth, minWidth);
});

const dialogX = computed(() => -dialogWidth.value / 2);
const dialogY = computed(() => nodeRadius + 10);

const computedDialogHeight = computed(
  () => paddingTop * 2 + currentEvents.value.length * lineHeight,
);

const nodeRadius = 35;

function animateEvents() {
  triggerPulseOnCircle();

  // Start a timeout to clear events after 2 seconds
  if (hideDialogTimeout) {
    initialDialogShow.value = false;
    clearTimeout(hideDialogTimeout);
    hideDialogTimeout = null;
  }
  initialDialogShow.value = true;
  hideDialogTimeout = setTimeout(() => {
    initialDialogShow.value = false;
    hideDialogTimeout = null;
  }, 2000);
}

function triggerPulseOnCircle() {
  isPulseActive.value = true;
  setTimeout(() => {
    isPulseActive.value = false;
  }, 500);
}

function handleMouseOver() {
  isHovered.value = true;
  if (hideDialogTimeout) {
    clearTimeout(hideDialogTimeout);
    hideDialogTimeout = null;
  }
  emit("mouseover");
}

function handleMouseOut() {
  isHovered.value = false;
  if (currentEvents.value.length > 0) {
    hideDialogTimeout = setTimeout(() => {
      initialDialogShow.value = false;
      hideDialogTimeout = null;
    }, 2000);
  }
  emit("mouseout");
}

const events = toRef(props.node, "events");

watch(events, (newEvents) => {
  currentEvents.value = [];
  newEvents.forEach((event) => {
    if (event instanceof Voted && !event.vote.isVoteToAccept) {
      currentEvents.value.push(
        `${event.publicKey} voted "${event.vote.statement}"`,
      );
    } else if (event instanceof Voted && event.vote.isVoteToAccept) {
      currentEvents.value.push(
        `${event.publicKey} accepted "${event.vote.statement}"`,
      );
    } else if (event instanceof VoteRatified) {
      currentEvents.value.push(
        `Quorum {${Array.from(event.quorum.keys()).join(", ")}} ratified "${event.statement}"`,
      );
    } else if (event instanceof AcceptVoteVBlocked) {
      currentEvents.value.push(
        `Accept vote on "${event.statement}" VBlocked by [${Array.from(
          event.vBlockingSet,
        ).join(", ")}]`,
      );
    } else if (event instanceof AcceptVoteRatified) {
      currentEvents.value.push(
        `Quorum {${Array.from(event.quorum.keys()).join(", ")}} ratified "accept(${event.statement})"`,
      );
    } else if (event instanceof ConsensusReached) {
      currentEvents.value.push(
        `${event.publicKey} confirmed "${event.statement}"`,
      );
    }
  });

  if (currentEvents.value.length > 0) {
    animateEvents();
  }
});

const transform = computed(() => {
  return `translate(${props.node.x}, ${props.node.y})`;
});

const nodeFillColor = computed(() => {
  if (props.node.confirm) {
    return "#2ca02c"; // Green if confirmed
  } else if (props.node.accept) {
    return "#1f77b4"; // Blue if accepted a value
  } else {
    return "#A9A9A9"; // Dark gray if only voted
  }
});
</script>

<style scoped>
.node-label.name {
  font-size: 12px;
}

.node-label.threshold {
  font-size: 12px;
}

.node-label.status {
  font-size: 12px;
}

/* Pulse Animation applied to the circle */
.pulse-animation {
  animation: pulse 0.5s ease-in-out;
}

/* Keyframes for pulse applied to the circle */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.9;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Transition for Dialog */
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
  stroke: #0288d1;
}

.dialog-content text {
  pointer-events: none;
  user-select: none;
  fill: #0288d1;
}
</style>
