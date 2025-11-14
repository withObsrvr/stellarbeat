# Python FBAS Scanner Integration Architecture

**Phase**: Week 2 - Integration Planning
**Status**: Design Phase
**Date**: 2025-11-13

---

## Architecture Decision: Integration Approach

### Three Options Evaluated

#### Option 1: HTTP Microservice ⭐ RECOMMENDED
**Architecture**: Python scanner runs as standalone HTTP service

```
┌─────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │         NetworkScanner (Domain Service)         │   │
│  │                                                  │   │
│  │  ┌──────────────────────┐                       │   │
│  │  │ FbasAnalyzerService  │◄──existing Rust       │   │
│  │  │  (current/Rust)      │                       │   │
│  │  └──────────────────────┘                       │   │
│  │                                                  │   │
│  │  ┌──────────────────────┐                       │   │
│  │  │PythonFbasHttpClient │◄──NEW                  │   │
│  │  │  (HTTP adapter)      │                       │   │
│  │  └──────────┬───────────┘                       │   │
│  └─────────────┼─────────────────────────────────┘   │
└────────────────┼──────────────────────────────────────┘
                 │ HTTP/REST
                 │
        ┌────────▼──────────────────────────────────────┐
        │   Python FBAS Scanner Service (Docker)        │
        │                                                │
        │  ┌──────────────────────────────────────┐    │
        │  │  Flask/FastAPI REST API              │    │
        │  │  - POST /analyze/top-tier            │    │
        │  │  - POST /analyze/blocking-sets       │    │
        │  │  - POST /analyze/splitting-sets      │    │
        │  │  - POST /analyze/quorums             │    │
        │  │  - POST /analyze/history-critical    │    │
        │  └──────────────┬───────────────────────┘    │
        │                 │                              │
        │  ┌──────────────▼───────────────────────┐    │
        │  │  python-fbas CLI (Docker)            │    │
        │  │  - SAT/MaxSAT/QBF solvers            │    │
        │  └──────────────────────────────────────┘    │
        └───────────────────────────────────────────────┘
```

