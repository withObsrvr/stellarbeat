# Validator discovery improvement implementation plan

## Status

Phases 1-4 in progress. The first end-to-end implementation was completed and
validated against a local Radar instance on July 30, 2026. See
[Endpoint discovery operations and implementation status](ENDPOINT_DISCOVERY_OPERATIONS.md)
for the implemented surface, local test procedure, and remaining hardening work.

## Objective

Improve Radar so that it can discover newly declared validators, follow
legitimate address changes, distinguish TCP reachability from Stellar overlay
reachability, and explain failures without requiring a deployment or manual log
investigation.

The plan addresses the two observed incident classes:

- Marketnode: three healthy validators were absent until their IP addresses were
  added manually to `NETWORK_KNOWN_PEERS`.
- Creit: the updated Beta address accepted TCP but terminated TLS through
  Traefik, preventing the Stellar HELLO/AUTH exchange.

## Success criteria

The work is complete when Radar can:

1. accept and persist a candidate endpoint without an application deployment;
2. resolve validator hostnames and detect address changes;
3. perform a real Stellar HELLO/AUTH exchange before associating an address with
   a validator identity;
4. classify and persist connection failures by stage;
5. reconcile TOML-declared validators with directly observed validators;
6. run a targeted discovery pass for declared, stale, or missing validators;
7. retain multiple candidate endpoints for a public key;
8. explain states such as validating-but-unreachable, TLS detected, wrong public
   key, or declared-but-undiscovered through the API and UI;
9. discover the Marketnode validators and diagnose the Creit proxy failure in
   automated regression tests.

## Non-goals

This project will not:

- treat `stellar.toml` as authoritative proof of validator identity;
- replace the existing network crawl or FBAS analysis;
- scan arbitrary Internet address ranges;
- automatically trust an address merely because DNS or TOML declares it;
- require validator-ops, an OBSRVR validator, or any external peer observer;
- expose a validator's private Stellar Core HTTP interface to Radar;
- replace the crawler's live overlay connection with a TCP-only health check.

## Design principles

### Public key is identity; endpoint is evidence

A validator public key is stable. Hostnames, IP addresses, and ports are mutable
observations. Radar must authenticate an endpoint and obtain its public key
before associating that endpoint with an identity.

### Preserve conflicting observations

Do not overwrite a previously authenticated endpoint simply because DNS changes.
Store the new address as a candidate, probe it, and promote it only after the
expected key is authenticated.

### Discovery sources are hints

Configured seeds, TOML entries, DNS answers, peer gossip, and optional external
peer observations produce candidates. None of them alone establishes identity.

### Every failed attempt should be actionable

Persist a stable outcome code, stage, timestamp, and sanitized detail. Operators
should not need debug logs to distinguish TLS, HTTP, timeout, protocol, and key
mismatch failures.

### Bound all automated discovery

Candidate collection, DNS resolution, and follow-up probes require rate limits,
SSRF protection, deduplication, retry backoff, and per-scan budgets.

## Target scan flow

```text
Candidate sources
  - previously authenticated endpoints
  - configured bootstrap IPs
  - runtime operator submissions
  - cached TOML declarations
  - peer gossip
  - optional provider-neutral peer observations
          |
          v
Resolve and normalize candidates
  - A and AAAA records
  - deduplicate IP:port
  - reject prohibited destinations
          |
          v
Primary authenticated crawl
  - TCP connection
  - Stellar HELLO/AUTH
  - public-key and protocol capture
  - peer gossip and SCP observation
          |
          v
Home-domain and TOML enrichment
  - declared validator keys and hosts
  - declaration/discovery reconciliation
          |
          v
Targeted delta pass
  - newly declared endpoints
  - stale DNS endpoints
  - identities seen through SCP without a usable address
          |
          v
Persist endpoint evidence and publish diagnostic state
```

The targeted delta pass must share the same global connection and time budgets
as the main scan. It should not restart the full FBAS pipeline.

## Domain model

### Validator endpoint candidate

