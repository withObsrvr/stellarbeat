<template>
  <div id="public-horizon-apis-card" class="rounded-xl border border-gray-200 bg-white">
    <div class="border-b border-gray-100 bg-gray-50/80 pl-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">Public Horizon APIs</h1>
    </div>
    <div class="p-0">
      <div class="w-full mb-4">
        <div
          v-for="horizon in horizons"
          :key="horizon.name"
          class="px-3 py-3 border-b border-gray-100 last:border-b-0"
        >
          <a :href="horizon.url ?? undefined" target="_blank" rel="noopener" class="text-emerald-700 hover:underline">{{
            horizon.name
          }}</a>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import useStore from "@/store/useStore";

const store = useStore();
const network = store.network;

const horizons = computed(() => {
  return network.organizations
    .filter((organization) => organization.horizonUrl)
    .map((organization) => {
      return {
        name: organization.name,
        url: organization.horizonUrl,
      };
    });
});
</script>
