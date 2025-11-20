# E2E Tests

## Prerequisites

E2E tests require both the backend API and frontend dev server to be running.

### 1. Start the Development Servers

From the project root, run:

```bash
pnpm dev
```

This will start:
- **Backend API** on `http://localhost:3000`
- **Frontend** on `http://localhost:5173`

### 2. Run the E2E Tests

In a separate terminal:

```bash
# Run all e2e tests
pnpm --filter frontend run test:e2e

# Run with UI (interactive mode)
pnpm --filter frontend run test:e2e:ui

# Run in debug mode
pnpm --filter frontend run test:e2e:debug
```

## Test Structure

- `navbar.spec.ts` - Navigation bar and routing tests
- `nodes.spec.ts` - Node detail pages and trust graph tests
- `organizations.spec.ts` - Organization detail pages tests

## Screenshots

Test screenshots are saved to `apps/frontend/e2e-results/` for debugging.

## Common Issues

### ERR_CONNECTION_REFUSED

If you see connection refused errors, make sure:
1. `pnpm dev` is running in another terminal
2. Backend is accessible at `http://localhost:3000`
3. Frontend is accessible at `http://localhost:5173`

### Trust Graph Not Rendering

The trust graph visualization depends on:
1. Real network data from the backend
2. D3.js visualization libraries loading correctly
3. Network data containing valid trust relationships
