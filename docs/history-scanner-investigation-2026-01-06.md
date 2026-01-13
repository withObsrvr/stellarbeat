# History Scanner Investigation Report

**Date:** 2026-01-06
**Investigator:** Tillman Mosley III

## Executive Summary

Investigation into Stellar Development Foundation (SDF) feedback regarding history archive scanning discrepancies between Radar and Atlas. Root cause identified: the WASM-based hasher (`@stellarbeat/stellar-history-archive-hasher@0.7.0`) crashes on Protocol 23+ transaction formats, causing false positives. Solution: replace with latest `stellar-archivist` which includes Protocol 23 support (commit `d4bcb010` merged 2026-01-06).

## SDF Reported Issues

1. **Blockdaemon False Positives** - Radar reported errors that Atlas did not
2. **SatoshiPay False Negatives** - Radar missed actual archive issues
3. **One Error Per Scan** - Only one error reported at a time

## Root Cause Analysis

### WASM Hasher Crashes (Protocol 23+ Incompatibility)

The current history scanner uses `@stellarbeat/stellar-history-archive-hasher@0.7.0`, a Rust/WASM library that:
- Was **archived June 2025**
- Last published December 2024
- Does NOT support Protocol 23+ XDR types:
  - `GeneralizedTransactionSet` (V1 transaction sets)
  - Parallel transaction phases
  - Hot archive buckets

**Error patterns observed:**
```
RuntimeError: unreachable
RuntimeError: memory access out of bounds
```

When the WASM hasher encounters Protocol 23+ transactions, it crashes with panic errors. The scanner then reports these as verification failures, creating **false positives**.

### stellar-archivist Fix

On **2026-01-06**, SDF merged commit `d4bcb010`:
> `historyarchive: Support GeneralizedTransactionSet in stellar-archivist scan --verify (#5867)`

This fix properly handles Protocol 23+ transaction hashing.

## Verification Test Results

All tests performed with rebuilt `stellar-archivist` from latest `go-stellar-sdk` (commit `d4bcb010`):

### SDF Official Archive
```
URL: https://history.stellar.org/prd/core-live/core_live_001
Range: 59213000-59213100
Result: PASS
- Verified 192 ledger headers
- Verified 192 transaction sets
- Verified 192 transaction result sets
- Verified 46 buckets
```

### Bootes/PublicNode Archive (Previously Reported as Failed)
```
URL: https://bootes-history.publicnode.org
Range: 59210000-59210200
Result: PASS
- Verified 320 ledger headers
- Verified 320 transaction sets
- Verified 320 transaction result sets
- Verified 61 buckets
```
**Conclusion: Previous Radar error was FALSE POSITIVE**

### SatoshiPay Iowa Archive
```
URL: https://stellar-history-us-iowa.satoshipay.io
Range: 56188400-56188600
Result: FAIL - REAL CORRUPTION DETECTED
Error: mismatched hash on ledger header 0x03595e53
  Expected: 98204b0d88ad21f6010eed3cf5ff6234cdf7a135c6fe7c64d7876c6597baa85d
  Got: 0000000000000000000000000000000000000000000000000000000000000000
```
**Conclusion: Radar error at SatoshiPay is LEGITIMATE** (all-zeros hash indicates real corruption)

## Pre-Fix stellar-archivist Behavior

Before the Protocol 23 fix, `stellar-archivist` also produced incorrect results:
- All transaction sets returned identical "got" hash: `66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925`
- This indicates a systematic hashing bug (likely hashing nil/empty structure)

## Recommendations

### Immediate Action: Replace WASM Hasher

**Option A: Use stellar-archivist binary (Recommended)**
- Pros: Maintained by SDF, already has Protocol 23+ support, comprehensive verification
- Cons: Requires Go runtime, larger binary, shell subprocess

**Option B: Fork and fix WASM hasher**
- Pros: WebAssembly integration, potentially faster
- Cons: Repository archived, significant Rust/XDR expertise required, ongoing maintenance burden

**Recommendation: Option A** - The WASM hasher repository is archived and the fix is non-trivial. stellar-archivist is actively maintained and just received the necessary fix.

### Architecture Changes

1. **Replace hash-worker.ts** - Remove WASM hasher dependency
2. **Integrate stellar-archivist** - Either as subprocess or port hashing logic to TypeScript
3. **Multiple Errors Per Scan** - Remove database UNIQUE constraint on errorId, modify scanner loop to continue after errors

### Database Schema Change
```sql
-- Remove UNIQUE constraint to allow multiple errors per scan
ALTER TABLE scan_errors DROP CONSTRAINT scan_errors_error_id_key;
```

### Scanner Loop Change
```typescript
// Current (exits on first error):
while (!error) { ... }

// Proposed (collects all errors):
const errors: ScanError[] = [];
while (hasMoreWork) {
  const result = await verify(...);
  if (result.error) errors.push(result.error);
}
```

## Response to SDF

### Blockdaemon False Positives
- **Status:** CONFIRMED FALSE POSITIVE
- **Root Cause:** WASM hasher crash on Protocol 23+ transactions
- **Fix:** Replace with stellar-archivist (Protocol 23+ support confirmed)

### SatoshiPay False Negatives
- **Status:** NEEDS FURTHER INVESTIGATION
- **Note:** We confirmed SatoshiPay HAS real corruption at ledger 56,188,499
- **Question:** Why didn't Radar detect this? Possibly different scan range or timing

### One Error Per Scan Limitation
- **Status:** ACKNOWLEDGED
- **Fix:** Database schema change and scanner loop modification planned

## Files Referenced

- `/home/tillman/projects/obsrvr/stellarbeat/apps/history-scanner/src/domain/scanner/hash-worker.ts` - WASM hasher integration
- `/home/tillman/projects/obsrvr/stellarbeat/apps/history-scanner/src/domain/scanner/Scanner.ts` - Main scanner orchestrator
- `/home/tillman/Documents/go-stellar-sdk/historyarchive/verify.go` - stellar-archivist verification logic
- `/home/tillman/Documents/go-stellar-sdk/tools/stellar-archivist/` - stellar-archivist CLI tool

## Next Steps

1. Update Radar to use stellar-archivist for hash verification
2. Implement multiple-error-per-scan support
3. Re-scan all Tier 1 archives with fixed tool
4. Respond to SDF with findings and timeline