Introduce an endpoint candidate entity independent of the node snapshot:

```text
ValidatorEndpointCandidate
  id
  networkId
  expectedPublicKey nullable
  hostname nullable
  ip
  port
  source
  sourceReference nullable
  firstSeenAt
  lastSeenAt
  lastResolvedAt nullable
  enabled
  expiresAt nullable
  state
```

Suggested source values:

```text
persisted_node
configured_seed
operator_submission
toml_declaration
peer_gossip
external_peer_observation
dns_resolution
```

Suggested candidate states:

```text
unverified
authenticated
failed
stale
quarantined
disabled
```

### Endpoint probe observation

Persist individual attempts separately from the candidate:

```text
EndpointProbeObservation
  id
  candidateId
  scanId nullable
  vantagePoint
  attemptedAt
  completedAt
  outcome
  failureStage nullable
  resolvedIp
  remotePublicKey nullable
  coreVersion nullable
  overlayMinVersion nullable
  overlayVersion nullable
  networkId nullable
  errorCode nullable
  sanitizedDetail nullable
```

Suggested outcomes:

```text
authenticated
dns_failed
tcp_refused
tcp_timeout
tls_detected
http_detected
invalid_overlay_frame
overlay_auth_failed
protocol_incompatible
wrong_network
unexpected_public_key
connection_closed
rate_limited
probe_budget_exhausted
```

### Node-to-endpoint relationship

A node may have multiple authenticated endpoints. Track:

- first and last successful authentication;
- most recent failure;
- source and provenance;
- whether the endpoint is currently preferred for crawling;
- whether it is still declared in TOML or DNS;
- regional reachability when multi-vantage probing is enabled.

Do not remove the current node IP field in the first release. Derive it from the
preferred authenticated endpoint until API consumers migrate to the endpoint
collection.

## Promotion and reconciliation rules

1. DNS and TOML create candidates but never update the node's canonical public
   key.
2. An authenticated endpoint presenting the expected key may be promoted.
3. An endpoint presenting a different key is quarantined and recorded as
   `unexpected_public_key`.
4. If no expected key was supplied, successful HELLO/AUTH may create or attach
   to the identity presented by the endpoint.
5. A newly authenticated address does not delete older addresses.
6. Failed probes do not erase prior successful authentication evidence.
7. The preferred endpoint is selected from recent successful observations using
   a deterministic policy.
8. Relayed SCP can set validating status but cannot mark an endpoint reachable.
9. A TOML declaration missing from the crawl is recorded as
   `declared_not_discovered`, not silently ignored.
10. An identity observed through SCP without an endpoint is retained as an
    identity candidate rather than discarded.

## Implementation phases

### Phase 1: Structured connection outcomes

Goal: retain the reason every address did or did not authenticate.

Work:

1. Define stable connection-attempt outcome and failure-stage types in the
   crawler package.
2. Extend `node-connector` error handling so the connection manager emits a
   structured failure event containing address, stage, code, and sanitized
   detail.
3. Detect common non-overlay signatures:
   - TLS record content types and versions;
   - responses beginning with `HTTP/`;
   - invalid XDR record markers;
   - overlay version and network mismatches.
4. Add every attempted address to the crawl result, including attempts that
   never revealed a public key.
5. Log a final failure summary grouped by outcome instead of relying only on
   debug connection messages.
6. Preserve the existing `connectivityError` field for compatibility, deriving
   it from the richer result.
7. Define a scanner-owned normalized diagnostic contract. Other tools may map to
   the same outcome vocabulary, but the scanner must have no build-time or
   runtime dependency on validator-ops.

Primary touchpoints:

- `packages/crawler/src/network-observer/connection-manager.ts`
- `packages/crawler/src/crawl-result.ts`
- `packages/crawler/src/crawl-logger.ts`
- `apps/backend/src/network-scan/domain/node/scan/node-crawl/CrawlerService.ts`
- `apps/backend/src/network-scan/domain/node/scan/node-crawl/PeerNodeToNodeMapper.ts`

