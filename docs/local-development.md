# Running Radar locally

The nix devShell starts two PostgreSQL servers and seeds `.env` files from the
checked-in `.env.dist` templates. This documents what those files need to
differ on locally, and what does not work without external credentials.

```bash
nix develop        # starts postgres on 25432 (dev) and 25433 (test)
pnpm install
```

## Environment files

`apps/{backend,frontend,users}/.env` are gitignored and are seeded from
`.env.dist` on first entry to the devShell. Four values must differ from the
template for a local run:

| Setting | Local value | Why |
| --- | --- | --- |
| `ACTIVE_DATABASE_URL` | `postgresql://user:password@localhost:25432/stellarbeat?sslmode=disable` | The template points at a docker hostname. **`sslmode=disable` is required** — `AppDataSource` turns SSL on unless the URL opts out, and the devShell Postgres does not speak SSL. |
| `DATABASE_TEST_URL` | same, port `25433`, database `stellarbeat_test` | |
| users `DATABASE_URL` | `postgresql://user:password@localhost:25432/stellarbeat_users?sslmode=disable` | |
| users `PORT` | `6000` | The template says 3000, which the backend API already uses. The backend's `USER_SERVICE_BASE_URL` expects 6000. |

## Running

```bash
pnpm build:ts
pnpm --filter backend run start-api      # :3000, runs migrations on boot
pnpm --filter frontend run dev           # :8080
```

Migrations run automatically unless `TYPEORM_MIGRATIONS_RUN=false`. They load
from `lib/**`, so the backend must be built first.

To populate the database, run a network scan. It connects out to real pubnet
validators and takes several minutes:

```bash
pnpm --filter backend run scan-network
```

Until a scan completes, `/api/v1/node` returns 404 — there is no network to
serve. For frontend work that does not need live data, point
`VUE_APP_PUBLIC_API_URL` at a deployed Radar instead.

## Geo data

`IPSTACK_ACCESS_KEY` ships as a placeholder. Without a real key every lookup
fails and nodes carry no country or ISP, which matters more than it sounds: the
country and ISP FBAS levels group nodes by those fields, so nodes missing them
collapse into a single synthetic `Unknown` group. One group cannot be split or
blocked, and the level stops meaning anything. This is the condition behind the
"safety threshold of 0 countries" report from staging.

Set a real key and the next scan backfills. The scanner asks for geo data for
every node that has none, not only for nodes whose IP changed this scan, so a
provider outage or a bad key is recovered from rather than baked in
permanently. Expect the first such scan to be slower — it looks up every node
rather than the handful that moved.

A free ipstack plan does not return the `connection` object that carries the
ISP, so the ISP level stays empty on one. Country data works on any plan.

## What does not work locally

- **Notifications and contact.** Need the users service plus Mailgun. Disabled
  via `NOTIFICATIONS_ENABLED=false` and the `VUE_APP_PUBLIC_ENABLE_*` flags.
- **S3 backup, Sentry, dead-man switch.** All switched off rather than pointed
  at placeholder endpoints, so a local run cannot reach production
  infrastructure by accident.
## FBAS analysis

`ENABLE_PYTHON_FBAS=false` uses the Rust facade, which does not compute the
top-tier splitting set — `Core forks if` renders as Unknown. To match
production, run the published service image and point the backend at it:

```bash
docker run --rm -p 8001:8080 withobsrvr/python-fbas:0.2.0
```

```
ENABLE_PYTHON_FBAS=true
PYTHON_FBAS_SERVICE_URL=http://127.0.0.1:8001
```

Use the image rather than a local install. The `top-tier` command needs QBF,
which means `pyqbf`, which builds through cmeel and a C++ toolchain and does
not compile cleanly under nix. The image already has it. Confirm with:

```bash
curl -s http://127.0.0.1:8001/health
# {"status":"healthy","python_fbas_available":true}
```

`127.0.0.1` rather than `localhost` is not optional — see Troubleshooting.

## Tests

Run jest from the **repository root**. The root `jest.config.cjs` defines one
project per package; running from inside `apps/frontend` misses it entirely and
falls back to babel, which cannot parse TypeScript and fails every suite with a
misleading syntax error.

```bash
pnpm test:unit                    # all projects
pnpm test:unit:frontend           # one project
pnpm test:unit:backend
```

`pnpm test:integration` needs the test database on 25433.

## What a healthy scan looks like

Against pubnet in September 2026, with geo data and the Python FBAS service
both working:

| | orgs | ISPs | countries |
| --- | --- | --- | --- |
| Halts if | 4 | 1 | 3 |
| Splitting set | 4 | *none exists* | 5 |

Roughly 92 active validators across 18 organizations, a top tier of 10
organizations, symmetric, with all quorums intersecting.

Two of those cells are worth understanding before you treat a difference as a
bug. **ISPs: halts if 1** is real — hosting is concentrated enough that one
provider going down can stop the network. **ISP splitting set: none exists** is
the best possible answer, not a missing one: no set of ISPs, however large, can
break safety. It is stored as null for exactly that reason; a 0 there would
read as "no ISPs need to fail at all", and it used to.

## Troubleshooting

**`permission denied for schema public`** — Postgres 15 revoked `CREATE` on
schema `public` from `PUBLIC`, so the database-level grants are not enough for
migrations to create tables. The devShell grants this on first setup; for an
already-initialised data directory, apply it by hand:

```bash
psql -h localhost -p 25432 -d stellarbeat       -c 'GRANT ALL ON SCHEMA public TO "user";'
psql -h localhost -p 25432 -d stellarbeat_users -c 'GRANT ALL ON SCHEMA public TO "user";'
psql -h localhost -p 25433 -d stellarbeat_test  -c 'GRANT ALL ON SCHEMA public TO "user";'
```

**`The server does not support SSL connections`** — the database URL is missing
`?sslmode=disable`.

**A crawl that logs `activeTopTiers: 0` and never syncs** — `NETWORK_KNOWN_PEERS`
is stale. The crawl bootstraps from that list.

**`SyntaxError: Unexpected token 'G', "[[GCVJ4Z6TI6"... is not valid JSON`** —
something exported `NETWORK_QUORUM_SET` into the shell before the app read it.
`source`-ing a `.env` applies shell quote removal, so

```
NETWORK_QUORUM_SET=[["GABC","GDEF"]]     in the file
NETWORK_QUORUM_SET=[[GABC,GDEF]]         after export
```

and dotenv will not overwrite a variable that is already in the environment, so
the mangled value wins. The devShell used to do this; it no longer does. If you
hit it in a shell of your own, `unset NETWORK_QUORUM_SET` and let dotenv read
the file. Never `source` these files — every app loads its own.

**`Python FBAS analysis failed, falling back to Rust scanner` with
`error: "fetch failed"`** — the service is probably reachable; Node 18+ resolves
`localhost` to `::1` first, and a published container port (or a uvicorn bound
to `127.0.0.1`) listens on IPv4 only. Use `127.0.0.1` in
`PYTHON_FBAS_SERVICE_URL`.

**`Core forks if` shows Unknown** — the Rust facade does not compute it. See
*FBAS analysis* above; run the service image.

**Country or ISP figures are 0, or every node groups as `Unknown`** — geo data
is missing for most nodes. Check how many have it:

```bash
psql -h localhost -p 25432 -d stellarbeat -c 'select count(*) from node_geo_data'
```

A handful of rows against ~220 nodes means lookups are failing. The scanner
retries nodes that have none on every scan, so this resolves itself once the
key works; the scan log reports `Geo data lookups failed` with a count when
some still do.
