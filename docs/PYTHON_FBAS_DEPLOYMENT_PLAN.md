# Python-FBAS Integration Deployment Plan

## Executive Summary

This document outlines the deployment strategy for integrating [python-fbas](https://github.com/nano-o/python-fbas) into the stellarbeat infrastructure to address critical FBAS analysis performance bottlenecks.

**Problem**: Current stellarbeat FBAS analysis automatically disables for networks >20 nodes due to exponential complexity (`NetworkAnalyzer.ts:50-60`).

**Solution**: Replace traditional graph algorithms with python-fbas constraint-solving approach for better scalability.

## Current Deployment Architecture

### Infrastructure Overview
- **Platform**: DigitalOcean App Platform with managed PostgreSQL
- **CI/CD**: GitHub Actions trunk-based pipeline (`.github/workflows/ci-cd.yml`)
- **IaC**: Terraform with separate staging/production environments
- **Build**: Node.js 20.x + pnpm monorepo
- **Services**: Frontend, Backend, Scanner, History Scanner, Users (microservices)

### Current FBAS Analysis Stack
- **Backend**: `@stellarbeat/stellar_analysis_nodejs` (Rust library with Node.js bindings)
- **Frontend**: `@stellarbeat/stellar_analysis_web` (Rust library compiled to WASM)
- **Algorithm**: Traditional graph algorithms with exponential complexity

## Integration Challenges

### Primary Challenge: Runtime Mismatch
- **Current**: Pure Node.js/TypeScript stack
- **Required**: Python + Node.js hybrid environment
- **Deployment**: DigitalOcean App Platform expects single-language buildpacks

### Scalability Impact
- **Current Limitation**: Analysis disabled for networks >20 nodes without symmetry
- **Performance Issue**: Exponential complexity as network grows
- **Business Impact**: Critical functionality unavailable for larger networks

## Deployment Strategy

### Phase 1: Infrastructure Preparation

#### 1.1 Container Strategy Options

**Option A: Microservice Approach (Recommended)**
```yaml
# New service in terraform/modules/app_platform/main.tf
service {
  name = "python-fbas-analyzer"
  instance_count = 1
  instance_size_slug = var.instance_size
  
  image {
    registry_type = "DOCKER_HUB"
    repository = "giulianolosa/python-fbas"
    tag = "latest"
  }
  
  http_port = 8080
  internal_ports = [8080]
}
```

**Option B: Hybrid Container**
```dockerfile
# Custom Dockerfile combining Node.js + Python
FROM node:20-alpine as base
RUN apk add --no-cache python3 py3-pip
COPY . .
RUN pip install python-fbas
RUN pnpm install && pnpm build
```

#### 1.2 Backend Integration Changes

**File**: `apps/backend/src/network-scan/domain/network/scan/fbas-analysis/FbasAnalyzerFacade.ts`

```typescript
// Replace current Rust integration with Python subprocess
export class PythonFbasAnalyzerFacade implements FbasAnalyzer {
  async analyzeQuorumIntersection(network: Network): Promise<AnalysisResult> {
    // Call python-fbas CLI via subprocess
    const result = await this.executePythonFbas([
      '--fbas=stellarbeat-data.json', 
      'check-intersection'
    ]);
    return this.parseResult(result);
  }
}
```

**File**: `apps/frontend/src/services/NetworkAnalyzer.ts`
```typescript
// Remove 20-node limitation
if (this.network.networkStatistics.hasSymmetricTopTier || true) { // Always enable
  this.manualMode = false;
  this.analyzeNodes();
} else {
  // Remove this branch - python-fbas can handle large networks
}
```

#### 1.3 Terraform Infrastructure Updates

**New Variables** (`terraform/variables.tf`):
```hcl
variable "enable_python_fbas" {
  description = "Enable python-fbas analysis service"
  type        = bool
  default     = false
}

variable "python_fbas_image" {
  description = "Python FBAS Docker image"
  type        = string
  default     = "giulianolosa/python-fbas:latest"
}
```

### Phase 2: CI/CD Pipeline Updates

#### 2.1 GitHub Actions Modifications

**File**: `.github/workflows/ci-cd.yml`

Add Python testing stage:
```yaml
- name: Test Python FBAS Integration
  run: |
    docker run --rm giulianolosa/python-fbas --version
    # Add integration tests here
```

#### 2.2 Environment Configuration

Add to terraform environment variables:
```hcl
env {
  key   = "PYTHON_FBAS_ENABLED"
  value = var.enable_python_fbas
}

env {
  key   = "PYTHON_FBAS_SERVICE_URL" 
  value = "http://python-fbas-analyzer:8080"
}
```

### Phase 3: Implementation Approach

#### 3.1 Service Communication Options

**Option A: HTTP API Wrapper**
- Create REST API wrapper around python-fbas CLI
- Backend makes HTTP calls to python-fbas service
- Better separation of concerns, scalable

**Option B: Direct CLI Integration**  
- Backend spawns python-fbas subprocess directly
- Simpler integration, single service
- Potential resource contention

#### 3.2 Data Flow Architecture

```
Frontend → Backend API → Python-FBAS Service → SAT Solver → Results
                    ↓
              Current Rust Analysis (fallback)
```

### Phase 4: Gradual Rollout Strategy

#### 4.1 Feature Flag Implementation

```typescript
// Config-based rollout
const PYTHON_FBAS_CONFIG = {
  enabled: process.env.PYTHON_FBAS_ENABLED === 'true',
  networkSizeThreshold: 20, // Use python-fbas for networks >20 nodes
  fallbackEnabled: true     // Keep Rust analysis as fallback
};
```

#### 4.2 Deployment Sequence

1. **Staging Deployment**
   - Deploy both analysis systems in parallel
   - A/B test python-fbas vs current implementation
   - Performance benchmarking and validation

2. **Production Canary**
   - Enable python-fbas for 10% of analysis requests
   - Monitor performance, accuracy, and stability
   - Gradual rollout: 10% → 50% → 100%

3. **Legacy Deprecation**
   - Remove Rust analysis dependencies after validation
   - Clean up old code paths
   - Update documentation

## Performance Expectations

### Benchmark Targets
Based on python-fbas claims and current limitations:

| Metric | Current (Rust) | Target (Python-FBAS) |
|--------|----------------|----------------------|
| **Max Network Size** | 20 nodes (hard limit) | 100+ nodes |
| **Analysis Time** | Exponential growth | Polynomial/linear |
| **Memory Usage** | High enumeration | Constraint-optimized |
| **Success Rate** | Disabled for large networks | Always enabled |

### Critical Success Metrics
- Remove 20-node analysis limitation
- Maintain or improve analysis accuracy
- Support Stellar network growth (50+ validators)
- Analysis completion time <30 seconds for production networks

## Risk Assessment & Mitigation

### Technical Risks

**Risk 1: Integration Complexity**
- *Mitigation*: Parallel deployment with fallback to current system
- *Timeline*: 2-week integration testing period

**Risk 2: Performance Regression**  
- *Mitigation*: Comprehensive benchmarking before production rollout
- *Timeline*: 1-week performance validation

**Risk 3: python-fbas Reliability**
- *Mitigation*: Maintain current Rust analysis as fallback system
- *Timeline*: Gradual rollout with monitoring

### Operational Risks

**Risk 4: Deployment Complexity**
- *Mitigation*: Terraform infrastructure-as-code for consistent deployments
- *Timeline*: Staging environment validation

**Risk 5: Resource Requirements**
- *Mitigation*: Monitor resource usage and scale DigitalOcean instances
- *Timeline*: Continuous monitoring during rollout

## Implementation Timeline

### Phase 1: Infrastructure (Week 1-2)
- [ ] Create Python service Docker container
- [ ] Update Terraform configurations
- [ ] Implement backend integration layer
- [ ] Deploy to staging environment

### Phase 2: Integration (Week 3-4)  
- [ ] Replace FbasAnalyzerFacade implementation
- [ ] Remove 20-node limitation in NetworkAnalyzer
- [ ] Add feature flag configuration
- [ ] Create integration tests

### Phase 3: Testing (Week 5-6)
- [ ] Performance benchmarking vs current system
- [ ] Validate analysis accuracy
- [ ] Load testing with production data
- [ ] Stability testing

### Phase 4: Rollout (Week 7-8)
- [ ] Production deployment with feature flag (disabled)
- [ ] Gradual enablement: 10% → 50% → 100%
- [ ] Monitor performance and stability
- [ ] Legacy system deprecation

## Success Criteria

### Technical Success
- ✅ Analysis works for networks >20 nodes
- ✅ Performance improvement over current system
- ✅ Analysis accuracy maintained or improved
- ✅ Zero downtime deployment

### Business Success  
- ✅ Full network analysis capability restored
- ✅ Future scalability for Stellar network growth
- ✅ Improved user experience (no manual analysis mode)
- ✅ Reduced infrastructure limitations

## Rollback Plan

### Immediate Rollback (Emergency)
1. Disable python-fbas via feature flag
2. Traffic routes to current Rust analysis
3. Monitor system stability

### Gradual Rollback
1. Reduce python-fbas traffic percentage
2. Investigate issues with parallel systems
3. Fix issues or complete rollback

### Full Rollback
1. Remove python-fbas service from Terraform
2. Clean up integration code
3. Restore 20-node limitation (temporary)

## Resource Requirements

### Development
- **Backend Engineer**: 2 weeks (integration layer)
- **DevOps Engineer**: 1 week (infrastructure updates)  
- **QA Engineer**: 1 week (testing and validation)

### Infrastructure
- **Additional DigitalOcean Service**: ~$20-50/month for python-fbas container
- **Increased Memory**: SAT solving may require more RAM
- **Monitoring**: Enhanced monitoring for new service

## Conclusion

The python-fbas integration addresses a critical scalability bottleneck in stellarbeat's FBAS analysis. The constraint-solving approach should eliminate the 20-node limitation while improving performance for larger networks.

**Recommended Next Steps**:
1. Approve integration plan and resource allocation
2. Begin Phase 1 infrastructure preparation
3. Establish performance benchmarking criteria
4. Coordinate with Giuliano for technical collaboration

---

**Document Status**: Draft  
**Date**: 2025-06-18  
**Author**: OBSRVR Engineering Team  
**Review Required**: Technical Lead, DevOps Lead  
**Next Review**: After Phase 1 completion