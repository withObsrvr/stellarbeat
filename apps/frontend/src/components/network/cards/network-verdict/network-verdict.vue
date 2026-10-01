<template>
  <section
    class="rounded-2xl border border-line bg-surface-card p-6 shadow-card sm:p-8"
    aria-labelledby="network-verdict-heading"
  >
    <!-- Tier 1: the answer -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <span
          class="h-3 w-3 flex-none rounded-full"
          :class="dotClass"
          :style="{ boxShadow: `0 0 0 4px ${haloColor}` }"
          aria-hidden="true"
        ></span>
        <h2
          id="network-verdict-heading"
          class="text-base font-semibold tracking-tight"
          :class="labelClass"
        >
          {{ verdict.label }}
        </h2>
        <button
          type="button"
          class="rounded-full p-0.5 text-ink-muted hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          :aria-label="`How ${verdict.label.toLowerCase()} is determined`"
          @click="explain(verdict.infoTopic)"
        >
          <InfoIcon />
        </button>
      </div>
      <span v-if="updatedAt" class="font-mono text-xs text-ink-muted">
        as of {{ updatedAt }}
      </span>
    </div>

    <p class="mt-4 max-w-[62ch] text-lg font-normal leading-snug text-ink-strong">
      {{ verdict.summary }}
    </p>

    <div class="my-6 h-px bg-line"></div>

    <!-- Tier 2: the three numbers -->
    <dl class="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="stat in verdict.stats" :key="stat.label" class="flex flex-col gap-2">
        <dt
          class="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-ink-muted"
        >
          {{ stat.label }}
          <button
            type="button"
            class="rounded-full text-ink-muted hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            :aria-label="`What ${stat.label.toLowerCase()} means`"
            @click="explain(stat.infoTopic)"
          >
            <InfoIcon />
          </button>
        </dt>
        <dd class="flex flex-col gap-1.5">
          <span
            class="tabular font-mono text-2xl font-medium leading-tight"
            :class="toneTextClass(stat.tone)"
          >
            {{ stat.value }}
          </span>
          <span class="text-[13px] leading-snug text-ink-body">{{ stat.caption }}</span>
        </dd>
      </div>
    </dl>

    <div class="my-6 h-px bg-line"></div>

    <!-- Tiers 4 and 5: supporting detail -->
    <div class="flex flex-col gap-2.5 text-[13.5px] text-ink-body">
      <div class="flex flex-wrap items-center gap-2">
        <span>Top tier:</span>
        <button
          type="button"
          class="rounded-full text-ink-muted hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          aria-label="What the top tier means"
          @click="explain('top-tier')"
        >
          <InfoIcon />
        </button>
        <span
          v-for="(detail, index) in verdict.topTier"
          :key="detail.label"
          class="flex items-center gap-2"
        >
          <span v-if="index > 0" class="text-ink-muted" aria-hidden="true">·</span>
          <span class="font-medium" :class="toneTextClass(detail.tone)">
            {{ detail.value }}
          </span>
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span>Concentration — halts if:</span>
        <span
          v-for="(detail, index) in verdict.concentration"
          :key="detail.label"
          class="flex items-center gap-2"
        >
          <span v-if="index > 0" class="text-ink-muted" aria-hidden="true">·</span>
          <span class="whitespace-nowrap">
            {{ detail.label }}
            <b
              class="tabular font-mono text-[13px] font-medium"
              :class="toneTextClass(detail.tone)"
              >{{ detail.value }}</b
            >
          </span>
        </span>
      </div>
    </div>

    <!-- The plain-language wording above is a summary. These are the existing
         FBAS explainers, reused rather than restated, so a reader can always
         reach the real definition. -->
    <QuorumIntersectionInfo ref="quorumIntersectionInfo" />
    <LivenessInfo ref="livenessInfo" />
    <SafetyInfo ref="safetyInfo" />
    <TopTierInfo ref="topTierInfo" />

    <!-- The detailed engine output is demoted, not removed -->
    <template v-if="$slots.details">
      <div class="mb-5 mt-6 h-px bg-line"></div>
      <slot name="details"></slot>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { type NetworkStatistics } from "shared";
import {
  deriveVerdict,
  type InfoTopic,
  type Tone,
} from "./deriveVerdict";
import InfoIcon from "./InfoIcon.vue";
import QuorumIntersectionInfo from "@/components/network/tools/network-analysis/info/quorum-intersection-info.vue";
import LivenessInfo from "@/components/network/tools/network-analysis/info/liveness-info.vue";
import SafetyInfo from "@/components/network/tools/network-analysis/info/safety-info.vue";
import TopTierInfo from "@/components/network/tools/network-analysis/info/top-tier-info.vue";

type Explainer = { show: () => void } | null;

const quorumIntersectionInfo = ref<Explainer>(null);
const livenessInfo = ref<Explainer>(null);
const safetyInfo = ref<Explainer>(null);
const topTierInfo = ref<Explainer>(null);

function explain(topic: InfoTopic) {
  const explainer: Record<InfoTopic, Explainer> = {
    "quorum-intersection": quorumIntersectionInfo.value,
    liveness: livenessInfo.value,
    safety: safetyInfo.value,
    "top-tier": topTierInfo.value,
  };

  explainer[topic]?.show();
}

const props = defineProps<{
  statistics: NetworkStatistics;
  updatedAt?: string;
}>();

const verdict = computed(() => deriveVerdict(props.statistics));

/**
 * The dot carries the verdict for anyone scanning the page rather than reading
 * it, so it tracks the level directly rather than any individual statistic.
 */
const dotClass = computed(() => {
  switch (verdict.value.level) {
    case "safe":
      return "bg-signal-safe";
    case "fragile":
      return "bg-signal-warn";
    case "at-risk":
      return "bg-signal-risk";
    case "unknown":
      return "bg-signal-neutral";
  }
  return "bg-signal-neutral";
});

//Read from the same tokens the classes above use, so the halo cannot drift out
//of step with the dot or fall back to a light-theme color in dark mode.
const haloColor = computed(() => {
  const token = {
    safe: "--color-signal-safe",
    fragile: "--color-signal-warn",
    "at-risk": "--color-signal-risk",
    unknown: "--color-signal-neutral",
  }[verdict.value.level];

  return `color-mix(in srgb, var(${token}) 18%, transparent)`;
});

//Only an actual safety problem colors the headline; "fragile" stays in the
//default ink so the page does not cry wolf about a network that is safe.
const labelClass = computed(() =>
  verdict.value.level === "at-risk" ? "text-signal-risk" : "text-ink-primary",
);

function toneTextClass(tone: Tone): string {
  switch (tone) {
    case "safe":
      return "text-signal-safe";
    case "warn":
      return "text-signal-warn";
    case "risk":
      return "text-signal-risk";
    default:
      return "text-ink-primary";
  }
}
</script>
