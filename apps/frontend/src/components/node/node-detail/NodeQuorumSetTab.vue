<template>
  <div>
    <div class="flex items-center gap-3 mb-2">
      <h3 class="text-2xs font-semibold uppercase tracking-wider text-gray-400">Quorum Set</h3>
      <UiBadge variant="amber">{{ node.quorumSet.threshold }} of {{ totalValidators }}</UiBadge>
    </div>
    <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
        <!-- Inner quorum sets (organizations) -->
        <div
          v-for="(qs, idx) in quorumSetEntries"
          :key="idx"
          :class="[
            'rounded-lg border p-3',
            qs.isSelf ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200',
          ]"
        >
          <div :class="[
            'text-2xs font-bold uppercase tracking-wider mb-2',
            qs.isSelf ? 'text-emerald-700' : 'text-gray-700',
          ]">{{ qs.name }}</div>
          <div class="text-2xs text-gray-500 mb-2">{{ qs.threshold }}</div>
          <div class="flex flex-col gap-1">
            <div
              v-for="n in qs.nodes"
              :key="n.publicKey"
              class="flex items-center gap-1.5"
            >
              <span :class="[
                'h-1.5 w-1.5 rounded-full',
                n.isValidating ? 'bg-emerald-500' : 'bg-red-400',
              ]"></span>
              <router-link
                :to="{
                  name: 'node-dashboard',
                  params: { publicKey: n.publicKey },
                  query: routeQuery,
                }"
                class="font-mono text-2xs text-gray-500 hover:text-gray-900 transition-colors"
              >{{ n.name }}</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Node, QuorumSet } from 'shared';
import useStore from '@/store/useStore';
import { useRoute } from 'vue-router';

const props = defineProps<{
  node: Node;
}>();

const store = useStore();
const network = store.network;
const route = useRoute();

const routeQuery = computed(() => ({
  view: route.query.view,
  network: route.query.network,
  at: route.query.at,
}));

interface QSEntry {
  name: string;
  threshold: string;
  isSelf: boolean;
  nodes: { publicKey: string; name: string; isValidating: boolean }[];
}

const totalValidators = computed(() =>
  QuorumSet.getAllValidators(props.node.quorumSet).length,
);

const quorumSetEntries = computed<QSEntry[]>(() => {
  const entries: QSEntry[] = [];

  // Top-level validators (not in inner quorum sets)
  if (props.node.quorumSet.validators.length > 0) {
    const nodes = props.node.quorumSet.validators.map((pk) => {
      const n = network.getNodeByPublicKey(pk);
      return {
        publicKey: pk,
        name: n.displayName,
        isValidating: n.isValidating,
      };
    });

    // Check if this node's org is represented
    const nodeOrg = props.node.organizationId
      ? network.getOrganizationById(props.node.organizationId)
      : null;
    const isSelf = nodes.some((n) => n.publicKey === props.node.publicKey);

    entries.push({
      name: nodeOrg ? nodeOrg.name : 'Direct',
      threshold: props.node.quorumSet.threshold + ' of ' + (props.node.quorumSet.validators.length + props.node.quorumSet.innerQuorumSets.length),
      isSelf,
      nodes,
    });
  }

  // Inner quorum sets
  for (const innerQs of props.node.quorumSet.innerQuorumSets) {
    const nodes = innerQs.validators.map((pk) => {
      const n = network.getNodeByPublicKey(pk);
      return {
        publicKey: pk,
        name: n.displayName,
        isValidating: n.isValidating,
      };
    });

    // Try to find org name from first validator
    let orgName = 'Unknown';
    if (nodes.length > 0) {
      const firstNode = network.getNodeByPublicKey(innerQs.validators[0]);
      if (firstNode.organizationId) {
        const org = network.getOrganizationById(firstNode.organizationId);
        if (org) orgName = org.name;
      }
    }

    entries.push({
      name: orgName,
      threshold: innerQs.threshold + ' of ' + innerQs.validators.length,
      isSelf: false,
      nodes,
    });
  }

  return entries;
});
</script>