**Pros:**
- ✅ Complete isolation (crashes don't affect backend)
- ✅ Easy to scale horizontally (multiple scanner instances)
- ✅ Independent deployment and versioning
- ✅ Timeout control and retry logic
- ✅ Can run on separate hardware (resource isolation)
- ✅ Health checks and monitoring

**Cons:**
- ❌ Network latency overhead
- ❌ More infrastructure complexity
- ❌ Requires service discovery/load balancing
- ❌ Additional deployment artifact

**Best For:** Production deployment, high availability requirements

---

#### Option 2: Child Process / Subprocess
**Architecture**: Spawn Docker container as subprocess from backend

```
┌──────────────────────────────────────────────────────┐
│              Backend (NestJS)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │      PythonFbasProcessAdapter                 │  │
│  │      (spawns Docker process)                  │  │
│  │                                                │  │
│  │  child_process.spawn(                         │  │
│  │    'docker', ['run', ..., 'python-fbas', ...] │  │
│  │  )                                             │  │
│  └───────────────┬───────────────────────────────┘  │
└──────────────────┼───────────────────────────────────┘
                   │ stdin/stdout
                   │
        ┌──────────▼────────────────────────────┐
        │  Docker Container (python-fbas)       │
        │  - Reads JSON from stdin              │
        │  - Outputs results to stdout          │
        └───────────────────────────────────────┘
```

**Pros:**
- ✅ Simpler than HTTP service (no API layer)
- ✅ Direct communication via stdin/stdout
- ✅ Automatic cleanup when parent dies
- ✅ Lower latency than HTTP

**Cons:**
- ❌ Backend crash kills analysis
- ❌ Resource contention with backend
- ❌ Harder to scale (limited to local machine)
- ❌ Complex error handling (parse stderr)
- ❌ Timeout management more complex

**Best For:** Single-server deployments, development/testing

---

#### Option 3: Native Python Library (node-python bridge)
**Architecture**: Use node-python bridge to import python-fbas directly

```
┌──────────────────────────────────────────────────┐
│           Backend (NestJS)                        │
│  ┌────────────────────────────────────────────┐ │
│  │   PythonFbasNativeAdapter                  │ │
│  │   (uses node-gyp-python or similar)        │ │
│  │                                             │ │
│  │   import { pythonBridge } from 'node-gyp'  │ │
│  │   const fbas = pythonBridge.import(...)    │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Pros:**
- ✅ Lowest latency (in-process)
- ✅ No serialization overhead
- ✅ Simplest deployment (single artifact)

**Cons:**
- ❌ Tight coupling (Python crash = backend crash)
- ❌ Complex dependency management
- ❌ Python interpreter in Node.js process
- ❌ Difficult to version/update independently
- ❌ GIL (Global Interpreter Lock) could block Node event loop

**Best For:** Not recommended for production

---

## Recommended Architecture: HTTP Microservice

### Design Details

#### 1. Python Scanner Service (FastAPI)

**Service Structure:**
```python
# app.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import subprocess
import json
import tempfile

app = FastAPI(title="FBAS Analysis Service")

class AnalysisRequest(BaseModel):
    nodes: list[dict]
    organizations: list[dict] = []

class TopTierResponse(BaseModel):
    top_tier: list[str]
    top_tier_size: int
    execution_time_ms: int

@app.post("/analyze/top-tier")
async def analyze_top_tier(request: AnalysisRequest) -> TopTierResponse:
    # Write nodes to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(request.nodes, f)
        temp_path = f.name

    try:
        # Call python-fbas CLI
        result = subprocess.run(
            ['python-fbas', '--fbas', temp_path, 'top-tier', '--output', 'json'],
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=result.stderr)

        data = json.loads(result.stdout)
        return TopTierResponse(**data)
    finally:
        os.unlink(temp_path)
```

**Endpoints:**
- `POST /analyze/top-tier` - Top tier analysis
- `POST /analyze/blocking-sets` - Minimal blocking sets
- `POST /analyze/splitting-sets` - Minimal splitting sets
- `POST /analyze/quorums` - Minimal quorums + intersection
- `POST /analyze/history-critical` - History-critical sets (NEW)
- `POST /analyze/full` - All analyses in one call
- `GET /health` - Health check endpoint

**Docker Deployment:**
```dockerfile
FROM python:3.11-slim

# Install python-fbas
RUN pip install --no-cache-dir python-fbas

# Copy FastAPI service
COPY app.py /app/
WORKDIR /app

# Install FastAPI + uvicorn
RUN pip install fastapi uvicorn

EXPOSE 8080
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

#### 2. Backend HTTP Client (TypeScript)

**Client Implementation:**
```typescript
// apps/backend/src/network-scan/domain/network/scan/python-fbas/PythonFbasHttpClient.ts

import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import axios, { AxiosInstance } from 'axios';

export interface PythonFbasNode {
  publicKey: string;
  name: string | null;
  quorumSet: {
    threshold: number;
    validators: string[];
    innerQuorumSets: any[];
  } | null;
  geoData?: {
    countryName: string | null;
  } | null;
  isp?: string | null;
}

export interface TopTierResponse {
  top_tier: string[];
  top_tier_size: number;
  execution_time_ms: number;
}

export interface BlockingSetsResponse {
  min_size: number;
  total_sets: number;
  example_set: string[];
  execution_time_ms: number;
}

export interface HistoryCriticalResponse {
  critical_sets: string[][];
  min_size: number;
  execution_time_ms: number;
}

@Injectable()
export class PythonFbasHttpClient {
  private client: AxiosInstance;

  constructor(
    private readonly baseUrl: string = process.env.PYTHON_FBAS_SERVICE_URL || 'http://localhost:8080',
    private readonly timeout: number = 60000
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeTopTier(
    nodes: PythonFbasNode[],
    organizations: any[] = []
  ): Promise<Result<TopTierResponse, Error>> {
    try {
      const response = await this.client.post<TopTierResponse>('/analyze/top-tier', {
        nodes,
        organizations
      });
      return ok(response.data);
    } catch (error) {
      return err(this.mapError(error));
    }
  }

  async analyzeBlockingSets(
    nodes: PythonFbasNode[],
    organizations: any[] = []
  ): Promise<Result<BlockingSetsResponse, Error>> {
    try {
      const response = await this.client.post<BlockingSetsResponse>('/analyze/blocking-sets', {
        nodes,
        organizations
      });
      return ok(response.data);
    } catch (error) {
      return err(this.mapError(error));
    }
  }

  async analyzeHistoryCritical(
    nodes: PythonFbasNode[]
  ): Promise<Result<HistoryCriticalResponse, Error>> {
    try {
      const response = await this.client.post<HistoryCriticalResponse>('/analyze/history-critical', {
        nodes
      });
      return ok(response.data);
    } catch (error) {
      return err(this.mapError(error));
    }
  }

  async healthCheck(): Promise<Result<boolean, Error>> {
    try {
      await this.client.get('/health');
      return ok(true);
    } catch (error) {
      return err(this.mapError(error));
    }
  }

  private mapError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return new Error('Python FBAS service unavailable');
      }
      if (error.code === 'ETIMEDOUT') {
        return new Error('Python FBAS analysis timeout');
      }
      if (error.response) {
        return new Error(`Python FBAS service error: ${error.response.data.detail || error.response.statusText}`);
      }
    }
    return new Error(`Unknown error: ${error.message}`);
  }
}
```

---

#### 3. Adapter Service (Maps to Current Domain)

**Integration with existing FbasAnalyzerService:**
```typescript
// apps/backend/src/network-scan/domain/network/scan/python-fbas/PythonFbasAdapterService.ts

import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { PythonFbasHttpClient } from './PythonFbasHttpClient';
import { AnalysisResult } from '../fbas-analysis/AnalysisResult';
import Node from '../../../node/Node';
import Organization from '../../../organization/Organization';

@Injectable()
export class PythonFbasAdapterService {
  constructor(
    private readonly pythonClient: PythonFbasHttpClient
  ) {}

  async performAnalysis(
    nodes: Node[],
    organizations: Organization[]
  ): Promise<Result<AnalysisResult, Error>> {
    // 1. Filter nodes with valid quorum sets
    const validNodes = nodes.filter(n =>
      n.quorumSet && n.quorumSet.threshold > 0
    );

    // 2. Map to Python format
    const pythonNodes = validNodes.map(node => ({
      publicKey: node.publicKey.value,
      name: node.name,
      quorumSet: node.quorumSet ? {
        threshold: node.quorumSet.threshold,
        validators: node.quorumSet.validators,
        innerQuorumSets: node.quorumSet.innerQuorumSets
      } : null,
      geoData: node.geoData ? {
        countryName: node.geoData.countryName
      } : null,
      isp: node.isp
    }));

    // 3. Call Python scanner
    const topTierResult = await this.pythonClient.analyzeTopTier(pythonNodes);
    if (topTierResult.isErr()) {
      return err(topTierResult.error);
    }

    const blockingResult = await this.pythonClient.analyzeBlockingSets(pythonNodes);
    if (blockingResult.isErr()) {
      return err(blockingResult.error);
    }

    // 4. Map to AnalysisResult
    return ok({
      hasSymmetricTopTier: true, // Python doesn't compute this yet
      hasQuorumIntersection: true, // Assume true if no errors
      node: {
        topTierSize: topTierResult.value.top_tier_size,
        blockingSetsMinSize: blockingResult.value.min_size,
        splittingSetsMinSize: 0, // TBD from splitting-sets call
        blockingSetsFilteredMinSize: blockingResult.value.min_size
      },
      organization: {
        topTierSize: 0, // Would need --group-by=organization
        blockingSetsMinSize: 0,
        splittingSetsMinSize: 0,
        blockingSetsFilteredMinSize: 0
      },
      country: {
        topTierSize: 0,
        blockingSetsMinSize: 0,
        splittingSetsMinSize: 0,
        blockingSetsFilteredMinSize: 0
      },
      isp: {
        topTierSize: 0,
        blockingSetsMinSize: 0,
        splittingSetsMinSize: 0,
        blockingSetsFilteredMinSize: 0
      }
    });
  }
}
```

---

## Data Preprocessing Filter

**Issue**: Validators referenced in quorum sets but not crawled cause analysis issues.

**Solution**: Pre-filter before analysis

```typescript
// apps/backend/src/network-scan/domain/network/scan/python-fbas/FbasDataPreprocessor.ts

export class FbasDataPreprocessor {
  /**
   * Filters out nodes without valid quorum sets and removes references
   * to validators that aren't in the crawled dataset
   */
  static preprocess(nodes: Node[]): Node[] {
    // Step 1: Get set of all crawled public keys
    const crawledKeys = new Set(nodes.map(n => n.publicKey.value));

    // Step 2: Filter to nodes with valid quorum sets
    const validNodes = nodes.filter(n =>
      n.quorumSet && n.quorumSet.threshold > 0
    );

    // Step 3: Clean quorum sets (remove uncrawled validators)
    return validNodes.map(node => {
      if (!node.quorumSet) return node;

      const cleanedQuorumSet = this.cleanQuorumSet(
        node.quorumSet,
        crawledKeys
      );

      return {
        ...node,
        quorumSet: cleanedQuorumSet
      };
    });
  }

  private static cleanQuorumSet(
    qs: QuorumSet,
    validKeys: Set<string>
  ): QuorumSet {
    return {
      threshold: qs.threshold,
      validators: qs.validators.filter(v => validKeys.has(v)),
      innerQuorumSets: qs.innerQuorumSets.map(inner =>
        this.cleanQuorumSet(inner, validKeys)
      )
    };
  }
}
```

---

## Deployment Strategy

### Phase 1: Parallel Analysis (Week 2-3)
- Deploy Python service alongside existing Rust scanner
- Both run in parallel, log results
- **No production impact** - results not used
- Collect metrics on performance and accuracy

### Phase 2: Gradual Rollout (Week 4-5)
- Feature flag: `USE_PYTHON_FBAS_SCANNER`
- Start with 1% of scans
- Monitor for errors, performance issues
- Gradually increase to 10%, 50%, 100%

### Phase 3: History-Critical Sets (Week 6)
- Add new API endpoint `/api/v1/network/history-critical`
- Only available via Python scanner
- Display in UI as new feature

### Phase 4: Deprecation (Week 8+)
- Once Python scanner proves stable
- Switch default to Python
- Keep Rust as fallback

---

## Configuration

**Environment Variables:**
```bash
# Python FBAS Service
PYTHON_FBAS_SERVICE_URL=http://python-fbas:8080
PYTHON_FBAS_TIMEOUT=60000
PYTHON_FBAS_RETRY_ATTEMPTS=3
PYTHON_FBAS_RETRY_DELAY=1000

# Feature Flags
PYTHON_FBAS_ENABLED=true
PYTHON_FBAS_ROLLOUT_PERCENTAGE=100
PYTHON_FBAS_FALLBACK_TO_RUST=true
```

---

## Monitoring & Observability

**Metrics to Track:**
- Request latency (p50, p95, p99)
- Error rate
- Timeout rate
- Result comparison (Python vs Rust discrepancies)
- Service availability

**Logging:**
```typescript
logger.info('Python FBAS analysis started', {
  nodeCount: nodes.length,
  organizationCount: orgs.length
});

logger.info('Python FBAS analysis completed', {
  topTierSize: result.topTierSize,
  executionTimeMs: result.executionTimeMs
});

logger.error('Python FBAS analysis failed', {
  error: error.message,
  nodeCount: nodes.length,
  willFallbackToRust: true
});
```

---

## Rollback Procedure

**Triggers for Rollback:**
1. Error rate > 5%
2. Timeout rate > 10%
3. Latency p95 > 30s
4. Service unavailable > 5 minutes

**Rollback Steps:**
1. Set `PYTHON_FBAS_ENABLED=false` in environment
2. Restart backend (or wait for config refresh)
3. Backend automatically falls back to Rust scanner
4. Investigate Python service logs
5. Fix issues in Python service
6. Redeploy when ready

**Graceful Degradation:**
```typescript
const result = await pythonFbasService.analyze(nodes, orgs);

if (result.isErr() && config.fallbackToRust) {
  logger.warn('Python FBAS failed, falling back to Rust', {
    error: result.error
  });

  return await rustFbasService.analyze(nodes, orgs);
}
```

---

## Next Steps

1. ✅ Architecture designed
2. ⏳ Build FastAPI service wrapper
3. ⏳ Implement TypeScript HTTP client
4. ⏳ Create adapter service
5. ⏳ Add data preprocessing filter
6. ⏳ Set up Docker deployment
7. ⏳ Create integration tests
8. ⏳ Document rollback procedure

**Estimated Completion**: End of Week 2
