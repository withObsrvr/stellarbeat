# Python FBAS Migration Strategy: Full Replacement of Rust

**Goal**: Complete replacement of Rust FBAS scanner with Python implementation
**Reason**: Rust implementation has scalability/capability cap blocking progress
**Timeline**: 6-8 weeks for full migration
**Status**: Migration Plan

---

## 🎯 Strategic Goal

**From**: Rust scanner with limitations
**To**: Python scanner with full feature parity + new capabilities
**Why**: Rust has a cap preventing:
- Scaling to larger networks
- Adding new analysis types
- Maintaining/updating algorithms
- [Other limitations - to be documented]

---

## 📊 Feature Gap Analysis

### What Rust Has That Python Needs

| Feature | Rust | Python | Migration Strategy |
|---------|------|--------|-------------------|
| **Symmetric Top Tier** | ✅ Built-in | ❓ Untested | Test Python scanner, add if missing |
| **Filtered Blocking Sets** | ✅ Excludes faulty nodes | ❌ Not built-in | Pre-filter nodes before analysis |
| **Org-level Aggregation** | ✅ Built-in merge | ❌ No built-in | Use `--group-by` parameter |
| **Country Aggregation** | ✅ Built-in | ❌ No built-in | Use `--group-by` parameter |
| **ISP Aggregation** | ✅ Built-in | ❌ No built-in | Use `--group-by` parameter |
| **In-memory Caching** | ✅ Analysis object reuse | ✅ File-based | Acceptable difference |
| **Fast Performance** | ✅ <200ms | ⚠️ ~20s | Acceptable for batch processing |

### What Python Adds (Beyond Rust)

| Feature | Status | Value |
|---------|--------|-------|
| **History-Critical Sets** | ✅ Unique to Python | HIGH - New capability |
| **Disjoint Quorum Detection** | ✅ Explicit | HIGH - Better validation |
| **Data Quality Validation** | ✅ Catches errors | HIGH - Prevents bad data |
| **Generic Grouping** | ✅ Group by any field | MEDIUM - Flexibility |
| **Better Scalability** | ✅ SAT solvers | HIGH - Removes Rust cap |

---

## 🚧 The "Cap" Problem

**Current Understanding** (to be confirmed):
- Rust scanner hits performance/memory limits at larger network sizes?
- Algorithm updates difficult due to Rust/WASM complexity?
- Maintenance burden due to compiled dependencies?
- Feature additions blocked by implementation constraints?

**Action**: Document specific limitations in detail

---

## 🗺️ Migration Phases

### Phase 1: Feature Parity (Week 3-4)
**Goal**: Make Python scanner do everything Rust does

**Tasks**:
1. **Test Symmetric Top Tier**
   ```bash
   # Verify Python scanner supports this
   docker run python-fbas --fbas data.json check-intersection
   ```
   - If missing: Contact python-fbas maintainers or implement workaround

2. **Implement Filtered Analysis**
   ```typescript
   // Pre-filter faulty nodes before sending to Python
   const validatingNodes = nodes.filter(n => n.isValidating);
   const result = await pythonScanner.analyze(validatingNodes);
   ```

3. **Add Multi-level Aggregation**
   ```typescript
   // Use --group-by parameter
   async analyzeByOrganization(nodes: Node[]) {
     // Group nodes by organization
     const grouped = this.groupByOrg(nodes);
     // Run analysis on grouped data
     return await this.pythonClient.analyze(grouped, {
       groupBy: 'organization'
     });
   }

   async analyzeByCountry(nodes: Node[]) {
     const grouped = this.groupByCountry(nodes);
     return await this.pythonClient.analyze(grouped, {
       groupBy: 'country'
     });
   }

   async analyzeByISP(nodes: Node[]) {
     const grouped = this.groupByISP(nodes);
     return await this.pythonClient.analyze(grouped, {
       groupBy: 'isp'
     });
   }
   ```

4. **Map to Current AnalysisResult Format**
   ```typescript
   // Adapter that produces identical output structure
   class PythonFbasAdapter {
     async performAnalysis(
       nodes: Node[],
       orgs: Organization[]
     ): Promise<AnalysisResult> {
       // Run Python scanner
       const pythonResults = await this.runAllAnalyses(nodes, orgs);

       // Map to exact same format as Rust scanner
       return {
         hasSymmetricTopTier: pythonResults.symmetricTopTier,
         hasQuorumIntersection: pythonResults.quorumIntersection,
         node: {
           topTierSize: pythonResults.node.topTier.length,
           blockingSetsMinSize: pythonResults.node.blockingMin,
           splittingSetsMinSize: pythonResults.node.splittingMin,
           blockingSetsFilteredMinSize: pythonResults.node.blockingFiltered
         },
         organization: {
           topTierSize: pythonResults.org.topTier.length,
           blockingSetsMinSize: pythonResults.org.blockingMin,
           splittingSetsMinSize: pythonResults.org.splittingMin,
           blockingSetsFilteredMinSize: pythonResults.org.blockingFiltered
         },
         country: { /* ... */ },
         isp: { /* ... */ }
       };
     }
   }
   ```

