# TrustRank System Documentation

## Overview

TrustRank is a comprehensive trust metrics system for the Stellar network that evaluates and ranks validators based on their network position, organizational diversity, and validation behavior. The system combines multiple algorithms to provide a holistic view of validator trustworthiness and network influence.

## Core Components

### 1. Trust Metrics

The system calculates four key metrics for each validator:

- **`trustCentralityScore`** (0-100): Measures the validator's centrality in the trust network
- **`pageRankScore`** (0-100): Measures the validator's authority based on trust relationships  
- **`trustRank`** (integer): Overall ranking position based on combined metrics
- **`lastTrustCalculation`** (timestamp): When the metrics were last calculated

### 2. Trust Graph Construction

The system builds a directed graph representing trust relationships:

```typescript
// Trust relationships are derived from quorum set configurations
// Each validator trusts the validators in their quorum sets
const trustGraph = TrustGraphFactory.create(nodes);
```

**Trust Relationship Rules:**
- If Validator A includes Validator B in its quorum set → A trusts B
- Trust is directional (A trusting B doesn't mean B trusts A)
- Self-references are excluded from trust calculations

### 3. Algorithms Used

#### PageRank Algorithm
- **Purpose**: Measures validator authority based on incoming trust relationships
- **Implementation**: Modified PageRank with damping factor 0.85
- **Formula**: `PR(v) = (1-d)/N + d * Σ(PR(u)/C(u))` where:
  - `d = 0.85` (damping factor)
  - `N = total number of validators`
  - `C(u) = out-degree of validator u`
- **Convergence**: Iterates until change < 1e-6 or max 100 iterations

#### Trust Centrality Algorithm  
- **Purpose**: Measures validator's position in strongly connected components
- **Process**:
  1. Find strongly connected components using Tarjan's algorithm
  2. Calculate centrality scores within each component
  3. Apply organizational diversity bonuses
  4. Normalize scores to 0-100 range

### 4. Organizational Diversity Bonuses

The system applies bonuses to validators from diverse organizations:

```typescript
interface NodeTrustData {
    organizationId: string | null;  // Organization the validator belongs to
    isValidator: boolean;           // Whether the node is actively validating
}
```

**Diversity Calculation:**
- Validators from the same organization share trust weight
- Validators from unique organizations receive full weight
- This prevents concentration of trust in single organizations

## API Response Structure

From your API example, here's what each field means:

```json
{
  "trustCentralityScore": "100.00000000",    // Trust centrality (0-100)
  "pageRankScore": "100.00000000",          // PageRank authority (0-100) 
  "trustRank": 1,                           // Overall ranking position
  "lastTrustCalculation": "2025-07-03T21:35:43.100Z"  // Last calculation time
}
```

**Score Interpretation:**
- **100.00 scores**: This validator (SDF 2) has maximum trust centrality and PageRank
- **trustRank: 1**: This is the #1 ranked validator in the network
- **High scores indicate**: Strong network position, many incoming trust relationships, organizational diversity

## Calculation Process

### Step 1: Graph Construction
```typescript
// Build trust graph from quorum sets
const trustGraph = TrustGraphFactory.create(validatorNodes);
```

### Step 2: Node Data Preparation
```typescript
// Map validators to their organizations
const nodeOrganizationMap = await nodeOrganizationMappingService.mapNodesToOrganizations(nodes);

// Build node trust data
const nodeData = new Map<string, NodeTrustData>();
nodes.forEach(node => {
    const organizationId = nodeOrganizationMap.get(node.publicKey.value);
    nodeData.set(node.publicKey.value, {
        organizationId: organizationId?.value || null,
        isValidator: node.latestMeasurement()?.isValidating || false
    });
});
```

### Step 3: Trust Metrics Calculation
```typescript
const trustResult = trustRankCalculator.calculateTrustMetrics(trustGraph, nodeData);
```

### Step 4: Score Application
The calculated metrics are applied to each validator's latest measurement:
```typescript
latestMeasurement.trustCentralityScore = trustMetrics.trustCentralityScore;
latestMeasurement.pageRankScore = trustMetrics.pageRankScore; 
latestMeasurement.trustRank = trustMetrics.trustRank;
latestMeasurement.lastTrustCalculation = trustMetrics.lastTrustCalculation;
```

## Real-World Example Analysis

Looking at your API data for SDF 2 validator:

### Network Position
- **Public Key**: `GCM6QMP3DLRPTAZW2UZPCPX2LF3SXWXKPMP3GKFZBDSF3QZGV2G5QSTK`
- **Organization**: Stellar Development Foundation (`organizationId: "587ae43d5ea675a3b575ce8f3b1b4105"`)
- **Domain**: `www.stellar.org`

### Trust Relationships
The validator's quorum set shows it trusts 7 inner quorum sets, each with threshold 2 and 3 validators. This creates a robust trust network with:
- **21 total trusted validators** (7 sets × 3 validators)
- **High redundancy** (threshold 2 out of 3 in each set)
- **Diverse validator selection** across different organizations

### Resulting Scores
- **Trust Centrality: 100.00** - Maximum centrality score indicates this validator is at the center of trust networks
- **PageRank: 100.00** - Maximum authority score indicates many validators trust this one
- **Trust Rank: 1** - #1 overall ranking in the network
- **Recent Calculation**: Updated within hours of your query

### Why These Scores Make Sense
1. **SDF's Central Role**: As a founding organization, SDF validators are widely trusted
2. **Robust Quorum Set**: Well-designed quorum set creates strong trust relationships
3. **Network Effect**: Being trusted by many validators increases PageRank score
4. **Organizational Reputation**: SDF's established reputation contributes to high centrality

## Configuration

### Trust Calculation Parameters
```typescript
// PageRank settings
const DAMPING_FACTOR = 0.85;
const CONVERGENCE_THRESHOLD = 1e-6;
const MAX_ITERATIONS = 100;

// Centrality settings  
const NORMALIZATION_RANGE = [0, 100];
const ORGANIZATIONAL_DIVERSITY_ENABLED = true;
```

### Calculation Frequency
- Trust metrics are recalculated during each network scan
- Typically updated every few hours
- `lastTrustCalculation` timestamp indicates freshness

## Use Cases

### For Validator Operators
- **Monitor trust position**: Track your validator's ranking over time
- **Optimize quorum sets**: Design quorum sets to improve trust scores
- **Organizational strategy**: Consider organizational diversity in validator selection

### For Network Analysis
- **Identify key validators**: High-ranking validators are network critical points
- **Analyze decentralization**: Check if trust is concentrated in few organizations
- **Monitor network health**: Track changes in trust distribution over time

### For Integration
- **Validator selection**: Use trust scores to choose reliable validators
- **Risk assessment**: Evaluate validator trustworthiness for applications
- **Network monitoring**: Track trust metric changes for anomaly detection

## Technical Implementation

### Database Schema
```sql
-- Trust metrics stored in node measurements
ALTER TABLE "node_measurement_v2" ADD "trustCentralityScore" decimal(10,8) DEFAULT 0;
ALTER TABLE "node_measurement_v2" ADD "pageRankScore" decimal(10,8) DEFAULT 0;  
ALTER TABLE "node_measurement_v2" ADD "trustRank" integer DEFAULT 0;
ALTER TABLE "node_measurement_v2" ADD "lastTrustCalculation" timestamptz;

-- Indexes for performance
CREATE INDEX "IDX_node_measurement_v2_trust_centrality_score" ON "node_measurement_v2" ("trustCentralityScore");
CREATE INDEX "IDX_node_measurement_v2_page_rank_score" ON "node_measurement_v2" ("pageRankScore");
CREATE INDEX "IDX_node_measurement_v2_trust_rank" ON "node_measurement_v2" ("trustRank");
```

### Key Classes
- **`TrustRankCalculator`**: Main calculation engine
- **`TrustGraph`**: Graph representation with algorithms
- **`NodeOrganizationMappingService`**: Maps validators to organizations
- **`NodeScannerIndexerStep`**: Integrates trust calculation into scanning process

## Performance Considerations

### Scalability
- **Graph algorithms**: O(V + E) for most operations where V=validators, E=trust edges
- **PageRank**: O(V × iterations) typically converges in 10-20 iterations
- **Memory usage**: Sparse graph representation for efficiency

### Optimization
- **Incremental updates**: Only recalculate when network topology changes significantly
- **Caching**: Results cached until next network scan
- **Parallel processing**: Graph algorithms can be parallelized for large networks

## Future Enhancements

### Planned Improvements
- **Historical trending**: Track trust score changes over time
- **Predictive analysis**: Forecast trust score changes
- **Advanced metrics**: Additional centrality measures (betweenness, closeness)
- **Real-time updates**: More frequent calculation for dynamic networks

### Research Areas
- **Trust decay**: Model how trust relationships change over time
- **Behavioral analysis**: Incorporate validator performance metrics
- **Machine learning**: Use ML to predict optimal quorum set configurations