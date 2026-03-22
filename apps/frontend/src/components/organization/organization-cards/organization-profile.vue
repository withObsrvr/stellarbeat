<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div
      class="pb-2 flex flex-col text-center justify-center items-center px-4 py-4"
    >
      <h3 class="my-1">
        <span
          v-if="organization.hasReliableUptime"
          v-tooltip="'>99% uptime with at least 3 validators'"
          class="inline-flex items-center justify-center rounded bg-primary text-white p-0.5 mr-1"
        >
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </span>
        {{ organization.name }}
        <UiBadge
          v-if="store.getOrganizationFailAt(organization) <= 0"
          v-tooltip="'More then 50% of its validators are failing'"
          variant="danger"
        >Failing</UiBadge>
      </h3>
      <p v-if="organization.description" class="m-2 text-sm text-gray-600">
        {{ organization.description }}
      </p>
      <UiAlert v-else class="mt-2" :show="true" variant="info"
        >No description found in
        <a
          target="_blank"
          rel="noopener"
          href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md"
          class="underline"
          >stellar.toml</a
        >
      </UiAlert>

      <ul class="flex gap-3 mb-2 mt-2 list-none p-0">
        <li v-if="organization.url">
          <a
            v-tooltip="organization.url"
            :href="organization.url"
            :title="organization.url"
            class="text-gray-400 hover:text-gray-700 transition-colors"
            target="_blank"
            rel="noopener"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          </a>
        </li>
        <li v-if="organization.physicalAddress">
          <a
            v-tooltip="organization.physicalAddress"
            :href="'https://www.google.com/maps/search/?api=1&query=' + organization.physicalAddress"
            target="_blank"
            rel="noopener"
            class="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </a>
        </li>
        <li v-if="organization.officialEmail">
          <a
            v-tooltip="organization.officialEmail"
            class="text-gray-400 hover:text-gray-700 transition-colors"
            :href="'mailto:' + organization.officialEmail"
            target="_blank"
            rel="noopener"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </a>
        </li>
        <li v-if="organization.phoneNumber">
          <a
            v-tooltip="organization.phoneNumber"
            class="text-gray-400 hover:text-gray-700 transition-colors"
            :href="'tel:' + organization.phoneNumber"
            target="_blank"
            rel="noopener"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </a>
        </li>
        <li v-if="organization.twitter">
          <a
            v-tooltip="organization.twitter"
            :href="'https://twitter.com/' + organization.twitter"
            class="text-gray-400 hover:text-gray-700 transition-colors"
            target="_blank"
            rel="noopener"
          >
            <twitter />
          </a>
        </li>
        <li v-if="organization.github">
          <a
            v-tooltip="organization.github"
            :href="'https://github.com/' + organization.github"
            target="_blank"
            rel="noopener"
            class="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <github />
          </a>
        </li>
        <li v-if="organization.keybase">
          <a
            v-tooltip="organization.keybase"
            :href="'https://keybase.io/' + organization.keybase"
            rel="noopener"
            target="_blank"
            class="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <img
              class="mb-2"
              width="19px"
              src="../../../assets/keybase-brands-grey.svg"
              alt="keybase"
            />
          </a>
        </li>
        <li v-if="organization.horizonUrl">
          <a
            v-tooltip="organization.horizonUrl"
            :href="organization.horizonUrl"
            target="_blank"
            class="text-gray-400 hover:text-gray-700 transition-colors"
            rel="noopener"
          >
            <stellar />
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Organization } from "shared";
import Github from "@/components/organization/logo/github.vue";
import Twitter from "@/components/organization/logo/twitter.vue";
import Stellar from "@/components/organization/logo/stellar.vue";
import useStore from "@/store/useStore";

defineProps<{
  organization: Organization;
}>();

const store = useStore();
</script>
