# Simple Kubernetes Operator

A Kubernetes operator written in TypeScript that watches for `AppConfig` custom resources and automatically creates/updates ConfigMaps.

## What is a Kubernetes Operator?

An operator is a software extension to Kubernetes that uses custom resources to manage applications. This simple operator demonstrates the pattern by:

1. Defining a Custom Resource Definition (CRD) called `AppConfig`
2. Watching for changes to `AppConfig` resources
3. Creating/updating ConfigMaps based on the `AppConfig` spec

## Features

- **Custom Resource Definition**: Define application configuration declaratively
- **Automatic ConfigMap Management**: Creates ConfigMaps from AppConfig specs
- **Status Updates**: Reports status back to the custom resource
- **Cleanup**: Deletes ConfigMaps when AppConfig is deleted

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Kubernetes API                        │
│                                                          │
│  ┌──────────────┐              ┌──────────────────┐     │
│  │  AppConfig   │─────────────▶│   ConfigMap      │     │
│  │  (Custom     │   creates/   │   (Generated)    │     │
│  │   Resource)  │   updates    │                  │     │
│  └──────────────┘              └──────────────────┘     │
│         │                                               │
│         │ watches                                       │
│         ▼                                               │
│  ┌──────────────────────────────────────┐              │
│  │         Simple Operator               │              │
│  │                                       │              │
│  │  ┌─────────────┐  ┌───────────────┐  │              │
│  │  │  Informer   │  │  Reconciler   │  │              │
│  │  │  (Watch)    │──│  (Logic)      │  │              │
│  │  └─────────────┘  └───────────────┘  │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- kubectl configured with cluster access
- Kubernetes cluster (minikube, kind, or remote)

### Installation

```bash
pnpm install
```

### Deploy CRD

```bash
kubectl apply -f manifests/crd.yaml
```

### Run Locally

```bash
# Uses your local kubeconfig
pnpm dev
```

### Create an AppConfig

```bash
kubectl apply -f manifests/example-appconfig.yaml
```

### Verify

```bash
# Check AppConfig
kubectl get appconfigs

# Check generated ConfigMap
kubectl get configmap my-app-config -o yaml
```

## AppConfig Spec

```yaml
apiVersion: vibe.example.com/v1
kind: AppConfig
metadata:
  name: my-app
spec:
  environment: production    # development | staging | production
  replicas: 3               # 1-10
  config:                   # Key-value pairs
    LOG_LEVEL: info
    CACHE_TTL: "3600"
    FEATURE_ENABLED: "true"
```

## Generated ConfigMap

The operator creates a ConfigMap named `{appconfig-name}-config`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-app-config
  labels:
    app.kubernetes.io/managed-by: simple-operator
    app.kubernetes.io/name: my-app
data:
  environment: production
  replicas: "3"
  LOG_LEVEL: info
  CACHE_TTL: "3600"
  FEATURE_ENABLED: "true"
  lastUpdated: "2024-01-01T00:00:00.000Z"
```

## Deploy to Cluster

### Build Docker Image

```bash
docker build -t simple-operator:latest .
```

### Deploy

```bash
kubectl apply -f manifests/deployment.yaml
```

## Project Structure

```
simple-operator/
├── src/
│   ├── index.ts        # Entry point
│   ├── controller.ts   # Reconciliation logic
│   └── types.ts        # TypeScript types
├── manifests/
│   ├── crd.yaml              # Custom Resource Definition
│   ├── example-appconfig.yaml # Example resources
│   └── deployment.yaml       # Operator deployment
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## Extending

### Add New Fields

1. Update `AppConfigSpec` in `types.ts`
2. Update CRD schema in `manifests/crd.yaml`
3. Update `buildConfigData()` in `controller.ts`

### Add New Resources

Modify the controller to create other resources like Secrets, Deployments, etc.

### Add Validation

Use admission webhooks for advanced validation.

## Resources

- [Kubernetes Operators (Official Docs)](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [kubernetes/client-node](https://github.com/kubernetes-client/javascript)
- [Operator SDK](https://sdk.operatorframework.io/) (Go-based alternative)

## License

MIT
