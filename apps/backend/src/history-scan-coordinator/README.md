# History Scan Coordinator

Coordinates and schedules history archive scanning jobs across multiple scanner
instances (workers). Part of the apps/backend service. See apps/history-scanner

## Overview

The coordinator:

- Manages scan chains and scheduling for Stellar history archives
- Provides REST endpoints for workers to fetch jobs and submit results
- Persists scan results and error states
- Uses configurable scheduling strategies to determine which archives to scan
  and which archives to RE-scan fully

## Architecture

### Key Components

- **GetScanJob**: Schedules new scan jobs based on configured strategy
- **Scan**: Represents a segment in a scan chain for an archive
- **ScanScheduler**: Determines which archives to scan next
- **HistoryArchiveRepository**: Manages list of archives to scan

### Scan Chain Concept

A scan chain represents the full verification history of an archive over time:

- Each scan has an `initDate` that groups it into a chain
- Chains are continued by passing previous scan details to the workers
- New chains are started periodically to re-verify from the beginning

## API Usage

### Get Scan Job

```http
GET /v1/history-scan/job
```

Schedules and return a new Scan job:

### Submit results

```http
POST /v1/history-scan
```
