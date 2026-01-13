# Build stellar-archivist from source
FROM golang:1.21-alpine AS archivist-builder

RUN apk add --no-cache git

WORKDIR /build
RUN git clone https://github.com/stellar/go.git
WORKDIR /build/go
# Use commit with Protocol 23+ support
RUN git checkout d4bcb010

WORKDIR /build/go/tools/stellar-archivist
RUN go build -o /stellar-archivist

# Build the Node.js application
FROM node:20-alpine AS app-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY package.json ./
COPY tsconfig.base.json ./

# Copy workspace packages
COPY packages ./packages
COPY apps/history-scanner ./apps/history-scanner

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build packages and app
RUN pnpm --filter history-scanner... build

# Production runtime image
FROM node:20-alpine AS runtime

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@8

# Copy built application
COPY --from=app-builder /app/pnpm-workspace.yaml ./
COPY --from=app-builder /app/pnpm-lock.yaml ./
COPY --from=app-builder /app/package.json ./
COPY --from=app-builder /app/packages ./packages
COPY --from=app-builder /app/apps/history-scanner ./apps/history-scanner

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy stellar-archivist binary
COPY --from=archivist-builder /stellar-archivist /usr/local/bin/stellar-archivist
RUN chmod +x /usr/local/bin/stellar-archivist

# Set environment variable for binary path
ENV STELLAR_ARCHIVIST_PATH=/usr/local/bin/stellar-archivist

WORKDIR /app/apps/history-scanner

CMD ["node", "lib/index.js"]
