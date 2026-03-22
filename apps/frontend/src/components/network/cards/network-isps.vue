<template>
  <div id="isp-list-card" class="rounded-xl border border-gray-200 bg-white">
    <div class="border-b border-gray-100 bg-gray-50/80 pl-3 py-3">
      <h1 class="text-sm font-semibold text-gray-900">
        {{ store.includeAllNodes ? "Node " : "Validator" }} ISPs
      </h1>
    </div>

    <div class="flex flex-col items-center justify-end">
      <UiTable
        :items="ispList"
        :fields="fields"
        :sort-by="sortBy"
        :sort-desc="sortDesc"
        :per-page="perPage"
        :current-page="currentPage"
        striped
        hover
        responsive
        class="mb-0"
        @update:sort-by="sortBy = $event"
        @update:sort-desc="sortDesc = $event"
      >
        <template #cell(action)="{ item }">
          <UiDropdown right :no-caret="true" size="sm" variant="outline" toggle-class="p-1 text-gray-400 hover:text-gray-600">
            <template #button-content>
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>
            </template>
            <UiDropdownHeader>Simulation options</UiDropdownHeader>
            <UiDropdownItemButton @click="simulateFailure(item.ispKey)">
              <span class="flex items-center gap-1.5">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Halt nodes with ISP
              </span>
            </UiDropdownItemButton>
          </UiDropdown>
        </template>
      </UiTable>
      <div
        v-show="ispList.length >= perPage"
        class="flex justify-end m-1"
      >
        <UiPagination
          v-model="currentPage"
          size="sm"
          :limit="3"
          class="mb-0"
          :total-rows="totalRows"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import useStore from "@/store/useStore";
import { AggregateChange } from "@/services/change-queue/changes/aggregate-change";
import { EntityPropertyUpdate } from "@/services/change-queue/changes/entity-property-update";
import useScrollTo from "@/composables/useScrollTo";

const store = useStore();
const network = store.network;
const scrollTo = useScrollTo();

const perPage = ref(5);
const sortBy = ref("count");
const sortDesc = ref(true);
const currentPage = ref(1);

const ispToKeyMap = computed(() => {
  const map = new Map<string, string>();
  network.nodes
    .filter(
      (node) =>
        (node.isValidator && node.isValidating) || store.includeAllNodes,
    )
    .forEach((node) => {
      if (node.isp) {
        const ispKey = removeSpecialCharacters(node.isp.toLowerCase());
        map.set(node.isp, ispKey);
      }
    });

  return map;
});

const keyToIspMap = computed(() => {
  const map = new Map<string, string>();
  network.nodes
    .filter(
      (node) =>
        (node.isValidator && node.isValidating) || store.includeAllNodes,
    )
    .forEach((node) => {
      if (node.isp) {
        const ispKey = removeSpecialCharacters(node.isp.toLowerCase());
        if (map.has(ispKey)) {
          map.set(ispKey, node.isp);
        } else {
          map.set(ispKey, node.isp);
        }
      }
    });

  return map;
});

const ispList = computed(() => {
  const getIspKeyCountsArray = getCountsArray(
    (
      network.nodes
        .filter(
          (node) =>
            node.isp &&
            ((node.isValidator && node.isValidating) || store.includeAllNodes),
        )
        .map((node) => node.isp) as string[]
    ).map((isp) => removeSpecialCharacters(isp.toLowerCase())),
  );

  return getIspKeyCountsArray.map((ispKeyCount) => {
    return {
      isp: keyToIspMap.value.get(ispKeyCount.isp) as string,
      ispKey: ispKeyCount.isp,
      count: ispKeyCount.count,
    };
  });
});

const simulateFailure = function (ispKey: string) {
  const aggregateChange = new AggregateChange(
    network.nodes
      .filter((node) => node.isp && ispToKeyMap.value.get(node.isp) === ispKey)
      .map((node) => {
        return [
          new EntityPropertyUpdate(node, "isValidating", false),
          new EntityPropertyUpdate(node, "activeInScp", false),
        ];
      })
      .flat(),
  );

  store.processChange(aggregateChange);

  scrollTo("content");
};

const totalRows = computed(() => ispList.value.length);

const fields = ref([
  { key: "isp", label: "ISP", sortable: true },
  {
    key: "count",
    label: "Count",
    sortable: true,
  },
  {
    key: "action",
    label: "",
    sortable: false,
    //@ts-ignore
    tdClass: "action",
  },
]);

function removeSpecialCharacters(str: string): string {
  const regex = /[!@#$%^&*(),.?":{}|<>]/g;
  return str.replace(regex, "");
}

function getCountsArray(
  stringsArray: string[],
): { isp: string; count: number }[] {
  const counts: { [key: string]: number } = stringsArray.reduce(
    (acc: { [key: string]: number }, str) => {
      if (acc[str]) {
        acc[str]++;
      } else {
        acc[str] = 1;
      }
      return acc;
    },
    {},
  );

  const uniqueStrings: string[] = Object.keys(counts);

  return uniqueStrings.map((str) => ({
    isp: str,
    count: counts[str],
  }));
}
</script>
