# Endpoint discovery operations and implementation status

## Purpose

This document describes the first implementation of Phases 1-4 in the
[validator discovery improvement plan](VALIDATOR_DISCOVERY_IMPROVEMENT_PLAN.md).
It gives a Radar operator a deployment-independent way to submit and probe a
validator endpoint, then include it in a normal network scan.

The implementation is internal and operator-authenticated. It does not require
validator-ops, an OBSRVR validator, or an external peer observer.

## Current implementation

### Phase 1: structured overlay outcomes

The crawler now retains every connection attempt, including addresses that never
presented a public key. Each result contains a normalized outcome, the stage at
which it failed, a stable error code, timestamps, and sanitized detail.

Recognized outcomes include:

- successful Stellar HELLO/AUTH with the remote public key;
- DNS and TCP failures;
- TLS or HTTP detected on the overlay port;
- invalid overlay framing;
- wrong network and incompatible overlay versions;
- authentication failure, timeout, and early connection closure.

The crawl summary groups failures by outcome. The existing node connectivity
fields remain available for API compatibility.

### Phase 2: persistent endpoint evidence

Migration `1785360000000-validator-endpoint-candidates` adds:

- `validator_endpoint_candidate`, which stores mutable endpoint candidates and
  their provenance independently of validator identity;
- `endpoint_probe_observation`, which stores individual probe and crawl results.

Current node addresses are backfilled as `persisted_node` candidates without
fabricating authentication evidence. A public key can retain multiple addresses,
and a failed new address does not erase an older authenticated address.

An endpoint that authenticates as a public key other than its declared expected
key is quarantined. Only a completed Stellar overlay authentication can update a
node's preferred address immediately; unauthenticated address changes retain the
legacy age guard.

### Phase 3: runtime candidate operations

When both `RADAR_ADMIN_API_USERNAME` and `RADAR_ADMIN_API_PASSWORD` are set,
Radar mounts a Basic-authenticated operator API under `/v1/admin`:

```text
GET    /v1/admin/networks/:networkId/endpoint-candidates
POST   /v1/admin/networks/:networkId/endpoint-candidates
PATCH  /v1/admin/endpoint-candidates/:candidateId
POST   /v1/admin/endpoint-candidates/:candidateId/probe
POST   /v1/admin/networks/:networkId/scans
```

A submission may contain an IP, a hostname, a home domain, or an HTTPS URL
ending in `/.well-known/stellar.toml`. Submitting a home domain imports all
valid node declarations from that TOML. The environment-provided known peers are
inserted through the same candidate pipeline but remain the crawler's bootstrap
fallback.

### Phase 4: DNS and TOML reconciliation

Before a scan, enabled hostname candidates are resolved to bounded A and AAAA
answer sets. Resolution time and TTL are retained. New answers become
independent candidates; previous answers are not overwritten.

After the primary crawl and TOML update, Radar reconciles TOML declarations and
runs a bounded delta probe for new or changed addresses. Successfully
authenticated delta results are folded into the same node scan. This is the path
that models Marketnode's three newly declared validators.

Failed and quarantined gossip candidates remain stored as diagnostic evidence
but are not automatically amplified into the next crawl. Configured peers are
always retained, and at most 64 additional persisted addresses are added to a
scan.

## Configuration

```text
RADAR_ADMIN_API_USERNAME       Required to mount the operator API
RADAR_ADMIN_API_PASSWORD       Required to mount the operator API
ENDPOINT_PROBE_TIMEOUT_MS      HELLO/AUTH probe timeout; default 5000
ENDPOINT_DELTA_PROBE_BUDGET    Post-TOML probes per scan; default 24, maximum 256
ALLOW_PRIVATE_ENDPOINT_CANDIDATES
                               Defaults false in production and true elsewhere
```

Do not enable private endpoint candidates on a public deployment unless its
destination policy is intentionally isolated. Candidate input rejects invalid
ports, malformed validator keys, and prohibited IP ranges under the production
policy.

## Operator workflow

The examples assume a local backend on port 3010, network ID `public`, and local
development credentials. Do not use these sample credentials outside a local
environment.

Start the API after building and applying migrations:

```bash
pnpm run build:ts
RADAR_ADMIN_API_USERNAME=local-operator \
RADAR_ADMIN_API_PASSWORD=local-secret \
TYPEORM_MIGRATIONS_RUN=true \
BACKEND_PORT=3010 \
PORT=3010 \
pnpm start:api
```

