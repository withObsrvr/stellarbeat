# Trust Visualization Phase 1: Core Implementation

## Overview

Phase 1 implements the backend foundation for trust visualization in Stellarbeat, addressing SDF feedback about sl8 validators appearing to dominate the network when they lack incoming trust from other organizations. The solution distinguishes nodes with genuine cross-organizational trust from those that appear prominent but lack broad network support.

## Problem Statement

**Original Issue**: SDF reported that sl8 validators appear to dominate the network visualization despite having minimal incoming trust from other organizations. The existing trust calculation was too simplistic, using only direct trust counts without considering:

- **Organizational diversity** of trust relationships
- **Quality vs quantity** of trust connections
- **Network-wide importance** vs local prominence

## Solution: PageRank with Organizational Diversity

Phase 1 implements a sophisticated trust scoring system based on:

1. **PageRank Algorithm**: Measures network-wide importance of nodes
2. **Organizational Diversity Bonuses**: Rewards nodes trusted by multiple different organizations
3. **Validator Bonuses**: Gives additional weight to consensus participants
4. **Normalized Scoring**: 0-100 scale for consistent comparison

## Technical Implementation

### 1. Database Schema (`1751570404901-trust-centrality-metrics.ts`)

Added trust metrics columns to store calculated scores:

```sql
-- Node snapshots (historical data)
ALTER TABLE "node_snap_shot" ADD "trustCentralityScore" decimal(12,8) DEFAULT 0;
ALTER TABLE "node_snap_shot" ADD "pageRankScore" decimal(12,8) DEFAULT 0;
ALTER TABLE "node_snap_shot" ADD "trustRank" integer DEFAULT 0;
ALTER TABLE "node_snap_shot" ADD "lastTrustCalculation" timestamptz;

-- Node measurements (real-time data)
ALTER TABLE "node_measurement_v2" ADD "trustCentralityScore" decimal(12,8) DEFAULT 0;
ALTER TABLE "node_measurement_v2" ADD "pageRankScore" decimal(12,8) DEFAULT 0;
ALTER TABLE "node_measurement_v2" ADD "trustRank" integer DEFAULT 0;
ALTER TABLE "node_measurement_v2" ADD "lastTrustCalculation" timestamptz;
```

**Note**: Updated from `decimal(10,8)` to `decimal(12,8)` to support values up to 9999.99999999.

### 2. Trust Calculation Engine

#### PageRankAlgorithm (`PageRankAlgorithm.ts`)
- **Core Algorithm**: Implements standard PageRank with configurable damping factor (0.85)
- **Convergence Detection**: Stops when score changes fall below threshold (1e-6)
- **Normalization**: Converts raw scores to 0-100 scale
- **Ranking**: Creates ordinal rankings handling ties properly

#### TrustRankCalculator (`TrustRankCalculator.ts`)
- **Trust Centrality**: Enhances PageRank with organizational diversity
- **Organizational Diversity Bonus**: 
  - Analyzes incoming trust sources by organization
  - Multiplier: 1.0 + (unique_orgs/5 * 0.5) + (diversity_ratio * 0.5)
  - Capped at 2.0x maximum bonus
- **Validator Bonus**: 1.1x multiplier for consensus participants
- **Score Bounds**: Ensures final scores stay within 0-100 range

### 3. Scanner Integration

#### NodeScannerIndexerStep (`NodeScannerIndexerStep.ts`)
**Enhanced to include trust calculation**:

```typescript
public execute(nodeScan: NodeScan, measurement30DayAverages: NodeMeasurementAverage[], stellarCoreVersion: StellarCoreVersion): void {
    // 1. Calculate trust metrics for all nodes
    const trustGraph = TrustGraphFactory.create(nodeScan.nodes);
    const nodeData = this.buildNodeTrustData(nodeScan.nodes);
    const trustResult = this.trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);

    // 2. Update nodes with trust metrics
    nodeScan.nodes.forEach(node => {
        const trustMetrics = trustResult.trustMetrics.get(node.publicKey.value);
        if (trustMetrics) {
            const latestMeasurement = node.latestMeasurement();
            if (latestMeasurement) {
                latestMeasurement.trustCentralityScore = trustMetrics.trustCentralityScore;
                latestMeasurement.pageRankScore = trustMetrics.pageRankScore;
                latestMeasurement.trustRank = trustMetrics.trustRank;
                latestMeasurement.lastTrustCalculation = trustMetrics.lastTrustCalculation;
            }
        }
    });

    // 3. Calculate node indexes using enhanced trust scores
    nodeScan.updateIndexes(NodeIndexer.calculateIndexes(nodeScan.nodes, measurement30DayAverages, stellarCoreVersion));
}
```

#### NodeIndexer (`NodeIndexer.ts`)
**Enhanced to use PageRank scores in index calculation**:

```typescript
// Use pre-calculated trust score if available, otherwise fall back to old calculation
const trustScore = node.trustCentralityScore !== undefined 
    ? node.trustCentralityScore / 100  // Convert 0-100 scale to 0-1 scale
    : TrustIndex.get(node.publicKey, trustGraph);

const indexRaw = (TypeIndex.get(...) + ActiveIndex.get(...) + ValidatingIndex.get(...) + 
                  VersionIndex.get(...) + trustScore + AgeIndex.get(...)) / 6;
```

### 4. API Integration

#### Shared Node Interface (`packages/shared/src/node.ts`)
Added trust properties to Node class:

```typescript
public trustCentralityScore: number = 0;
public pageRankScore: number = 0;
public trustRank: number = 0;
public lastTrustCalculation: Date | null = null;
```

