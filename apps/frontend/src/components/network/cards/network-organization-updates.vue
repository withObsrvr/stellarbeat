<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">Latest updated organizations</h1>
    </div>
    <div v-if="failed" class="p-4 text-sm text-red-600 bg-red-50/50 ring-1 ring-red-200/60 rounded-none">
      <svg class="inline h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
      Error fetching data
    </div>
    <div :class="dimmerClass">
      <div class="loader mt-2"></div>
      <div class="dimmer-content">
        <div v-if="!isLoading" class="w-full mb-4 card-columns">
          <div
            v-for="snapshot in snapshots"
            :key="snapshot.organization.id + snapshot.startDate"
            class="px-3 py-2 border-b border-gray-100 last:border-b-0"
          >
            <div class="text-gray-500 mb-0 text-xs">
              {{ snapshot.startDate.toLocaleString() }}
              <UiBadge
                v-if="snapshot.startDate.getTime() === network.time.getTime()"
                variant="info"
              >current crawl</UiBadge>
            </div>
            <div class="flex items-center ml-2">
              <div class="mr-1">
                <router-link
                  :to="{
                    name: 'organization-dashboard',
                    params: {
                      organizationId: snapshot.organization.id,
                    },
                    query: {
                      network: $route.query.network,
                      at: $route.query.at,
                    },
                  }"
                >
                  {{ snapshot.organization.name }}
                </router-link>
              </div>
              <UiBadge
                v-if="
                  snapshot.organization.dateDiscovered &&
                  snapshot.startDate.getTime() ===
                    snapshot.organization.dateDiscovered.getTime()
                "
                variant="success"
              >New</UiBadge>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { OrganizationSnapShot } from "shared";
import useStore from "@/store/useStore";
import { useIsLoading } from "@/composables/useIsLoading";
import { onMounted, type Ref, ref } from "vue";
import useOrganizationSnapshotRepository from "@/repositories/useOrganizationSnapshotRepository";

const store = useStore();
const organizationSnapshotRepository = useOrganizationSnapshotRepository();
const network = store.network;
const { isLoading, dimmerClass } = useIsLoading();
const failed = ref(false);
const snapshots: Ref<OrganizationSnapShot[]> = ref([]);

async function getSnapshots() {
  let snapshots: OrganizationSnapShot[] = [];
  const snapshotsOrError = await organizationSnapshotRepository.find(
    network.time,
  );
  if (snapshotsOrError.isErr()) {
    failed.value = true;
  } else {
    snapshots = snapshotsOrError.value;
  }
  isLoading.value = false;
  return snapshots;
}

onMounted(async () => {
  snapshots.value = await getSnapshots();
});
</script>
<style scoped>
.card-columns {
  column-count: 3;
}
</style>