**Success Criteria**: Python scanner produces identical AnalysisResult as Rust

---

### Phase 2: Parallel Operation (Week 5-6)
**Goal**: Run both scanners, compare results, validate Python

**Implementation**:
```typescript
class DualModeNetworkScanner {
  async scan(network: Network): Promise<NetworkScan> {
    // Run BOTH scanners
    const [rustResult, pythonResult] = await Promise.all([
      this.rustScanner.analyze(nodes, orgs),
      this.pythonScanner.analyze(nodes, orgs)
    ]);

    // Compare results
    const comparison = this.compareResults(rustResult, pythonResult);

    // Log discrepancies
    if (!comparison.identical) {
      logger.warn('Scanner result mismatch', {
        differences: comparison.differences
      });
    }

    // Use Python results (if valid), otherwise fallback to Rust
    return pythonResult.isOk() ? pythonResult.value : rustResult.value;
  }

  private compareResults(rust: AnalysisResult, python: AnalysisResult) {
    return {
      identical: this.deepEqual(rust, python),
      differences: {
        topTier: rust.node.topTierSize !== python.node.topTierSize,
        blocking: rust.node.blockingSetsMinSize !== python.node.blockingSetsMinSize,
        // ... other comparisons
      }
    };
  }
}
```

**Monitoring**:
- Track: % agreement on all metrics
- Alert: If agreement < 95%
- Log: All discrepancies for investigation

**Success Criteria**:
- Python scanner stable for 2 weeks
- >95% agreement with Rust on all metrics
- No performance issues

---

### Phase 3: Gradual Traffic Shift (Week 7-8)
**Goal**: Shift production traffic to Python, keep Rust as safety net

**Feature Flag Strategy**:
```typescript
enum ScannerMode {
  RUST_ONLY = 'rust',
  PYTHON_ONLY = 'python',
  DUAL_MODE = 'dual',     // Both run, Python primary
  RUST_FALLBACK = 'fallback'  // Python primary, Rust on failure
}

class ConfigurableScanner {
  private mode: ScannerMode;

  async analyze(nodes: Node[], orgs: Organization[]): Promise<AnalysisResult> {
    switch (this.mode) {
      case ScannerMode.RUST_ONLY:
        return this.rustScanner.analyze(nodes, orgs);

      case ScannerMode.PYTHON_ONLY:
        return this.pythonScanner.analyze(nodes, orgs);

      case ScannerMode.DUAL_MODE:
        // Both run, use Python, log comparison
        return this.dualMode(nodes, orgs);

      case ScannerMode.RUST_FALLBACK:
        // Python primary, Rust fallback
        const result = await this.pythonScanner.analyze(nodes, orgs);
        if (result.isErr()) {
          logger.warn('Python failed, using Rust fallback');
          return this.rustScanner.analyze(nodes, orgs);
        }
        return result.value;
    }
  }
}
```

**Rollout Schedule**:
```
Week 7, Day 1-2:   DUAL_MODE (0% Python primary)
Week 7, Day 3-4:   RUST_FALLBACK, Python serving 10%
Week 7, Day 5-7:   RUST_FALLBACK, Python serving 50%
Week 8, Day 1-3:   RUST_FALLBACK, Python serving 100%
Week 8, Day 4-7:   PYTHON_ONLY (monitor closely)
Week 9+:           Remove Rust scanner code
```

**Rollback Triggers**:
- Python error rate > 2%
- Python timeout rate > 5%
- Result discrepancy > 5%
- User reports of incorrect data

**Rollback Action**:
```bash
# Immediate
export SCANNER_MODE=rust
# Restart backend

# Investigation
# Fix Python scanner
# Redeploy

# Resume migration
export SCANNER_MODE=rust_fallback
```

---

### Phase 4: Rust Deprecation (Week 9+)
**Goal**: Remove Rust scanner entirely

