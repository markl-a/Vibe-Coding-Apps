/**
 * Kubernetes Configuration Management
 *
 * Comprehensive examples of ConfigMaps, Secrets, environment variables,
 * volume mounts, and best practices for managing application configuration in Kubernetes.
 */

/**
 * ============================================================================
 * 1. ConfigMap - Basic Configuration
 * ============================================================================
 *
 * Store non-sensitive configuration data as key-value pairs.
 *
 * configmap.yaml:
 * ---------------
 * apiVersion: v1
 * kind: ConfigMap
 * metadata:
 *   name: app-config
 *   namespace: production
 * data:
 *   # Simple key-value pairs
 *   database.host: "postgres.production.svc.cluster.local"
 *   database.port: "5432"
 *   database.name: "myapp"
 *   log.level: "info"
 *   feature.newUI: "true"
 *
 *   # Multi-line configuration file
 *   app.config: |
 *     server:
 *       port: 3000
 *       timeout: 30s
 *     cache:
 *       ttl: 3600
 *       maxSize: 1000
 *
 *   # JSON configuration
 *   settings.json: |
 *     {
 *       "apiTimeout": 5000,
 *       "retryAttempts": 3,
 *       "enableMetrics": true
 *     }
 *
 * # Create from literal values
 * kubectl create configmap app-config \
 *   --from-literal=database.host=postgres \
 *   --from-literal=database.port=5432
 *
 * # Create from file
 * kubectl create configmap app-config \
 *   --from-file=config.json \
 *   --from-file=settings.yaml
 */

/**
 * ============================================================================
 * 2. Secrets - Sensitive Data
 * ============================================================================
 *
 * Store passwords, tokens, certificates, and other sensitive data.
 *
 * secret.yaml:
 * ------------
 * apiVersion: v1
 * kind: Secret
 * metadata:
 *   name: app-secrets
 *   namespace: production
 * type: Opaque
 * data:
 *   # Base64 encoded values
 *   database.password: cGFzc3dvcmQxMjM=  # "password123"
 *   api.key: YXBpa2V5MTIzNDU2Nzg5MA==      # "apikey1234567890"
 * stringData:
 *   # Plain text (will be base64 encoded automatically)
 *   jwt.secret: "my-super-secret-jwt-key"
 * ---
 * # TLS Secret
 * apiVersion: v1
 * kind: Secret
 * metadata:
 *   name: tls-cert
 *   namespace: production
 * type: kubernetes.io/tls
 * data:
 *   tls.crt: LS0tLS1CRUdJTi...  # Base64 encoded certificate
 *   tls.key: LS0tLS1CRUdJTi...  # Base64 encoded private key
 * ---
 * # Docker Registry Secret
 * apiVersion: v1
 * kind: Secret
 * metadata:
 *   name: docker-registry-creds
 *   namespace: production
 * type: kubernetes.io/dockerconfigjson
 * data:
 *   .dockerconfigjson: eyJhdXRocyI6...
 *
 * # Create secret from literal
 * kubectl create secret generic app-secrets \
 *   --from-literal=database.password=password123 \
 *   --from-literal=api.key=apikey123
 *
 * # Create TLS secret from files
 * kubectl create secret tls tls-cert \
 *   --cert=path/to/tls.crt \
 *   --key=path/to/tls.key
 *
 * # Create docker registry secret
 * kubectl create secret docker-registry docker-registry-creds \
 *   --docker-server=registry.example.com \
 *   --docker-username=user \
 *   --docker-password=password \
 *   --docker-email=user@example.com
 */

/**
 * ============================================================================
 * 3. Using ConfigMaps and Secrets in Deployments
 * ============================================================================
 *
 * Multiple ways to consume configuration and secrets.
 *
 * deployment-with-config.yaml:
 * ----------------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 *   namespace: production
 * spec:
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 *
 *         # Method 1: Environment variables from ConfigMap
 *         env:
 *         - name: DATABASE_HOST
 *           valueFrom:
 *             configMapKeyRef:
 *               name: app-config
 *               key: database.host
 *         - name: DATABASE_PORT
 *           valueFrom:
 *             configMapKeyRef:
 *               name: app-config
 *               key: database.port
 *         - name: LOG_LEVEL
 *           valueFrom:
 *             configMapKeyRef:
 *               name: app-config
 *               key: log.level
 *
 *         # Environment variables from Secrets
 *         - name: DATABASE_PASSWORD
 *           valueFrom:
 *             secretKeyRef:
 *               name: app-secrets
 *               key: database.password
 *         - name: API_KEY
 *           valueFrom:
 *             secretKeyRef:
 *               name: app-secrets
 *               key: api.key
 *
 *         # Method 2: Load all keys from ConfigMap
 *         envFrom:
 *         - configMapRef:
 *             name: app-config
 *         - secretRef:
 *             name: app-secrets
 *
 *         # Method 3: Mount as volume
 *         volumeMounts:
 *         - name: config-volume
 *           mountPath: /etc/config
 *           readOnly: true
 *         - name: secret-volume
 *           mountPath: /etc/secrets
 *           readOnly: true
 *
 *       volumes:
 *       - name: config-volume
 *         configMap:
 *           name: app-config
 *       - name: secret-volume
 *         secret:
 *           secretName: app-secrets
 *           defaultMode: 0400  # Read-only for owner
 */

