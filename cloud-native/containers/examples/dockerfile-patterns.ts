/**
 * Dockerfile Patterns and Best Practices
 *
 * Comprehensive examples of Dockerfile patterns, multi-stage builds,
 * optimization techniques, and container best practices for Node.js/TypeScript applications.
 */

/**
 * ============================================================================
 * 1. Basic Node.js Application Dockerfile
 * ============================================================================
 *
 * Basic pattern for containerizing a Node.js application with proper
 * dependency management and non-root user.
 *
 * Dockerfile:
 * -----------
 * FROM node:18-alpine
 *
 * # Set working directory
 * WORKDIR /app
 *
 * # Copy package files
 * COPY package*.json ./
 *
 * # Install dependencies
 * RUN npm ci --only=production
 *
 * # Copy application code
 * COPY . .
 *
 * # Create non-root user
 * RUN addgroup -g 1001 -S nodejs && \
 *     adduser -S nodejs -u 1001
 *
 * # Change ownership
 * RUN chown -R nodejs:nodejs /app
 *
 * # Switch to non-root user
 * USER nodejs
 *
 * # Expose port
 * EXPOSE 3000
 *
 * # Start application
 * CMD ["node", "dist/index.js"]
 */

/**
 * ============================================================================
 * 2. Multi-Stage Build Pattern (Optimized)
 * ============================================================================
 *
 * Multi-stage build separates build dependencies from runtime dependencies,
 * resulting in smaller, more secure production images.
 *
 * Dockerfile:
 * -----------
 * # Build stage
 * FROM node:18-alpine AS builder
 *
 * WORKDIR /app
 *
 * # Copy package files
 * COPY package*.json ./
 * COPY tsconfig.json ./
 *
 * # Install all dependencies (including dev)
 * RUN npm ci
 *
 * # Copy source code
 * COPY src ./src
 *
 * # Build TypeScript
 * RUN npm run build
 *
 * # Production stage
 * FROM node:18-alpine AS production
 *
 * WORKDIR /app
 *
 * # Copy package files
 * COPY package*.json ./
 *
 * # Install only production dependencies
 * RUN npm ci --only=production && \
 *     npm cache clean --force
 *
 * # Copy built application from builder
 * COPY --from=builder /app/dist ./dist
 *
 * # Create non-root user
 * RUN addgroup -g 1001 -S nodejs && \
 *     adduser -S nodejs -u 1001 && \
 *     chown -R nodejs:nodejs /app
 *
 * USER nodejs
 *
 * EXPOSE 3000
 *
 * CMD ["node", "dist/index.js"]
 */

/**
 * ============================================================================
 * 3. Advanced Multi-Stage Build with Layer Caching
 * ============================================================================
 *
 * Optimized for build speed using layer caching and parallel stages.
 *
 * Dockerfile:
 * -----------
 * # Dependencies stage
 * FROM node:18-alpine AS deps
 *
 * WORKDIR /app
 *
 * # Copy only package files to leverage cache
 * COPY package*.json ./
 *
 * # Install dependencies separately for better caching
 * RUN npm ci
 *
 * # Build stage
 * FROM node:18-alpine AS builder
 *
 * WORKDIR /app
 *
 * # Copy dependencies from deps stage
 * COPY --from=deps /app/node_modules ./node_modules
 *
 * # Copy source
 * COPY . .
 *
 * # Build
 * RUN npm run build && \
 *     npm prune --production
 *
 * # Production stage
 * FROM node:18-alpine AS runner
 *
 * WORKDIR /app
 *
 * ENV NODE_ENV=production
 *
 * # Create user and group
 * RUN addgroup --system --gid 1001 nodejs && \
 *     adduser --system --uid 1001 nodejs
 *
 * # Copy production dependencies
 * COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
 *
 * # Copy built application
 * COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
 *
 * # Copy package.json for version info
 * COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
 *
 * USER nodejs
 *
 * EXPOSE 3000
 *
 * CMD ["node", "dist/index.js"]
 */

/**
 * ============================================================================
 * 4. Development Dockerfile with Hot Reload
 * ============================================================================
 *
 * Optimized for development with volume mounting and hot reload.
 *
 * Dockerfile.dev:
 * ---------------
 * FROM node:18-alpine
 *
 * WORKDIR /app
 *
 * # Install development dependencies
 * COPY package*.json ./
 * RUN npm install
 *
 * # Copy source (will be overridden by volume mount)
 * COPY . .
 *
 * # Expose debug port
 * EXPOSE 3000 9229
 *
 * # Start with nodemon for hot reload
 * CMD ["npm", "run", "dev"]
 *
 * docker-compose.yml:
 * ------------------
 * version: '3.8'
 * services:
 *   app:
 *     build:
 *       context: .
 *       dockerfile: Dockerfile.dev
 *     volumes:
 *       - .:/app
 *       - /app/node_modules
 *     ports:
 *       - "3000:3000"
 *       - "9229:9229"
 *     environment:
 *       - NODE_ENV=development
 */

