# Phase 1 Remaining Tasks: Trust Centrality Integration

## Overview

This document outlines the remaining tasks to complete Phase 1 of the Trust Visualization Enhancement Plan. Phase 1 focuses on implementing the backend foundation for trust-based node ranking using PageRank algorithm integrated into the existing network scanner workflow.

## Current Status

### ✅ Completed Tasks

1. **Database Migration** - `1751570404901-trust-centrality-metrics.ts`
   - Added `trustCentralityScore`, `pageRankScore`, `trustRank`, `lastTrustCalculation` columns
   - Created performance indexes for efficient querying

2. **Trust Calculation Services**
   - `TrustMetrics.ts` - Core interfaces and configuration
   - `PageRankAlgorithm.ts` - PageRank implementation with convergence detection
   - `TrustRankCalculator.ts` - Main service with organizational diversity bonuses

3. **Database Entity Updates**
   - Updated `NodeSnapShot.ts` entity with trust properties
   - Enhanced copy method for proper versioning

4. **Shared Interface Updates**
   - Updated `Node.ts` class with trust properties
   - Enhanced serialization/deserialization methods

5. **API Compatibility**
   - Updated `NodeV1` DTO interface and JSON schema
   - Maintained backward compatibility

## 🔄 Remaining Tasks

### High Priority - Core Integration

#### Task 1: Complete Node DTOs for API Compatibility
**Status**: In Progress (95% complete)
**Files**: `/packages/shared/src/dto/node-v1.ts`
**Remaining Work**: Final verification that all DTO updates are correct

**Verification Checklist**:
- [ ] Confirm all trust fields are properly typed in NodeV1 interface
- [ ] Verify JSON schema includes all trust properties with correct validation
- [ ] Test API serialization/deserialization with trust fields
- [ ] Run any existing DTO validation tests

---

#### Task 2: Modify NodeScannerIndexerStep to Include Trust Calculation
**Status**: Pending
**Files**: `/apps/backend/src/network-scan/domain/node/scan/NodeScannerIndexerStep.ts`
**Priority**: High

**Implementation Details**:
```typescript
// Current flow: NodeScannerIndexerStep -> NodeIndexer.calculateIndexes()
// New flow: NodeScannerIndexerStep -> TrustRankCalculator -> NodeIndexer.calculateIndexes()

// Steps to implement:
1. Inject TrustRankCalculator into NodeScannerIndexerStep
2. Add trust calculation before index calculation
3. Pass trust results to NodeIndexer
4. Ensure proper error handling for trust calculation failures
```

**Key Requirements**:
- Must execute after trust graph creation but before final indexing
- Should handle cases where trust calculation fails gracefully
- Need to collect node data (organization, validator status) for trust calculation
- Must update NodeSnapshot entities with calculated trust metrics

**Files to Modify**:
- `/apps/backend/src/network-scan/domain/node/scan/NodeScannerIndexerStep.ts`
- May need to update constructor and execute method

---

#### Task 3: Update NodeIndexer to Use PageRank Scores
**Status**: Pending
**Files**: `/apps/backend/src/network-scan/domain/node/scan/NodeIndexer.ts`
**Priority**: High

**Current Implementation Analysis**:
- Existing: Uses `TrustIndex.get()` for simple in-degree calculation
- New: Should incorporate or replace with PageRank-based trust scores

**Implementation Options**:
1. **Replace TrustIndex**: Use `trustCentralityScore` instead of current trust index
2. **Enhance TrustIndex**: Modify `TrustIndex.get()` to use PageRank when available
3. **Hybrid Approach**: Combine PageRank with existing metrics

**Recommended Approach**: Enhance TrustIndex to use PageRank scores when available, fallback to current method

**Files to Modify**:
- `/apps/backend/src/network-scan/domain/node/scan/NodeIndexer.ts`
- `/apps/backend/src/network-scan/domain/node/scan/node-index/index/trust-index.ts`

---

#### Task 4: Register TrustRankCalculator in DI Container
**Status**: Pending
**Files**: 
- `/apps/backend/src/network-scan/infrastructure/di/container.ts`
- `/apps/backend/src/network-scan/infrastructure/di/di-types.ts`
**Priority**: High

**Implementation Steps**:

1. **Add DI Type**:
```typescript
// In di-types.ts
export const TYPES = {
    // ... existing types
    TrustRankCalculator: Symbol.for('TrustRankCalculator'),
};
```

