<template>
  <div ref="rootRef" class="relative inline-block">
    <button
      class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      @click.stop="open = !open"
    >
      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>
    </button>
    <div
      v-show="open"
      class="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
    >
      <div class="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-gray-400">
        Simulation options
      </div>
      <div v-if="supportsHalt">
        <a
          v-if="!store.network.isOrganizationBlocked(organization)"
          class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          @click.prevent.stop="store.toggleOrganizationAvailability(organization); open = false"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          {{ organization.subQuorumAvailable ? "Halt this organization" : "Start validating" }}
        </a>
        <div v-else class="px-3 py-2 text-xs text-gray-400">
          Organization blocked: not enough validators are reaching their quorumSet threshold.
        </div>
      </div>
      <a
        v-if="supportsDelete && store.selectedOrganization"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="store.removeOrganizationFromOrganization(organization, store.selectedOrganization); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Remove
      </a>
      <a
        v-if="supportsAdd"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="showAddOrgModal = true; open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Add organization
      </a>
    </div>
    <UiModal
      v-model="showAddOrgModal"
      :lazy="true"
      size="lg"
      title="Select organization to add"
      ok-title="Add"
      @ok="organizationsToAddModalOk"
    >
      <AddOrganizationsTable
        v-if="showAddOrgModal"
        :organizations="possibleOrganizationsToAdd"
        @organizations-selected="onOrganizationsSelected"
      />
    </UiModal>
  </div>
</template>

<script setup lang="ts">
import { Organization } from "shared";
import AddOrganizationsTable from "@/components/node/tools/simulation/add-organizations-table.vue";
import { computed, onMounted, onUnmounted, ref, type Ref, toRefs } from "vue";
import useStore from "@/store/useStore";

interface Props {
  organization: Organization;
  supportsDelete?: boolean;
  supportsAdd?: boolean;
  supportsHalt?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  supportsDelete: false,
  supportsAdd: false,
  supportsHalt: true,
});

const { organization, supportsDelete, supportsAdd, supportsHalt } =
  toRefs(props);

const store = useStore();
const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const showAddOrgModal = ref(false);

const organizationsToAdd: Ref<Organization[]> = ref([]);

const trustedOrganizationIds = computed(() => {
  const trustedOrganizationIds = new Set<string>();
  organization.value.validators.forEach((publicKey) => {
    const validator = store.network.getNodeByPublicKey(publicKey);
    store.network
      .getTrustedOrganizations(validator.quorumSet)
      .forEach((org) => {
        if (org.id !== organization.value.id)
          trustedOrganizationIds.add(org.id);
      });
  });
  return Array.from(trustedOrganizationIds);
});

const possibleOrganizationsToAdd = computed(() => {
  return store.network.organizations.filter(
    (organization) => trustedOrganizationIds.value.indexOf(organization.id) < 0,
  );
});

function organizationsToAddModalOk() {
  if (organizationsToAdd.value.length > 0) {
    store.addOrganizationsToOrganization(
      organizationsToAdd.value,
      organization.value,
    );
  }
}

function onOrganizationsSelected(organizations: Organization[]) {
  organizationsToAdd.value = organizations;
}

function closeOnOutsideClick(e: Event) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) open.value = false;
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick));
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick));
</script>
