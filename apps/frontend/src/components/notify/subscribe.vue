<template>
  <div>
    <div v-if="requesting" class="flex flex-col items-center py-8">
      <div class="loader"></div>
      <p class="text-sm text-gray-500 mt-3">Requesting subscription...</p>
    </div>
    <div v-else>
      <h3 class="text-lg font-bold text-gray-900 mb-4">Subscribe to events</h3>
      <form novalidate @submit.prevent="onSubscribe" @reset="onReset">
        <UiAlert variant="success" :show="requested">
          Request received, you will receive an email shortly.
        </UiAlert>
        <UiAlert variant="danger" :show="submitError">
          Something went wrong, please try again later or contact support.
        </UiAlert>

        <!-- Node events -->
        <div class="mb-5">
          <label class="block text-sm font-medium text-gray-700 mb-1">Node events</label>
          <p class="text-2xs text-gray-400 mb-2">
            Triggered when inactive, not validating, or history archive not up-to-date for three consecutive updates.
          </p>
          <multiselect
            id="nodes-select"
            v-model="selectedNodes"
            mode="tags"
            :close-on-select="false"
            :searchable="true"
            placeholder="Search nodes..."
            label="name"
            valueProp="publicKey"
            :object="true"
            :options="nodes"
            @search-change="searchNodes"
          />
        </div>

        <!-- Organization events -->
        <div class="mb-5">
          <label class="block text-sm font-medium text-gray-700 mb-1">Organization events</label>
          <p class="text-2xs text-gray-400 mb-2">
            Triggered when organization unavailable for three consecutive updates.
          </p>
          <multiselect
            id="organization-select"
            v-model="selectedOrganizations"
            mode="tags"
            :close-on-select="false"
            :searchable="true"
            placeholder="Search organizations..."
            label="name"
            valueProp="id"
            :object="true"
            :options="organizations"
          />
        </div>

        <!-- Network events -->
        <div class="mb-5">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input
              v-model="networkSubscription"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
            />
            <span class="font-medium text-gray-700">Network events</span>
          </label>
          <p class="text-2xs text-gray-400 mt-1 ml-6">
            Triggered when transitive quorum set changes or when liveness/danger risks drop below thresholds.
          </p>
        </div>

        <!-- Email -->
        <div class="mb-5">
          <label for="email-address" class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
          <input
            id="email-address"
            v-model.trim="emailAddress"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>

        <!-- Consent -->
        <div class="mb-6">
          <label class="flex items-start gap-2 text-sm cursor-pointer">
            <input
              v-model="consented"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 mt-0.5"
              true-value="accepted"
              false-value="not_accepted"
            />
            <span class="text-gray-600">
              I have read, understood, and agree to be bound by the
              <a :href="termsLink" target="_blank" class="text-gray-900 underline">Terms and Conditions</a>
              and our
              <a :href="privacyLink" target="_blank" class="text-gray-900 underline">Privacy Policy</a>
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2">
          <button
            type="submit"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            @click="onSubscribe"
          >Create or update subscriptions</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40"
            :disabled="!(emailAddressState === true && consented !== 'not_accepted')"
            @click="onUnsubscribe"
          >Unsubscribe</button>
          <button
            type="reset"
            class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >Clear form</button>
        </div>
      </form>
    </div>

    <!-- Info notes -->
    <div class="mt-6 rounded-xl border border-gray-200 bg-gray-50/50 p-4 text-sm text-gray-600">
      <h4 class="text-2xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Important notes</h4>
      <ul class="space-y-2 list-disc pl-4">
        <li>Events are triggered when they first occur. A node down for three days triggers only one event at the start.</li>
        <li>Notifications for a specific event are muted for 24H after first sent. Unmute via the link in the notification email.</li>
        <li>This service is provided best effort. Check the <a href="https://dashboard.stellar.org" target="_blank" class="text-gray-900 underline">official Stellar dashboard</a> if network issues are reported.</li>
        <li>This does not replace <a href="https://developers.stellar.org/docs/run-core-node/monitoring/" target="_blank" class="text-gray-900 underline">Stellar monitoring docs</a> recommendations.</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import Multiselect from "@vueform/multiselect";
