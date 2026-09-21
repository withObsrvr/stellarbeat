import { NetworkStatistics } from "shared";
import { deriveVerdict } from "../deriveVerdict";

/**
 * The copy in the verdict block is the deliverable, so these fixtures pin the
 * wording a validator operator actually reads, not just the numbers behind it.
 */
function statistics(overrides: Partial<NetworkStatistics> = {}) {
  const stats = new NetworkStatistics();
  stats.hasQuorumIntersection = true;
  stats.hasSymmetricTopTier = true;
  stats.topTierOrgsSize = 7;
  stats.minBlockingSetOrgsFilteredSize = 3;
  stats.minBlockingSetISPFilteredSize = 3;
  stats.minBlockingSetCountryFilteredSize = 4;
  stats.minSplittingSetOrgsSize = 2;
  stats.minSplittingSetOrgsTopTierSize = 3;
  return Object.assign(stats, overrides);
}

describe("deriveVerdict", () => {
  describe("level", () => {
    it("is safe when quorums intersect and no single org can halt the network", () => {
      const verdict = deriveVerdict(statistics());

      expect(verdict.level).toBe("safe");
      expect(verdict.label).toBe("Network safe");
      expect(verdict.summary).toContain("cannot fork");
    });

    it("is fragile when a single organization can halt the network", () => {
      const verdict = deriveVerdict(
        statistics({ minBlockingSetOrgsFilteredSize: 1 }),
      );

      expect(verdict.level).toBe("fragile");
      expect(verdict.label).toBe("Network safe · fragile");
      expect(verdict.summary).toContain("a single organization");
    });

    it("is at risk when quorums do not intersect", () => {
      const verdict = deriveVerdict(
        statistics({ hasQuorumIntersection: false }),
      );

      expect(verdict.level).toBe("at-risk");
      expect(verdict.label).toBe("Safety at risk");
      expect(verdict.summary).toContain("conflicting histories");
    });

    it("reports at-risk ahead of fragile when both apply", () => {
      const verdict = deriveVerdict(
        statistics({
          hasQuorumIntersection: false,
          minBlockingSetOrgsFilteredSize: 1,
        }),
      );

      expect(verdict.level).toBe("at-risk");
    });

    it("is unknown, not at-risk, when the scan could not answer", () => {
      const verdict = deriveVerdict(
        statistics({ hasQuorumIntersection: undefined }),
      );

      expect(verdict.level).toBe("unknown");
      expect(verdict.label).toBe("Analysis unavailable");
    });
  });

  describe("the two safety thresholds", () => {
    it("reads the top-tier figure for the core and the network-wide one for cut-off", () => {
      const verdict = deriveVerdict(
        statistics({
          minSplittingSetOrgsTopTierSize: 3,
          minSplittingSetOrgsSize: 2,
        }),
      );

      const core = verdict.stats.find((s) => s.label === "Core forks if");
      const cutOff = verdict.stats.find((s) => s.label === "Nodes cut off by");

      expect(core?.value).toBe("3 orgs collude");
      expect(cutOff?.value).toBe("2 orgs");
    });

    it("says Unknown rather than 0 when the top-tier figure was not computed", () => {
      const verdict = deriveVerdict(
        statistics({ minSplittingSetOrgsTopTierSize: undefined }),
      );

      const core = verdict.stats.find((s) => s.label === "Core forks if");

      expect(core?.value).toBe("Unknown");
      expect(core?.value).not.toContain("0");
    });

    it("keeps a genuine zero distinct from a missing answer", () => {
      const verdict = deriveVerdict(
        statistics({ minSplittingSetOrgsTopTierSize: 0 }),
      );

      expect(
        verdict.stats.find((s) => s.label === "Core forks if")?.value,
      ).toBe("0 orgs collude");
    });
  });

  describe("wording", () => {
    it("uses the singular when exactly one organization is involved", () => {
      const verdict = deriveVerdict(
        statistics({
          minBlockingSetOrgsFilteredSize: 1,
          minSplittingSetOrgsSize: 1,
        }),
      );

      expect(verdict.stats[0].value).toBe("1 org fails");
      expect(
        verdict.stats.find((s) => s.label === "Nodes cut off by")?.value,
      ).toBe("1 org");
    });

    it("uses the plural otherwise", () => {
      const verdict = deriveVerdict(
        statistics({ minBlockingSetOrgsFilteredSize: 3 }),
      );

      expect(verdict.stats[0].value).toBe("3 orgs fail");
    });
  });

  describe("tone", () => {
    it("marks a single point of failure as risk", () => {
      const verdict = deriveVerdict(
        statistics({ minBlockingSetOrgsFilteredSize: 1 }),
      );

      expect(verdict.stats[0].tone).toBe("risk");
    });

    it("marks a thin margin as a warning", () => {
      const verdict = deriveVerdict(
        statistics({ minBlockingSetOrgsFilteredSize: 2 }),
      );

      expect(verdict.stats[0].tone).toBe("warn");
    });

    it("leaves a healthy margin neutral", () => {
      const verdict = deriveVerdict(
        statistics({ minBlockingSetOrgsFilteredSize: 5 }),
      );

      expect(verdict.stats[0].tone).toBe("neutral");
    });

    it("reports both fork figures as risk once safety is at risk", () => {
      const verdict = deriveVerdict(
        statistics({
          hasQuorumIntersection: false,
          minSplittingSetOrgsTopTierSize: 9,
          minSplittingSetOrgsSize: 9,
        }),
      );

      expect(
        verdict.stats.find((s) => s.label === "Core forks if")?.tone,
      ).toBe("risk");
      expect(
        verdict.stats.find((s) => s.label === "Nodes cut off by")?.tone,
      ).toBe("risk");
    });

    it("does not treat an asymmetric top tier as a fault", () => {
      const verdict = deriveVerdict(
        statistics({ hasSymmetricTopTier: false }),
      );

      const structure = verdict.topTier.find((d) => d.label === "Structure");

      expect(structure?.value).toBe("not symmetric");
      expect(structure?.tone).toBe("neutral");
    });
  });

  describe("concentration", () => {
    it("shows an em dash for a level that was not analysed", () => {
      const verdict = deriveVerdict(
        statistics({ minBlockingSetCountryFilteredSize: undefined }),
      );

      const countries = verdict.concentration.find(
        (d) => d.label === "countries",
      );

      expect(countries?.value).toBe("—");
    });
  });
});

