<template>
  <div class="rounded-xl border border-gray-200 bg-white this-card">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h4 class="text-sm font-semibold text-gray-900">Latest organization updates</h4>
    </div>
    <div v-if="failed" class="p-4 text-sm text-red-600 bg-red-50/50 ring-1 ring-red-200/60">
      <svg class="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
      Error fetching data
    </div>
    <div class="py-0 overflow-auto px-4">
      <div v-if="!isLoading" class="w-full mb-4">
        <div
          v-for="updatesOnDate in updatesPerDate"
          :key="updatesOnDate.date.getTime()"
          class="px-0 pb-0 border-b border-gray-100 last:border-b-0 py-2"
        >
          <div class="flex justify-between flex-wrap">
            <div class="w-3/4">
              <div class="text-gray-500 mb-1 text-xs">
                {{ updatesOnDate.date.toLocaleString() }}
              </div>
              <div class="mb-2">
                <div v-for="update in updatesOnDate.updates" :key="update.key">
                  <div v-if="update.key === 'validators'">Validators updated</div>
                  <div v-if="update.key === 'name'">Name changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'dba'">Dba changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'url'">Url changed to <a :href="update.value">{{ update.value || "empty" }}</a></div>
                  <div v-if="update.key === 'officialEmail'">Official email changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'phoneNumber'">Phone number changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'physicalAddress'">Physical address changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'twitter'">Twitter account changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'github'">Github account changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'keybase'">Keybase account changed to {{ update.value || "empty" }}</div>
                  <div v-if="update.key === 'horizon'">Horizon url changed to <p class="ml-2">"{{ update.value || "empty" }}"</p></div>
                  <div v-if="update.key === 'description'">Description changed to <p class="ml-2">"{{ update.value || "empty" }}"</p></div>
                  <div v-if="update.key === 'archival'">Organization unarchived after period of inactivity</div>
                </div>
              </div>
            </div>
            <div class="flex items-center mb-2 gap-1">
              <button
                v-tooltip="'View diff'"
                class="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                @click="showDiff(updatesOnDate.snapshot)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
              <button
                v-tooltip="'Travel to this point in time'"
                class="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                @click="timeTravel(updatesOnDate.snapshot)"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div v-if="updatesPerDate.length === 0 && !isLoading" class="py-3 text-gray-500 text-sm">
          No recent updates...
        </div>
      </div>
      <div v-else class="flex justify-center mt-5">
        <div class="loader"></div>
      </div>
    </div>
    <UiModal v-model="showDiffModal" title="Diff" size="lg">
      <div v-html="diffModalHtml"></div>
    </UiModal>
  </div>
</template>
<script setup lang="ts">
import { type Ref, ref, toRefs, watch } from "vue";
import { Organization, OrganizationSnapShot, type PublicKey } from "shared";
import * as jsondiffpatch from "jsondiffpatch";
import * as htmlFormatter from "jsondiffpatch/formatters/html";

import "jsondiffpatch/formatters/styles/html.css";
import "jsondiffpatch/formatters/styles/annotated.css";

import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";
import useOrganizationSnapshotRepository from "@/repositories/useOrganizationSnapshotRepository";

interface Update {
  key: string;
  value: string;
}

interface SnapshotForDelta {
  validators: string[];
  startDate: Date;
  endDate: Date;
  id: string;
  name: string;
  dba: string | null;
  url: string | null;
  officialEmail: string | null;
  phoneNumber: string | null;
  physicalAddress: string | null;
  twitter: string | null;
  github: string | null;
  description: string | null;
  keybase: string | null;
}

const store = useStore();
const organizationSnapshotRepository = useOrganizationSnapshotRepository();
const router = useRouter();
const route = useRoute();

const differ = jsondiffpatch.create({});
const diffModalHtml = ref("<p>No update selected</p>");
const showDiffModal = ref(false);
const deltas: Map<string, jsondiffpatch.Delta | undefined> = new Map();

const updatesPerDate: Ref<
  {
    date: Date;
    updates: Update[];
    snapshot: SnapshotForDelta;
  }[]