/**
 * ============================================================================
 * 5. Distroless Image Pattern (Minimal Attack Surface)
 * ============================================================================
 *
 * Using Google's distroless images for maximum security and minimal size.
 *
 * Dockerfile:
 * -----------
 * # Build stage
 * FROM node:18-alpine AS builder
 *
 * WORKDIR /app
 *
 * COPY package*.json ./
 * RUN npm ci
 *
 * COPY . .
 * RUN npm run build && \
 *     npm prune --production
 *
 * # Production stage with distroless
 * FROM gcr.io/distroless/nodejs18-debian11
 *
 * WORKDIR /app
 *
 * # Copy node modules and built app
 * COPY --from=builder /app/node_modules ./node_modules
 * COPY --from=builder /app/dist ./dist
 * COPY --from=builder /app/package.json ./
 *
 * EXPOSE 3000
 *
 * # Note: distroless doesn't have shell, so use array syntax
 * CMD ["dist/index.js"]
 */

/**
 * ============================================================================
 * 6. Docker BuildKit Features (BuildKit-optimized)
 * ============================================================================
 *
 * Using BuildKit features for improved build performance and security.
 *
 * Dockerfile:
 * -----------
 * # syntax=docker/dockerfile:1.4
 *
 * FROM node:18-alpine AS base
 *
 * WORKDIR /app
 *
 * # Dependencies stage with cache mount
 * FROM base AS deps
 *
 * # Cache mount for npm to speed up builds
 * RUN --mount=type=cache,target=/root/.npm \
 *     --mount=type=bind,source=package.json,target=package.json \
 *     --mount=type=bind,source=package-lock.json,target=package-lock.json \
 *     npm ci --only=production
 *
 * # Build stage
 * FROM base AS build
 *
 * RUN --mount=type=cache,target=/root/.npm \
 *     --mount=type=bind,source=package.json,target=package.json \
 *     --mount=type=bind,source=package-lock.json,target=package-lock.json \
 *     npm ci
 *
 * COPY . .
 * RUN npm run build
 *
 * # Production stage
 * FROM base AS production
 *
 * ENV NODE_ENV=production
 *
 * RUN addgroup --system --gid 1001 nodejs && \
 *     adduser --system --uid 1001 nodejs
 *
 * COPY --from=deps /app/node_modules ./node_modules
 * COPY --from=build /app/dist ./dist
 *
 * USER nodejs
 *
 * EXPOSE 3000
 *
 * CMD ["node", "dist/index.js"]
 *
 * Build command:
 * DOCKER_BUILDKIT=1 docker build --target production -t myapp:latest .
 */

/**
 * ============================================================================
 * 7. Microservices Pattern with ARG Variables
 * ============================================================================
 *
 * Flexible Dockerfile for building different microservices from same codebase.
 *
 * Dockerfile:
 * -----------
 * ARG NODE_VERSION=18
 * FROM node:${NODE_VERSION}-alpine AS builder
 *
 * ARG SERVICE_NAME
 * ARG BUILD_DATE
 * ARG VERSION
 * ARG VCS_REF
 *
 * # Labels for metadata
 * LABEL org.opencontainers.image.created="${BUILD_DATE}" \
 *       org.opencontainers.image.version="${VERSION}" \
 *       org.opencontainers.image.revision="${VCS_REF}" \
 *       org.opencontainers.image.title="${SERVICE_NAME}"
 *
 * WORKDIR /app
 *
 * COPY package*.json ./
 * RUN npm ci
 *
 * COPY . .
 * RUN npm run build
 *
 * # Production
 * FROM node:${NODE_VERSION}-alpine
 *
 * ARG SERVICE_NAME
 * ENV SERVICE_NAME=${SERVICE_NAME}
 *
 * WORKDIR /app
 *
 * COPY --from=builder /app/dist ./dist
 * COPY --from=builder /app/node_modules ./node_modules
 * COPY package.json ./
 *
 * RUN addgroup -g 1001 -S nodejs && \
 *     adduser -S nodejs -u 1001
 *
 * USER nodejs
 *
 * EXPOSE 3000
 *
 * CMD ["node", "dist/services/${SERVICE_NAME}/index.js"]
 *
 * Build command:
 * docker build \
 *   --build-arg SERVICE_NAME=api \
 *   --build-arg VERSION=1.0.0 \
 *   --build-arg BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") \
 *   --build-arg VCS_REF=$(git rev-parse --short HEAD) \
 *   -t myapp-api:1.0.0 .
 */