Acceptance tests:

- raw Stellar endpoint returns `authenticated` with the remote key;
- TLS endpoint returns `tls_detected`;
- HTTP endpoint returns `http_detected`;
- silent endpoint returns `tcp_timeout` or `overlay_auth_failed` according to
  the stage reached;
- wrong network and incompatible overlay versions are distinguishable;
- no secrets or raw payloads are included in persisted error detail.

### Phase 2: Endpoint candidate persistence

Goal: separate mutable addresses from validator identity and retain their
history.

Work:

1. Add database migrations for endpoint candidates and probe observations.
2. Add repositories and domain services for candidate deduplication, state
   transitions, and probe persistence.
3. Backfill current node IP and port values as `persisted_node` candidates.
4. Backfill current configured known peers as `configured_seed` candidates.
5. Mark backfilled endpoints with their actual evidence level; do not fabricate
   a recent successful authentication timestamp.
6. Project the preferred authenticated endpoint back onto the current node
   snapshot so existing APIs continue to work.
7. Allow identity candidates that have SCP evidence but do not yet have an
   address.

Acceptance tests:

- one public key can retain several endpoints;
- one IP can be probed without being assigned to a public key;
- a wrong-key response cannot change an existing node identity;
- failed and stale endpoints remain inspectable;
- existing node API responses remain backward compatible.

### Phase 3: Runtime seed and probe operations

Goal: remove the deployment requirement for discovery intervention.

Work:

1. Add an authenticated operator API to create, disable, expire, and list
   endpoint candidates.
2. Accept either:
   - literal IP and port;
   - hostname and port;
   - home domain or `stellar.toml` URL plus optional expected keys.
3. Add an operator action to probe a candidate immediately.
4. Add an operator action to include enabled candidates in the next scan.
5. Record submitter, reason, source, and audit timestamps.
6. Move environment-provided `NETWORK_KNOWN_PEERS` into the same candidate
   pipeline while preserving it as a bootstrap fallback.
7. Add retry backoff and optional expiration for temporary operator submissions.

Proposed internal endpoints:

```text
POST   /api/v1/admin/networks/:networkId/endpoint-candidates
GET    /api/v1/admin/networks/:networkId/endpoint-candidates
PATCH  /api/v1/admin/endpoint-candidates/:candidateId
POST   /api/v1/admin/endpoint-candidates/:candidateId/probe
POST   /api/v1/admin/networks/:networkId/scans
```

Exact routing should follow the existing backend API conventions.

Acceptance tests:

- adding a candidate requires no redeployment;
- the next scan includes an enabled candidate;
- an immediate probe returns the normalized outcome;
- disabled or expired candidates are not crawled;
- every mutation is authenticated and audited.

### Phase 4: DNS refresh and TOML reconciliation

Goal: automatically find changed and newly declared endpoints.

Work:

1. Extend the endpoint model to accept hostnames instead of requiring only
   literal IP addresses.
2. Resolve all A and AAAA records at scan preparation time.
3. Store resolution time, answer set, and TTL where available.
4. When DNS changes, create new candidates while retaining previous addresses.
5. Cache parsed TOML validator declarations so they can seed the next scan's
   preparation phase.
6. After the primary crawl and TOML update, diff declared validators against:
   - authenticated nodes;
   - identities observed through SCP;
   - enabled endpoint candidates.
7. Resolve and probe newly declared or changed hosts in a targeted delta pass.
8. Require an operator submission for an entirely unknown organization unless
   its home domain is learned from authenticated network data. Radar cannot
   infer an arbitrary organization's TOML URL on its own.
9. Apply a strict per-domain and per-scan candidate limit.

Acceptance tests:

- a DNS address change creates and probes a new candidate in the same scan;
- a failed new address does not remove the last authenticated address;
- multiple A and AAAA answers are tested independently;
- a TOML-declared validator missing from the first crawl is attempted in the
  delta pass;
- an entirely new submitted organization can be discovered without editing
  `NETWORK_KNOWN_PEERS`.

