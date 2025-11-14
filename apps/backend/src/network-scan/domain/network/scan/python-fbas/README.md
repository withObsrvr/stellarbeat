# Python FBAS Scanner Integration

Complete replacement for Rust FBAS scanner, removing the tier 1 organization cap and enabling unlimited organization analysis.

## Overview

This module integrates the [python-fbas](https://github.com/nano-o/python-fbas) scanner into the Stellarbeat backend, providing:

- **No Organization Cap**: Analyze unlimited tier 1 organizations (Rust scanner has a cap)
- **Multi-level Aggregation**: Organization, country, and ISP level analysis
- **Filtered Analysis**: Separate analysis for all nodes vs validating nodes
- **Quorum Set Merging**: Sophisticated merging logic that preserves trust relationships
- **Type-Safe Results**: Full TypeScript integration with `neverthrow` Result types

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PythonFbasAdapter                        │
│  Orchestrates entire analysis flow                          │
│  - Aggregates nodes by org/country/ISP                      │
│  - Runs filtered/unfiltered analyses                        │
│  - Maps results to AnalysisResult                           │
└────────────┬──────────────┬─────────────┬──────────────────┘
             │              │             │
    ┌────────▼───────┐ ┌───▼─────────┐  ┌▼────────────────┐
    │FbasAggregator  │ │FbasFiltered │  │PythonFbasHttp   │
    │                │ │Analyzer     │  │Client           │
    │Merges quorum   │ │Splits nodes │  │HTTP requests to │
    │sets for org/   │ │into all vs  │  │Python service   │
    │country/ISP     │ │validating   │  │                 │
    └────────────────┘ └─────────────┘  └─────────┬───────┘
                                                   │
                                          ┌────────▼────────┐
                                          │FastAPI Service  │
                                          │python-fbas CLI  │
                                          │wrapper          │
                                          └─────────────────┘
```

## Key Components

### 1. FbasAggregator

Groups nodes by organization, country, or ISP and merges their quorum sets.

**Why this is critical**: The Rust scanner has a built-in cap on tier 1 organizations. When the network grows beyond this cap, the scanner performance degrades. By implementing aggregation in TypeScript and removing the cap, we can analyze networks with unlimited organizations.

**Key method**: `mergeQuorumSets()`
- Collapses internal trust within a group (e.g., SDF validators trusting each other)
- Preserves external trust relationships (e.g., SDF trusting Lobstr)
- Calculates appropriate threshold based on group size

Example:
```typescript
const aggregator = new FbasAggregator();

// Aggregate by organization
const aggregatedNodes = aggregator.aggregateByOrganization(nodes, organizations);

// Now "SDF" is a single super-node representing all SDF validators
// with merged quorum sets
```

### 2. FbasFilteredAnalyzer

Splits nodes into two sets for comparative analysis:
- **All nodes**: Every node with a valid quorum set
- **Validating nodes**: Only nodes currently validating

This enables calculating both `blockingSetsMinSize` (all nodes) and `blockingSetsFilteredMinSize` (validating only).

Example:
```typescript
const filteredAnalyzer = new FbasFilteredAnalyzer();

const result = filteredAnalyzer.prepareFilteredAnalysis({ nodes });

console.log(`All nodes: ${result.allNodes.length}`);
console.log(`Validating: ${result.validatingNodes.length}`);
```

### 3. PythonFbasAdapter

Main adapter that orchestrates the complete analysis flow:
1. Filters nodes with valid quorum sets
2. Runs analysis at 4 levels in parallel:
   - **Node level**: Individual validators
   - **Organization level**: Aggregated by organization
   - **Country level**: Aggregated by country
   - **ISP level**: Aggregated by ISP
3. For each level:
   - Splits into all vs validating
   - Runs analyses (top tier, blocking, splitting)
   - Maps results to `AnalysisMergedResult`
4. Returns complete `AnalysisResult`

Example:
```typescript
const adapter = new PythonFbasAdapter(httpClient, aggregator, filteredAnalyzer);

const result = await adapter.analyze(nodes, organizations);

if (result.isOk()) {
  const analysis = result.value;

  console.log('Node level top tier:', analysis.node.topTierSize);
  console.log('Org level top tier:', analysis.organization.topTierSize);
  console.log('Quorum intersection:', analysis.hasQuorumIntersection);
}
```

### 4. PythonFbasHttpClient

HTTP client for communicating with the Python FBAS FastAPI service.

Features:
- Configurable timeout and retry logic
- Exponential backoff on failures
- Health check monitoring
- `neverthrow` Result types for error handling

Example:
```typescript
const client = PythonFbasHttpClientFactory.create({
  baseUrl: 'http://localhost:8000',
  timeout: 60000, // 60 seconds
  retries: 3
});

const result = await client.analyzeTopTier(request);
if (result.isOk()) {
  console.log('Top tier:', result.value.top_tier);
}
```

## Usage

### Basic Analysis

```typescript
import {
  PythonFbasAdapter,
  PythonFbasHttpClientFactory,
  FbasAggregator,
  FbasFilteredAnalyzer
} from './python-fbas';

// Setup
const httpClient = PythonFbasHttpClientFactory.create();
const aggregator = new FbasAggregator();
const filteredAnalyzer = new FbasFilteredAnalyzer();
const adapter = new PythonFbasAdapter(httpClient, aggregator, filteredAnalyzer);

// Run analysis
const result = await adapter.analyze(nodes, organizations);

if (result.isOk()) {
  const analysis = result.value;

  // Access results at all levels
  console.log('Node level:', analysis.node);
  console.log('Organization level:', analysis.organization);
  console.log('Country level:', analysis.country);
  console.log('ISP level:', analysis.isp);

  // Check quorum intersection
  console.log('Has quorum intersection:', analysis.hasQuorumIntersection);
}
```

### Custom Configuration

```typescript
// Custom HTTP client config
const client = PythonFbasHttpClientFactory.create({
  baseUrl: process.env.PYTHON_FBAS_URL || 'http://python-fbas:8000',
  timeout: 120000, // 2 minutes
  retries: 5
});

const adapter = new PythonFbasAdapter(client, aggregator, filteredAnalyzer);
```

### Health Check

```typescript
const health = await httpClient.healthCheck();

if (health.isOk()) {
  console.log('Service status:', health.value.status);
} else {
  console.error('Service unavailable:', health.error);
}
```

## Differences from Rust Scanner

| Feature | Rust Scanner | Python Scanner |
|---------|-------------|----------------|
| **Tier 1 Org Cap** | Limited (causes performance issues) | ❌ Removed (unlimited) |
| **Aggregation** | Built-in (MergeBy enum) | TypeScript (FbasAggregator) |
| **Filtered Analysis** | Separate calls | Automatic (both in one call) |
| **Performance** | ~170ms | ~20s |
| **History-Critical Sets** | ❌ Not available | ✅ Available |
| **Data Quality Checks** | Limited | ✅ Comprehensive |
| **Algorithm** | Rust implementation | SAT/MaxSAT/QBF solvers |

## Integration with NetworkScanner

The `PythonFbasAdapter` is a drop-in replacement for `FbasAnalyzerFacade` (Rust scanner):

**Before (Rust)**:
```typescript
const rustFacade = new FbasAnalyzerFacade();
const result = rustFacade.analyzeTopTier(nodes);
```

**After (Python)**:
```typescript
const pythonAdapter = new PythonFbasAdapter(...);
const result = await pythonAdapter.analyze(nodes, organizations);
```

Both return the same `AnalysisResult` structure.

## Testing

### Unit Tests

Each component has comprehensive unit tests:
- `FbasAggregator.test.ts` - Aggregation logic
- `FbasFilteredAnalyzer.test.ts` - Filtering logic
- `PythonFbasAdapter.test.ts` - Adapter with mocked HTTP client

Run tests:
```bash
pnpm test FbasAggregator
pnpm test FbasFilteredAnalyzer
pnpm test PythonFbasAdapter
```

### Integration Tests

`PythonVsRustIntegration.test.ts` compares Python vs Rust results on the same data.

**Requirements**: Python FBAS service must be running

Run integration tests:
```bash
# Start Python service first
cd python-fbas-service
docker-compose up -d

# Run tests
pnpm test PythonVsRustIntegration
```

Skip integration tests:
```bash
SKIP_PYTHON_INTEGRATION_TESTS=true pnpm test
```

## Deployment

### Environment Variables

```bash
# Python FBAS service URL
PYTHON_FBAS_SERVICE_URL=http://python-fbas-service:8000

# Feature flag (for gradual rollout)
USE_PYTHON_FBAS_SCANNER=true

# Timeout settings
PYTHON_FBAS_TIMEOUT=60000
PYTHON_FBAS_RETRIES=3
```

### Docker Compose

```yaml
services:
  python-fbas-service:
    image: giulianolosa/python-fbas:latest
    ports:
      - "8000:8000"
    environment:
      - LOG_LEVEL=info
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Rollback Strategy

If the Python scanner encounters issues, the system can gracefully fall back to the Rust scanner:

```typescript
const pythonResult = await pythonAdapter.analyze(nodes, organizations);

if (pythonResult.isErr()) {
  console.warn('Python scanner failed, falling back to Rust:', pythonResult.error);

  // Fallback to Rust
  const rustFacade = new FbasAnalyzerFacade();
  const rustResult = rustFacade.analyzeTopTier(nodes);
  // ... handle Rust result
}
```

## Performance Considerations

- **Python scanner is slower** (~20s vs 170ms for Rust)
- **Recommended use case**: Weekly deep analysis, not real-time API endpoints
- **Parallel execution**: All 4 levels (node/org/country/ISP) run in parallel
- **Caching**: Consider caching results for frequently requested analyses

## Future Enhancements

- [ ] Add symmetric top tier support
- [ ] Implement history-critical sets endpoint
- [ ] Add JSON output mode to python-fbas (avoid parsing CLI output)
- [ ] Performance optimization for large networks
- [ ] Metrics and monitoring dashboard

## References

- [python-fbas GitHub](https://github.com/nano-o/python-fbas)
- [Shape Up Integration Plan](../../../../../../docs/shape-python-fbas-integration.md)
- [Migration Strategy](../../../../../../docs/python-fbas-migration-strategy.md)
- [Week 2 Summary](../../../../../../docs/python-fbas-week2-summary.md)

## Support

For issues or questions:
1. Check integration tests for examples
2. Review Python FBAS service logs
3. Verify service health check
4. Consult migration strategy document