2. **Register Service**:
```typescript
// In container.ts
import { TrustRankCalculator } from '../domain/trust/TrustRankCalculator';

container.bind<ITrustRankCalculator>(TYPES.TrustRankCalculator)
    .to(TrustRankCalculator)
    .inSingletonScope();
```

3. **Update Injection Points**:
- Add TrustRankCalculator injection to NodeScannerIndexerStep constructor

---

### Medium Priority - Quality Assurance

#### Task 5: Create Unit Tests for TrustRankCalculator
**Status**: Pending
**Files**: `/apps/backend/src/network-scan/domain/trust/__tests__/`
**Priority**: Medium

**Test Coverage Requirements**:

1. **PageRankAlgorithm Tests**:
   - Test convergence with simple graphs
   - Test handling of disconnected components
   - Test normalization accuracy
   - Test ranking creation with ties
   - Performance tests with large graphs

2. **TrustRankCalculator Tests**:
   - Test organizational diversity bonus calculation
   - Test validator bonus application
   - Test integration with TrustGraph
   - Test error handling for invalid inputs

3. **TrustMetrics Tests**:
   - Test configuration validation
   - Test result data structures

**Test Files to Create**:
```
/apps/backend/src/network-scan/domain/trust/__tests__/
├── PageRankAlgorithm.test.ts
├── TrustRankCalculator.test.ts
├── TrustMetrics.test.ts
└── fixtures/
    ├── test-trust-graphs.ts
    └── test-node-data.ts
```

---

#### Task 6: Verify Integration with Existing Scanner Workflow
**Status**: Pending
**Priority**: Medium

**Integration Testing Requirements**:

1. **End-to-End Scanner Test**:
   - Run complete network scan with trust calculation enabled
   - Verify trust metrics are calculated and stored
   - Confirm no performance degradation
   - Test with various network topologies

2. **Database Integration Test**:
   - Verify migration runs successfully
   - Test trust metric persistence
   - Confirm index performance improvements

3. **Error Handling Test**:
   - Test behavior when trust calculation fails
   - Verify graceful degradation
   - Test with malformed trust graphs

**Test Scenarios**:
- Small network (< 10 nodes)
- Medium network (10-100 nodes)  
- Large network (> 100 nodes)
- Network with no trust relationships
- Network with complex organizational structures

---

## Implementation Order

**Recommended Sequence**:

1. **Complete DTO verification** (30 minutes)
2. **Register TrustRankCalculator in DI** (30 minutes)
3. **Modify NodeScannerIndexerStep** (2-3 hours)
4. **Update NodeIndexer** (1-2 hours)
5. **Create unit tests** (4-6 hours)
6. **Integration testing** (2-3 hours)

**Total Estimated Time**: 10-15 hours

## Risk Mitigation

### Performance Risks
- **Risk**: Trust calculation slows down network scanning
- **Mitigation**: 
  - Implement async trust calculation
  - Add performance monitoring
  - Consider caching trust results

### Data Integrity Risks
- **Risk**: Trust calculation errors corrupt node data
- **Mitigation**:
  - Comprehensive error handling
  - Transaction rollback on calculation failure
  - Extensive testing with edge cases

### Backwards Compatibility Risks
- **Risk**: Changes break existing functionality
- **Mitigation**:
  - Maintain all existing interfaces
  - Default trust scores to safe values (0)
  - Progressive enhancement approach

## Success Criteria

### Functional Requirements
- [ ] Trust metrics are calculated for all nodes during network scan
- [ ] Trust scores are properly stored in database
- [ ] Scanner performance remains acceptable (< 20% slowdown)
- [ ] All existing functionality continues to work

### Quality Requirements
- [ ] > 90% test coverage for new trust calculation code
- [ ] No memory leaks in trust calculation
- [ ] Proper error logging and monitoring
- [ ] Documentation for trust calculation parameters

## Rollback Plan

If integration issues arise:

1. **Database**: Migration can be rolled back safely
2. **Code**: Feature flag to disable trust calculation
3. **Fallback**: Use existing trust index until issues resolved

## Documentation Updates Needed

After completion:
- Update API documentation with new trust fields
- Add trust calculation configuration guide
- Document performance tuning parameters
- Create troubleshooting guide for trust calculation issues

## Monitoring and Observability

Add monitoring for:
- Trust calculation execution time
- Trust calculation success/failure rates
- Trust score distribution across network
- Memory usage during trust calculation

This completes the documentation for Phase 1 remaining tasks. The foundation is solid, and these integration tasks will make the trust calculation system fully operational.