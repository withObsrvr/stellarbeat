<template>
  <g
    :transform="transform"
    style="cursor: pointer"
    @mouseover="handleMouseOver"
    @mouseout="handleMouseOut"
    @click="handleClick"
  >
    <circle
      ref="nodeCircle"
      :r="nodeRadius"
      :fill="nodeFillColor"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      role="link"
      :aria-label="
        currentEvents.length > 0
          ? `Node ${node.id} has ${currentEvents.length} event(s)`
          : `Node ${node.id}`
      "
      :class="{ 'pulse-animation': isPulseActive }"
    ></circle>

    <g class="default-text" :font-size="isSelected ? 11 : 10">
      <text class="node-label name" dy="-0.6em">
        {{ node.id }}
      </text>

      <text v-if="statusText" class="node-label status" dy="0.4em">
        {{ statusText }}
      </text>

      <text class="node-label threshold" dy="1.6em">
        {{
          node.threshold && node.validators
            ? `${node.threshold}/${node.validators.length}`
            : ""
        }}
      </text>
    </g>

    <FbasGraphNodeDialog
      :events="currentEvents"
      :is-hovered="isHovered"
      :show-dialog="showDialog"
    />
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
import FbasGraphNodeDialog from "./fbas-graph-node-dialog.vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

export interface Node extends SimulationNodeDatum {
  id: string;
  validators?: string[];
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

const currentEvents = ref<
  Array<{ shortDescription: string; fullDescription: string }>
>([]);

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

const nodeRadius = computed(() => {
  return isHovered.value || isSelected.value ? 30 : 25;
});

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

function handleClick() {
  federatedVotingStore.selectedNodeId = props.node.id;
}

const events = toRef(props.node, "events");

watch(
  events,
  (newEvents) => {
    currentEvents.value = [];
    initialDialogShow.value = false;

    newEvents.forEach((event) => {
      if (event instanceof Voted && !event.vote.isVoteToAccept) {
        currentEvents.value.push({
          shortDescription: `Voted "${event.vote.statement}"`,
          fullDescription: `${event.publicKey} voted "${event.vote.statement}"`,
        });
      } else if (event instanceof Voted && event.vote.isVoteToAccept) {
        /*currentEvents.value.push({
        shortDescription: `Accepted "${event.vote.statement}"`,
        fullDescription: `${event.publicKey} accepted "${event.vote.statement}"`,
      });*/
      } else if (event instanceof VoteRatified) {
        currentEvents.value.push({
          shortDescription: `Quorum ratified "${event.statement}"`,
          fullDescription: `Quorum {${Array.from(event.quorum.keys()).join(", ")}} ratified "${event.statement}"`,
        });
      } else if (event instanceof AcceptVoteVBlocked) {
        currentEvents.value.push({
          shortDescription: `VBlocking set accepted "${event.statement}"`,
          fullDescription: `VBlocking set [${Array.from(event.vBlockingSet).join(", ")}] accepted "${event.statement}"`,
        });
      } else if (event instanceof AcceptVoteRatified) {
        currentEvents.value.push({
          shortDescription: `Quorum ratified accept("${event.statement}")`,
          fullDescription: `Quorum {${Array.from(event.quorum.keys()).join(", ")}} ratified "accept(${event.statement})"`,
        });
      } else if (event instanceof ConsensusReached) {
        /*currentEvents.value.push({
        shortDescription: `Confirmed "${event.statement}"`,
        fullDescription: `${event.publicKey} confirmed "${event.statement}"`,
      });*/
      }
    });
    if (currentEvents.value.length > 0) {
      animateEvents();
    }
  },
  { immediate: true },
);

const transform = computed(() => {
  return `translate(${props.node.x}, ${props.node.y})`;
});

const strokeColor = computed(() => {
  if (federatedVotingStore.illBehavedNodes.includes(props.node.id)) {
    return "#ff0000";
  } else if (!federatedVotingStore.intactNodes.includes(props.node.id)) {
    return "orange";
  }
  return nodeFillColor.value;
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

const selectedNodeId = computed(() => {
  return federatedVotingStore.selectedNodeId;
});

const isSelected = computed(() => {
  return selectedNodeId.value === props.node.id;
});

const strokeWidth = computed(() => {
  return isHovered.value || isSelected.value ? 5 : 4;
});
</script>

<style scoped>
.node-label {
  text-anchor: middle;
  font-family: Arial, sans-serif;
  font-weight: bold;
  pointer-events: none;
  fill: #ffff;
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
</style>
