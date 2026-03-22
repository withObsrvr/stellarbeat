<template>
  <div class="relative inline-block">
    <button
      class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
      @click.stop="open = !open"
    >
      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>
    </button>
    <div
      v-show="open"
      class="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
    >
      <div class="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-gray-400">
        Simulation options
      </div>
      <a
        v-if="!network.isValidatorBlocked(node)"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="store.toggleValidating(node); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        {{ node.isValidating ? "Halt this node" : "Start validating" }}
      </a>
      <div v-else class="px-3 py-2 text-xs text-gray-400">
        Node blocked: quorumset not reaching threshold
      </div>
      <a
        v-if="supportsDelete"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="deleteValidatorFromQuorumSet(node, quorumSet); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Remove
      </a>
      <div class="border-t border-gray-100 px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-gray-400">
        Tools
      </div>
      <a
        v-if="supportsHaltingAnalysis"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="store.showHaltingAnalysis(node); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        Halting analysis
      </a>
      <a
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="copyPublicKey(); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        Copy public key
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Node, QuorumSet } from "shared";
import useStore from "@/store/useStore";
import { onMounted, onUnmounted, ref, toRefs } from "vue";

export interface Props {
  node: Node;
  supportsDelete?: boolean;
  quorumSet?: QuorumSet;
  supportsHaltingAnalysis?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  supportsDelete: false,
  supportsHaltingAnalysis: true,
  quorumSet: undefined,
});
const { node, supportsDelete, quorumSet, supportsHaltingAnalysis } =
  toRefs(props);

const store = useStore();
const network = store.network;
const open = ref(false);

const deleteValidatorFromQuorumSet = (
  node: Node,
  quorumSet: QuorumSet | undefined,
) => {
  if (!quorumSet) return;
  store.deleteValidatorFromQuorumSet(quorumSet, node);
};

function copyPublicKey() {
  navigator.clipboard.writeText(node.value.publicKey);
}

function closeOnOutsideClick(e: Event) {
  const el = (e.target as HTMLElement).closest('.relative.inline-block');
  if (!el) open.value = false;
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick));
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick));
</script>
