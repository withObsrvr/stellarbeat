# Build stage
FROM node:20 AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# Copy users specific files
COPY apps/users/package.json ./apps/users/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install 

# Copy source code
COPY apps/ ./apps/


# Build everything
# RUN pnpm build

RUN pnpm build:ts && \
    pnpm --filter shared run post-build && \
    pnpm --filter users run post-build

# Build the application
RUN pnpm --filter users build

# Production stage
FROM node:20

WORKDIR /app

# Copy built files and users package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/users/lib ./apps/users/lib
COPY --from=builder /app/apps/users/node_modules ./apps/users/node_modules
COPY --from=builder /app/apps/users/package.json ./apps/users/package.json


# # Set environment variables
ENV NODE_ENV=production
ENV PORT=7000


# Expose the port
EXPOSE 7000

# Start the application
CMD ["node", "apps/users/lib/index.js"] 