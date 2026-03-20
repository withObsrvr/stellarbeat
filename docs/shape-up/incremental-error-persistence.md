# Shape Up: Incremental Error Persistence for History Scanner

## Problem
Long-running history archive scans (20+ hours) accumulate errors in memory and only persist to the database after full completion. If the process crashes mid-scan, all findings are lost. This has already happened with the himawari.node.sl8.online scan running on DigitalOcean App Platform.

## Appetite
**1 week** (Medium feature)

This is infrastructure-level work that touches scanner core, persistence layer, and API aggregation. The solution leverages existing patterns (`chainInitDate`, multi-error support) to minimize new complexity.

## Solution (Fat-Marker Sketch)

**Core idea:** Persist each 1M ledger range as its own `Scan` record immediately after completion. Link ranges by `chainInitDate`. Aggregate errors on query.

```
Current:
  scan 100M ledgers → accumulate errors in memory → persist once at end

New:
  scan range 1 → persist → scan range 2 → persist → ... → query aggregates all
```

**Scanner side:**
- Add callback to `scanInRanges()` that fires after each range
- Callback creates + persists a Scan record for that range
- All ranges in a scan share the same `chainInitDate`

**API side:**
- Query all scans with matching `chainInitDate` for a URL
- Aggregate error counts by category
- Return combined `fromLedger`/`toLedger` across chain

---

## Scope Line

### MUST HAVE (Non-negotiable)
- Per-range persistence callback in Scanner
- Persistence wiring in VerifyArchives use-case
- Chain-aware aggregation query in backend
- Partial results visible immediately via API

### NICE TO HAVE (Try to include)
- `chainStatus` field (in_progress vs complete) on API response
- Unit tests for callback invocation
- Integration test for multi-range persistence

### COULD HAVE (Cut first if needed)
- Database index optimization for `(url, scan_chain_init_date)`
- Admin endpoint to view individual range scans
- Progress percentage in API response

---

## Rabbit Holes (Don't do these)

- **Don't implement streaming/WebSocket updates** - Polling is fine for now
- **Don't add a new database table** - Use existing `history_archive_scan_v2` with multiple records per chain
- **Don't change the scan chain concept** - Resume behavior should continue same chain, not start new one
- **Don't over-engineer transaction handling** - Each range persist is independent, no distributed transactions needed
- **Don't add retry logic for persistence failures** - If persist fails, scan continues and that range is lost (acceptable for now)

## No-Gos (Explicitly out of scope)

- Real-time progress dashboard
- Historical comparison of chain results over time
- Automatic scan resumption after crash (manual restart is fine)
- Schema migrations or new database columns
- Breaking changes to existing API contracts

---

## Done (Concrete success example)

**Scenario:** Start a scan of 50M ledgers, kill the process at ledger 25M, check the API.

**Expected result:**
1. Database has ~25 Scan records (one per 1M range completed)
2. API returns aggregated errors for ledgers 0-25M
3. `fromLedger: 0`, `toLedger: 25000000` in response
4. Error counts are summed across all range records
5. Resuming scan adds new range records to same chain

---

## Files to Modify

1. `apps/history-scanner/src/domain/scanner/Scanner.ts`
   - Add `onRangeComplete` callback parameter

2. `apps/history-scanner/src/use-cases/verify-archives/VerifyArchives.ts`
   - Pass persistence callback to scanner

3. `apps/backend/src/history-scan-coordinator/infrastructure/repositories/database/TypeOrmHistoryArchiveScanResultRepository.ts`
   - Add chain aggregation query method

4. `apps/backend/src/history-scan-coordinator/use-cases/get-latest-scan/GetLatestScan.ts`
   - Use chain aggregation for results

---

## Verification Plan

1. **Unit test:** Scanner calls callback exactly once per range
2. **Integration test:** Start scan, verify multiple DB records with same `chainInitDate`
3. **Manual test:**
   - Start scan on DigitalOcean
   - Kill container mid-scan
   - Verify partial results in DB and API
   - Resume scan
   - Verify new ranges join existing chain

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Query performance with many range records | Low | Medium | Add index if needed |
| Breaking existing scan consumers | Low | High | API response structure unchanged |
| Race condition on concurrent scans | Low | Low | Different `chainInitDate` per scan instance |

---

## Technical Notes

**Existing patterns to leverage:**
- `scanChainInitDate` already exists on Scan entity
- Multi-error support with `errors[]` relationship
- `latestScannedLedger` checkpoint field

**Key SQL for aggregation:**
```sql
SELECT * FROM history_archive_scan_v2
WHERE url = :url AND scan_chain_init_date = (
  SELECT scan_chain_init_date FROM history_archive_scan_v2
  WHERE url = :url ORDER BY id DESC LIMIT 1
)
```

Then aggregate: `SUM(error.count)` grouped by `error.category`