/**
 * ============================================================================
 * 4. Advanced ConfigMap Patterns
 * ============================================================================
 *
 * Structured configuration files and selective mounting.
 *
 * advanced-configmap.yaml:
 * ------------------------
 * apiVersion: v1
 * kind: ConfigMap
 * metadata:
 *   name: nginx-config
 *   namespace: production
 * data:
 *   nginx.conf: |
 *     user nginx;
 *     worker_processes auto;
 *     error_log /var/log/nginx/error.log;
 *
 *     events {
 *       worker_connections 1024;
 *     }
 *
 *     http {
 *       include /etc/nginx/mime.types;
 *       default_type application/octet-stream;
 *
 *       server {
 *         listen 80;
 *         server_name _;
 *
 *         location / {
 *           proxy_pass http://backend:3000;
 *           proxy_set_header Host $host;
 *         }
 *       }
 *     }
 * ---
 * # Using specific keys from ConfigMap
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: nginx
 * spec:
 *   template:
 *     spec:
 *       containers:
 *       - name: nginx
 *         image: nginx:1.21
 *         volumeMounts:
 *         - name: nginx-config
 *           mountPath: /etc/nginx/nginx.conf
 *           subPath: nginx.conf
 *           readOnly: true
 *       volumes:
 *       - name: nginx-config
 *         configMap:
 *           name: nginx-config
 *           items:
 *           - key: nginx.conf
 *             path: nginx.conf
 */

/**
 * ============================================================================
 * 5. External Secrets Operator
 * ============================================================================
 *
 * Sync secrets from external secret managers (AWS Secrets Manager, Vault, etc.)
 *
 * external-secret.yaml:
 * ---------------------
 * apiVersion: external-secrets.io/v1beta1
 * kind: ExternalSecret
 * metadata:
 *   name: app-secrets
 *   namespace: production
 * spec:
 *   refreshInterval: 1h
 *   secretStoreRef:
 *     name: aws-secrets-manager
 *     kind: SecretStore
 *   target:
 *     name: app-secrets
 *     creationPolicy: Owner
 *   data:
 *   - secretKey: database-password
 *     remoteRef:
 *       key: /production/database/password
 *   - secretKey: api-key
 *     remoteRef:
 *       key: /production/api/key
 * ---
 * # SecretStore for AWS Secrets Manager
 * apiVersion: external-secrets.io/v1beta1
 * kind: SecretStore
 * metadata:
 *   name: aws-secrets-manager
 *   namespace: production
 * spec:
 *   provider:
 *     aws:
 *       service: SecretsManager
 *       region: us-east-1
 *       auth:
 *         jwt:
 *           serviceAccountRef:
 *             name: external-secrets
 */

/**
 * ============================================================================
 * 6. Sealed Secrets (GitOps-friendly)
 * ============================================================================
 *
 * Encrypt secrets for safe storage in Git repositories.
 *
 * sealed-secret.yaml:
 * -------------------
 * apiVersion: bitnami.com/v1alpha1
 * kind: SealedSecret
 * metadata:
 *   name: app-secrets
 *   namespace: production
 * spec:
 *   encryptedData:
 *     database.password: AgBi8...encrypted...
 *     api.key: AgCd9...encrypted...
 *   template:
 *     metadata:
 *       name: app-secrets
 *     type: Opaque
 *
 * # Create sealed secret
 * kubectl create secret generic app-secrets \
 *   --from-literal=database.password=password123 \
 *   --dry-run=client -o yaml | \
 *   kubeseal -o yaml > sealed-secret.yaml
 */