Submit a single endpoint:

```bash
curl --user local-operator:local-secret \
  --header 'Content-Type: application/json' \
  --data '{
    "hostname":"beta.validator.stellar.creit.tech",
    "port":11625,
    "reason":"Creit overlay diagnostic"
  }' \
  http://localhost:3010/v1/admin/networks/public/endpoint-candidates
```

List candidates and copy the ID for either the literal-IP candidate or a
resolved DNS child:

```bash
curl --user local-operator:local-secret \
  http://localhost:3010/v1/admin/networks/public/endpoint-candidates
```

Probe a candidate immediately:

```bash
curl --request POST \
  --user local-operator:local-secret \
  http://localhost:3010/v1/admin/endpoint-candidates/CANDIDATE_ID/probe
```

Submit an organization TOML, as required for an entirely unknown organization:

```bash
curl --user local-operator:local-secret \
  --header 'Content-Type: application/json' \
  --data '{
    "homeDomain":"stellar.marketnode.com",
    "reason":"Discover newly declared Marketnode validators"
  }' \
  http://localhost:3010/v1/admin/networks/public/endpoint-candidates
```

Trigger a full scan without editing known peers or deploying code:

```bash
curl --request POST \
  --user local-operator:local-secret \
  http://localhost:3010/v1/admin/networks/public/scans
```

The scan request returns `202` immediately. Inspect the candidate list after the
scan for state and timestamps. Observation-history retrieval is not yet exposed
through an API; it is part of the remaining Phase 3/diagnostic work.

Disable or expire a candidate:

```bash
curl --request PATCH \
  --user local-operator:local-secret \
  --header 'Content-Type: application/json' \
  --data '{"enabled":false}' \
  http://localhost:3010/v1/admin/endpoint-candidates/CANDIDATE_ID
```

## Local acceptance result

The implementation was exercised on July 30, 2026 against the local Radar API
and development database:

1. The migration completed and backfilled existing node endpoints.
2. `beta.validator.stellar.creit.tech` resolved to `57.128.141.161:11625`.
3. The immediate probe completed Stellar HELLO/AUTH and returned remote key
   `GDDANSYOYSY5EPSFHBRPCLX6XMHPPLIMHVIDXG6IPQLVVLRI2BN4HMH3`, Core `27.0.0`,
   overlay range `38-41`, and ledger protocol `27`.
4. A full scan started through the operator API, completed the normal crawl and
   downstream analysis, and reported that endpoint as connected, participating
   in SCP, and validating.
5. The candidate and its authenticated observation were persisted in the local
   database.

The real scan also exposed seed amplification from retained gossip failures. The
implementation now preserves those failures for diagnosis but excludes them from
automatic reseeding and bounds additional addresses as described above.

## Automated regression coverage

Focused tests cover:

- Stellar overlay signature and connection-outcome classification;
- recording attempts before and after socket and authentication stages;
- multiple addresses for one validator identity;
- DNS changes that preserve prior authentication;
- three Marketnode TOML declarations discovered and authenticated in one delta
  pass;
- Creit-style TLS termination classified at the overlay HELLO stage;
- wrong-key quarantine;
- failed gossip candidates not becoming an unbounded future seed source;
- authenticated operator routes and runtime scan triggering;
- backward-compatible node address updates.

## Remaining work in Phases 1-4

The foundation is operational, but these items should be completed before a
production rollout:

- add retry backoff and `nextAttemptAt` rather than excluding all failed dynamic
  candidates until they are observed again;
- expose paginated observation history and candidate diagnostics through the
  operator API;
- add operator mutation audit records beyond submitter and entity timestamps;
- add API rate limiting and concurrent-scan protection;
- implement and test a deterministic preferred-endpoint scoring policy;
- add metrics for candidate sources, outcomes, discovery lag, and delta budgets;
- make destination-policy checks resistant to DNS rebinding at connect time;
- add feature flags and run the endpoint pipeline in shadow mode before enabling
  automatic production promotion;
- fix quorum-set response/timeout correlation called out in the parent plan;
- add database integration tests for candidate deduplication and migration
  backfill behavior.

Phases 5 and later remain optional and are not dependencies of this workflow.
