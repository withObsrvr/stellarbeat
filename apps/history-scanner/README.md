| `HISTORY_SLOW_ARCHIVE_MAX_LEDGERS` | Maximum ledgers to scan for slow archives                       | `1000`  |
| `HISTORY_MAX_CONCURRENCY`          | Ceiling for the concurrency ladder the performance test probes  | `100`   |
| `UV_THREADPOOL_SIZE`               | libuv thread pool size; overrides the value derived above        | derived |

#### Concurrency and the libuv thread pool

Each checkpoint and bucket file is verified with a `gunzip -> sha256` pipeline,
and Node runs zlib on the libuv thread pool, which defaults to **4** threads.
Raising `HISTORY_MAX_CONCURRENCY` on its own therefore buys very little: dozens
of in-flight downloads still queue behind four threads.

The scanner sizes the pool at startup to
`max(4, min(HISTORY_MAX_CONCURRENCY, 2 x cpu count))`, which is why the two are
documented together. Set `UV_THREADPOOL_SIZE` explicitly to override. Because
libuv reads the variable the first time the pool is used, it is applied by
`src/infrastructure/uv-thread-pool.ts`, which must stay the **first import** of
every entry point.

`HISTORY_MAX_CONCURRENCY` is a ceiling, not a target: `ArchivePerformanceTester`
still benchmarks a descending ladder and picks the fastest rung, so a slow or
rate-limited archive settles on a lower value by itself. Raise it with care when
scanning archives you do not operate.
# History Scanner

A standalone application for scanning and verifying Stellar history archives in
chunks. It is designed to scale by running multiple instances—each instance
communicates via REST with a central **coordinator** that schedules and stores
scan results.

---

## Warning

Scanning history archives can be data/network intensive. Be sure to check your
hosting provider data ingress costs before continuing.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation and Setup](#installation-and-setup)
4. [Usage](#usage)
5. [Environment Variables](#environment-variables)

---

## Overview

The **History Scanner** verifies Stellar history archives by fetching _ScanJobs_
from a coordinator service. It scans the archives in configurable _chunks_, with
concurrency determined at runtime based on performance benchmarks. After each
scan, the results are sent back to the coordinator, which persists and schedules
future scans.

**Why run separately from backend?**

- You may want to run your scanning in a different environment or cloud provider
  to minimize data ingress/egress costs.
- Running multiple standalone scanners makes it easy to scale out horizontally
  for faster verification of multiple archives or large history ranges.
- Microservice instead of 12factor app worker was chosen so you do not have to
  share (make public) your database. A REST api has a much smaller attack vector

---

## Architecture

1. **Coordinator** (external service):

   - Schedules scans and stores scan records/results.
   - Provides REST endpoints for workers (this app) to fetch jobs and submit
     results.

2. **History Scanner** (this app, “worker”):
   - Requests a `ScanJob` from the coordinator.
   - Scans the assigned Stellar archive range.
   - Submits a `ScanResult` to the coordinator once complete or on failure.

## Concurrency & slow archives

To avoid overloading history archives and determining an optimal scan speed, the
concurrency is calculated using some benchmarking before each scan.

A history archive that has low througput is marked as a 'slow archive'. These
archives are not fully scanned, but are limited to the latest x ledgers (See env
variables)

## Installation and Setup

1. **Clone** this repository or download it.
2. **Copy** `.env.dist` to `.env`.
   - Update it with your coordinator’s API URL, credentials, etc.
3. **Install** dependencies:
   ```bash
   pnpm install
   ```
4. **Build** the scanner:

```
pnpm build
```

## Usage

Once configured, run:

```
pnpm run scan-history
```

This command starts the scanning process. It will:

- Contact the coordinator to retrieve a ScanJob.
- Download and verify Stellar history archives.
- Submit the final or incremental results back to the coordinator.

## Environment Variables

### Required

| Variable                   | Description                       | Default |
| -------------------------- | --------------------------------- | ------- |
| `COORDINATOR_API_BASE_URL` | URL of the coordinator service    | -       |
| `COORDINATOR_API_USERNAME` | Username for coordinator API auth | -       |
| `COORDINATOR_API_PASSWORD` | Password for coordinator API auth | -       |

### Performance Settings

| Variable                           | Description                                                     | Default |
| ---------------------------------- | --------------------------------------------------------------- | ------- |
| `HISTORY_MAX_FILE_MS`              | Maximum time (ms) allowed for downloading a single history file | `60000` |
| `HISTORY_SLOW_ARCHIVE_MAX_LEDGERS` | Maximum ledgers to scan for slow archives                       | `1000`  |
| `HISTORY_MAX_CONCURRENCY`          | Ceiling for the concurrency ladder the performance test probes  | `100`   |
| `UV_THREADPOOL_SIZE`               | libuv thread pool size; overrides the value derived below       | derived |

#### Concurrency and the libuv thread pool

Each checkpoint and bucket file is verified with a `gunzip -> sha256` pipeline,
and Node runs zlib on the libuv thread pool, which defaults to **4** threads.
Raising `HISTORY_MAX_CONCURRENCY` on its own therefore buys very little: dozens
of in-flight downloads still queue behind four threads.

The scanner sizes the pool at startup to
`max(4, min(HISTORY_MAX_CONCURRENCY, 2 x cpu count))`, which is why the two are
documented together. Set `UV_THREADPOOL_SIZE` explicitly to override. Because
libuv reads the variable the first time the pool is used, it is applied by
`src/infrastructure/uv-thread-pool.ts`, which must stay the **first import** of
every entry point.

`HISTORY_MAX_CONCURRENCY` is a ceiling, not a target: `ArchivePerformanceTester`
still benchmarks a descending ladder and picks the fastest rung, so a slow or
rate-limited archive settles on a lower value by itself. Raise it with care when
scanning archives you do not operate.

### Error Tracking

| Variable        | Description                                         | Default |
| --------------- | --------------------------------------------------- | ------- |
| `ENABLE_SENTRY` | Enable Sentry error reporting                       | `false` |
| `SENTRY_DSN`    | Sentry project DSN URL (required if Sentry enabled) | -       |

### General Settings

| Variable     | Description                    | Default                       |
| ------------ | ------------------------------ | ----------------------------- |
| `NODE_ENV`   | Environment name               | `development`                 |
| `USER_AGENT` | User agent string for requests | `radar-history-scanner` |
| `LOG_LEVEL`  | Logging verbosity              | `info`                        |

Copy `.env.dist` to `.env` and configure these variables for your environment.