/**
 * ============================================================================
 * 7. Environment-Specific Configuration
 * ============================================================================
 *
 * Kustomize for managing environment-specific configs.
 *
 * base/kustomization.yaml:
 * ------------------------
 * apiVersion: kustomize.config.k8s.io/v1beta1
 * kind: Kustomization
 * resources:
 * - deployment.yaml
 * - service.yaml
 * configMapGenerator:
 * - name: app-config
 *   literals:
 *   - database.host=postgres
 *   - log.level=info
 *
 * overlays/production/kustomization.yaml:
 * ---------------------------------------
 * apiVersion: kustomize.config.k8s.io/v1beta1
 * kind: Kustomization
 * bases:
 * - ../../base
 * namespace: production
 * replicas:
 * - name: myapp
 *   count: 10
 * configMapGenerator:
 * - name: app-config
 *   behavior: merge
 *   literals:
 *   - database.host=postgres-prod
 *   - log.level=warn
 * images:
 * - name: myapp
 *   newTag: 1.0.0
 *
 * # Apply with kustomize
 * kubectl apply -k overlays/production
 */

/**
 * ============================================================================
 * 8. Dynamic Configuration Reload
 * ============================================================================
 *
 * Auto-reload configuration without pod restart.
 *
 * configmap-reloader.yaml:
 * ------------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 * spec:
 *   template:
 *     metadata:
 *       annotations:
 *         # Reloader annotation (requires reloader controller)
 *         configmap.reloader.stakater.com/reload: "app-config"
 *         secret.reloader.stakater.com/reload: "app-secrets"
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         volumeMounts:
 *         - name: config
 *           mountPath: /etc/config
 *       volumes:
 *       - name: config
 *         configMap:
 *           name: app-config
 */

// ============================================================================
// TypeScript Configuration Management
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import * as k8s from '@kubernetes/client-node';

/**
 * Configuration manager for Kubernetes applications
 */
export class KubernetesConfigManager {
  private config: Map<string, string> = new Map();
  private watchers: Map<string, fs.FSWatcher> = new Map();
  private callbacks: Array<(config: Map<string, string>) => void> = [];

  constructor(
    private configPath: string = '/etc/config',
    private secretsPath: string = '/etc/secrets'
  ) {}

  /**
   * Load configuration from mounted volumes
   */
  async load(): Promise<void> {
    console.log('Loading configuration...');

    // Load from ConfigMap volume
    if (fs.existsSync(this.configPath)) {
      this.loadFromDirectory(this.configPath);
    }

    // Load from Secret volume
    if (fs.existsSync(this.secretsPath)) {
      this.loadFromDirectory(this.secretsPath);
    }

    // Load from environment variables
    this.loadFromEnvironment();

    console.log(`Configuration loaded: ${this.config.size} keys`);
  }

  /**
   * Load configuration from directory
   */
  private loadFromDirectory(dirPath: string): void {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      if (file.startsWith('.')) continue; // Skip hidden files

      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Try to parse as JSON
      try {
        const json = JSON.parse(content);
        this.loadFromObject(json, file);
      } catch {
        // Store as-is if not JSON
        this.config.set(file, content);
      }
    }
  }

  /**
   * Load configuration from object
   */
  private loadFromObject(obj: any, prefix: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && !Array.isArray(value)) {
        this.loadFromObject(value, fullKey);
      } else {
        this.config.set(fullKey, String(value));
      }
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.config.set(key, value);
      }
    }
  }

  /**
   * Get configuration value
   */
  get(key: string, defaultValue?: string): string | undefined {
    return this.config.get(key) || defaultValue;
  }

  /**
   * Get configuration value as number
   */
  getNumber(key: string, defaultValue?: number): number | undefined {
    const value = this.config.get(key);
    if (value === undefined) return defaultValue;

    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Get configuration value as boolean
   */
  getBoolean(key: string, defaultValue?: boolean): boolean | undefined {
    const value = this.config.get(key);
    if (value === undefined) return defaultValue;

    return value.toLowerCase() === 'true';
  }

  /**
   * Get all configuration
   */
  getAll(): Record<string, string> {
    return Object.fromEntries(this.config);
  }

  /**
   * Watch for configuration changes
   */
  watch(callback: (config: Map<string, string>) => void): void {
    this.callbacks.push(callback);

    // Watch ConfigMap directory
    if (fs.existsSync(this.configPath) && !this.watchers.has(this.configPath)) {
      const watcher = fs.watch(this.configPath, async () => {
        console.log('Configuration changed, reloading...');
        await this.reload();
      });

      this.watchers.set(this.configPath, watcher);
    }

    // Watch Secrets directory
    if (fs.existsSync(this.secretsPath) && !this.watchers.has(this.secretsPath)) {
      const watcher = fs.watch(this.secretsPath, async () => {
        console.log('Secrets changed, reloading...');
        await this.reload();
      });

      this.watchers.set(this.secretsPath, watcher);
    }
  }

  /**
   * Reload configuration
   */
  private async reload(): Promise<void> {
    this.config.clear();
    await this.load();

    // Notify all callbacks
    for (const callback of this.callbacks) {
      callback(this.config);
    }
  }

  /**
   * Stop watching for changes
   */
  stopWatching(): void {
    for (const watcher of this.watchers.values()) {
      watcher.close();
    }
    this.watchers.clear();
  }
}