/**
 * ============================================================================
 * 8. .dockerignore Best Practices
 * ============================================================================
 *
 * Proper .dockerignore to reduce build context and improve security.
 *
 * .dockerignore:
 * --------------
 * # Dependencies
 * node_modules
 * npm-debug.log
 * yarn-error.log
 *
 * # Build outputs
 * dist
 * build
 * .next
 * out
 *
 * # Tests
 * **/*.test.ts
 * **/*.spec.ts
 * __tests__
 * coverage
 *
 * # Development
 * .git
 * .gitignore
 * .env.local
 * .env.*.local
 *
 * # Documentation
 * README.md
 * docs
 * *.md
 *
 * # CI/CD
 * .github
 * .gitlab-ci.yml
 * .circleci
 *
 * # IDE
 * .vscode
 * .idea
 * *.swp
 * *.swo
 * *~
 *
 * # OS
 * .DS_Store
 * Thumbs.db
 *
 * # Docker
 * Dockerfile*
 * docker-compose*.yml
 * .dockerignore
 */

// ============================================================================
// TypeScript Application Entry Point
// ============================================================================

import express, { Express, Request, Response } from 'express';

export class ContainerizedApp {
  private app: Express;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || 'unknown'
      });
    });

    // Readiness check
    this.app.get('/ready', (req: Request, res: Response) => {
      // Check if application is ready to accept traffic
      const isReady = this.checkReadiness();

      if (isReady) {
        res.json({ status: 'ready' });
      } else {
        res.status(503).json({ status: 'not ready' });
      }
    });

    // API routes
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        service: process.env.SERVICE_NAME || 'app',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      });
    });
  }

  private checkReadiness(): boolean {
    // Implement actual readiness checks (database, cache, etc.)
    return true;
  }

  public start(): void {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`Server running on port ${this.port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Service: ${process.env.SERVICE_NAME || 'app'}`);
    });
  }
}

// Entry point
if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const app = new ContainerizedApp(port);
  app.start();
}

/**
 * ============================================================================
 * 9. Security Hardening Patterns
 * ============================================================================
 *
 * Dockerfile with security scanning and hardening:
 * ------------------------------------------------
 * FROM node:18-alpine AS builder
 *
 * # Install security updates
 * RUN apk update && apk upgrade && \
 *     apk add --no-cache dumb-init
 *
 * WORKDIR /app
 *
 * # Copy and install with audit
 * COPY package*.json ./
 * RUN npm ci && npm audit fix && \
 *     npm cache clean --force
 *
 * COPY . .
 * RUN npm run build
 *
 * # Production
 * FROM node:18-alpine
 *
 * # Security updates
 * RUN apk update && apk upgrade && \
 *     apk add --no-cache dumb-init && \
 *     rm -rf /var/cache/apk/*
 *
 * WORKDIR /app
 *
 * # Create non-root user with specific UID/GID
 * RUN addgroup -g 1001 -S nodejs && \
 *     adduser -S nodejs -u 1001
 *
 * # Copy files with proper ownership
 * COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
 * COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
 * COPY --chown=nodejs:nodejs package.json ./
 *
 * # Set read-only root filesystem (application should write to /tmp only)
 * USER nodejs
 *
 * # Use dumb-init to handle signals properly
 * ENTRYPOINT ["dumb-init", "--"]
 *
 * EXPOSE 3000
 *
 * CMD ["node", "dist/index.js"]
 *
 * # Health check
 * HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
 *   CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"
 */

/**
 * ============================================================================
 * 10. Build Best Practices Summary
 * ============================================================================
 *
 * 1. Use specific base image tags (node:18-alpine, not node:latest)
 * 2. Leverage multi-stage builds to reduce image size
 * 3. Order Dockerfile instructions from least to most frequently changing
 * 4. Use .dockerignore to exclude unnecessary files
 * 5. Run as non-root user for security
 * 6. Use COPY instead of ADD unless you need tar extraction
 * 7. Combine RUN commands to reduce layers
 * 8. Clean up in the same layer (npm cache clean, apt-get clean)
 * 9. Use HEALTHCHECK to enable container health monitoring
 * 10. Include metadata labels for traceability
 * 11. Use BuildKit cache mounts for faster builds
 * 12. Pin all dependency versions
 * 13. Scan images for vulnerabilities (docker scan, trivy, snyk)
 * 14. Keep images small (alpine, distroless)
 * 15. Use dumb-init or tini for proper signal handling
 */

export default ContainerizedApp;
