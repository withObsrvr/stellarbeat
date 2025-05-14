# Radar Backend (formerly Stellarbeat)

Backend for the Radar platform that monitors and analyzes the Stellar
network validators and organizations. It uses a database (pgsql recomended) for
storage. And it exposes a REST API for all the necessary functions.

Built with Nodejs/TypeScript and follows Clean Architecture principles.

Follows 12 factor app and can be easily run on heroku hosting.

## Modules

The backend follows clean architecture and is divided into modules that are
loosely coupled. Every module has a domain folder for domain code. An
infrastructure folder for the database, cli scripts, ... and use-cases that
describe and execute the available functionality.

### Network Scanner

- Crawls and monitors the Stellar network using the crawler package
- Collects node and organization data through TOML files and direct connections
- Tracks network health, node versions, and quorum set configurations
- Provides network metrics via REST APIs

### Notifications

- Manages user subscriptions for network events
- Sends email notifications through the users microservice
- Alerts on network outages, validator failures, and quorum set changes

### History Archive Scan coordinator

- Schedules ScanJobs to scan history archives
- Workers can fetch ScanJobs to execute.
- Allows parallel executing of History Archive Scans

### Core

The core module contains app wide functionality like kernel initiation,
configuration, database, etc.

## install

Should be executed from the root of the monorepo

```
> pnpm install # install dependencies
> pnpm build # build the code into the lib folder
# Database migrations are run automatically when the code is first run.
```

Copy env.dist to .env and configure the environment variables.

## Usage

Every module has a README.md file with more detailed information.

### Run dev environment

Note: these commands are also exposed in the monorepo root.

1. Provide the necessary environment variables. (todo: automate)
2. Start a network scan to get some data into the system

```
pnpm start:scan-network
```

3. start api and frontend dev environment

```
pnpm dev
```

Dev environment hosted on http://localhost:5173/

### Run the api

```

pnpm start-api

```

### Run the history-scan

```

pnpm verify-archives

```

### Run the network-scan

```

pnpm scan-network

```

### Run tests

The test folder contains both unit and integration tests. A test database is
required for the integration tests that you can configure with the
DATABASE_TEST_URL env variable.

```

pnpm test pnpm test:unit pnpm test:integration

```

### Create migration

```

pnpm build
cd apps/backend
pnpm typeorm migration:generate src/core/infrastructure/database/migrations/{{MIGRATION_DESCRIPTION}} -d lib/core/infrastructure/database/AppDataSource.js

```

### Revert latest migration

```
pnpm typeorm migration:revert -d lib/core/infrastructure/database/AppDataSource.js
```

## API Documentation

OpenAPI spec available at openapi.json Swagger UI available at /api-docs when
running in development

## history

Code from https://github.com/stellarbeat/stellarbeat was forked to
this monorepo. For history consult this archive.