> = ref([]);

const isLoading = ref(true);
const failed = ref(false);

const props = defineProps<{
  organization: Organization;
}>();

const organization = toRefs(props).organization;

watch(
  organization,
  async () => {
    await getSnapshots();
  },
  { immediate: true },
);

function showDiff(snapShot: SnapshotForDelta) {
  htmlFormatter.showUnchanged(true);
  diffModalHtml.value = htmlFormatter.format(
    deltas.get(snapShot.startDate.toISOString()) as jsondiffpatch.Delta,
    snapShot,
  ) as string;
  showDiffModal.value = true;
}

async function getSnapshots() {
  let snapshots: SnapshotForDelta[] = [];
  try {
    deltas.clear();
    updatesPerDate.value = [];
    const fetchedSnapshotsOrError =
      await organizationSnapshotRepository.findForOrganization(
        organization.value.id,
        store.network.time,
      );
    if (fetchedSnapshotsOrError.isErr()) {
      failed.value = true;
      return [];
    }
    snapshots = fetchedSnapshotsOrError.value.map(
      (snapshot: OrganizationSnapShot) => {
        return {
          validators: snapshot.organization.validators.map(
            (validator: PublicKey) =>
              store.network.getNodeByPublicKey(validator) &&
              store.network.getNodeByPublicKey(validator).name
                ? (store.network.getNodeByPublicKey(validator).name as string) +
                  " (" + validator + ")"
                : validator,
          ),
          startDate: snapshot.startDate,
          endDate: snapshot.endDate,
          id: snapshot.organization.id,
          name: snapshot.organization.name,
          dba: snapshot.organization.dba,
          url: snapshot.organization.url,
          officialEmail: snapshot.organization.officialEmail,
          phoneNumber: snapshot.organization.phoneNumber,
          physicalAddress: snapshot.organization.physicalAddress,
          twitter: snapshot.organization.twitter,
          github: snapshot.organization.github,
          description: snapshot.organization.description,
          keybase: snapshot.organization.keybase,
          horizon: snapshot.organization.horizonUrl,
        };
      },
    );
    const validatorSort = (a: PublicKey, b: PublicKey) => a.localeCompare(b);
    for (let i = snapshots.length - 2; i >= 0; i--) {
      const updates: Update[] = [];
      [
        "validators", "name", "dba", "url", "officialEmail", "phoneNumber",
        "physicalAddress", "twitter", "github", "description", "keybase", "horizon",
      ]
        .filter((key) =>
          key === "validators"
            ? JSON.stringify(snapshots[i][key].sort(validatorSort)) !==
              JSON.stringify(snapshots[i + 1][key].sort(validatorSort))
            : //@ts-ignore
              snapshots[i][key] !== snapshots[i + 1][key],
        )
        .forEach((changedKey) =>
          updates.push({
            key: changedKey,
            //@ts-ignore
            value: snapshots[i][changedKey],
          }),
        );

      if (snapshots[i]["startDate"].getTime() !== snapshots[i + 1]["endDate"].getTime()) {
        updates.push({ key: "archival", value: "unArchived" });
      }

      updatesPerDate.value.push({
        date: snapshots[i].startDate,
        updates: updates,
        snapshot: snapshots[i],
      });

      deltas.set(
        snapshots[i].startDate.toISOString(),
        differ.diff(snapshots[i + 1], snapshots[i]),
      );
    }
    updatesPerDate.value.reverse();
  } catch (e) {
    isLoading.value = false;
    failed.value = true;
  }

  isLoading.value = false;
  return snapshots;
}

function timeTravel(snapshot: SnapshotForDelta) {
  router.push({
    name: route.name ? route.name : undefined,
    params: route.params,
    query: {
      view: route.query.view,
      "no-scroll": "1",
      network: route.query.network,
      at: snapshot.startDate.toISOString(),
    },
  });
}
</script>

<style scoped>
.this-card {
  min-height: 200px;
  max-height: 910px;
}
</style>
