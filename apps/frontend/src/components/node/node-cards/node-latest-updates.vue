<template>
  <div class="rounded-xl border border-gray-200 bg-white this-card">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h4 class="text-sm font-semibold text-gray-900">Latest node updates</h4>
    </div>
    <div v-if="failed" class="p-4 text-sm text-red-600 bg-red-50/50 ring-1 ring-red-200/60">
      <svg class="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
      Error fetching data
    </div>
    <div class="py-0 overflow-auto px-4">
      <div v-if="!isLoading" class="w-full mb-4">
        <div
          v-for="updatesOnDate in updatesPerDate"
          :key="new Date(updatesOnDate.date).getTime()"
          class="px-0 pb-0 border-b border-gray-100 last:border-b-0 py-2"
        >
          <div class="flex justify-between flex-wrap">
            <div class="w-3/4">
              <div class="text-gray-500 mb-1 text-xs">
                {{ new Date(updatesOnDate.date).toLocaleString() }}
              </div>
              <div class="mb-2">
                <div v-for="update in updatesOnDate.updates" :key="update.key">
                  <div v-if="update.key === 'ip'">IP changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'port'">Port changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'quorumSet'">QuorumSet updated</div>
                  <div v-else-if="update.key === 'ledgerVersion'">Ledger updated to version {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'overlayVersion'">Overlay updated to version {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'overlayMinVersion'">Minimum required overlay version is now {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'name'">Name changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'host'">Host changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'homeDomain'">Home domain changed to <a :href="update.value">{{ update.value || "empty" }}</a></div>
                  <div v-else-if="update.key === 'historyUrl'">History url changed to <a :href="update.value">{{ update.value || "empty" }}</a></div>
                  <div v-else-if="update.key === 'alias'">Alias changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'isp'">ISP changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'versionStr' && update.value">Stellar core updated to version {{ update.value.replace("stellar-core ", "").replace("v", "").replace(/ \(.*$/, "").replace(/\-.*$/, "") }}</div>
                  <div v-else-if="update.key === 'countryName'">Geo location: country changed to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'organizationId'">Organization changed to {{ network.getOrganizationById(update.value) ? network.getOrganizationById(update.value).name : "N/A" }}</div>
                  <div v-else-if="update.key === 'archival'">Node unarchived after period of inactivity</div>
                  <div v-else-if="update.key === 'longitude'">Longitude updated to {{ update.value || "empty" }}</div>
                  <div v-else-if="update.key === 'latitude'">Latitude updated to {{ update.value || "empty" }}</div>
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
import { Node, type PublicKey, QuorumSet } from "shared";
import * as jsondiffpatch from "jsondiffpatch";
import * as htmlFormatter from "jsondiffpatch/formatters/html";

import "jsondiffpatch/formatters/styles/html.css";
import "jsondiffpatch/formatters/styles/annotated.css";

import { isArray } from "shared";
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";
import useNodeSnapshotRepository from "@/repositories/useNodeSnapshotRepository";

interface Update {
  key: string;
  value: string;
}

interface SnapshotForDelta {
  startDate: Date;
  endDate: Date;
  publicKey: string;
  ip: string | null;
  port: number | null;
  host: string | null;
  name: string | null;
  homeDomain: string | null;
  historyUrl: string | null;
  alias: string | null;
  isp: string | null;
  ledgerVersion: number | null;
  overlayVersion: number | null;
  overlayMinVersion: number | null;
  versionStr: string | null;
  countryCode: string | null;
  countryName: string | null;
  longitude: number | null;
  latitude: number | null;
  organizationId: string | null;
  quorumSet: QuorumSet;
  quorumSetHashKey: string | null;
}

const props = defineProps<{
  node: Node;
}>();

const node = toRefs(props).node;

const differ = jsondiffpatch.create({
  objectHash(item) {
    if (isArray((item as QuorumSet).validators)) {
      return (item as QuorumSet).validators.join("");
    }
  },
});

const diffModalHtml = ref("<p>No update selected</p>");
const showDiffModal = ref(false);
const deltas: Map<string, jsondiffpatch.Delta | undefined> = new Map();

const updatesPerDate: Ref<
  {
    date: string;
    updates: Update[];
    snapshot: SnapshotForDelta;
  }[]
> = ref([]);

const store = useStore();
const nodeSnapshotRepository = useNodeSnapshotRepository();
const network = store.network;
const router = useRouter();
const route = useRoute();
const isLoading = ref(true);
const failed = ref(false);

function showDiff(snapShot: SnapshotForDelta) {
  htmlFormatter.showUnchanged(true);
  diffModalHtml.value = htmlFormatter.format(
    deltas.get(snapShot.startDate.toISOString()) as jsondiffpatch.Delta,
    snapShot,
  ) as string;
  showDiffModal.value = true;
}

function mapValidatorsToNames(quorumSet: QuorumSet) {
  quorumSet.validators = quorumSet.validators.map((validator: PublicKey) =>
    network.getNodeByPublicKey(validator) &&
    network.getNodeByPublicKey(validator).name
      ? network.getNodeByPublicKey(validator).name
      : validator,
  ) as [];

  quorumSet.innerQuorumSets = quorumSet.innerQuorumSets.map((quorumSet) =>
    mapValidatorsToNames(quorumSet),
  );

  return quorumSet;
}

watch(
  node,
  async () => {
    await getSnapshots();
  },
  { immediate: true },
);

async function getSnapshots() {
  let snapshots: SnapshotForDelta[] = [];
  try {
    deltas.clear();
    updatesPerDate.value = [];
    const fetchedSnapshotsOrError = await nodeSnapshotRepository.findForNode(
      node.value.publicKey,
      network.time,
    );
    if (fetchedSnapshotsOrError.isErr()) {
      failed.value = true;
      return [];
    }

    snapshots = fetchedSnapshotsOrError.value.map((snapshot) => {
      let quorumSet: QuorumSet;
      if (!snapshot.node.quorumSet) quorumSet = new QuorumSet(0);
      else quorumSet = mapValidatorsToNames(snapshot.node.quorumSet);

      return {
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        publicKey: snapshot.node.publicKey,
        ip: snapshot.node.ip,
        port: snapshot.node.port,
        host: snapshot.node.host,
        name: snapshot.node.name,
        homeDomain: snapshot.node.homeDomain,
        historyUrl: snapshot.node.historyUrl,
        alias: snapshot.node.alias,
        isp: snapshot.node.isp,
        ledgerVersion: snapshot.node.ledgerVersion,
        overlayVersion: snapshot.node.overlayVersion,
        overlayMinVersion: snapshot.node.overlayMinVersion,
        versionStr: snapshot.node.versionStr,
        countryCode: snapshot.node.geoData.countryCode,
        countryName: snapshot.node.geoData.countryName,
        longitude: snapshot.node.geoData.longitude,
        latitude: snapshot.node.geoData.latitude,
        organizationId: snapshot.node.organizationId,
        quorumSet: quorumSet,
        quorumSetHashKey: snapshot.node.quorumSetHashKey,
      };
    });

    for (let i = snapshots.length - 2; i >= 0; i--) {
      const updates: Update[] = [];
      [
        "latitude", "longitude", "quorumSet", "ip", "port", "countryName",
        "countryCode", "host", "name", "homeDomain", "historyUrl", "alias",
        "isp", "ledgerVersion", "overlayVersion", "overlayMinVersion",
        "versionStr", "organizationId",
      ]
        .filter((key) =>
          key !== "quorumSet"
            ? //@ts-ignore
              snapshots[i][key] !== snapshots[i + 1][key]
            : snapshots[i].quorumSetHashKey !== snapshots[i + 1].quorumSetHashKey,
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
        date: snapshots[i].startDate.toISOString(),
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
