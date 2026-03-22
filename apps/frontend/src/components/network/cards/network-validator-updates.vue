<template>
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">Latest updated validators</h1>
    </div>
    <div v-if="failed" class="p-4 text-sm text-red-600 bg-red-50/50 ring-1 ring-red-200/60">
      Error fetching data
    </div>
    <div :class="dimmerClass">
      <div class="loader mt-2"></div>
      <div class="dimmer-content">
        <div v-if="!isLoading" class="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          <div
            v-for="snapshot in snapshots"
            :key="snapshot.node.publicKey + snapshot.startDate"
            class="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50/50 transition-colors"
          >
            <div class="flex items-center gap-2 min-w-0">
              <UiStatusDot :color="snapshot.node.isValidating ? 'emerald' : 'red'" />
              <router-link
                :to="{
                  name: 'node-dashboard',
                  params: { publicKey: snapshot.node.publicKey },
                  query: {
                    network: $route.query.network,
                    at: $route.query.at,
                  },
                }"
                class="text-sm font-medium text-gray-900 hover:text-emerald-700 transition-colors truncate"
              >{{ snapshot.node.displayName }}</router-link>
              <UiBadge
                v-if="snapshot.startDate.getTime() === snapshot.node.dateDiscovered.getTime()"
                variant="success"
              >New</UiBadge>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0 ml-3">
              <UiBadge
                v-if="snapshot.startDate.getTime() === network.time.getTime()"
                variant="info"
              >current</UiBadge>
              <span class="text-2xs text-gray-400 tabular whitespace-nowrap">
                {{ formatDate(snapshot.startDate) }}
              </span>
            </div>
          </div>
          <div v-if="snapshots.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
            No recent updates
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NodeSnapShot } from "shared";
import useStore from "@/store/useStore";
import { useIsLoading } from "@/composables/useIsLoading";
import { onMounted, type Ref, ref } from "vue";
import useNodeSnapshotRepository from "@/repositories/useNodeSnapshotRepository";

const store = useStore();
const nodeSnapshotRepository = useNodeSnapshotRepository();
const network = store.network;

const { isLoading, dimmerClass } = useIsLoading();

const failed = ref(false);
const snapshots: Ref<NodeSnapShot[]> = ref([]);

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return Math.floor(diffMs / 60000) + 'm ago';
  if (diffH < 24) return diffH + 'h ago';
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return diffD + 'd ago';
  return date.toLocaleDateString();
}

async function getSnapshots() {
  const result = await nodeSnapshotRepository.find(network.time);
  let snapshots: NodeSnapShot[] = [];
  if (result.isOk()) {
    snapshots = result.value;
  } else {
    failed.value = true;
  }
  isLoading.value = false;
  return snapshots;
}

onMounted(async () => {
  snapshots.value = await getSnapshots();
});
</script>
