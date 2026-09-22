<template>
  <UiModal :id="'network-analysis-liveness-info'" ref="modal" lazy hide-header size="lg">
    <div class="flex flex-col gap-5 text-sm leading-relaxed text-ink-body">
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Halts if</h3>
        <p>This is the smallest number of organizations that would have to be <strong>offline at the same time</strong> for the network to stop closing ledgers.</p>
        <p>They do not have to misbehave. An outage, a bad deploy, or a data centre losing power all count. That is what makes this the number most worth watching day to day: outages are ordinary, and collusion is not.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Why it is the number it is</h3>
        <p>When every organization in the top tier declares the same quorum set of <em>T of N</em>, the answer is <strong>N &minus; T + 1</strong>. A top tier of 10 organizations with a threshold of 7 halts if 4 are lost: once 4 are gone, the remaining 6 cannot reach 7, so no quorum can form.</p>
        <p>It follows that <strong>lowering the threshold, or adding organizations without raising it, makes this number larger</strong> &mdash; more failures tolerated. The trade is safety: the same change makes the network easier to fork. The two figures move in opposite directions.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Where the number comes from</h3>
        <p>Formally this is the size of a <em>minimal blocking set</em>: the smallest set of validators that appears in every quorum, so that losing all of them leaves no quorum intact. Radar reports it grouped by organization, because an organization is the unit that actually fails &mdash; three validators at one operator go down together. The network analysis tool can also group by node, ISP and country.</p>
        <p>Two caveats. A validator is counted as not validating if it was not validating during the last crawl, so a node that is merely slow or catching up can be counted as down. And ISP and country grouping depends on geo lookups, which are not guaranteed to be correct.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Going deeper</h3>
        <p>The minimal blocking set section of <a target="_blank" rel="noopener" class="text-accent" href="https://arxiv.org/pdf/2002.08101.pdf">Fast and secure global payments with Stellar</a> covers the formal definition.</p>
      </section>
    </div>
    <template #modal-footer>
      <div class="flex w-full items-center justify-between gap-3">
        <p class="text-xs text-ink-muted">
          Computed by
          <a
            target="_blank"
            rel="noopener"
            class="text-accent"
            href="https://github.com/nano-o/python-fbas"
            >python-fbas</a
          >, with
          <a
            target="_blank"
            rel="noopener"
            class="text-accent"
            href="https://github.com/wiberlin/fbas_analyzer"
            >wiberlin/fbas_analyzer</a
          >
          as a fallback.
        </p>
        <button
          class="rounded-lg bg-ink-primary px-3 py-1.5 text-sm font-medium text-surface-card transition-colors hover:bg-ink-strong"
          @click="hideModal"
        >
          Close
        </button>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

const modal = ref(null);

function hideModal() {
  if (modal.value) (modal.value as any).hide();
}

// Exposed so callers can open the explainer. Without this the component can
// only be opened by the global show-modal-global event, which belongs to the
// Bootstrap compatibility layer that has been removed.
function showModal() {
  if (modal.value) (modal.value as any).show();
}

defineExpose({ show: showModal, hide: hideModal });
</script>