### Phase 5: Optional external peer-observation ingestion

Goal: allow any Radar operator to contribute peer observations from
infrastructure they control without coupling Radar to validator-ops, OBSRVR
validators, or a required companion process.

This phase is an optional coverage enhancement. Phases 1-4 must provide a
complete and supported Radar deployment on their own. Start Phase 5 only after
measuring the remaining discovery gaps following the Phase 4 rollout.

Work:

1. Define a provider-neutral external peer-observation contract that creates
   unverified endpoint candidates through the same candidate-source interface as
   built-in discovery.
2. Add an authenticated, rate-limited ingestion API accepting only the required
   fields:
   - network identifier;
   - observed public key when available;
   - observed address and advertised/listening port when available;
   - Core version and overlay version;
   - connection direction;
   - observation timestamp;
   - caller-controlled source identifier.
3. Bind ingestion credentials to a network and source identifier. Add replay
   protection, payload limits, audit records, and source-specific freshness
   rules.
4. Convert accepted observations to `external_peer_observation` candidates.
   Never mark them authenticated based on the submission.
5. Deduplicate observations from different sources while retaining their
   provenance.
6. Require Radar to perform its own HELLO/AUTH and expected-key verification
   before endpoint promotion.
7. Use a push model so an observer needs only outbound HTTPS access to Radar.
   Radar must never require inbound access to a validator's private Core HTTP
   port.
8. Document a small, optional `radar-peer-observer` companion that reads a local
   Core `/peers` endpoint and submits sanitized observations. It must be
   independently deployable and must not require validator-ops.
9. Permit community operators to implement their own producers against the same
   ingestion contract.
10. Keep all external observation sources optional and failure-isolated from the
    normal scan.

Acceptance tests:

- Radar operates normally when no external observation source is configured;
- a valid observation from any authorized producer becomes an unverified
  candidate;
- forged, replayed, stale, oversized, or unauthorized submissions are rejected;
- an external observation cannot assign the wrong key to an endpoint;
- repeated observations do not create duplicate candidates;
- Radar independently authenticates an observed endpoint before promotion;
- loss of every external source does not block or degrade the built-in crawl;
- no inbound firewall access to the observer or Stellar Core admin API is
  needed.

### Phase 6: Diagnostic API and UI

Goal: explain what Radar knows and what operators should do next.

Work:

1. Extend the node API with a backward-compatible connectivity summary.
2. Add an endpoint history API for detailed operator use.
3. Display separate states for:
   - authenticated and reachable;
   - validating through relayed SCP but not directly reachable;
   - declared but not discovered;
   - DNS changed and awaiting authentication;
   - TLS or HTTP proxy detected;
   - unexpected public key;
   - incompatible overlay protocol;
   - no recent evidence.
4. Show last successful authentication, last attempt, attempted address, vantage
   point, and a safe remediation message.
5. Add an internal “probe now” control backed by the Phase 3 API.
6. Do not expose sensitive topology or unrestricted probing to public users.

Example compatibility shape:

```json
{
	"active": false,
	"connectivityError": true,
	"connectivity": {
		"status": "tls_detected",
		"lastAttemptedAt": "2026-07-29T23:55:05Z",
		"endpoint": "57.128.141.161:11625",
		"expectedPublicKey": "G...",
		"authenticatedPublicKey": null,
		"detail": "TLS termination detected on the Stellar overlay port"
	}
}
```

Acceptance tests:

- existing API consumers continue to receive the current fields;
- each normalized outcome maps to a stable API and UI state;
- Creit's failure produces a TLS-specific explanation;
- Marketnode's pre-discovery state produces a declared-but-undiscovered
  explanation;
- operator controls enforce authentication and rate limits.

### Phase 7: Reliability and multi-vantage hardening

Goal: distinguish global failures from regional routing and firewall failures.

Work:

