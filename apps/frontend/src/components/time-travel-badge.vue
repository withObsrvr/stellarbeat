<template>
  <span
    v-if="store.isTimeTravel && !store.isSimulation"
    class="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 ring-1 ring-cyan-200 mx-2"
  >
    Time Travel
    <a
      href="#"
      class="ml-0.5 text-cyan-500 hover:text-cyan-700 transition-colors"
      @click.stop.prevent="resetTimeTravel()"
    >
      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </a>
  </span>
</template>
<script setup lang="ts">
import useStore from "@/store/useStore";
import { useRoute, useRouter } from "vue-router";

const store = useStore();
const route = useRoute();
const router = useRouter();

function resetTimeTravel() {
  const query = store.copyAndModifyObject(route.query, [], ["at"]);
  router.push({
    name: route.name ? route.name : undefined,
    params: route.params,
    query: query as Record<string, string | Array<string>>,
  });
}
</script>
