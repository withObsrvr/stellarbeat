# Install stellar-archivist (requires Go 1.24+)
FROM golang:1.24-alpine AS archivist-builder

RUN go install github.com/stellar/go-stellar-sdk/tools/stellar-archivist@latest

# Build the Node.js application
FROM node:20-alpine AS app-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.base.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/history-scanner ./apps/history-scanner

# Install all dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Build all packages and the app
RUN pnpm --filter history-scanner... build

# Use pnpm deploy to create a standalone production bundle
RUN pnpm --filter history-scanner deploy --prod /prod/history-scanner

# Production runtime image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy the deployed production bundle
COPY --from=app-builder /prod/history-scanner ./

# Copy stellar-archivist binary
COPY --from=archivist-builder /go/bin/stellar-archivist /usr/local/bin/stellar-archivist
RUN chmod +x /usr/local/bin/stellar-archivist

# Set environment variable for binary path
ENV STELLAR_ARCHIVIST_PATH=/usr/local/bin/stellar-archivist

CMD ["node", "lib/index.js"]
