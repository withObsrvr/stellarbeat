<template>
  <UiModal
    v-model="isOpen"
    title="Select validators to add"
    size="lg"
    ok-title="Add"
    cancel-title="Close"
    lazy
    @ok="validatorsToAddModalOk"
    @cancel="close"
  >
    <AddValidatorsTable
      :validators="possibleValidatorsToAdd"
      @validators-selected="onValidatorsSelected"
    />
  </UiModal>
</template>

<script setup lang="ts">
/**
 * Converted from a raw Bootstrap `.modal` driven by `$(el).modal("show")`.
 * Bootstrap's JavaScript is never loaded, so this dialog could not open.
 *
 * The old `visible` flag kept the table out of the DOM until the dialog
 * opened, set from a `show.bs.modal` handler; UiModal's `lazy` does that.
 */
import { computed, type PropType, ref, toRefs } from "vue";
import { Node, QuorumSet } from "shared";
import useStore from "@/store/useStore";
import AddValidatorsTable from "@/components/node/tools/simulation/add-validators-table.vue";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  quorumSet: {
    type: Object as PropType<QuorumSet>,
    required: true,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["expand", "close"]);

const { quorumSet } = toRefs(props);
const store = useStore();
const network = store.network;
const validatorsToAdd = ref<string[]>([]);

const isOpen = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit("close");
  },
});

function close() {
  emit("close");
}

const possibleValidatorsToAdd = computed(() => {
  return network.nodes.filter(
    (node: Node) =>
      node.isValidator &&
      QuorumSet.getAllValidators(quorumSet.value).indexOf(node.publicKey) < 0,
  );
});

function onValidatorsSelected(validators: Node[]) {
  validatorsToAdd.value = validators.map(
    (validator: Node) => validator.publicKey,
  );
}

function validatorsToAddModalOk() {
  if (validatorsToAdd.value.length > 0) {
    addValidatorsToQuorumSet(quorumSet.value, validatorsToAdd.value);
    emit("expand");
  }
  close();
}

function addValidatorsToQuorumSet(
  toQuorumSet: QuorumSet,
  validators: string[],
) {
  store.addValidators(toQuorumSet, validators);
}
</script>