describe("deriveVerdict with values absent from the API", () => {
  /**
   * The API omits a statistic the scan did not compute, and the database
   * stores it as null. Both must read as Unknown rather than as a threshold,
   * which is the bug this whole distinction exists to prevent.
   */
  function bare(overrides: Record<string, unknown> = {}) {
    return Object.assign(new NetworkStatistics(), {
      hasQuorumIntersection: true,
      hasSymmetricTopTier: true,
      minBlockingSetOrgsFilteredSize: 4,
      minSplittingSetOrgsSize: 4,
      ...overrides,
    });
  }

  it("treats null the same as a missing value", () => {
    const verdict = deriveVerdict(
      bare({ minSplittingSetOrgsTopTierSize: null }),
    );

    expect(
      verdict.stats.find((s) => s.label === "Core forks if")?.value,
    ).toBe("Unknown");
  });

  it("does not claim fragility when the blocking set is unknown", () => {
    const verdict = deriveVerdict(
      bare({ minBlockingSetOrgsFilteredSize: null }),
    );

    expect(verdict.level).toBe("safe");
    expect(verdict.stats[0].value).toBe("Unknown");
    expect(verdict.stats[0].tone).toBe("neutral");
  });

  it("shows an em dash for a null concentration level", () => {
    const verdict = deriveVerdict(
      bare({ minBlockingSetCountryFilteredSize: null }),
    );

    expect(
      verdict.concentration.find((d) => d.label === "countries")?.value,
    ).toBe("—");
  });
});