#### NodeV1DTOMapper (`NodeV1DTOMapper.ts`)
Enhanced API responses to include trust data:

```typescript
trustCentralityScore: node.trustCentralityScore || 0,
pageRankScore: node.pageRankScore || 0,
trustRank: node.trustRank || 0,
lastTrustCalculation: node.lastTrustCalculation?.toISOString() || null
```

### 5. Dependency Injection

Registered `TrustRankCalculator` in DI container (`container.ts`):

```typescript
container.bind(TrustRankCalculator).toSelf();
```

## Data Flow

1. **Network Scan Triggers**: Every network scan now includes trust calculation
2. **Trust Graph Creation**: `TrustGraphFactory.create()` builds graph from node relationships
3. **PageRank Calculation**: Base algorithm computes network-wide importance scores
4. **Trust Enhancement**: Organizational diversity and validator bonuses applied
5. **Score Storage**: Results stored in database via NodeMeasurement entities
6. **API Exposure**: Trust scores included in all node API responses
7. **Index Integration**: Node ranking uses enhanced trust scores

## Configuration

### PageRank Parameters
```typescript
export const DEFAULT_PAGERANK_CONFIG: PageRankConfiguration = {
    dampingFactor: 0.85,        // Standard PageRank damping factor
    maxIterations: 100,         // Maximum iterations before timeout
    convergenceThreshold: 1e-6  // Convergence detection threshold
};
```

### Trust Centrality Bonuses
- **Organizational Diversity**: Up to 1.5x bonus for trust from multiple organizations
- **Validator Status**: 1.1x bonus for consensus participants
- **Maximum Multiplier**: 2.0x total (prevents extreme scores)

## Testing

### Unit Tests Created
1. **TrustRankCalculator.test.ts**: Comprehensive tests for trust calculation logic
   - Simple network calculations
   - Organizational diversity bonuses
   - Validator bonuses
   - Edge cases (empty graphs, missing data)

2. **PageRankAlgorithm.test.ts**: Tests for core PageRank implementation
   - Basic algorithm correctness
   - Convergence behavior
   - Score normalization
   - Ranking generation

### Test Coverage
- **Trust calculation accuracy**: Verifies correct PageRank computation
- **Bonus application**: Tests organizational diversity and validator bonuses
- **Edge cases**: Empty graphs, single nodes, disconnected components
- **Configuration handling**: Different damping factors and thresholds

## Performance Considerations

### Algorithm Complexity
- **PageRank**: O(k * E) where k = iterations, E = edges
- **Trust Enhancement**: O(V * D) where V = vertices, D = average node degree
- **Overall**: Linear with network size for typical Stellar network topology

### Optimization Strategies
- **Convergence Detection**: Stops early when scores stabilize
- **Efficient Storage**: Uses Maps for O(1) score lookups
- **Database Indexing**: Trust score columns indexed for query performance

## Troubleshooting

### Common Issues

1. **Database Precision Overflow**
   - **Symptom**: "numeric field overflow" error
   - **Cause**: Trust scores exceeded decimal(10,8) range
   - **Solution**: Updated to decimal(12,8) to support higher values

2. **Missing @injectable Decorator**
   - **Symptom**: DI container errors about missing annotation
   - **Cause**: TrustRankCalculator missing proper decoration
   - **Solution**: Added `@injectable()` and `reflect-metadata` import

3. **TypeScript Compilation Errors**
   - **Symptom**: Build failures on import paths
   - **Cause**: Using `@stellarbeat/shared` instead of `shared`
   - **Solution**: Corrected import paths to use local package name

## Verification

### Database Verification
```sql
-- Check trust scores are being calculated
SELECT public_key, trust_centrality_score, page_rank_score, trust_rank, last_trust_calculation 
FROM node_measurement_v2 
WHERE last_trust_calculation IS NOT NULL 
ORDER BY trust_centrality_score DESC 
LIMIT 10;
```

### API Verification
Trust scores now appear in node API responses:
```json
{
  "publicKey": "GABCD...",
  "trustCentralityScore": 85.32,
  "pageRankScore": 78.45,
  "trustRank": 5,
  "lastTrustCalculation": "2025-07-03T21:16:38.237Z"
}
```

## What's Next: Phase 2 Preview

Phase 1 provides the foundation for Phase 2 frontend visualization:

### Planned Features
1. **Trust Score Display**: Show trust metrics in node details
2. **Visual Indicators**: Color-code nodes by trust centrality
3. **Trust-based Filtering**: Filter nodes by trust thresholds
4. **Organizational Analysis**: Highlight cross-organizational trust patterns
5. **Historical Trends**: Track trust score changes over time

### Technical Foundation Ready
- ✅ **Database schema** supports historical trust data
- ✅ **API endpoints** expose trust metrics
- ✅ **Real-time calculation** during network scans
- ✅ **Enhanced indexing** reflects trust in node rankings
- ✅ **Comprehensive testing** ensures reliability

## Impact

**Addresses SDF Feedback**: The system now distinguishes nodes with genuine cross-organizational support from those that appear prominent due to simple metrics.

**Example Scenarios**:
- **sl8 validators**: May have high traditional metrics but lower trust centrality due to limited organizational diversity
- **SDF nodes**: Likely to score high due to broad cross-organizational trust
- **Well-connected independents**: Could score higher than expected due to diverse trust sources

The trust calculation provides a more nuanced view of network importance that better reflects the decentralized nature and organizational structure of the Stellar network.