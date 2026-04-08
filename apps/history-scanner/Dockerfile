# Install stellar-archivist (requires Go 1.25+)
FROM golang:1.25-alpine AS archivist-builder

RUN go install github.com/stellar/go-stellar-sdk/tools/stellar-archivist@main

# Build the Node.js application
FROM node:20-alpine AS app-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.33.0

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

# Build workspace packages in dependency order (sequential to avoid race conditions)
RUN pnpm --filter shared build && \
    pnpm --filter logger build && \
    pnpm --filter custom-error build && \
    pnpm --filter history-scanner-dto build && \
    pnpm --filter exception-logger build && \
    pnpm --filter job-monitor build && \
    pnpm --filter http-helper build && \
    pnpm --filter history-scanner build

# Create production deployment directory
RUN mkdir -p /prod/history-scanner

# Use pnpm deploy for dependencies
RUN pnpm --filter history-scanner deploy --legacy --prod /prod/history-scanner

# Explicitly copy the built lib/ directory (pnpm deploy may not include it)
RUN cp -r /app/apps/history-scanner/lib /prod/history-scanner/lib

# Production runtime image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy the deployed production bundle with built files
COPY --from=app-builder /prod/history-scanner ./

# Copy stellar-archivist binary
COPY --from=archivist-builder /go/bin/stellar-archivist /usr/local/bin/stellar-archivist
RUN chmod +x /usr/local/bin/stellar-archivist

# Set environment variable for binary path
ENV STELLAR_ARCHIVIST_PATH=/usr/local/bin/stellar-archivist

CMD ["node", "lib/infrastructure/cli/verify-archives.js", "1", "1"]
