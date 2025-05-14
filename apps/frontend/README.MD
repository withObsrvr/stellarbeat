# Obsrvr Radar frontend (formerly Stellarbeat)

The Obsrvr Radar frontend provides an intuitive web dashboard for monitoring and analyzing the Stellar network. Built with Vue.js (currently on v2.7, with Vue 3 migration in progress)

## Features
- Network visualizations and analytics
- Node and organization explorer
- Simulation tools
- Email notification management
- History archive analysis
- Mobile-responsive design
- Bootstrap based UI

## Architecture
- Components: Reusable Vue components in src/components
- Views: Page components in src/views
- Config: Environment configuration via Config
- Router: Vue Router setup in src/router
- Assets: Static files in src/assets

## Development Tools
- Vite for builds
- TypeScript for type safety
- ESLint & Prettier for code quality
- Jest for unit testing

## Usage

### installation

`pnpm install`

Copy .env.dist to .env and fill in the values.

### development mode

`pnpm dev`

### production build

production build: `pnpm build`

## history

You can find the package original history on
https://github.com/stellarbeat/js-stellarbeat-frontend
