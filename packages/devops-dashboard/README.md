# @vibe/devops-dashboard

Centralized DevOps Dashboard for monitoring and managing all Vibe-Coding-Apps projects.

## Features

- 📊 **Build Status Monitoring**: Real-time CI/CD pipeline status
- 🧪 **Test Coverage Tracking**: Track test coverage across all projects
- 🔒 **Security Alerts**: Monitor security vulnerabilities
- 📈 **Performance Metrics**: Track performance trends
- 🚀 **Deployment Tracking**: Monitor deployment status and history
- 📝 **Log Aggregation**: Centralized log viewing
- 🔔 **Alerting**: Configurable alerts for critical events

## Architecture

```
devops-dashboard/
├── app/                    # Next.js 14 App Router
│   ├── dashboard/         # Dashboard pages
│   ├── projects/          # Project management
│   ├── builds/            # Build status
│   ├── tests/             # Test coverage
│   ├── security/          # Security monitoring
│   └── logs/              # Log viewer
├── components/            # React components
├── lib/                   # Utilities and helpers
├── services/              # API services
└── types/                 # TypeScript types
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Visit `http://localhost:3000` to see the dashboard.

## Configuration

Create a `.env.local` file:

```env
# API Endpoints
GITHUB_TOKEN=your_github_token
GITHUB_REPO=markl-a/Vibe-Coding-Apps

# Database (optional)
DATABASE_URL=postgresql://...

# Analytics (optional)
ANALYTICS_API_KEY=...
```

## Dashboard Features

### 1. Overview Dashboard

- Project health scores
- Recent build status
- Test coverage trends
- Security alert summary
- Active deployments

### 2. Build Monitoring

- Real-time build status
- Build history
- Build duration trends
- Failure analysis
- Build artifacts

### 3. Test Coverage

- Overall coverage metrics
- Per-project coverage
- Coverage trends
- Uncovered files
- Coverage goals

### 4. Security Dashboard

- Vulnerability alerts
- Dependency updates
- Security scan results
- Compliance status
- Remediation tracking

### 5. Performance Monitoring

- Build time trends
- Test execution time
- Deployment frequency
- Mean time to recovery
- Change failure rate

### 6. Log Viewer

- Centralized logs
- Real-time streaming
- Log filtering
- Error tracking
- Log analytics

## Integration

### GitHub Actions

The dashboard automatically pulls data from:
- GitHub Actions workflows
- Pull request statuses
- Security advisories
- Dependabot alerts

### Custom Integrations

```typescript
import { DashboardClient } from '@vibe/devops-dashboard';

const client = new DashboardClient({
  apiKey: process.env.DASHBOARD_API_KEY,
});

// Report build status
await client.reportBuild({
  project: 'my-project',
  status: 'success',
  duration: 120,
});

// Report test coverage
await client.reportCoverage({
  project: 'my-project',
  coverage: 85.5,
});
```

## API

The dashboard exposes a REST API:

```
GET  /api/projects          - List all projects
GET  /api/builds            - Get build history
GET  /api/tests/coverage    - Get test coverage
GET  /api/security/alerts   - Get security alerts
POST /api/webhooks/github   - GitHub webhook endpoint
```

## Development

```bash
# Run tests
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint

# Clean build artifacts
pnpm clean
```

## Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Docker

```bash
docker build -t devops-dashboard .
docker run -p 3000:3000 devops-dashboard
```

### Manual

```bash
pnpm build
pnpm start
```

## Screenshots

[Screenshots would go here in production]

## License

MIT
