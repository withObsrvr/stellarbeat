<template>
  <div class="rounded-xl border border-gray-200 bg-white">
    <div class="py-0 flex flex-col items-center px-4">
      <h3 class="mt-5 mb-4 text-center flex items-start">
        <full-validator-title :node="node" />
        <UiBadge
          v-show="network.isNodeFailing(node)"
          v-tooltip:top="network.getNodeFailingReason(node).description"
          variant="danger"
          class="ml-1"
          >{{ network.getNodeFailingReason(node).label }}</UiBadge
        >
      </h3>
      <table class="w-full text-sm">
        <thead>
          <tr>
            <th class="px-0"></th>
            <th class="px-0 text-right"></th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-gray-500">
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              Public key
            </td>
            <td class="px-0 text-right">
              {{ node.publicKey.substring(0, 7) }}...{{
                node.publicKey.substring(51, 100)
              }}
              <button
                v-tooltip:top="'Copy to clipboard'"
                type="button"
                class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                @click="copyPublicKey"
              >
                <svg class="h-3.5 w-3.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </td>
          </tr>
          <tr class="text-gray-500">
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              host
            </td>
            <td class="px-0 text-right">{{ node.host }}</td>
          </tr>

          <tr class="text-gray-500">
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              ip:port
            </td>
            <td class="px-0 text-right">{{ node.key }}</td>
          </tr>
          <tr
            v-if="node.versionStr"
            v-tooltip:top="node.versionStr"
            class="text-gray-500"
          >
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              Version
            </td>
            <td class="px-0 text-right">
              {{ truncate(node.versionStr, 35) }}
            </td>
          </tr>
          <tr class="text-gray-500">
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              Country
            </td>
            <td class="px-0 text-right">
              {{ node.geoData.countryName ? node.geoData.countryName : "N/A" }}
            </td>
          </tr>
          <tr class="text-gray-500">
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              ISP
            </td>
            <td class="px-0 text-right">
              {{ node.isp ? node.isp : "N/A" }}
            </td>
          </tr>
          <tr class="text-gray-500">
            <td class="px-0" style="font-weight: 600; font-size: 0.875rem">
              Discovery date
            </td>
            <td class="px-0 text-right">
              {{ node.dateDiscovered.toDateString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Node } from "shared";

import FullValidatorTitle from "@/components/node/full-validator-title.vue";
import useStore from "@/store/useStore";
import { useTruncate } from "@/composables/useTruncate";

const store = useStore();
const network = store.network;
const props = defineProps<{
  node: Node;
}>();

const truncate = useTruncate();

function copyPublicKey() {
  navigator.clipboard.writeText(props.node.publicKey);
}
</script>
