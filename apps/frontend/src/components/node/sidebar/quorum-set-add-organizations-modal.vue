<template>
  <UiModal
    v-model="isOpen"
    title="Select organization to add"
    size="lg"
    ok-title="Add"
    cancel-title="Close"
    lazy
    @ok="organizationsToAddModalOk"
    @cancel="close"
  >
    <AddOrganizationsTable
      :organizations="possibleOrganizationsToAdd"
      @organizations-selected="onOrganizationsSelected"
    />
  </UiModal>
</template>

<script setup lang="ts">
/**
 * Converted from a raw Bootstrap `.modal` driven by `$(el).modal("show")`.
 * Bootstrap's JavaScript is never loaded, so this dialog could not open.
 *
 * The old `visible` flag existed to keep the table out of the DOM until the
 * dialog opened, set from a `show.bs.modal` handler. UiModal's `lazy` does
 * that directly, so the flag is gone.
 */
import { computed, type PropType, ref, toRefs } from "vue";
import useStore from "@/store/useStore";
import { Organization, QuorumSet } from "shared";
import AddOrganizationsTable from "@/components/node/tools/simulation/add-organizations-table.vue";

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

const emit = defineEmits(["close"]);

const { quorumSet } = toRefs(props);
const organizationsToAdd = ref<Organization[]>([]);
const store = useStore();
const network = store.network;

const isOpen = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit("close");
  },
});

function close() {
  emit("close");
}

const possibleOrganizationsToAdd = computed(() => {
  const trustedOrganizations = network
    .getTrustedOrganizations(quorumSet.value)
    .map((org) => org.id);

  return store.network.organizations.filter(
    (organization) => trustedOrganizations.indexOf(organization.id) < 0,
  );
});

function organizationsToAddModalOk() {
  if (organizationsToAdd.value.length > 0) {
    addOrganizationsToQuorumSet(quorumSet.value, organizationsToAdd.value);
  }
  close();
}

function onOrganizationsSelected(organizations: Organization[]) {
  organizationsToAdd.value = organizations;
}

function addOrganizationsToQuorumSet(
  toQuorumSet: QuorumSet,
  organizations: Organization[],
) {
  store.addOrganizations(toQuorumSet, organizations);
}
</script>
