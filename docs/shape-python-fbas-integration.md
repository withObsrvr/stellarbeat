# Shape Up Cycle: Python FBAS Scanner Integration

## Problem

The current Rust-based FBAS scanner (`@stellarbeat/stellar_analysis_nodejs`) has scalability and/or accuracy issues. The Python FBAS scanner (https://github.com/nano-o/python-fbas) offers:
- Superior scalability through constraint solvers (SAT/MaxSAT/QBF)
- Additional capabilities (disjoint quorums, history-critical sets)
- Better performance on large networks
- More academically rigorous approach

We need to evaluate if this scanner can replace our current implementation without breaking existing functionality.

## Appetite

**2 weeks** - This is a research, evaluation, and integration planning cycle. We're NOT doing the full replacement yet, just proving it can work and planning the swap.

## Solution (Fat-Marker Sketch)

### Week 1: Evaluation & Testing (Figuring Out)

**Set up Python FBAS scanner as separate service:**
1. Docker container or Python microservice alongside current backend
2. Feed it the same network data our current scanner uses
3. Run both scanners in parallel on test data

**Compare outputs:**
- Verify Python scanner produces equivalent results for existing metrics
- Test on current production network snapshots
- Document any differences in results
- Benchmark performance (time, memory, network size handling)

**Test integration points:**
- Can we call it from TypeScript backend?
- How do we pass node/quorum set data?
- What's the response format?
- Does it work with our current data model?

### Week 2: Integration Planning (Making It Happen)

**Create integration architecture:**
- Design how Python scanner fits into existing scan pipeline
- Decide: HTTP microservice? Command-line tool? Python subprocess?
- Map Python scanner outputs to our current domain models
- Plan backward compatibility strategy

**Build proof-of-concept adapter:**
- Simple adapter that translates between our models and Python scanner
- Test it with real network scan data
- Verify all existing FBAS metrics can be computed

**Document replacement plan:**
- Step-by-step migration strategy
- Rollback plan if issues arise
- Testing strategy for production deployment
- Feature flag approach for gradual rollout

## Rabbit Holes (Don't Do These)

❌ **Don't rewrite the Python scanner** - Use it as-is, fork only if absolutely necessary

❌ **Don't try to replace everything at once** - Just prove the core FBAS analysis works

❌ **Don't optimize performance yet** - First prove correctness, optimize later

❌ **Don't modify existing scanner during evaluation** - Keep them completely separate

❌ **Don't build elaborate microservice infrastructure** - Keep it simple for evaluation

## No-Gos (Explicitly Out of Scope)

🚫 Full production deployment - Not this cycle

🚫 Removing the old Rust scanner - Keep both during evaluation

🚫 UI changes to display new metrics - Backend only

🚫 Historical data migration - Only works with new scans

🚫 Performance optimization of Python scanner - Use stock implementation

🚫 Integration with trust rank calculations - Focus on core FBAS only

## Done (Concrete Success Example)

At the end of 2 weeks, we have:

✅ **Working Python FBAS scanner** running in parallel with current scanner

✅ **Test results document** showing:
   - Side-by-side comparison of outputs on 5+ network snapshots
   - Performance benchmarks (time, memory, max network size)
   - Any discrepancies explained

✅ **Proof-of-concept adapter code** that:
   - Takes our Node/Network domain objects
   - Calls Python scanner
   - Returns results in our expected format
   - Passes all existing FBAS-related tests

✅ **Replacement plan document** with:
   - Architecture diagram showing integration approach
   - Step-by-step migration checklist
   - Testing strategy
   - Rollback procedure
   - Estimated timeline for full replacement (future cycle)

✅ **Go/No-Go decision**: Clear recommendation on whether to proceed with full replacement

## Scope Line

### MUST HAVE ══════════════
- [ ] Python FBAS scanner running in local/Docker environment
- [ ] Test harness comparing both scanners on same data
- [ ] Verification that core metrics match (top tier, blocking sets, splitting sets)
- [ ] Basic adapter code proving integration is possible
- [ ] Performance benchmarks on realistic network sizes
- [ ] Written recommendation: proceed or abandon

### NICE TO HAVE ───────────
- [ ] Test new features (disjoint quorums, history-critical sets)
- [ ] Automated test suite running both scanners
- [ ] Performance tests on very large synthetic networks
- [ ] Detailed architecture design for production integration
- [ ] Feature flag implementation strategy

### COULD HAVE ─────────────
- [ ] Actual microservice implementation (vs proof-of-concept)
- [ ] CI/CD pipeline for Python scanner
- [ ] Load testing at scale
- [ ] Comparison with other FBAS scanners
- [ ] Cost analysis (compute resources)

## Hill Chart Tracking

Use these checkpoints to track progress:

### Left Side (0-50%): Figuring Things Out
- [ ] 10% - Python scanner installed and running
- [ ] 20% - First successful scan of test data
- [ ] 30% - Both scanners running on same data
- [ ] 40% - Initial results comparison complete
- [ ] 50% - **DECISION POINT** - Is integration viable? If unclear, CUT SCOPE

### Right Side (50-100%): Making It Happen
- [ ] 60% - Adapter code working
- [ ] 70% - All core metrics verified equivalent
- [ ] 80% - Performance benchmarks complete
- [ ] 90% - Replacement plan documented
- [ ] 100% - Go/No-Go decision made and documented

## Risk Mitigation

**If Python scanner produces different results:**
- Investigate which is more correct
- May need to consult research papers
- Document as finding, not blocker

**If performance is worse:**
- Test with various solver configurations
- Check if running in parallel is acceptable
- Consider this in go/no-go decision

**If integration proves too complex:**
- This is valuable information - document why
- Recommend alternative approaches
- No-go is a valid outcome

## Success Metrics

By end of cycle, we can answer:
1. ✅ Is Python scanner more accurate/scalable? (yes/no + evidence)
2. ✅ Can we integrate it without major architecture changes? (yes/no + reason)
3. ✅ What's the estimated effort for full replacement? (days/weeks)
4. ✅ Should we proceed? (go/no-go + rationale)

---

**Ship Deadline: 2 weeks from start date**
**Mantra: Prove it works > Make it perfect**
