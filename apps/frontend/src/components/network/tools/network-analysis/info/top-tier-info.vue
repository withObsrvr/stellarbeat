<template>
  <UiModal :id="'network-analysis-top-tier-info'" ref="modal" lazy hide-header size="lg">
    <div class="flex flex-col gap-5 text-sm leading-relaxed text-ink-body">
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Top tier</h3>
        <p>The organizations that actually decide. Every other validator ultimately depends on them, so the network&rsquo;s safety and liveness margins are determined by this set and nothing else.</p>
        <p>The gap between this and the validator count is the point. A network can show ninety validators and still be decided by ten organizations, because three validators run by one operator fail together. Radar reports organizations for that reason.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Symmetric</h3>
        <p>The top tier is <strong>symmetric</strong> when every member declares the same quorum set. That is not a quality judgement &mdash; an asymmetric top tier is not broken &mdash; but it has two practical consequences: the network is much easier to reason about, and the analysis is far faster to compute. When the top tier is asymmetric and large, Radar may not be able to finish the analysis automatically.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Why it matters for the other figures</h3>
        <p>A symmetric top tier is what makes the arithmetic behind the other numbers hold: with <em>T of N</em>, halting takes <strong>N &minus; T + 1</strong> organizations and forking the core takes <strong>2T &minus; N</strong>. Those shortcuts do not apply once members disagree about who they trust.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Going deeper</h3>
        <p><a target="_blank" rel="noopener" class="text-accent" href="https://arxiv.org/pdf/2002.08101.pdf">Fast and secure global payments with Stellar</a> introduces the top tier concept.</p>
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
