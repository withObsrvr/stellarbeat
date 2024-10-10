# Monorepo for Stellarbeat project

Work in progress

## install

```
pnpm install
```

## development

### backend and packages

```
pnpm build:ts
```

### frontend and API

```
pnpm serve
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

Start the backend API

```
pnpm start:api
```

Start the frontend server and serve the website

```
pnpm start:frontend
```

Run a stellar network scan (recommended: use dedicated worker or machine)

```
pnpm start:scan-network
```

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

```

```
