# Deployment Guide

Comprehensive deployment strategies and best practices for Vibe-Coding-Apps projects.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Database Migrations](#database-migrations)
- [Environment Variables Management](#environment-variables-management)
- [CI/CD Pipeline Overview](#cicd-pipeline-overview)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Logging](#monitoring-and-logging)
- [Health Checks](#health-checks)

---

## Environment Setup

### Development Environment

Development environment is for local development and testing.

```bash
# 1. Clone the repository
git clone https://github.com/markl-a/Vibe-Coding-Apps.git
cd Vibe-Coding-Apps

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your local configuration

# 4. Start development databases
docker-compose up -d postgres redis

# 5. Run database migrations
pnpm db:migrate

# 6. Start development server
pnpm dev
```

**Key Environment Variables for Development:**
```env
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vibe_dev
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Staging Environment

Staging mirrors production but uses test data and isolated resources.

```bash
# 1. Set NODE_ENV
export NODE_ENV=staging

# 2. Configure staging environment variables
cp .env.example .env.staging
# Update with staging-specific values

# 3. Use staging database
DATABASE_URL=postgresql://user:pass@staging-db.example.com:5432/vibe_staging

# 4. Deploy to staging
pnpm deploy:staging
```

**Staging Configuration:**
```env
NODE_ENV=staging
LOG_LEVEL=info
DATABASE_URL=postgresql://[USER]:[PASSWORD]@staging-db:5432/vibe_staging
REDIS_URL=redis://staging-redis:6379
CORS_ORIGINS=https://staging.example.com

# Use test API keys
OPENAI_API_KEY=sk-test-...
STRIPE_API_KEY=sk_test_...

# Enable debug features
ENABLE_DEBUG_ROUTES=true
RATE_LIMIT_ENABLED=false
```

### Production Environment

Production requires strict security, monitoring, and scalability configurations.

```bash
# 1. Verify all security requirements
./scripts/pre-deploy-check.sh

# 2. Set production environment
export NODE_ENV=production

# 3. Configure production secrets (use secret management)
# DO NOT use .env files in production
# Use AWS Secrets Manager, Azure Key Vault, or Kubernetes Secrets

# 4. Deploy with zero-downtime strategy
pnpm deploy:production --strategy rolling
```

**Production Configuration:**
```env
NODE_ENV=production
LOG_LEVEL=warn

# Databases (use managed services)
DATABASE_URL=postgresql://[USER]:[PASSWORD]@prod-db.rds.amazonaws.com:5432/vibe_prod
REDIS_URL=redis://prod-redis.cache.amazonaws.com:6379

# Security (MUST be generated, never use defaults)
JWT_SECRET=[GENERATED_WITH: openssl rand -base64 32]
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=[GENERATED_WITH: openssl rand -base64 32]
ENCRYPTION_KEY=[GENERATED_WITH: openssl rand -hex 32]

# CORS (whitelist only production domains)
CORS_ORIGINS=https://example.com,https://www.example.com

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m

# Production API keys (use production credentials)
OPENAI_API_KEY=[PRODUCTION_KEY]
STRIPE_API_KEY=sk_live_...

# Monitoring
SENTRY_DSN=https://[KEY]@sentry.io/[PROJECT]
NEWRELIC_LICENSE_KEY=[LICENSE_KEY]

# Feature flags
ENABLE_DEBUG_ROUTES=false
ENABLE_METRICS=true
```

---

## Docker Deployment

### Dockerfile Patterns

#### 1. Multi-Stage Build (Recommended)

Our main Dockerfile uses multi-stage builds for optimal image size and security:

```dockerfile
# syntax=docker/dockerfile:1.6

# Build arguments
ARG NODE_VERSION=20.11.0
ARG ALPINE_VERSION=3.19

# =============================================================================
# Base stage - Common base for all stages
# =============================================================================
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base
LABEL maintainer="Vibe-Coding-Apps Team"
LABEL description="Vibe Coding Apps - Production Image"

# Install security updates
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# =============================================================================
# Dependencies stage - Install all dependencies
# =============================================================================
FROM base AS deps
RUN npm install -g pnpm@8

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# =============================================================================
# Builder stage - Build the application
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
# Production stage - Final runtime image
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
      org.opencontainers.image.source="https://github.com/markl-a/Vibe-Coding-Apps"
```

#### 2. Microservice Dockerfile Pattern

For individual microservices (simpler pattern):

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "index.js"]
```

### Docker Compose Setup

#### Development Docker Compose

```yaml
version: '3.8'

services:
  # Main Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      # Hot reload for development
      - ./src:/app/src
      - ./public:/app/public
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: vibe_devops
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  # Grafana Visualization
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  default:
    name: vibe-network
```

#### Microservices Docker Compose

Example from our e-commerce microservices:

```yaml
version: '3.8'

services:
  # User Service
  user-service:
    build: ./user-service
    container_name: ecommerce-user-service
    environment:
      PORT: 3001
      MONGODB_URI: mongodb://user-db:27017/ecommerce_users
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      NODE_ENV: production
    ports:
      - "3001:3001"
    depends_on:
      user-db:
        condition: service_healthy
    networks:
      - ecommerce-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Product Service
  product-service:
    build: ./product-service
    container_name: ecommerce-product-service
    environment:
      PORT: 3002
      MONGODB_URI: mongodb://product-db:27017/ecommerce_products
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "3002:3002"
    depends_on:
      product-db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ecommerce-network
    restart: unless-stopped

  # API Gateway
  api-gateway:
    build: ./api-gateway
    container_name: ecommerce-api-gateway
    environment:
      PORT: 3000
      USER_SERVICE_URL: http://user-service:3001
      PRODUCT_SERVICE_URL: http://product-service:3002
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - user-service
      - product-service
    networks:
      - ecommerce-network
    restart: unless-stopped

  # MongoDB for User Service
  user-db:
    image: mongo:7
    container_name: ecommerce-user-db
    environment:
      MONGO_INITDB_DATABASE: ecommerce_users
    volumes:
      - user-data:/data/db
    networks:
      - ecommerce-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for Caching
  redis:
    image: redis:7-alpine
    container_name: ecommerce-redis
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - ecommerce-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

networks:
  ecommerce-network:
    driver: bridge

volumes:
  user-data:
  product-data:
  redis-data:
```

### Building and Running

```bash
# Build images
docker-compose build

# Build with no cache
docker-compose build --no-cache

# Build specific service
docker-compose build user-service

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f user-service

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Scale a service
docker-compose up -d --scale product-service=3
```

---

## Kubernetes Deployment

### Namespace

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vibe-apps
  labels:
    environment: production
```

### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: vibe-apps
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
  DATABASE_HOST: "postgres-service"
  REDIS_HOST: "redis-service"

  # Application settings
  RATE_LIMIT_ENABLED: "true"
  RATE_LIMIT_MAX: "100"
  RATE_LIMIT_WINDOW: "15m"

  # Feature flags
  ENABLE_METRICS: "true"
  ENABLE_DEBUG_ROUTES: "false"
```

### Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: vibe-apps
type: Opaque
stringData:
  # Database
  DATABASE_PASSWORD: "CHANGE_THIS_IN_PRODUCTION"
  DATABASE_URL: "postgresql://user:password@postgres-service:5432/vibe_prod"

  # JWT & Encryption
  JWT_SECRET: "GENERATE_WITH_openssl_rand_base64_32"
  REFRESH_TOKEN_SECRET: "GENERATE_WITH_openssl_rand_base64_32"
  ENCRYPTION_KEY: "GENERATE_WITH_openssl_rand_hex_32"

  # API Keys
  OPENAI_API_KEY: "sk-..."
  ANTHROPIC_API_KEY: "sk-ant-..."

  # Monitoring
  SENTRY_DSN: "https://[KEY]@sentry.io/[PROJECT]"
```

**Generate secrets:**
```bash
# Generate JWT secret
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
  --from-literal=REFRESH_TOKEN_SECRET=$(openssl rand -base64 32) \
  --from-literal=ENCRYPTION_KEY=$(openssl rand -hex 32) \
  --namespace=vibe-apps
```

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vibe-app
  namespace: vibe-apps
  labels:
    app: vibe-app
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Zero-downtime deployment
  selector:
    matchLabels:
      app: vibe-app
  template:
    metadata:
      labels:
        app: vibe-app
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001

      containers:
      - name: app
        image: ghcr.io/vibe-coding-apps/app:latest
        imagePullPolicy: Always

        ports:
        - containerPort: 3000
          name: http
          protocol: TCP

        # Environment from ConfigMap
        envFrom:
        - configMapRef:
            name: app-config

        # Environment from Secrets
        env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_PASSWORD
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: JWT_SECRET
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL

        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Liveness probe
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness probe
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3

        # Startup probe (for slow-starting apps)
        startupProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 0
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 30

        # Volume mounts
        volumeMounts:
        - name: app-logs
          mountPath: /app/logs
        - name: tmp
          mountPath: /tmp

      volumes:
      - name: app-logs
        emptyDir: {}
      - name: tmp
        emptyDir: {}

      # Image pull secrets (for private registries)
      imagePullSecrets:
      - name: ghcr-secret
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: vibe-app-service
  namespace: vibe-apps
  labels:
    app: vibe-app
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
spec:
  type: LoadBalancer
  selector:
    app: vibe-app
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
  - port: 443
    targetPort: 3000
    protocol: TCP
    name: https
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vibe-app-ingress
  namespace: vibe-apps
  annotations:
    # Nginx Ingress Controller
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"

    # SSL/TLS
    cert-manager.io/cluster-issuer: letsencrypt-prod

    # Rate limiting
    nginx.ingress.kubernetes.io/limit-rps: "100"

    # CORS
    nginx.ingress.kubernetes.io/enable-cors: "true"
    nginx.ingress.kubernetes.io/cors-allow-origin: "https://example.com"

    # Timeouts
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
spec:
  tls:
  - hosts:
    - example.com
    - www.example.com
    - api.example.com
    secretName: vibe-app-tls

  rules:
  - host: example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vibe-app-service
            port:
              number: 80

  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: vibe-app-service
            port:
              number: 80
```

### HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vibe-app-hpa
  namespace: vibe-apps
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: vibe-app
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

### PersistentVolumeClaim (for databases)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: vibe-apps
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3  # AWS EBS gp3
  resources:
    requests:
      storage: 20Gi
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create ConfigMap and Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml

# Deploy autoscaler
kubectl apply -f k8s/hpa.yaml

# Check deployment status
kubectl rollout status deployment/vibe-app -n vibe-apps

# View pods
kubectl get pods -n vibe-apps

# View logs
kubectl logs -f deployment/vibe-app -n vibe-apps

# Scale manually
kubectl scale deployment/vibe-app --replicas=5 -n vibe-apps
```

---

## Cloud Deployments

### Vercel (Next.js Apps)

#### vercel.json

```json
{
  "version": 2,
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1", "sfo1"],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  },
  "build": {
    "env": {
      "NEXT_TELEMETRY_DISABLED": "1"
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://example.com"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

#### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production

# View deployments
vercel ls

# View logs
vercel logs
```

#### GitHub Integration

```yaml
# .github/workflows/deploy-vercel.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### AWS Deployments

#### AWS Lambda (Serverless)

**serverless.yml:**

```yaml
service: vibe-apps-api

frameworkVersion: '3'

provider:
  name: aws
  runtime: nodejs20.x
  region: us-east-1
  stage: ${opt:stage, 'dev'}
  memorySize: 512
  timeout: 30

  environment:
    NODE_ENV: ${self:provider.stage}
    DATABASE_URL: ${ssm:/vibe-apps/${self:provider.stage}/database-url}
    JWT_SECRET: ${ssm:/vibe-apps/${self:provider.stage}/jwt-secret~true}

  iam:
    role:
      statements:
        - Effect: Allow
          Action:
            - dynamodb:Query
            - dynamodb:Scan
            - dynamodb:GetItem
            - dynamodb:PutItem
          Resource: "arn:aws:dynamodb:${aws:region}:*:table/${self:custom.tableName}"

functions:
  api:
    handler: dist/handler.handler
    events:
      - httpApi:
          path: /{proxy+}
          method: ANY

  scheduled:
    handler: dist/cron.handler
    events:
      - schedule: rate(5 minutes)

custom:
  tableName: vibe-apps-${self:provider.stage}

resources:
  Resources:
    VibeDynamoTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:custom.tableName}
        BillingMode: PAY_PER_REQUEST
        AttributeDefinitions:
          - AttributeName: id
            AttributeType: S
        KeySchema:
          - AttributeName: id
            KeyType: HASH

plugins:
  - serverless-offline
  - serverless-plugin-typescript
```

**Deploy:**

```bash
# Install Serverless Framework
npm install -g serverless

# Deploy to dev
serverless deploy --stage dev

# Deploy to production
serverless deploy --stage prod

# View logs
serverless logs -f api --stage prod

# Remove deployment
serverless remove --stage dev
```

#### AWS ECS (Elastic Container Service)

**Task Definition:**

```json
{
  "family": "vibe-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "vibe-app",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/vibe-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/vibe-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

**Deploy to ECS:**

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t vibe-app .
docker tag vibe-app:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/vibe-app:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/vibe-app:latest

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update service
aws ecs update-service \
  --cluster vibe-cluster \
  --service vibe-app-service \
  --task-definition vibe-app \
  --force-new-deployment
```

### GCP Cloud Run

**Deploy to Cloud Run:**

```bash
# Build and deploy in one command
gcloud run deploy vibe-app \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets DATABASE_URL=database-url:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 80 \
  --timeout 300

# Or build container and deploy
docker build -t gcr.io/PROJECT_ID/vibe-app .
docker push gcr.io/PROJECT_ID/vibe-app

gcloud run deploy vibe-app \
  --image gcr.io/PROJECT_ID/vibe-app \
  --platform managed \
  --region us-central1

# Update traffic (canary deployment)
gcloud run services update-traffic vibe-app \
  --to-revisions REVISION-1=90,REVISION-2=10
```

**cloud-run.yaml:**

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: vibe-app
  labels:
    cloud.googleapis.com/location: us-central1
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: '1'
        autoscaling.knative.dev/maxScale: '10'
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/vibe-app
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        resources:
          limits:
            cpu: '1'
            memory: 512Mi
```

---

## Database Migrations

### Prisma Migrations

```bash
# Create migration
pnpm prisma migrate dev --name add_user_table

# Apply migrations (production)
pnpm prisma migrate deploy

# Generate Prisma Client
pnpm prisma generate

# Reset database (dev only)
pnpm prisma migrate reset
```

### Sequelize Migrations

```bash
# Create migration
npx sequelize-cli migration:generate --name add-user-table

# Run migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

### TypeORM Migrations

```bash
# Generate migration from entities
npm run typeorm migration:generate -- -n AddUserTable

# Run migrations
npm run typeorm migration:run

# Revert migration
npm run typeorm migration:revert
```

### Migration Best Practices

1. **Always test migrations in staging first**
2. **Create backups before running migrations**
3. **Use transactions for atomic migrations**
4. **Keep migrations reversible**
5. **Version control all migrations**

**Pre-migration checklist:**

```bash
#!/bin/bash
# scripts/run-migration.sh

set -e

echo "Pre-migration checklist:"
echo "1. Backup database"
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

echo "2. Run migration in transaction"
pnpm prisma migrate deploy

echo "3. Verify migration"
pnpm prisma migrate status

echo "4. Test application"
curl -f http://localhost:3000/health || exit 1

echo "Migration completed successfully!"
```

---

## Environment Variables Management

### Local Development

Use `.env` files (never commit to git):

```bash
# .env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/vibe_dev
REDIS_URL=redis://localhost:6379
```

### Staging/Production

**DO NOT use .env files in production.** Use secret management services:

#### AWS Secrets Manager

```bash
# Store secret
aws secretsmanager create-secret \
  --name vibe-apps/prod/database-url \
  --secret-string "postgresql://user:pass@host:5432/db"

# Retrieve secret
aws secretsmanager get-secret-value \
  --secret-id vibe-apps/prod/database-url \
  --query SecretString \
  --output text
```

#### AWS Systems Manager Parameter Store

```bash
# Store parameter
aws ssm put-parameter \
  --name /vibe-apps/prod/jwt-secret \
  --value "your-secret-here" \
  --type SecureString

# Retrieve parameter
aws ssm get-parameter \
  --name /vibe-apps/prod/jwt-secret \
  --with-decryption \
  --query Parameter.Value \
  --output text
```

#### Kubernetes Secrets

```bash
# Create secret from literal
kubectl create secret generic app-secrets \
  --from-literal=DATABASE_URL="postgresql://..." \
  --from-literal=JWT_SECRET="..." \
  --namespace=vibe-apps

# Create secret from file
kubectl create secret generic app-secrets \
  --from-env-file=.env.production \
  --namespace=vibe-apps

# Update secret
kubectl create secret generic app-secrets \
  --from-literal=JWT_SECRET="new-secret" \
  --dry-run=client -o yaml | kubectl apply -f -
```

#### Docker Secrets

```bash
# Create secret
echo "my-secret-value" | docker secret create jwt_secret -

# Use in docker-compose.yml
services:
  app:
    secrets:
      - jwt_secret
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret

secrets:
  jwt_secret:
    external: true
```

### Environment Variable Naming Convention

```bash
# Database
DATABASE_URL=postgresql://...
MONGODB_URI=mongodb://...
REDIS_URL=redis://...

# Authentication
JWT_SECRET=...
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=...
ENCRYPTION_KEY=...

# API Keys (prefix with service name)
OPENAI_API_KEY=sk-...
STRIPE_API_KEY=sk_...
SENDGRID_API_KEY=SG...

# Feature Flags (boolean values)
ENABLE_METRICS=true
ENABLE_DEBUG_ROUTES=false

# Configuration
NODE_ENV=production
LOG_LEVEL=info
PORT=3000
```

---

## CI/CD Pipeline Overview

Our CI/CD pipeline uses GitHub Actions with the following stages:

### Pipeline Stages

```
┌─────────────┐
│   Trigger   │ (Push to main/develop or PR)
└──────┬──────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
┌──────▼──────┐                      ┌──────▼──────┐
│    Lint     │                      │ Type Check  │
│  & Format   │                      │             │
└──────┬──────┘                      └──────┬──────┘
       │                                     │
       └─────────────┬───────────────────────┘
                     │
              ┌──────▼──────┐
              │    Test     │
              │  (Unit &    │
              │  Coverage)  │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │    Build    │
              └──────┬──────┘
                     │
              ┌──────▼──────┐
              │  E2E Tests  │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
  ┌──────▼──────┐         ┌─────▼──────┐
  │   Deploy    │         │   Deploy   │
  │   Staging   │         │ Production │
  │ (auto on    │         │ (manual)   │
  │  develop)   │         │            │
  └─────────────┘         └────────────┘
```

### GitHub Actions Workflow

See `.github/workflows/ci.yml` for the complete workflow. Key jobs:

1. **Lint & Format Check** - ESLint, Prettier
2. **Type Check** - TypeScript validation
3. **Tests** - Unit tests with coverage (75% threshold)
4. **Build** - Build all packages
5. **E2E Tests** - Playwright tests across browsers
6. **Deploy** - Automated deployment on success

### Deployment Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'staging' }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Run tests
        run: pnpm test

      - name: Build Docker image
        run: |
          docker build \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VCS_REF=${{ github.sha }} \
            --build-arg VERSION=${{ github.ref_name }} \
            -t vibe-app:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker tag vibe-app:${{ github.sha }} ghcr.io/${{ github.repository }}:${{ github.sha }}
          docker tag vibe-app:${{ github.sha }} ghcr.io/${{ github.repository }}:latest
          docker push ghcr.io/${{ github.repository }}:${{ github.sha }}
          docker push ghcr.io/${{ github.repository }}:latest

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/vibe-app \
            app=ghcr.io/${{ github.repository }}:${{ github.sha }} \
            --namespace=vibe-apps
          kubectl rollout status deployment/vibe-app --namespace=vibe-apps
```

---

## Rollback Procedures

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/vibe-app -n vibe-apps

# Rollback to previous version
kubectl rollout undo deployment/vibe-app -n vibe-apps

# Rollback to specific revision
kubectl rollout undo deployment/vibe-app --to-revision=3 -n vibe-apps

# Check rollout status
kubectl rollout status deployment/vibe-app -n vibe-apps

# Pause rollout (emergency)
kubectl rollout pause deployment/vibe-app -n vibe-apps

# Resume rollout
kubectl rollout resume deployment/vibe-app -n vibe-apps
```

### Docker Compose Rollback

```bash
# Tag current deployment
docker tag vibe-app:latest vibe-app:backup-$(date +%Y%m%d)

# Pull previous image
docker pull vibe-app:previous-tag

# Restart with previous version
docker-compose down
docker-compose up -d
```

### Vercel Rollback

```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>

# Or use dashboard
# Go to https://vercel.com/dashboard
# Select deployment and click "Promote to Production"
```

### AWS ECS Rollback

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix vibe-app

# Update service to previous task definition
aws ecs update-service \
  --cluster vibe-cluster \
  --service vibe-app-service \
  --task-definition vibe-app:PREVIOUS_REVISION
```

### Database Rollback

```bash
# Restore from backup
pg_restore -d vibe_prod backup-20250101-120000.sql

# Or revert migration
pnpm prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Emergency Rollback Procedure

1. **Identify the issue** - Check logs and metrics
2. **Notify team** - Alert on-call engineer
3. **Execute rollback** - Use appropriate method above
4. **Verify health** - Check health endpoints and metrics
5. **Post-mortem** - Document what went wrong

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

set -e

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Rolling back to previous version..."

# Rollback Kubernetes deployment
kubectl rollout undo deployment/vibe-app -n vibe-apps

# Wait for rollout
kubectl rollout status deployment/vibe-app -n vibe-apps

# Verify health
echo "Verifying health..."
sleep 10
curl -f https://example.com/health || exit 1

echo "✅ Rollback completed successfully"
echo "⚠️  Please investigate the issue and create a post-mortem"
```

---

## Monitoring and Logging

### Prometheus Metrics

**prometheus.yml:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'vibe-app'
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names:
            - vibe-apps
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__
```

### Application Metrics

Add to your Express/Fastify app:

```typescript
import { register, Counter, Histogram } from 'prom-client';

// Request counter
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Grafana Dashboards

**grafana-dashboard.json:**

```json
{
  "dashboard": {
    "title": "Vibe Apps Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Centralized Logging

#### ELK Stack (Elasticsearch, Logstash, Kibana)

```yaml
# docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5000:5000"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch-data:
```

#### Application Logging

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'vibe-app',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Development console logging
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Sentry Error Tracking

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Express error handler
app.use(Sentry.Handlers.errorHandler());
```

---

## Health Checks

### Health Check Endpoints

```typescript
// health.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const router = express.Router();
const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL);

// Liveness probe - Is the app running?
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Readiness probe - Can the app serve traffic?
router.get('/ready', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    // Check Redis
    await redis.ping();
    checks.redis = true;

    const allHealthy = Object.values(checks).every(Boolean);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      checks,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Startup probe - Has the app finished starting?
router.get('/startup', (req, res) => {
  // Check if app has completed initialization
  const isStarted = global.appReady === true;

  res.status(isStarted ? 200 : 503).json({
    status: isStarted ? 'started' : 'starting',
    timestamp: new Date().toISOString(),
  });
});

export default router;
```

### Health Check Patterns

```bash
# Basic health check
curl -f http://localhost:3000/health || exit 1

# Detailed health check
curl -f http://localhost:3000/ready || exit 1

# Health check with timeout
timeout 5s curl -f http://localhost:3000/health || exit 1
```

### Docker Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-3000}/health || exit 1
```

### Kubernetes Health Checks

Already included in the Kubernetes deployment manifest above.

### Load Balancer Health Checks

**AWS ALB:**

```json
{
  "HealthCheckPath": "/health",
  "HealthCheckIntervalSeconds": 30,
  "HealthCheckTimeoutSeconds": 5,
  "HealthyThresholdCount": 2,
  "UnhealthyThresholdCount": 3,
  "Matcher": {
    "HttpCode": "200"
  }
}
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Vercel Documentation](https://vercel.com/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [GCP Documentation](https://cloud.google.com/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## Support

For deployment issues or questions:
- Create an issue: [GitHub Issues](https://github.com/markl-a/Vibe-Coding-Apps/issues)
- Check existing docs: [/docs](/docs)
- See architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Last Updated:** 2025-12-31