1. Add optional probes from at least two independent regions.
2. Store the vantage point on every probe observation.
3. Distinguish globally unreachable from regionally unreachable.
4. Add bounded retry and jitter policies by failure category.
5. Cap candidate probes, DNS resolutions, and delta-pass duration per scan.
6. Add circuit breakers for domains or networks producing excessive candidates.
7. Continue the scan when the targeted discovery budget is exhausted and record
   `probe_budget_exhausted`.

This phase should follow single-vantage correctness; additional vantage points
must not multiply ambiguous results.

## Regression scenarios

### Marketnode scenario

Fixture:

- a new organization has a valid TOML with three validator keys and hosts;
- none of the validators appears in peer gossip or persisted nodes;
- each host exposes a valid Stellar endpoint presenting the declared key.

Expected behavior:

1. An operator submits the home domain once.
2. Radar fetches the TOML, resolves all three hosts, and creates candidates.
3. The targeted pass authenticates all three keys.
4. The nodes are persisted and associated with the organization.
5. Future DNS changes are followed without another submission.
6. No environment change or deployment is required.

### Creit scenario

Fixture:

- an existing validator's hostname resolves to a new IP;
- the validator key continues to appear in relayed SCP;
- the new address accepts TCP but returns a Traefik TLS alert and HTTP response.

Expected behavior:

1. DNS refresh creates the new endpoint candidate.
2. Radar retains `isValidating: true` from signed relayed SCP.
3. The probe returns `tls_detected`, not `authenticated`.
4. Radar does not replace the last authenticated endpoint with the TLS endpoint.
5. The API explains that the validator is validating but its public overlay
   endpoint terminates TLS.
6. After the fixture changes to raw Stellar TCP, the next probe authenticates
   the expected key and promotes the new endpoint.

### Address-hijack scenario

Fixture:

- a declared hostname changes to an endpoint presenting another valid Stellar
  key.

Expected behavior:

- record `unexpected_public_key`;
- quarantine the candidate;
- preserve both node identities;
- never move the expected node to the presented key or address automatically.

### Multiple-address scenario

Fixture:

- one public key is reachable through two valid addresses;
- one address later becomes unreachable.

Expected behavior:

- retain both endpoints;
- prefer the recently authenticated address according to policy;
- keep the failed address history;
- do not create two validator identities.

## Quorum-set request cleanup

The Marketnode scan showed `QuorumSet received` followed by
`Request timeout reached`. Address this alongside the crawler observability
work:

1. use one correlation identifier consistently for request creation, response,
   and timeout cancellation;
2. ensure a received quorum set clears its timer before logging success;
3. make late timeout callbacks no-ops after successful completion;
4. add a regression test in which a quorum set response arrives before timeout
   and assert that no timeout or retry is recorded;
5. report the final request outcome once rather than requiring operators to
   infer it from ordered log lines.

## Security requirements

### SSRF and destination policy

- Permit only `https://<home-domain>/.well-known/stellar.toml` for submitted
  home domains unless an administrator explicitly overrides it.
- Resolve DNS before connecting and reject loopback, link-local, multicast,
  private, documentation, and cloud-metadata destinations for the public
  network.
- Revalidate the resolved address at connection time to mitigate DNS rebinding.
- Apply network-specific policies so private test networks can opt into private
  destinations deliberately.
- Default to port 11625; require elevated authorization for arbitrary ports.

### Resource limits

- Limit hostnames, addresses per hostname, submissions per operator, and probes
  per scan.
- Deduplicate candidates before connection scheduling.
- Apply exponential backoff to persistent failures.
- Expire temporary manual candidates unless explicitly made durable.

### Identity integrity

- Never associate a candidate with `expectedPublicKey` until HELLO/AUTH presents
  that exact key.
- Sanitize error details before persistence or API output.
- Audit candidate creation, modification, immediate probes, and manual scans.

## Observability

Add metrics:

```text
radar_endpoint_candidates_total{source,state}
radar_endpoint_probe_total{source,outcome,vantage}
radar_endpoint_probe_duration_seconds{outcome}
radar_declared_validator_gap_total{home_domain}
radar_dns_change_total{network}
radar_unexpected_public_key_total{network}
radar_discovery_lag_seconds{source}
radar_delta_pass_candidates_total{result}
radar_delta_pass_duration_seconds
```

