<template>
  <div>
    <button
      v-tooltip="'Forge Message'"
      class="btn btn-danger btn-sm py-0 pr-1"
      @click="showForgeMessageModal"
    >
      <BIconEnvelopeFill class="mr-1" /><BIconExclamation />
    </button>

    <BModal
      id="forgeMessageModal"
      ref="forgeMessageModal"
      title="Forge Message"
      @ok="handleForgeMessage"
      @hidden="clearForgeMessageForm"
    >
      <div class="mb-3">
        <label for="fromNode" class="form-label">From:</label>
        <select id="fromNode" v-model="forgeMessage.from" class="form-select">
          <option value="" disabled>Select sender node</option>
          <option
            v-for="node in nodePublicKeys"
            :key="`from-${node}`"
            :value="node"
          >
            {{ node }}
          </option>
        </select>
      </div>

      <div class="mb-3">
        <label for="toNode" class="form-label">To:</label>
        <select id="toNode" v-model="forgeMessage.to" class="form-select">
          <option value="" disabled>Select receiver node</option>
          <option
            v-for="node in nodePublicKeys"
            :key="`to-${node}`"
            :value="node"
          >
            {{ node }}
          </option>
        </select>
      </div>

      <div class="mb-3 form-check">
        <input
          id="acceptVote"
          v-model="forgeMessage.isAccept"
          type="checkbox"
          class="form-check-input"
        />
        <label for="acceptVote" class="form-check-label">Accept Vote</label>
      </div>

      <div class="mb-3">
        <label class="form-label d-block">Vote:</label>
        <div class="form-check form-check-inline">
          <input
            id="burger"
            v-model="forgeMessage.value"
            type="radio"
            class="form-check-input"
            value="burger"
          />
          <label for="burger" class="form-check-label">burger</label>
        </div>
        <div class="form-check form-check-inline">
          <input
            id="pizza"
            v-model="forgeMessage.value"
            type="radio"
            class="form-check-input"
            value="pizza"
          />
          <label for="pizza" class="form-check-label">pizza</label>
        </div>
        <div class="form-check form-check-inline">
          <input
            id="salad"
            v-model="forgeMessage.value"
            type="radio"
            class="form-check-input"
            value="salad"
          />
          <label for="salad" class="form-check-label">salad</label>
        </div>
      </div>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { federatedVotingStore } from "@/store/useFederatedVotingStore";
import { Message, QuorumSet, Vote } from "scp-simulation";
import { BIconEnvelopeFill, BIconExclamation, BModal } from "bootstrap-vue";

const forgeMessageModal = ref<BModal | null>(null);
const forgeMessage = ref({
  from: "",
  to: "",
  isAccept: false,
  value: "burger",
});

const nodePublicKeys = computed(() =>
  federatedVotingStore.nodes.map((node) => node.publicKey),
);

function showForgeMessageModal() {
  if (forgeMessageModal.value) {
    forgeMessageModal.value.show();
  }
}

function clearForgeMessageForm() {
  forgeMessage.value = {
    from: "",
    to: "",
    isAccept: false,
    value: "burger",
  };
}

function handleForgeMessage() {
  const { from, to, isAccept, value } = forgeMessage.value;

  if (!from || !to || !value) return;

  const node = federatedVotingStore.nodes.find(
    (node) => node.publicKey === from,
  );
  if (!node) return;

  const vote = new Vote(
    value,
    isAccept,
    node.publicKey,
    new QuorumSet(node.trustThreshold, node.trustedNodes, []),
  );

  const message = new Message(node.publicKey, to, vote);
  federatedVotingStore.forgeMessage(message);
}
</script>

<style scoped>
.form-select {
  padding: 0rem 0.5rem;
  height: 26px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background-color: white;
  min-width: 90px;
  color: #495057;
}

.form-check-inline {
  margin-right: 1rem;
}
</style>
