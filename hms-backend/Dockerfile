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

# Copy only necessary files from builder and set correct ownership
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/prisma.config.ts ./

# Drop root privileges and switch to appuser
USER appuser

# Configure healthcheck using curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Run migrations and start the server
CMD npx prisma migrate deploy && node dist/src/main
