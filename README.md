# Monorepo for Stellarbeat project

## Devcontainer development

For easy development a devcontainer configuration is provided in the .devcontainer folder: https://containers.dev/

You can develop on github codespaces or localy using vscode and devcontainers extension.

A debian docker image with non-root user 'node' is used with nodejs and rust support. 
Two postgress databases are added for development and integration testing.
A persistant volume is created linked to the remote 'workspace' folder.  

Also works with podman. 

Container config and postgresql credentials: 
``` 
cd .devcontainer
cat docker-compose.yml
```

## install

```
pnpm install
```

## list available commands

```
pnpm run
```

## development

### backend and packages

```
pnpm build:ts
```

### frontend and API

```
pnpm dev
```

This will start the api on port 3000 and the frontend hot reload environment.
API (backend) is not hot reloaded on changes. You have to manually stop and
restart pnpm serve.

## build

```
pnpm build
```

## run the app (in production)

Make sure to build first.

### Start the backend API

Start REST API that exposes all data. Used by frontend.

Source: apps/backend/core/infrastructure/http

```
pnpm start:api
```

### Start the frontend server and serve the website

Host the web dashboard.

source: apps/frontend

```
pnpm start:frontend
```

### Run a stellar network scan (recommended: use dedicated worker or machine)

Scans the a stellar network, detects nodes and validators, fetches geo data,
performs network analysis,...

Source: apps/backend/network-scan

```
pnpm start:scan-network 1 0
```

First argument controls if it should loop the scans (.env file in backend can
supply a loop time interval), second argument controls if it's a dry run.

### Run a history scan (recommended: use a dedicated machine)

Fetches all known history archives from db and scans and verifies their content.
Source: apps/backend/history-scan

```
pnpm start:scan-history 1 1
```

First argument controls persisting the results, the second argument if you want
to loop the scanning forever.

## typescript monorepo configuration

The pure typescript packages and apps (backend, crawler, shared,...) have their
tsconfigs linked through references in the root tsconfig.json and composite:true
value in the local tsconfigs.

They inherit common typescript settings from root tsconfig.base.json.

When running build on top level, typescript compiler only recompiles changed
apps/packages and does this in the correct order.

To compile:

```
pnpm build:ts

```

The frontend is separate because it uses vite to build. To build frontend and
all other apps and packages:

```

pnpm build

```

## eslint monorepo configuration

Eslint is defined at the top level using the esling.config.mjs file. Every
project needs to be defined here to enable linting.

run linting:

```
pnpm lint
```

## testing

Using Jest

### unit

```
pnpm test:unit
```

### integration

Using jest, needs postgres instance

```
pnpm test:integration
```

### run all tests (ci)

```
pnpm test:all
```
