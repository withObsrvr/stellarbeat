import { type NetworkStatistics } from "shared";

/**
 * Turns scan statistics into the plain-language network verdict.
 *
 * Deliberately a pure function rather than logic inside the template: the copy
 * a validator operator reads is the deliverable here, so it needs to be
 * testable against fixtures rather than only visible by running the app.
 */

export type VerdictLevel = "safe" | "fragile" | "at-risk" | "unknown";

export type Tone = "neutral" | "safe" | "warn" | "risk";

export interface VerdictStat {
  label: string;
  value: string;
  caption: string;
  tone: Tone;
}

export interface VerdictDetail {
  label: string;
  value: string;
  tone: Tone;
}

export interface Verdict {
  level: VerdictLevel;
  //short status beside the dot, e.g. "Network safe · fragile"
  label: string;
  //one or two sentences answering "should I be worried?"
  summary: string;
  stats: VerdictStat[];
  topTier: VerdictDetail[];
  concentration: VerdictDetail[];
}

//Below this many organizations, losing one is enough to matter. Two is the
//point where a single failure still leaves a margin.
const RISK_AT_OR_BELOW = 1;
const WARN_AT_OR_BELOW = 2;

function toneForSize(size: number | undefined): Tone {
  if (size === undefined) return "neutral";
  if (size <= RISK_AT_OR_BELOW) return "risk";
  if (size <= WARN_AT_OR_BELOW) return "warn";
  return "neutral";
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Renders a count that may not have been computed.
 *
 * "Unknown" is not "0". A scan that could not answer must not be displayed as
 * a threshold of zero organizations, which reads as the most alarming possible
 * finding rather than as missing data.
 */
function sizeValue(
  size: number | undefined,
  singular: string,
  plural: string,
): string {
  if (size === undefined) return "Unknown";
  return pluralize(size, singular, plural);
}

export function deriveVerdict(statistics: NetworkStatistics): Verdict {
  const haltsIf = statistics.minBlockingSetOrgsFilteredSize;
  const coreForksIf = statistics.minSplittingSetOrgsTopTierSize;
  const cutOffBy = statistics.minSplittingSetOrgsSize;

  const level = deriveLevel(statistics, haltsIf);

  //A fork is the failure mode being described, so once safety is at risk both
  //splitting-set figures are reported in that register regardless of size.
  const forkTone = (size: number | undefined): Tone =>
    level === "at-risk" ? "risk" : toneForSize(size);

  return {
    level,
    label: labelFor(level),
    summary: summaryFor(level, haltsIf),
    stats: [
      {
        label: "Halts if",
        value: sizeValue(haltsIf, "org fails", "orgs fail"),
        caption: "smallest set of organizations whose failure stops new ledgers",
        tone: toneForSize(haltsIf),
      },
      {
        label: "Core forks if",
        value: sizeValue(coreForksIf, "org colludes", "orgs collude"),
        caption: "smallest set that could split the top tier itself",
        tone: forkTone(coreForksIf),
      },
      {
        label: "Nodes cut off by",
        value: sizeValue(cutOffBy, "org", "orgs"),
        caption:
          "smallest set that could separate a node from the rest of the network",
        tone: forkTone(cutOffBy),
      },
    ],
    topTier: topTierDetail(statistics),
    concentration: concentrationDetail(statistics),
  };
}

function deriveLevel(
  statistics: NetworkStatistics,
  haltsIf: number | undefined,
): VerdictLevel {
  //undefined means the scan did not answer, which is not the same as "no"
  if (statistics.hasQuorumIntersection === undefined) return "unknown";
  if (!statistics.hasQuorumIntersection) return "at-risk";

  //Safety holds, but if a single organization going offline can stop the
  //network then saying only "safe" would be misleading.
  if (haltsIf !== undefined && haltsIf <= RISK_AT_OR_BELOW) return "fragile";

  return "safe";
}

function labelFor(level: VerdictLevel): string {
  switch (level) {
    case "safe":
      return "Network safe";
    case "fragile":
      return "Network safe · fragile";
    case "at-risk":
      return "Safety at risk";
    case "unknown":
      return "Analysis unavailable";
  }
}

function summaryFor(level: VerdictLevel, haltsIf: number | undefined): string {
  switch (level) {
    case "safe":
      return "Safety is guaranteed and all quorums intersect. The network cannot fork under its current configuration.";
    case "fragile":
      return haltsIf === 1
        ? "Safety is guaranteed, but liveness depends on a single organization. If it goes offline, the network stops producing ledgers."
        : "Safety is guaranteed, but liveness depends on a small set of operators. A single failure could halt new ledgers.";
    case "at-risk":
      return "Not all quorums intersect. Under some failure conditions the network could split into conflicting histories.";
    case "unknown":
      return "The most recent scan could not complete the quorum analysis, so the network's safety cannot be reported right now.";
  }
}

function topTierDetail(statistics: NetworkStatistics): VerdictDetail[] {
  const size = statistics.topTierOrgsSize;

  return [
    {
      label: "Top tier",
      value: sizeValue(size, "org", "orgs"),
      tone: "neutral",
    },
    {
      label: "Structure",
      value: statistics.hasSymmetricTopTier ? "symmetric" : "not symmetric",
      //Asymmetry is not a fault, only a reason analysis is slower and trust is
      //unevenly expressed, so it is a note rather than a warning.
      tone: statistics.hasSymmetricTopTier ? "safe" : "neutral",
    },
  ];
}

function concentrationDetail(statistics: NetworkStatistics): VerdictDetail[] {
  return [
    {
      label: "orgs",
      value: countValue(statistics.minBlockingSetOrgsFilteredSize),
      tone: toneForSize(statistics.minBlockingSetOrgsFilteredSize),
    },
    {
      label: "ISPs",
      value: countValue(statistics.minBlockingSetISPFilteredSize),
      tone: toneForSize(statistics.minBlockingSetISPFilteredSize),
    },
    {
      label: "countries",
      value: countValue(statistics.minBlockingSetCountryFilteredSize),
      tone: toneForSize(statistics.minBlockingSetCountryFilteredSize),
    },
  ];
}

function countValue(size: number | undefined): string {
  return size === undefined ? "—" : String(size);
}
