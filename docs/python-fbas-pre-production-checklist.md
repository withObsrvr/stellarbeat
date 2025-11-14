# Python FBAS Scanner - Pre-Production Deployment Checklist

## Local Testing Checklist

### ✅ Docker Container Tests

- [x] Docker container builds successfully
  ```bash
  cd python-fbas-service
  docker build -t python-fbas-service .
  ```

- [x] Docker container runs and stays healthy
  ```bash
  docker run -p 8082:8080 python-fbas-service
  docker ps | grep python-fbas-service  # Should show "(healthy)"
  ```

- [x] python-fbas CLI works inside container
  ```bash
  docker exec <container_id> python-fbas --help
  ```

### ✅ Service Endpoint Tests

- [x] Health endpoint responds
  ```bash
  curl http://localhost:8082/health
  # Expected: {"status":"healthy","version":"1.0.0","python_fbas_available":true}
  ```

- [x] Top tier analysis works
  ```bash
  curl -X POST http://localhost:8082/analyze/top-tier \
    -H "Content-Type: application/json" \
    -d '{"nodes": [...]}'
  # Should return: {"top_tier": [...], "top_tier_size": N, "execution_time_ms": X}
  ```

- [x] Blocking sets analysis works
  ```bash
  curl -X POST http://localhost:8082/analyze/blocking-sets \
    -H "Content-Type: application/json" \
    -d '{"nodes": [...]}'
  # Should return: {"min_size": N, ...}
  ```

- [x] Splitting sets analysis works
  ```bash
  curl -X POST http://localhost:8082/analyze/splitting-sets \
    -H "Content-Type: application/json" \
    -d '{"nodes": [...]}'
  # Should return: {"min_size": N, ...}
  ```

- [x] Quorum analysis works
  ```bash
  curl -X POST http://localhost:8082/analyze/quorums \
    -H "Content-Type: application/json" \
    -d '{"nodes": [...]}'
  # Should return: {"has_quorum_intersection": true/false, ...}
  ```

### Backend Integration Tests

- [ ] Backend configuration is correct
  ```bash
  # Check apps/backend/.env
  ENABLE_PYTHON_FBAS=true
  PYTHON_FBAS_SERVICE_URL=http://localhost:8082
  ```

- [ ] Full network scan uses Python scanner
  ```bash
  pnpm start:scan-network 0 0
  # Watch for logs:
  # - "Using Python FBAS scanner (removes tier 1 org cap)"
  # - "Python FBAS analysis succeeded"
  ```

- [ ] Fallback to Rust works if Python fails
  ```bash
  # Stop Docker container and run scan
  # Should see: "Python FBAS analysis failed, falling back to Rust scanner"
  ```

### Performance Tests

- [ ] Python scanner handles real network size
  - Stellar mainnet has ~20-30 nodes, 7-10 organizations
  - Analysis should complete in < 30 seconds

- [ ] No memory issues during analysis
  - Monitor Docker container memory usage
  - Should stay under 1GB for typical networks

## Production Deployment Checklist

### Terraform Configuration

- [ ] Added `python_fbas_instance_count = 1` to environment config
  ```hcl
  # terraform/environments/staging/main.tf (or production/main.tf)
  module "app_platform" {
    # ... existing config ...
    python_fbas_instance_count = 1
  }
  ```

- [ ] Optional: Added custom environment variables
  ```hcl
  python_fbas_env = {
    LOG_LEVEL = "info"
  }
  ```

- [ ] Ran `terraform plan` to review changes
  ```bash
  cd terraform/environments/staging  # or production
  terraform plan
  # Review: Should show new python-fbas service being created
  ```

### Pre-Deployment Verification

- [ ] Dockerfile exists and is correct
  - Location: `python-fbas-service/Dockerfile`
  - Has all dependencies: cmake, zlib1g-dev, build-essential

- [ ] requirements.txt is correct
  - Includes `python-fbas[qbf]` for QBF solver support

- [ ] Git branch is ready
  - All changes committed
  - Branch pushed to remote
  - Terraform will deploy from this branch

### Post-Deployment Monitoring

- [ ] Check service deployed successfully
  - DigitalOcean App Platform console
  - Service status should be "Running"

- [ ] Check health endpoint
  ```bash
  # Internal URL (from within App Platform)
  curl http://python-fbas:8080/health
  ```

- [ ] Monitor network scanner logs
  ```bash
  # In DigitalOcean App Platform, view network-scanner logs
  # Look for:
  # - "Using Python FBAS scanner"
  # - "Python FBAS analysis succeeded"
  ```

- [ ] Verify analysis results
  - Check network statistics are being updated
  - `minBlockingSetOrgsFilteredSize` should be accurate (not capped)
  - No "top tier not symmetric" warnings if network is actually symmetric

### Rollback Plan

If Python scanner fails in production:

1. **Immediate**: Set `python_fbas_instance_count = 0`
   ```hcl
   python_fbas_instance_count = 0
   ```

2. **Apply changes**
   ```bash
   terraform apply
   ```

3. **Verify**: Scanner automatically falls back to Rust
   - `ENABLE_PYTHON_FBAS=false` automatically set
   - Rust scanner takes over (with tier 1 org cap limitation)

### Success Criteria

✅ Python FBAS service is ready for production when:

1. All local tests pass
2. Full network scan completes successfully with Python scanner
3. Analysis results match expected network topology
4. No errors in service logs
5. Response times are acceptable (< 30s for typical networks)
6. Fallback to Rust works correctly when Python service is unavailable

### Troubleshooting

**Issue**: Service returns 500 errors

- Check logs for `libstdc++.so.6` errors
- Verify Dockerfile has all C++ library dependencies
- Solution: Dockerfile should have `build-essential` and `zlib1g-dev`

**Issue**: "Not symmetric" warning persists

- Python scanner should handle non-symmetric top tiers
- Check that `ENABLE_PYTHON_FBAS=true` in scanner environment
- Verify scanner is actually using Python (check logs)

**Issue**: Analysis times out

- Increase QBF solver timeout in python-fbas-service/app.py
- Consider using different SAT solver (see python-fbas docs)
- May need larger instance size for very large networks

## Current Status

✅ **Local Environment**: Python FBAS scanner working in Docker
✅ **Service Tests**: All endpoints responding correctly
✅ **Backend Tests**: Backend can call Python service via HTTP
⏳ **Integration Test**: Full scan integration test in progress
📋 **Terraform**: Configuration ready for deployment
❌ **Production**: Not yet deployed

## Next Steps

1. ✅ Complete local testing (DONE)
2. ⏳ Run full network scan and verify Python scanner is used
3. ⏳ Review scan results for correctness
4. 📋 Choose deployment environment (staging first recommended)
5. 📋 Run `terraform plan` and review changes
6. 📋 Run `terraform apply` to deploy
7. 📋 Monitor production logs and verify success

## Notes

- **Staging first**: Always deploy to staging before production
- **Monitor closely**: Watch logs for first few scans
- **Gradual rollout**: Can deploy to staging, then integration, then production
- **Safe fallback**: Rust scanner always available as fallback