**Prerequisites**:
- ✅ Python stable for 2 weeks at 100%
- ✅ No rollbacks needed
- ✅ All metrics showing healthy
- ✅ Team confidence high

**Deprecation Steps**:
1. **Mark Rust code as deprecated** (Week 9)
   ```typescript
   /**
    * @deprecated Use PythonFbasScanner instead
    * This will be removed in version 2.0
    */
   class RustFbasScanner { }
   ```

2. **Monitor for 1 month** (Week 9-12)
   - Ensure no issues emerge
   - Validate Python handles all cases
   - Collect performance data

3. **Remove Rust dependencies** (Week 13)
   ```json
   // package.json - REMOVE
   {
     "dependencies": {
       "@stellarbeat/stellar_analysis_nodejs": "^0.6.2"  // DELETE
     }
   }
   ```

4. **Delete Rust scanner code** (Week 13)
   ```bash
   # Remove files
   rm -rf apps/backend/src/network-scan/domain/network/scan/fbas-analysis/

   # Update imports
   # Remove RustFbasScanner references
   ```

5. **Update documentation** (Week 13)
   - Architecture diagrams
   - API documentation
   - Developer guides

6. **Celebrate!** 🎉
   - Blog post about migration
   - Team retrospective
   - Document lessons learned

---

## 🛠️ Technical Implementation Details

### Multi-level Aggregation Implementation

Since Python scanner doesn't have built-in org/country/ISP merging, we need to implement it:

```typescript
class FbasAggregator {
  /**
   * Groups nodes by organization and runs analysis
   */
  async analyzeByOrganization(
    nodes: Node[],
    organizations: Organization[]
  ): Promise<AggregatedAnalysis> {
    // Create virtual nodes representing organizations
    const orgNodes = organizations.map(org => {
      // Merge all validators from this org
      const orgValidators = nodes.filter(n =>
        n.organizationId === org.id
      );

      // Create aggregated quorum set
      const mergedQuorumSet = this.mergeQuorumSets(
        orgValidators.map(v => v.quorumSet)
      );

      return {
        publicKey: org.id,
        name: org.name,
        quorumSet: mergedQuorumSet,
        // Represent all validators from this org
        _originalValidators: orgValidators.map(v => v.publicKey)
      };
    });

    // Run Python scanner on aggregated nodes
    return await this.pythonScanner.analyze(orgNodes);
  }

  /**
   * Groups nodes by country
   */
  async analyzeByCountry(nodes: Node[]): Promise<AggregatedAnalysis> {
    const countryMap = new Map<string, Node[]>();

    nodes.forEach(node => {
      const country = node.geoData?.countryName || 'Unknown';
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      countryMap.get(country)!.push(node);
    });

    const countryNodes = Array.from(countryMap.entries()).map(([country, validators]) => ({
      publicKey: country,
      name: country,
      quorumSet: this.mergeQuorumSets(validators.map(v => v.quorumSet)),
      _originalValidators: validators.map(v => v.publicKey)
    }));

    return await this.pythonScanner.analyze(countryNodes);
  }

  /**
   * Groups nodes by ISP
   */
  async analyzeByISP(nodes: Node[]): Promise<AggregatedAnalysis> {
    // Similar to country grouping
    const ispMap = new Map<string, Node[]>();

    nodes.forEach(node => {
      const isp = node.isp || 'Unknown';
      if (!ispMap.has(isp)) {
        ispMap.set(isp, []);
      }
      ispMap.get(isp)!.push(node);
    });

    const ispNodes = Array.from(ispMap.entries()).map(([isp, validators]) => ({
      publicKey: isp,
      name: isp,
      quorumSet: this.mergeQuorumSets(validators.map(v => v.quorumSet)),
      _originalValidators: validators.map(v => v.publicKey)
    }));

    return await this.pythonScanner.analyze(ispNodes);
  }

  /**
   * Merges multiple quorum sets into one
   * This is complex - needs careful implementation
   */
  private mergeQuorumSets(quorumSets: QuorumSet[]): QuorumSet {
    // Strategy: Create a quorum set that represents
    // the aggregated trust relationships

    // For organizations: typically create an innerQuorumSet
    // containing all the org's validators

    // Example: If org has 3 validators, threshold 2
    return {
      threshold: Math.ceil(quorumSets.length / 2), // Majority
      validators: [],
      innerQuorumSets: quorumSets.filter(qs => qs !== null)
    };
  }
}
```

### Filtered Analysis (Faulty Node Exclusion)

