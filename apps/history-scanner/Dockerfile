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

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm --filter history-scanner... build

# Prune dev dependencies for production
RUN pnpm prune --prod

# Production runtime image
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy the entire built workspace from builder (includes node_modules and lib/)
COPY --from=app-builder /app ./

# Copy stellar-archivist binary
COPY --from=archivist-builder /go/bin/stellar-archivist /usr/local/bin/stellar-archivist
RUN chmod +x /usr/local/bin/stellar-archivist

# Set environment variable for binary path
ENV STELLAR_ARCHIVIST_PATH=/usr/local/bin/stellar-archivist

WORKDIR /app/apps/history-scanner

CMD ["node", "lib/index.js"]
