<template>
  <UiModal :id="'network-analysis-qi-info'" ref="modal" lazy hide-header size="lg">
    <div class="flex flex-col gap-5 text-sm leading-relaxed text-ink-body">
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">The verdict</h3>
        <p>This line answers one question: <strong>could the network split into two histories that both look valid?</strong></p>
        <p><strong>Network safe</strong> means every possible quorum overlaps with every other, so two groups of validators cannot both reach agreement on conflicting ledgers. It is a statement about the configuration, not about anyone&rsquo;s honesty &mdash; it holds no matter who fails.</p>
        <p><strong>Safety at risk</strong> means that is no longer true: some quorums do not overlap, and under the right failure the network could diverge. This is a configuration problem, and it is fixed by changing the quorum sets of the validators causing it, not by waiting.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Safe, but fragile</h3>
        <p>Radar adds <strong>fragile</strong> when safety holds but a single organization going offline would stop the network. Both things are worth knowing and they are not the same risk: a fragile network is intact and easily interrupted, and interruption is far more likely than collusion.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Where the number comes from</h3>
        <p>A <em>quorum</em> is a set of validators that can reach agreement on its own. A <em>minimal quorum</em> is one that contains no smaller quorum. If every minimal quorum shares at least one member with every other, the network has quorum intersection and cannot fork. The network analysis tool lists the minimal quorums themselves.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Going deeper</h3>
        <p><a target="_blank" rel="noopener" class="text-accent" href="https://arxiv.org/pdf/2002.08101.pdf">Fast and secure global payments with Stellar</a> sets out the model this is built on.</p>
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