```typescript
class FbasDataFilter {
  /**
   * Filters out non-validating nodes for blocking set analysis
   */
  filterForBlockingAnalysis(nodes: Node[]): Node[] {
    return nodes.filter(node => {
      // Must be validating
      if (!node.isValidating) return false;

      // Must have valid quorum set
      if (!node.quorumSet || node.quorumSet.threshold === 0) return false;

      // Must be in transitive network quorum set (if applicable)
      // This would require additional network analysis

      return true;
    });
  }

  /**
   * Two-stage analysis: filtered and unfiltered
   */
  async analyzeWithFiltering(
    allNodes: Node[],
    organizations: Organization[]
  ): Promise<FilteredAnalysisResult> {
    // Unfiltered analysis (all nodes with quorum sets)
    const validNodes = allNodes.filter(n =>
      n.quorumSet && n.quorumSet.threshold > 0
    );
    const unfiltered = await this.pythonScanner.analyze(validNodes, organizations);

    // Filtered analysis (only validating nodes)
    const validatingNodes = this.filterForBlockingAnalysis(allNodes);
    const filtered = await this.pythonScanner.analyze(validatingNodes, organizations);

    return {
      unfiltered: {
        blockingSetsMinSize: unfiltered.blockingMin,
        // ...
      },
      filtered: {
        blockingSetsMinSize: filtered.blockingMin,
        // ...
      }
    };
  }
}
```

---

## 📈 Success Metrics

### Technical Metrics
| Metric | Target | Current (Rust) | Python Goal |
|--------|--------|----------------|-------------|
| **Availability** | >99.5% | 99.9% | >99.5% |
| **Analysis Time** | <60s | <1s | <30s acceptable |
| **Error Rate** | <1% | <0.1% | <1% |
| **Result Accuracy** | 100% match | Baseline | >95% match |
| **Max Network Size** | No cap | ~500 nodes? | 1000+ nodes |

### Business Metrics
| Metric | Target |
|--------|--------|
| **Zero Data Loss** | 100% of current features preserved |
| **New Capabilities** | History-critical sets added |
| **Data Quality** | 100% of issues detected |
| **Migration Time** | <8 weeks |
| **Rollback Count** | 0 (ideal), <2 (acceptable) |

---

## 🔍 Testing Strategy

### Phase 1: Unit Tests
```typescript
describe('PythonFbasScanner', () => {
  it('produces same top tier as Rust scanner', async () => {
    const result = await pythonScanner.analyzeTopTier(testNodes);
    expect(result.topTierSize).toBe(21);
  });

  it('handles filtered blocking analysis', async () => {
    const validating = nodes.filter(n => n.isValidating);
    const result = await pythonScanner.analyzeBlockingSets(validating);
    expect(result.minSize).toBe(6);
  });

  it('groups by organization correctly', async () => {
    const result = await aggregator.analyzeByOrganization(nodes, orgs);
    expect(result.topTierSize).toBeGreaterThan(0);
  });
});
```

### Phase 2: Integration Tests
```typescript
describe('Scanner Migration', () => {
  it('Python matches Rust on production data', async () => {
    const snapshot = await loadProductionSnapshot();

    const rustResult = await rustScanner.analyze(snapshot.nodes, snapshot.orgs);
    const pythonResult = await pythonScanner.analyze(snapshot.nodes, snapshot.orgs);

    expect(pythonResult.node.topTierSize).toBe(rustResult.node.topTierSize);
    expect(pythonResult.node.blockingSetsMinSize).toBe(rustResult.node.blockingSetsMinSize);
    // ... all metrics
  });

  it('handles edge cases Rust handles', async () => {
    // Test cases that have caused issues in the past
    const edgeCases = await loadEdgeCaseData();

    for (const testCase of edgeCases) {
      const pythonResult = await pythonScanner.analyze(testCase.nodes, testCase.orgs);
      expect(pythonResult.isOk()).toBe(true);
    }
  });
});
```

### Phase 3: Performance Tests
```typescript
describe('Performance', () => {
  it('handles 1000 node network within timeout', async () => {
    const largeNetwork = generateNetwork(1000);

    const start = Date.now();
    const result = await pythonScanner.analyze(largeNetwork.nodes, largeNetwork.orgs);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(60000); // 60s
    expect(result.isOk()).toBe(true);
  });

  it('handles network growth over time', async () => {
    // Test with progressively larger networks
    for (const size of [100, 300, 500, 1000]) {
      const network = generateNetwork(size);
      const result = await pythonScanner.analyze(network.nodes, network.orgs);

      logger.info(`Network size ${size}: ${result.executionTime}ms`);
      expect(result.isOk()).toBe(true);
    }
  });
});
```

