# Stage 1: Builder
FROM node:20-alpine AS builder

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
FROM node:20-alpine

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

# Run migrations and start the server
CMD npx prisma migrate deploy && node dist/src/main
