<template>
  <div class="relative">
    <div v-if="store.networkContexts.size > 1 && !store.isLoading">
      <button
        class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        @click.stop="open = !open"
      >
        <span class="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
        {{ store.getNetworkContextName() }}
        <svg class="h-3 w-3 text-gray-400 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div
        v-show="open"
        class="absolute right-0 top-full mt-1 z-50 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden p-1"
      >
        <a
          v-for="network in Array.from(store.networkContexts.keys())"
          :key="network"
          class="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          @click="navigateToNetwork(network); open = false"
        >
          {{ store.getNetworkContextName(network) }}
        </a>
      </div>
    </div>
    <div v-else class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-400">
      <span class="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
      {{ store.getNetworkContextName() }}
    </div>
  </div>
</template>
<script setup lang="ts">
import useStore from "@/store/useStore";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted, ref } from "vue";

const store = useStore();
const router = useRouter();
const open = ref(false);

const navigateToNetwork = (networkId: string) => {
  if (networkId === store.networkContext.networkId) return;
  router
    .push({
      name: "network-dashboard",
      query: { network: networkId },
    })
    .catch(() => {});
};

function closeOnOutsideClick(e: Event) {
  if (!(e.target as HTMLElement).closest('.relative')) open.value = false;
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick));
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick));
</script>
