<template>
  <span
    class="node clickable"
    role="link"
    :class="[
      {
        intact: isIntact,
        'ill-behaved': isIllBehaved,
        befouled: isBefouled,
        selected: isSelected,
        main: isMain,
        accepted: hasAccepted,
        confirmed: hasConfirmed,
      },
      $attrs.class,
    ]"
    @click="handleClick"
    @mouseover="$emit('mouseover', $event)"
    @mouseleave="$emit('mouseleave', $event)"
  >
    {{ nodeId }}
    <span v-if="showVote && voteLabel" class="vote-label">{{ voteLabel }}</span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";

const props = defineProps<{
  nodeId: string;
  isMain?: boolean;
  showVote?: boolean;
  accepted?: boolean;
  confirmed?: boolean;
}>();

const showVote = computed(() => props.showVote ?? false);
const emit = defineEmits(["select", "mouseover", "mouseleave"]);

const selectedNodeId = computed(() => federatedVotingStore.selectedNodeId);
const intactNodes = computed(() => federatedVotingStore.intactNodes);
const illBehavedNodes = computed(() => federatedVotingStore.illBehavedNodes);

const currentNode = computed(() => {
  const node = federatedVotingStore.nodes.find(
    (node) => node.publicKey === props.nodeId,
  );
  if (!node) throw new Error(`Node with public key ${props.nodeId} not found`);
  return node;
});

const selectedNode = federatedVotingStore.selectedNode;

const processedVotesOfSelectedNode = computed(() => {
  // No node selected - no processed votes to consider
  if (!selectedNode.value) return [];

  // Find votes related to this badge's node
  return selectedNode.value.processedVotes.filter(
    (vote) => vote.publicKey === props.nodeId,
  );
});

const isIntact = computed(() => intactNodes.value.includes(props.nodeId));
const isIllBehaved = computed(() =>
  illBehavedNodes.value.includes(props.nodeId),
);
const isBefouled = computed(() => !isIntact.value);
const isSelected = computed(() => selectedNodeId.value === props.nodeId);

const hasConfirmed = computed(() => {
  if (props.confirmed !== undefined) {
    return props.confirmed;
  }
  // If no node is selected, show system/fbas state
  if (!selectedNodeId.value) {
    return currentNode.value.confirmed;
  }

  if (selectedNodeId.value === props.nodeId) {
    return selectedNode.value?.confirmed;
  }

  // A node can never know if another node has confirmed a vote because there is no final
  // confirmation message.
  return false;
});

const hasAccepted = computed(() => {
  if (props.accepted !== undefined) {
    return props.accepted;
  }

  // If no node is selected, show global state
  if (!selectedNodeId.value) {
    return currentNode.value.accepted;
  }

  // For any node (including the selected node itself),
  // use the selected node's processed votes
  const hasAcceptVote = processedVotesOfSelectedNode.value.some(
    (vote) => vote.isVoteToAccept,
  );
  return hasAcceptVote;
});

const voteLabel = computed(() => {
  // If no node is selected, show global state
  if (!currentNode.value) return "";

  if (!selectedNodeId.value) {
    if (currentNode.value.confirmed) return currentNode.value.confirmed;
    if (currentNode.value.accepted) return currentNode.value.accepted;
    if (currentNode.value.voted) return currentNode.value.voted;
    return "";
  }

  // For any node (including the selected node itself),
  // use the selected node's processed votes
  const acceptVotes = processedVotesOfSelectedNode.value.filter(
    (vote) => vote.isVoteToAccept,
  );
  const regularVotes = processedVotesOfSelectedNode.value.filter(
    (vote) => !vote.isVoteToAccept,
  );

  if (acceptVotes.length > 0) return acceptVotes[0].statement.toString();
  if (regularVotes.length > 0) return regularVotes[0].statement.toString();
  return "";
});

function handleClick() {
  if (!isSelected.value) {
    emit("select", props.nodeId);
  }
}
</script>

<style scoped>
.node {
  display: inline-block;
  padding: 2px 4px;
  border: 3px solid #a9a9a9;
  border-radius: 4px;
  font-size: 0.85em;
  background-color: #a9a9a9;
  color: #ffffff;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.node:hover {
  background-color: #888888;
}

.node.selected {
  cursor: default;
}

.node.accepted {
  background-color: #1f77b4;
  border-color: #1f77b4;
  color: white;
}

.node.confirmed {
  background-color: #2ca02c;
  border-color: #2ca02c;
  color: white;
}

.ill-behaved {
  border-color: #ff0000 !important;
}

.befouled {
  border-color: #ffa500 !important;
}

.vote-label {
  margin-left: 6px;
  padding: 1px 4px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  font-size: 0.7em;
  color: #fff;
  vertical-align: middle;
}
</style>
