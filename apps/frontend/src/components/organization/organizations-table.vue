<template>
  <div class="flex flex-col items-center justify-end">
    <UiTable
      striped
      hover
      responsive
      :items="organizations"
      :fields="fields"
      :sort-by="sortByRef"
      :sort-desc="sortDesc"
      :per-page="perPage"
      :current-page="currentPage"
      :filter="filter"
      class="mb-0"
      @update:sort-by="sortByRef = $event"
      @update:sort-desc="sortDesc = $event"
    >
      <template #cell(validators)="{ item }">
        <ul class="validator-list">
          <li
            v-for="validator in item.validators"
            :key="validator.publicKey"
          >
            <div>
              <span
                v-if="validator.isFullValidator"
                v-tooltip="'Full validator'"
                class="inline-flex items-center justify-center rounded bg-emerald-500 text-white mr-1 p-0.5"
                title="Full validator"
              >
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </span>

              <router-link
                :to="{
                  name: 'node-dashboard',
                  params: { publicKey: validator.publicKey },
                  query: {
                    center: '1',
                    view: $route.query.view,
                    network: $route.query.network,
                    at: $route.query.at,
                  },
                }"
              >
                {{ validator.displayName }}
              </router-link>
              <UiBadge
                v-if="network.isNodeFailing(validator)"
                v-tooltip="network.getNodeFailingReason(validator).description"
                variant="danger"
                class="ml-1"
              >{{ network.getNodeFailingReason(validator).label }}</UiBadge>
              <UiBadge
                v-else-if="NodeWarningDetector.nodeHasWarning(validator, network)"
                v-tooltip="NodeWarningDetector.getNodeWarningReasonsConcatenated(validator, network)"
                variant="warning"
                class="ml-1"
              >
                Warning
              </UiBadge>
            </div>
          </li>
        </ul>
      </template>
      <template #head(subQuorum24HAvailability)="{ label }">
        <span>{{ label }}
          <svg v-tooltip="'Availability: more than or equal to 50% of the organization validators are validating.'" class="inline h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
      </template>
      <template #head(subQuorum30DAvailability)="{ label }">
        <span>{{ label }}
          <svg v-tooltip="'Availability: more than or equal to 50% of the organization validators are validating.'" class="inline h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
      </template>
      <template #cell(name)="{ item }">
        <div class="flex items-center">
          <span
            v-if="item.hasReliableUptime"
            v-tooltip="'>99% uptime with at least 3 validators'"
            class="inline-flex items-center justify-center rounded bg-primary text-white mr-1 p-0.5"
          >
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </span>
          <div class="mr-1">
            <router-link
              :to="{
                name: 'organization-dashboard',
                params: { organizationId: item.id },
                query: {
                  view: $route.query.view,
                  network: $route.query.network,
                  at: $route.query.at,
                },
              }"
            >
              {{ item.name }}
            </router-link>
          </div>
          <UiBadge
            v-if="item.failAt === 1"
            v-tooltip="'If one more validator fails, this organization will fail'"
            variant="warning"
            class="ml-1"
          >Warning</UiBadge>
          <UiBadge
            v-else-if="item.failAt < 1"
            v-tooltip="item.dangers"
            variant="danger"
            class="ml-1"
          >{{ item.blocked ? "Blocked" : "Failing" }}</UiBadge>
          <UiBadge
            v-else-if="item.hasWarning"
            v-tooltip="item.warning"
            variant="warning"
            class="ml-1"
          >Warning</UiBadge>
        </div>
      </template>
      <template #cell(url)="{ item }">
        <a :href="item.url" target="_blank" rel="noopener">{{
          item.url
        }}</a>
      </template>
      <template #cell(keybase)="{ item }">
        <a
          :href="'https://keybase.io/' + item.keybase"
          target="_blank"
          rel="noopener"
        >{{ item.keybase }}</a>
      </template>
      <template #cell(email)="{ item }">
        <a
          v-if="item.email"
          :href="'mailto:' + item.email"
          target="_blank"
          rel="noopener"
        >{{ item.email }}</a>
      </template>
      <template #cell(action)="{ item }">
        <organization-actions
          :organization="network.getOrganizationById(item.id)"
        ></organization-actions>
      </template>
    </UiTable>
    <div
      v-show="organizations.length >= perPage"
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
</template>

<script setup lang="ts">
import { computed, ref, toRefs } from "vue";

import OrganizationActions from "@/components/organization/sidebar/organization-actions.vue";
import useStore from "@/store/useStore";
import { NodeWarningDetector } from "@/services/NodeWarningDetector";
import { Node } from "shared";

interface TableField {
  key: string;
  label?: string;
  sortable?: boolean;
  class?: string;
  tdClass?: string;
}

export interface Props {
  filter?: string;
  fields: (string | TableField)[];
  organizations: TableOrganization[];
  perPage?: number;
  sortBy?: string;
}

const props = withDefaults(defineProps<Props>(), {
  filter: "",
  perPage: 200,
  sortBy: "subQuorum30DAvailability",
});

const { filter, fields, organizations, perPage } = toRefs(props);

const sortByRef = ref(props.sortBy);
const sortDesc = ref(true);
const currentPage = ref(1);

const store = useStore();
const network = store.network;

const totalRows = computed(() => props.organizations.length);

export type TableOrganization = {
  name: string;
  id: string;
  hasReliableUptime?: boolean;
  failAt?: number;
  hasWarning?: boolean;
  warning?: string;
  dangers?: string;
  blocked?: boolean;
  subQuorum24HAvailability?: string;
  subQuorum30DAvailability?: string;
  email?: string;
  keybase?: string;
  validators?: Node[];
  github?: string;
  url?: string;
};
</script>

<style scoped>
ul {
  list-style-type: none;
}

.validator-list {
  padding-left: 0;
  margin-bottom: 0;
}
</style>
