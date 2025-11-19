# Multi-stage Dockerfile for Vibe-Coding-Apps

# Base image with pnpm
FROM node:20-alpine AS base
RUN npm install -g pnpm@8
WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production dependencies
FROM base AS prod-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile --prod

# Runner stage for web apps
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