/**
 * Kubernetes ConfigMap/Secret API Client
 */
export class KubernetesConfigAPI {
  private coreApi: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  /**
   * Create ConfigMap
   */
  async createConfigMap(
    namespace: string,
    name: string,
    data: Record<string, string>
  ): Promise<void> {
    const configMap: k8s.V1ConfigMap = {
      metadata: { name, namespace },
      data
    };

    try {
      await this.coreApi.createNamespacedConfigMap(namespace, configMap);
      console.log(`ConfigMap ${name} created`);
    } catch (error) {
      console.error('Error creating ConfigMap:', error);
      throw error;
    }
  }

  /**
   * Update ConfigMap
   */
  async updateConfigMap(
    namespace: string,
    name: string,
    data: Record<string, string>
  ): Promise<void> {
    try {
      const { body: configMap } = await this.coreApi.readNamespacedConfigMap(
        name,
        namespace
      );

      configMap.data = data;

      await this.coreApi.replaceNamespacedConfigMap(
        name,
        namespace,
        configMap
      );

      console.log(`ConfigMap ${name} updated`);
    } catch (error) {
      console.error('Error updating ConfigMap:', error);
      throw error;
    }
  }

  /**
   * Create Secret
   */
  async createSecret(
    namespace: string,
    name: string,
    data: Record<string, string>
  ): Promise<void> {
    // Base64 encode all values
    const encodedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      encodedData[key] = Buffer.from(value).toString('base64');
    }

    const secret: k8s.V1Secret = {
      metadata: { name, namespace },
      type: 'Opaque',
      data: encodedData
    };

    try {
      await this.coreApi.createNamespacedSecret(namespace, secret);
      console.log(`Secret ${name} created`);
    } catch (error) {
      console.error('Error creating Secret:', error);
      throw error;
    }
  }

  /**
   * Read ConfigMap
   */
  async readConfigMap(
    namespace: string,
    name: string
  ): Promise<Record<string, string>> {
    try {
      const { body } = await this.coreApi.readNamespacedConfigMap(name, namespace);
      return body.data || {};
    } catch (error) {
      console.error('Error reading ConfigMap:', error);
      throw error;
    }
  }

  /**
   * Read Secret
   */
  async readSecret(
    namespace: string,
    name: string
  ): Promise<Record<string, string>> {
    try {
      const { body } = await this.coreApi.readNamespacedSecret(name, namespace);

      // Decode base64 values
      const decodedData: Record<string, string> = {};
      for (const [key, value] of Object.entries(body.data || {})) {
        decodedData[key] = Buffer.from(value, 'base64').toString('utf-8');
      }

      return decodedData;
    } catch (error) {
      console.error('Error reading Secret:', error);
      throw error;
    }
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

export async function configManagementExample(): Promise<void> {
  // Load configuration from mounted volumes
  const configManager = new KubernetesConfigManager();
  await configManager.load();

  // Access configuration
  const dbHost = configManager.get('DATABASE_HOST', 'localhost');
  const dbPort = configManager.getNumber('DATABASE_PORT', 5432);
  const enableFeature = configManager.getBoolean('FEATURE_ENABLED', false);

  console.log('Database:', dbHost, dbPort);
  console.log('Feature enabled:', enableFeature);

  // Watch for configuration changes
  configManager.watch((config) => {
    console.log('Configuration reloaded:', config.size, 'keys');
    // Re-initialize application with new config
  });

  // Kubernetes API example
  const configAPI = new KubernetesConfigAPI();

  // Create ConfigMap
  await configAPI.createConfigMap('production', 'app-config', {
    'database.host': 'postgres',
    'database.port': '5432',
    'log.level': 'info'
  });

  // Create Secret
  await configAPI.createSecret('production', 'app-secrets', {
    'database.password': 'secret123',
    'api.key': 'apikey123'
  });

  // Read configuration
  const config = await configAPI.readConfigMap('production', 'app-config');
  const secrets = await configAPI.readSecret('production', 'app-secrets');

  console.log('Config:', config);
  console.log('Secrets loaded:', Object.keys(secrets).length);
}

export default KubernetesConfigManager;
