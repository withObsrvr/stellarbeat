<template>
  <UiModal
    v-model="isOpen"
    title="Stellar Core Config"
    size="lg"
    ok-only
    ok-title="Close"
    lazy
    @shown="loadTomlExport"
    @ok="close"
  >
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <pre class="overflow-x-auto text-xs"><code>{{ tomlNodesExport }}</code></pre>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
/**
 * Converted from a raw Bootstrap `.modal` driven by `$(el).modal("show")`.
 *
 * Bootstrap's JavaScript is never loaded -- only its CSS -- so the jQuery
 * plugin call did nothing and this dialog could not open at all. The content
 * is generated on open rather than up front, which the old code did with a
 * `show.bs.modal` handler and UiModal expresses as @shown.
 */
import { StellarCoreConfigurationGenerator, QuorumSet } from "shared";
import useStore from "@/store/useStore";
import { computed, type PropType, ref, toRefs } from "vue";

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  quorumSet: {
    type: Object as PropType<QuorumSet>,
    required: true,
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

const { quorumSet } = toRefs(props);
const store = useStore();
const network = store.network;
const tomlNodesExport = ref("");

//The parent owns the open state, so writing back goes through the close event
//rather than mutating the prop.
const isOpen = computed({
  get: () => props.show,
  set: (value: boolean) => {
    if (!value) emit("close");
  },
});

function close() {
  emit("close");
}

function loadTomlExport() {
  const stellarCoreConfigurationGenerator =
    new StellarCoreConfigurationGenerator(network);
  tomlNodesExport.value = stellarCoreConfigurationGenerator.quorumSetToToml(
    quorumSet.value,
  );
}
</script>
