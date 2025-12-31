# syntax=docker/dockerfile:1.6

# Build arguments
ARG NODE_VERSION=20.11.0
ARG ALPINE_VERSION=3.19

# =============================================================================
# Base stage
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
LABEL maintainer="Vibe-Coding-Apps Team"
LABEL description="Vibe Coding Apps - Production Image"

# Install security updates
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS deps
RUN npm install -g pnpm@8

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# =============================================================================
# Builder stage
# =============================================================================
FROM base AS builder
RUN npm install -g pnpm@8

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=latest

ENV NODE_ENV=production

RUN pnpm build

# =============================================================================
# Production stage
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS runner

# Security: Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs appuser

WORKDIR /app

# Install only runtime dependencies
RUN apk add --no-cache curl dumb-init

# Copy built assets
COPY --from=builder --chown=appuser:nodejs /app/.next/standalone ./
COPY --from=builder --chown=appuser:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=appuser:nodejs /app/public ./public

# Security: Set proper permissions
RUN chmod -R 550 /app && \
    chmod -R 770 /app/.next/cache 2>/dev/null || true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Switch to non-root user
USER appuser

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]

# Metadata labels
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.source="https://github.com/vibe-coding-apps"
