# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy workspace files first
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./

# Copy backend package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Copy workspace files first
COPY ../../pnpm-workspace.yaml ./
COPY ../../package.json ./

# Copy backend package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built files from builder stage
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/src/notifications/infrastructure/templates ./lib/notifications/infrastructure/templates

# Copy environment file
COPY apps/backend/.env.dist .env

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "lib/core/infrastructure/http/api.js"] 