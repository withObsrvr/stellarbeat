# History Scanner Architecture

A comprehensive guide to the Stellar history archive verification system.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Verification Process](#verification-process)
6. [Data Models](#data-models)
7. [Current Limitations](#current-limitations)
8. [Replacement Strategy](#replacement-strategy)

---

## Overview

The History Scanner is a distributed system for verifying Stellar history archives. It ensures that history archives contain valid, uncorrupted data by verifying cryptographic hashes at multiple levels.

### What It Does

1. **Verifies ledger headers** - Confirms each ledger header hash matches its content
2. **Verifies transaction sets** - Confirms transaction hashes match expected values in ledger headers
3. **Verifies transaction results** - Confirms result hashes match expected values
4. **Verifies bucket files** - Confirms bucket hashes match their content
5. **Verifies bucket list hashes** - Confirms bucket list structure integrity

### Why It Exists

History archives are the source of truth for Stellar network state. Corrupted or incomplete archives can:
- Prevent nodes from catching up to the network
- Cause incorrect state reconstruction
- Break downstream data pipelines (e.g., Horizon, indexers)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND SERVICE                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    History Scan Coordinator                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────────┐   │  │
│  │  │ GetScanJob  │  │ RegisterScan │  │ ScheduleScanJobs           │   │  │
│  │  │ (REST API)  │  │ (REST API)   │  │ (Scheduling Strategy)      │   │  │
│  │  └─────────────┘  └──────────────┘  └────────────────────────────┘   │  │
│  │                           │                                           │  │
│  │  ┌────────────────────────┴───────────────────────────────────────┐  │  │
│  │  │                    PostgreSQL Database                          │  │  │
│  │  │  • Scan chains (history per archive)                           │  │  │
│  │  │  • Scan jobs (scheduled work)                                  │  │  │
│  │  │  • Scan results (errors, latest ledger)                        │  │  │
│  │  └────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                REST API
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HISTORY SCANNER (Worker)                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         VerifyArchives                                 │  │
│  │  • Main loop: fetch job → scan → report results                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                            Scanner                                     │  │
│  │  • Orchestrates scanning in 1M ledger ranges                          │  │
│  │  • Manages scan settings (concurrency, slow archive detection)        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                    │                                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          RangeScanner                                  │  │
│  │  • Scans a specific ledger range                                      │  │
│  │  • Coordinates HAS, Category, and Bucket scanning                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│           │                        │                        │               │
│  ┌────────┴────────┐    ┌─────────┴─────────┐    ┌────────┴────────┐      │
│  │ CategoryScanner │    │   BucketScanner   │    │ CheckPointGen   │      │
│  │ • HAS files     │    │ • Bucket files    │    │ • Ledger→CP     │      │
│  │ • Ledger files  │    │ • Hash verify     │    │ • Range calc    │      │
│  │ • TX files      │    │                   │    │                 │      │
│  │ • Result files  │    │                   │    │                 │      │
│  └─────────────────┘    └───────────────────┘    └─────────────────┘      │
│           │                                                                 │
│  ┌────────┴────────────────────────────────────────────────────────────┐   │
│  │                         HasherPool (workerpool)                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                      hash-worker.ts                           │   │   │
│  │  │  • processLedgerHeaderHistoryEntryXDR (stellar-base)         │   │   │
│  │  │  • processTransactionHistoryEntryXDR (WASM hasher) ⚠️ BROKEN │   │   │
│  │  │  • processTransactionHistoryResultEntryXDR (WASM hasher)     │   │   │
│  │  │  • unzipAndHash (Node crypto)                                │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                               HTTP Requests
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STELLAR HISTORY ARCHIVES                            │
│  • https://history.stellar.org/prd/core-live/core_live_001                 │
│  • https://stellar-history.satoshipay.io                                   │
│  • https://bootes-history.publicnode.org                                   │
│  • etc.                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Backend - History Scan Coordinator

**Location:** `apps/backend/src/history-scan-coordinator/`

| Component | File | Purpose |
|-----------|------|---------|
| GetScanJob | `use-cases/get-scan-job/GetScanJob.ts` | Returns next scan job to worker |
| RegisterScan | `use-cases/register-scan/RegisterScan.ts` | Stores scan results from worker |
| ScheduleScanJobs | `use-cases/schedule-scan-jobs/ScheduleScanJobs.ts` | Pre-schedules scan jobs |
| ScanScheduler | `domain/ScanScheduler.ts` | Determines which archives to scan next |
| HistoryScanRouter | `infrastructure/http/HistoryScanRouter.ts` | REST API endpoints |

**REST Endpoints:**
- `GET /v1/history-scan/job` - Get next scan job
- `POST /v1/history-scan` - Submit scan results

### History Scanner (Worker)

**Location:** `apps/history-scanner/src/`

#### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| **Scanner** | `domain/scanner/Scanner.ts` | Main orchestrator, divides work into 1M ledger ranges |
| **RangeScanner** | `domain/scanner/RangeScanner.ts` | Scans a specific ledger range |
| **CategoryScanner** | `domain/scanner/CategoryScanner.ts` | Scans HAS, ledger, tx, results files |
| **BucketScanner** | `domain/scanner/BucketScanner.ts` | Scans and verifies bucket files |
| **HasherPool** | `domain/scanner/HasherPool.ts` | Worker pool for parallel XDR processing |
| **hash-worker** | `domain/scanner/hash-worker.ts` | Hash calculation functions (WASM + stellar-base) |

#### Supporting Components

| Component | File | Purpose |
|-----------|------|---------|
| CheckPointGenerator | `domain/check-point/CheckPointGenerator.ts` | Converts ledger ranges to checkpoints |
| UrlBuilder | `domain/history-archive/UrlBuilder.ts` | Builds archive file URLs |
| HASValidator | `domain/history-archive/HASValidator.ts` | Validates HAS JSON structure |
| CategoryVerificationService | `domain/scanner/CategoryVerificationService.ts` | Compares expected vs calculated hashes |
| XdrStreamReader | `domain/scanner/XdrStreamReader.ts` | Parses XDR streams |
| CategoryXDRProcessor | `domain/scanner/CategoryXDRProcessor.ts` | Processes XDR and dispatches to worker pool |

#### Use Cases

| Use Case | File | Purpose |
|----------|------|---------|
| VerifyArchives | `use-cases/verify-archives/VerifyArchives.ts` | Main loop: get job, scan, report |
| VerifySingleArchive | `use-cases/verify-single-archive/VerifySingleArchive.ts` | One-off archive verification |

---

## Data Flow

### 1. Job Acquisition

```
Worker                          Coordinator
   │                                │
   │  GET /v1/history-scan/job      │
   │ ─────────────────────────────► │
   │                                │  ScanScheduler determines next archive
   │                                │  Creates/continues scan chain
   │                                │
   │  ScanJobDTO                    │
   │ ◄───────────────────────────── │
   │  {url, fromLedger, toLedger,   │
   │   chainInitDate, ...}          │
```

### 2. Scan Execution

```
Scanner.perform(scanJob)
    │
    ▼
ScanSettingsFactory.determineSettings()
    │  • Benchmark archive performance
    │  • Calculate optimal concurrency
    │  • Mark slow archives
    │
    ▼
Scanner.scanInRanges()
    │  Loop in 1M ledger chunks
    │
    ▼
RangeScanner.scan()
    │
    ├──► CategoryScanner.scanHASFilesAndReturnBucketHashes()
    │    │  • Download .stellar-history.json files
    │    │  • Extract bucket hashes
    │    │  • Calculate bucket list hashes
    │
    ├──► CategoryScanner.scanOtherCategories()
    │    │  • Download ledger-*.xdr.gz
    │    │  • Download transactions-*.xdr.gz
    │    │  • Download results-*.xdr.gz
    │    │
    │    ▼
    │    CategoryXDRProcessor (stream pipeline)
    │    │  • Gunzip
    │    │  • XdrStreamReader (parse frames)
    │    │  • Dispatch to HasherPool
    │    │
    │    ▼
    │    hash-worker.ts (in worker threads)
    │    │  • processLedgerHeaderHistoryEntryXDR()
    │    │  • processTransactionHistoryEntryXDR() ⚠️ BROKEN
    │    │  • processTransactionHistoryResultEntryXDR()
    │    │
    │    ▼
    │    CategoryVerificationService.verify()
    │        • Compare calculated vs expected hashes
    │        • Return error if mismatch
    │
    └──► BucketScanner.scan()
         │  • Download bucket files
         │  • Gunzip + SHA256 hash
         │  • Compare to expected hash
```

### 3. Result Reporting

```
Worker                          Coordinator
   │                                │
   │  POST /v1/history-scan         │
   │  {                             │
   │    url,                        │
   │    chainInitDate,              │
   │    latestScannedLedger,        │
   │    latestScannedLedgerHeaderHash,
   │    error: {type, url, message} │
   │  }                             │
   │ ─────────────────────────────► │
   │                                │  Store in database
   │                                │  Update scan chain
```

---

## Verification Process

### What Gets Verified

#### 1. Ledger Headers (`ledger-*.xdr.gz`)

Each `LedgerHeaderHistoryEntry` contains:
- `ledgerSeq` - Ledger sequence number
- `hash` - Hash of the header itself
- `previousLedgerHash` - Hash of previous ledger header
- `scpValue.txSetHash` - Expected transaction set hash
- `txSetResultHash` - Expected transaction result hash
- `bucketListHash` - Expected bucket list hash

**Verification:** Parse XDR, recalculate header hash, compare.

#### 2. Transaction Sets (`transactions-*.xdr.gz`)

Each `TransactionHistoryEntry` contains:
- V0: `TransactionSet` (legacy)
- V1: `GeneralizedTransactionSet` (Protocol 20+)

**Verification:** Hash the transaction set, compare to `txSetHash` from ledger header.

**⚠️ BROKEN:** The WASM hasher crashes on V1 (GeneralizedTransactionSet).

#### 3. Transaction Results (`results-*.xdr.gz`)

Each `TransactionHistoryResultEntry` contains transaction results.

**Verification:** Hash the result set, compare to `txSetResultHash` from ledger header.

#### 4. Buckets (`bucket/xx/yy/zz/bucket-{hash}.xdr.gz`)

Bucket files contain ledger state.

**Verification:** Gunzip, SHA256 hash, compare to expected hash from HAS file.

#### 5. Bucket List (from HAS files)

The bucket list is a Merkle tree of bucket hashes.

**Verification:** Calculate bucket list hash from HAS file, compare to `bucketListHash` in ledger header.

### Empty Transaction Set Handling

When a ledger has no transactions, there's no entry in the transactions file. The scanner handles this with `EmptyTransactionSetsHashVerifier`:

| Protocol Version | Empty Hash Calculation |
|-----------------|------------------------|
| V0 (legacy) | SHA256(previousLedgerHash) |
| V1 (Protocol 20+) | SHA256(GeneralizedTransactionSet with empty phases) |

**Files:** `domain/scanner/verification/empty-transaction-sets/`

---

## Data Models

### Scan Chain Concept

A **scan chain** represents the complete verification history of an archive:

```
Scan Chain for https://history.stellar.org/...
├── Scan 1: initDate=2024-01-01, ledgers 0-1M
├── Scan 2: initDate=2024-01-01, ledgers 1M-2M (continues chain)
├── Scan 3: initDate=2024-01-01, ledgers 2M-3M (continues chain)
│   ...
└── Scan N: initDate=2024-06-01, ledgers 0-1M (NEW chain, re-verification)
```

### Key Entities

#### ScanJob

```typescript
{
  url: Url,
  chainInitDate: Date,      // Groups scans into a chain
  fromLedger?: number,       // Starting point
  toLedger?: number,         // Ending point
  latestScannedLedger?: number,  // Resume point
  latestScannedLedgerHeaderHash?: string
}
```

#### ScanSettings

```typescript
{
  fromLedger: number,
  toLedger: number,
  concurrency: number,
  isSlowArchive: boolean,
  latestScannedLedger: number,
  latestScannedLedgerHeaderHash: string | null
}
```

#### ScanResult

```typescript
{
  latestLedgerHeader: { ledger: number, hash: string },
  error?: ScanError
}
```

#### ScanError

```typescript
{
  type: ScanErrorType.TYPE_VERIFICATION | ScanErrorType.TYPE_CONNECTION,
  url: string,      // URL of failed file
  message: string   // "Wrong transaction hash", "Wrong ledger hash", etc.
}
```

#### Scan (Final Result)

```typescript
{
  scanChainInitDate: Date,
  startDate: Date,
  endDate: Date,
  baseUrl: Url,
  fromLedger: number,
  toLedger: number | null,
  latestScannedLedger: number,
  latestScannedLedgerHeaderHash: string | null,
  concurrency: number,
  isSlowArchive: boolean | null,
  error: ScanError | null
}
```

---

## Current Limitations

### 1. WASM Hasher Broken (Protocol 23+)

**File:** `domain/scanner/hash-worker.ts` (lines 73-83)

```typescript
import * as hasher from '@withobsrvr/stellar-history-archive-hasher';

export function processTransactionHistoryEntryXDR(
  transactionHistoryEntryXDR: Uint8Array
): { ledger: number; hash: string } {
  const hash = hasher.hash_transaction_history_entry(
    transactionHistoryEntryXDR  // ⚠️ CRASHES on Protocol 23+ XDR
  );
  return { ledger, hash };
}
```

**Problem:** The WASM library is archived (June 2025) and doesn't support:
- `GeneralizedTransactionSet` (V1 tx sets)
- Parallel transaction phases
- Hot archive buckets

**Error:** `RuntimeError: unreachable` when encountering new XDR types.

### 2. One Error Per Scan

**File:** `domain/scanner/Scanner.ts` (line 90)

```typescript
while (rangeFromLedger < scanSettings.toLedger && !error) {
  // Exits on first error
}
```

The scanner stops at the first error, reporting only one issue even if multiple exist.

### 3. Hash Calculation is Embedded

Hash calculation is tightly coupled to the WASM library:
- `processTransactionHistoryEntryXDR` - WASM
- `processTransactionHistoryResultEntryXDR` - WASM
- `processLedgerHeaderHistoryEntryXDR` - stellar-base (working)

---

## Replacement Strategy

### Option A: Replace WASM with stellar-archivist

**Approach:** Shell out to `stellar-archivist` binary for verification.

**Pros:**
- Maintained by SDF
- Protocol 23+ support (commit `d4bcb010` from 2026-01-06)
- Comprehensive verification (buckets, tx sets, results, ledgers)

**Cons:**
- Go binary dependency
- Subprocess overhead
- Different output format

### Option B: Port stellar-archivist Logic to TypeScript

**Approach:** Rewrite the Go hashing logic in TypeScript.

**Key files to port from `go-stellar-sdk/historyarchive/verify.go`:**
- `HashTxSet()` - V0 transaction set hashing
- `VerifyTransactionHistoryEntry()` - V0/V1 dispatch
- `xdr.HashXdr()` for GeneralizedTransactionSet - V1 hashing

**Pros:**
- Native TypeScript, no external binary
- Full control over implementation
- Better integration with existing code

**Cons:**
- Significant development effort
- Need to maintain XDR compatibility

### Option C: Create New Go-based Scanner

**Approach:** Replace the entire TypeScript scanner with a Go implementation using `go-stellar-sdk`.

**Pros:**
- Leverages proven, maintained SDF code
- Best performance
- Easy to stay updated with protocol changes

**Cons:**
- Complete rewrite
- Different deployment model
- Team needs Go expertise

### Recommended Path

**Short-term:** Option A (stellar-archivist integration)
- Fastest to implement
- Proven to work (tested against SDF archives)
- Minimal code changes

**Long-term:** Option C (Go-based scanner)
- Best maintainability
- SDF maintains the hashing logic
- Future protocol updates handled automatically

---

## File Reference

### History Scanner (Worker)

```
apps/history-scanner/src/
├── domain/
│   ├── check-point/
│   │   ├── CheckPointFrequency.ts
│   │   ├── CheckPointGenerator.ts
│   │   └── StandardCheckPointFrequency.ts
│   ├── history-archive/
│   │   ├── Category.ts
│   │   ├── HASBucketHashExtractor.ts
│   │   ├── HASValidator.ts
│   │   ├── HistoryArchiveState.ts
│   │   ├── UrlBuilder.ts
│   │   └── hashBucketList.ts
│   ├── scan/
│   │   ├── Scan.ts
│   │   ├── ScanCoordinatorService.ts
│   │   ├── ScanError.ts
│   │   ├── ScanJob.ts
│   │   ├── ScanResult.ts
│   │   ├── ScanSettings.ts
│   │   └── ScanSettingsFactory.ts
│   └── scanner/
│       ├── ArchivePerformanceTester.ts
│       ├── BucketScanner.ts
│       ├── CategoryScanner.ts
│       ├── CategoryVerificationService.ts
│       ├── CategoryXDRProcessor.ts
│       ├── HasherPool.ts
│       ├── RangeScanner.ts
│       ├── RequestGenerator.ts
│       ├── Scanner.ts
│       ├── ScanState.ts
│       ├── WorkerPoolLoadTracker.ts
│       ├── XdrStreamReader.ts
│       ├── hash-worker.ts  ⚠️ CONTAINS BROKEN WASM HASHER
│       └── verification/
│           └── empty-transaction-sets/
│               ├── EmptyTransactionSetsHashVerifier.ts
│               └── hash-policies/
├── infrastructure/
│   ├── cli/
│   │   ├── verify-archives.ts
│   │   └── verify-single-archive.ts
│   ├── config/
│   │   └── Config.ts
│   ├── di/
│   │   ├── container.ts
│   │   └── di-types.ts
│   ├── http/
│   │   └── MockHistoryArchive.ts
│   └── services/
│       └── RESTScanCoordinatorService.ts
└── use-cases/
    ├── verify-archives/
    │   ├── VerifyArchives.ts
    │   └── VerifyArchivesDTO.ts
    └── verify-single-archive/
        ├── VerifySingleArchive.ts
        └── VerifySingleArchiveDTO.ts
```

### Backend Coordinator

```
apps/backend/src/history-scan-coordinator/
├── domain/
│   ├── HistoryArchiveRepository.ts
│   ├── ScanJob.ts
│   ├── ScanJobRepository.ts
│   ├── ScanScheduler.ts
│   └── sortHistoryUrls.ts
├── infrastructure/
│   ├── di/
│   ├── http/
│   │   └── HistoryScanRouter.ts
│   ├── mappers/
│   │   └── ScanMapper.ts
│   └── repositories/
│       └── database/
│           ├── TypeOrmHistoryArchiveScanResultRepository.ts
│           └── TypeOrmScanJobRepository.ts
└── use-cases/
    ├── get-latest-scan/
    ├── get-scan-job/
    │   └── GetScanJob.ts
    ├── register-scan/
    │   └── RegisterScan.ts
    └── schedule-scan-jobs/
        └── ScheduleScanJobs.ts
```
