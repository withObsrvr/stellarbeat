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
      class="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
    >
      <div class="px-3 py-1.5 text-2xs font-semibold uppercase tracking-wider text-gray-400">
        Simulation options
      </div>
      <a
        v-if="level === 0"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="showAddOrgsModal = true; open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Add organization
      </a>
      <a
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="showAddValidatorsModal = true; open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Add Validators
      </a>
      <a
        v-if="!(level === 2)"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="addQuorumSet(); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Add QuorumSet
      </a>
      <a
        v-if="!(level === 0)"
        class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
        @click.prevent.stop="deleteQuorumSet(); open = false"
      >
        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Delete QuorumSet
      </a>
      <div class="border-t border-gray-100 px-3 py-2">
        <div class="flex items-center gap-1.5">
          <svg class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          <label class="text-xs text-gray-600">Threshold</label>
          <input
            v-model="newThreshold"
            class="rounded border border-gray-200 px-1.5 py-0.5 text-xs w-10"
            type="number"
          />
        </div>
        <button
          class="rounded-lg bg-gray-900 px-2 py-1 text-xs font-medium text-white hover:bg-gray-800 transition-colors mt-1.5 w-full"
          @click="saveThresholdFromInput(); open = false"
        >
          Save Threshold
        </button>
      </div>
      <div class="border-t border-gray-100">
        <a
          class="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
          @click.prevent.stop="showTomlModal = true; open = false"
        >
          <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Stellar core config
        </a>
      </div>
    </div>
    <QuorumSetTomlExportModal :id="id" :quorum-set="quorumSet" :show="showTomlModal" @close="showTomlModal = false" />
    <QuorumSetAddOrganizationsModal :id="id" :quorum-set="quorumSet" :show="showAddOrgsModal" @close="showAddOrgsModal = false" />
    <QuorumSetAddValidatorsModal :id="id" :quorum-set="quorumSet" :show="showAddValidatorsModal" @close="showAddValidatorsModal = false" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, toRefs } from "vue";
import { QuorumSet } from "shared";
import useStore from "@/store/useStore";
import QuorumSetTomlExportModal from "@/components/node/sidebar/quorum-set-toml-export-modal.vue";
import QuorumSetAddOrganizationsModal from "@/components/node/sidebar/quorum-set-add-organizations-modal.vue";
import QuorumSetAddValidatorsModal from "@/components/node/sidebar/quorum-set-add-validators-modal.vue";

export interface Props {
  quorumSet: QuorumSet;
  parentQuorumSet: QuorumSet | null | undefined;
  level: number | undefined;
}
const props = withDefaults(defineProps<Props>(), {
  level: 0,
  parentQuorumSet: null,
});
const { quorumSet, parentQuorumSet, level } = toRefs(props);
const emit = defineEmits(["expand"]);

const newThreshold = ref(quorumSet.value.threshold);
const id = ref(Math.ceil(Math.random() * 1000));
const open = ref(false);
const showTomlModal = ref(false);
const showAddOrgsModal = ref(false);
const showAddValidatorsModal = ref(false);

const store = useStore();

function deleteQuorumSet() {
  if (!parentQuorumSet.value) return;
  store.deleteInnerQuorumSet(quorumSet.value, parentQuorumSet.value);
}

function addQuorumSet() {
  store.addInnerQuorumSet(quorumSet.value);
  emit("expand");
}

function saveThresholdFromInput() {
  if (newThreshold.value <= 0) return;
  store.editQuorumSetThreshold(quorumSet.value, Number(newThreshold.value));
}

function closeOnOutsideClick(e: Event) {
  const el = (e.target as HTMLElement).closest('.relative.inline-block');
  if (!el) open.value = false;
}

onMounted(() => document.addEventListener('click', closeOnOutsideClick));
onUnmounted(() => document.removeEventListener('click', closeOnOutsideClick));
</script>

<style scoped>
.thresholdEdit {
  margin-left: 10px;
  width: 45px !important;
}
</style>