Add structured scan summary fields:

- candidates by source;
- unique normalized addresses;
- attempts by outcome;
- identities authenticated;
- new endpoints promoted;
- declarations still unresolved;
- candidates skipped because of policy, backoff, or budget.

Alert on:

- a sudden rise in TLS or HTTP endpoints on port 11625;
- declared high-quality validators without an authenticated endpoint;
- discovery lag above the agreed service objective;
- unexpected-key responses;
- exhaustion of the targeted-pass budget;
- loss of all candidate sources other than persisted addresses.

## Rollout strategy

### Shadow mode

1. Deploy endpoint persistence and probes without changing the preferred node
   IP.
2. Compare candidate authentication results with the existing crawl for several
   scan cycles.
3. Measure scan-duration and connection-volume impact.
4. Review all wrong-key, TLS, and HTTP classifications manually.

### Feature flags

Introduce separate flags:

```text
ENABLE_ENDPOINT_CANDIDATES
ENABLE_RUNTIME_SEEDS
ENABLE_TOML_DISCOVERY_PASS
ENABLE_EXTERNAL_PEER_OBSERVATIONS
ENABLE_ENDPOINT_PROMOTION
ENABLE_CONNECTIVITY_API_V2
```

Enable collection and observation before promotion. Roll back endpoint promotion
without disabling evidence collection.

### Promotion rollout

1. Enable automatic promotion only when the candidate authenticates the expected
   key.
2. Start with manually submitted candidates.
3. Add cached TOML and DNS candidates.
4. Measure the remaining discovery gaps before enabling optional external peer
   observations.
5. Add multi-vantage results last.

## Proposed implementation issues

1. Define endpoint candidate, probe outcome, and failure-stage domain types.
2. Emit structured connection failures from `node-connector` and crawler.
3. Add candidate and probe-observation database migrations and repositories.
4. Backfill current node endpoints and configured seeds.
5. Persist crawl connection attempts and final outcome summaries.
6. Add the authenticated runtime candidate CRUD and probe API.
7. Include runtime candidates in scan preparation.
8. Add safe hostname resolution with A/AAAA, TTL, and DNS-change tracking.
9. Cache and reconcile TOML validator declarations.
10. Add the targeted delta crawl/probe pass.
11. Support identity candidates observed through SCP without an address.
12. Add the provider-neutral external peer-observation ingestion contract and
    API, gated on post-Phase-4 coverage measurements.
13. Build the optional standalone `radar-peer-observer` only if the measured
    discovery benefit justifies maintaining it.
14. Add endpoint preference and promotion policy.
15. Extend the node API with connectivity evidence.
16. Add Radar UI diagnostic states and internal probe controls.
17. Fix quorum-set response/timeout correlation.
18. Add Marketnode, Creit, wrong-key, and multiple-address integration fixtures.
19. Add metrics, alerts, feature flags, and shadow-mode comparison reporting.
20. Add optional multi-region probing after the single-vantage rollout
    stabilizes.

Issues 1-5 form the foundation. Issues 6-10 deliver the first operational and
automatic discovery improvements. Issues 11-13 expand coverage without
introducing a required external dependency. Issues 14-16 make the richer model
visible. Issues 17-19 harden correctness and rollout. Issue 20 is a later
reliability enhancement.

## Definition of done

- All success criteria are met.
- Creit and Marketnode regression scenarios pass in CI.
- Existing crawler and API tests remain green.
- Scanner duration and connection counts remain within configured budgets.
- Wrong-key candidates cannot alter node identity.
- Runtime candidate management is authenticated, audited, and rate-limited.
- The public API remains backward compatible.
- Operators can determine the last attempted endpoint, outcome, and next action
  without reading raw crawler logs.
- The validator discovery testing document is updated to use the new API and
  normalized outcome names.
