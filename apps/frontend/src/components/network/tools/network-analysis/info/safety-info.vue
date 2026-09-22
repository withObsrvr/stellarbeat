<template>
  <UiModal :id="'network-analysis-safety-info'" ref="modal" lazy hide-header size="lg">
    <div class="flex flex-col gap-5 text-sm leading-relaxed text-ink-body">
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Core forks if, and Nodes cut off by</h3>
        <p>Both figures answer the same question at different scopes: how many organizations would have to be <strong>actively dishonest at the same time</strong> to break agreement. Not offline &mdash; compromised, or deliberately lying. Failure alone cannot produce this.</p>
        <p><strong>Core forks if</strong> is measured across the top tier: what it takes to split the organizations that carry consensus into two groups that could confirm conflicting histories. <strong>Nodes cut off by</strong> is measured across every validating organization, and is usually the smaller of the two, because severing one outlying validator from the core takes less than splitting the core itself.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Why there are two numbers</h3>
        <p>Radar used to report only the top-tier figure while labelling it as though it covered the whole network. Running the same analysis unrestricted gives a different, lower answer, and both are true &mdash; they are answers to different questions. Showing one without saying which was the more misleading option.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Why they are the numbers they are</h3>
        <p>With a symmetric top tier of <em>T of N</em>, the top-tier figure is <strong>2T &minus; N</strong>. Two quorums of 7 drawn from 10 must overlap in 4 organizations; corrupt those 4 and they can tell each side a different story.</p>
        <p>So <strong>raising the threshold hardens safety</strong> and costs liveness, while adding organizations without raising it weakens safety. This is the opposite direction to the halting figure, which is why the two cannot both be maximised.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">When there is no such set at all</h3>
        <p>Sometimes no set of any size can break safety at a given grouping &mdash; on the public network today, no combination of ISPs can. That is the best possible answer, and Radar shows it as <em>unknown</em> rather than as a number, because writing it as 0 would read as &ldquo;no organizations need to fail&rdquo;, which is the opposite of what it means.</p>
        <p>A genuine 0 is different and much worse: it means some quorums do not intersect at all, so the network could already split. Radar reports that as <strong>Safety at risk</strong> in the verdict rather than as a threshold.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Limitations</h3>
        <p>Quorum intersection is computed across the network, so a badly configured validator at the edge can drag the result down. Radar filters out the clearest case &mdash; validators that trust only themselves. ISP and country grouping depends on geo lookups, which are not guaranteed to be correct.</p>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="text-base font-semibold text-ink-primary">Going deeper</h3>
        <p>The minimal splitting set section of <a target="_blank" rel="noopener" class="text-accent" href="https://arxiv.org/pdf/2002.08101.pdf">Fast and secure global payments with Stellar</a> covers the formal definition.</p>
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