import { computed, type ComputedRef, onMounted, type Ref, ref } from "vue";
import useStore from "@/store/useStore";

type EventSourceId = {
  type: string;
  id: string;
};

type SelectNode = {
  name: string;
  publicKey: string;
};

type SelectedOrganization = {
  name: string;
  id: string;
};

const store = useStore();
const network = store.network;

const emailAddress = ref("");
const requested = ref(false);
const consented = ref("not_accepted");
const requesting = ref(false);
const submitError = ref(false);
const networkSubscription = ref(false);
const selectedNodes: Ref<SelectNode[] | null> = ref(null);
const nodes: Ref<SelectNode[]> = ref([]);
const selectedOrganizations: Ref<SelectedOrganization[] | null> = ref(null);
const validated = ref(false);

const privacyLink = import.meta.env.VUE_APP_PRIVACY_LINK;
const termsLink = import.meta.env.VUE_APP_TERMS_LINK;

const organizations: ComputedRef<SelectedOrganization[]> = computed(() => {
  return network.organizations.map((org) => ({
    name: org.name,
    id: org.id,
  }));
});

function searchNodes(query: string) {
  nodes.value = network.nodes
    .filter(
      (node) =>
        node.publicKey.toLowerCase().search(query.toLowerCase()) !== -1 ||
        node.displayName.toLowerCase().search(query.toLowerCase()) !== -1,
    )
    .map((node) => ({ name: node.displayName, publicKey: node.publicKey }));
}

const emailAddressState = computed(() => {
  if (emailAddress.value === "") return null;
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(emailAddress.value.toLowerCase());
});

function onReset(event: Event) {
  event.preventDefault();
  resetForm();
}

function resetForm() {
  emailAddress.value = "";
  selectedOrganizations.value = null;
  selectedNodes.value = null;
  networkSubscription.value = false;
  consented.value = "not_accepted";
}

function getSelectedEventSourceIds(): EventSourceId[] {
  const eventSourceIds: EventSourceId[] = [];
  if (networkSubscription.value) {
    eventSourceIds.push({
      type: "network",
      id: store.network.id
        ? store.network.id
        : "Public Global Stellar Network ; September 2015",
    });
  }
  if (selectedNodes.value !== null) {
    selectedNodes.value.forEach((node: SelectNode) => {
      eventSourceIds.push({ type: "node", id: node.publicKey });
    });
  }
  if (selectedOrganizations.value !== null) {
    selectedOrganizations.value.forEach((org: SelectedOrganization) => {
      eventSourceIds.push({ type: "organization", id: org.id });
    });
  }
  return eventSourceIds;
}

async function onSubscribe(event: Event) {
  validated.value = true;
  event.preventDefault();
  submitError.value = false;
  requested.value = false;
  if (!emailAddressState.value || consented.value === "not_accepted") return;
  try {
    requesting.value = true;
    const response = await fetch(
      import.meta.env.VUE_APP_PUBLIC_API_URL + "/v1/subscription",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailAddress: emailAddress.value,
          eventSourceIds: getSelectedEventSourceIds(),
        }),
      },
    );
    if (!response.ok) {
      requesting.value = false;
      submitError.value = true;
    }
    requested.value = true;
    requesting.value = false;
    resetForm();
  } catch (e) {
    requesting.value = false;
    submitError.value = true;
  }
}

async function onUnsubscribe(event: Event) {
  event.preventDefault();
  submitError.value = false;
  requested.value = false;
  if (!emailAddressState.value || consented.value === "not_accepted") return;
  try {
    requesting.value = true;
    const response = await fetch(
      import.meta.env.VUE_APP_PUBLIC_API_URL + "/v1/subscription/request-unsubscribe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAddress: emailAddress.value }),
      },
    );
    if (!response.ok) {
      requesting.value = false;
      submitError.value = true;
    }
    requested.value = true;
    requesting.value = false;
    resetForm();
  } catch (e) {
    requesting.value = false;
    submitError.value = true;
  }
}

onMounted(() => {
  nodes.value = network.nodes.map((node) => ({
    name: node.displayName,
    publicKey: node.publicKey,
  }));
});
</script>

<style src="@vueform/multiselect/themes/default.css"></style>