---

## 📋 Migration Checklist

### Prerequisites
- [ ] Document specific Rust "cap" limitations
- [ ] Verify Python scanner supports symmetric top tier
- [ ] Test Python performance on largest expected network size
- [ ] Get team approval for migration timeline

### Phase 1: Feature Parity (Week 3-4)
- [ ] Implement filtered analysis (exclude faulty nodes)
- [ ] Implement organization-level aggregation
- [ ] Implement country-level aggregation
- [ ] Implement ISP-level aggregation
- [ ] Create adapter that produces identical AnalysisResult
- [ ] Unit tests for all aggregation levels
- [ ] Integration tests comparing Python vs Rust

### Phase 2: Parallel Operation (Week 5-6)
- [ ] Deploy Python service to production (disabled)
- [ ] Implement dual-mode scanner
- [ ] Add result comparison logging
- [ ] Monitor for discrepancies
- [ ] Fix any issues found
- [ ] Validate >95% agreement

### Phase 3: Traffic Shift (Week 7-8)
- [ ] Enable dual mode (both run, Python primary)
- [ ] Shift 10% traffic to Python
- [ ] Monitor for 2 days, fix issues
- [ ] Shift 50% traffic
- [ ] Monitor for 3 days
- [ ] Shift 100% traffic
- [ ] Monitor for 1 week

### Phase 4: Deprecation (Week 9+)
- [ ] Mark Rust code as deprecated
- [ ] Monitor Python-only for 1 month
- [ ] Remove Rust dependencies
- [ ] Delete Rust scanner code
- [ ] Update all documentation
- [ ] Team retrospective

---

## 🚨 Risk Mitigation

### Risk 1: Python Scanner Missing Features
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Test all Rust features against Python in Phase 1
- Implement workarounds (aggregation, filtering) in adapter
- Contact python-fbas maintainers for missing features

### Risk 2: Performance Degradation
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Accept slower performance for batch processing
- Schedule scans during off-peak hours
- Consider running Python scanner on dedicated hardware

### Risk 3: Results Discrepancy
**Probability**: Low (Week 1 showed >95% agreement)
**Impact**: High
**Mitigation**:
- Extensive testing in Phase 2 with dual mode
- Document all discrepancies
- Investigate and fix before proceeding

### Risk 4: Production Incident
**Probability**: Low
**Impact**: Very High
**Mitigation**:
- Gradual rollout with rollback at each stage
- Automatic fallback to Rust on errors
- 24/7 monitoring during migration
- Clear rollback procedure documented

---

## 💰 Cost-Benefit Analysis

### Costs
- **Development**: 6-8 weeks (1 dev)
- **Infrastructure**: +1 microservice (Python service)
- **Risk**: Migration complexity, potential incidents
- **Testing**: Extensive dual-mode monitoring

### Benefits
- **Removes Rust Cap**: Can scale to larger networks
- **New Features**: History-critical sets
- **Better Data Quality**: Catches issues Rust misses
- **Maintainability**: Python easier to update than Rust/WASM
- **Future-Proof**: SAT solvers scale better
- **Academic Validation**: Published algorithms

**ROI**: High - Removing cap unblocks future growth

---

## 🎯 Revised Timeline

```
Week 3-4:  Feature Parity          [=====>              ] 25%
Week 5-6:  Parallel Operation      [==========>         ] 50%
Week 7-8:  Traffic Shift           [===============>    ] 75%
Week 9+:   Rust Deprecation        [====================] 100%
```

**Total Duration**: 6-8 weeks for complete migration

---

## 📝 Open Questions

1. **What is the specific "cap" in Rust scanner?**
   - Network size limit?
   - Algorithm limitation?
   - Maintenance difficulty?
   - Feature addition blocker?

2. **Current network size and growth projections?**
   - How many nodes today?
   - Expected growth rate?
   - Target capacity needed?

3. **Is symmetric top tier analysis critical?**
   - Used in UI/API?
   - Can we verify Python supports it?

4. **Performance requirements?**
   - Real-time scanning needed?
   - Batch processing acceptable?
   - Current scan frequency?

---

## 🏁 Next Steps

1. **Clarify the "cap"** - Document exact Rust limitations
2. **Verify Python features** - Test symmetric top tier, etc.
3. **Get stakeholder buy-in** - Present migration plan
4. **Start Phase 1** - Build feature parity adapters
5. **Set up monitoring** - Prepare for dual-mode comparison

**Ready to proceed with full replacement strategy?**
