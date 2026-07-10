# Stage 1: Builder
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS builder

# Install necessary tools for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2

# Install openssl and curl for healthcheck
RUN apk add --no-cache openssl curl

WORKDIR /app

# Create system user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Install production dependencies only (prisma CLI available as dependency)
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.js ./
RUN npm ci --omit=dev && npx prisma generate

# Copy built artifacts from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Drop root privileges and switch to appuser
USER appuser

# Configure healthcheck using curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

# Expose port
EXPOSE 3000

# Migrations are executed once by the deployment orchestrator before rollout.
CMD ["node", "dist/src/main.js"]
