import * as k8s from '@kubernetes/client-node';
import type { AppConfig, AppConfigSpec } from './types.js';

const GROUP = 'vibe.example.com';
const VERSION = 'v1';
const PLURAL = 'appconfigs';

export class AppConfigController {
  private customApi: k8s.CustomObjectsApi;
  private coreApi: k8s.CoreV1Api;
  private informer?: k8s.Informer<AppConfig>;
  private isRunning = false;

  constructor(customApi: k8s.CustomObjectsApi, coreApi: k8s.CoreV1Api) {
    this.customApi = customApi;
    this.coreApi = coreApi;
  }

  async start(): Promise<void> {
    console.log(`👀 Watching for ${GROUP}/${VERSION}/${PLURAL} resources`);

    const kc = new k8s.KubeConfig();
    try {
      kc.loadFromCluster();
    } catch {
      kc.loadFromDefault();
    }

    // Create list function for informer
    const listFn = () =>
      this.customApi.listClusterCustomObject(GROUP, VERSION, PLURAL);

    // Create informer
    this.informer = k8s.makeInformer(
      kc,
      `/apis/${GROUP}/${VERSION}/${PLURAL}`,
      listFn as () => Promise<{ body: k8s.KubernetesListObject<AppConfig> }>
    );

    // Handle events
    this.informer.on('add', (obj: AppConfig) => {
      console.log(`➕ AppConfig added: ${obj.metadata?.name}`);
      this.reconcile(obj);
    });

    this.informer.on('update', (obj: AppConfig) => {
      console.log(`🔄 AppConfig updated: ${obj.metadata?.name}`);
      this.reconcile(obj);
    });

    this.informer.on('delete', (obj: AppConfig) => {
      console.log(`➖ AppConfig deleted: ${obj.metadata?.name}`);
      this.handleDelete(obj);
    });

    this.informer.on('error', (err: Error) => {
      console.error('❌ Informer error:', err);
      // Restart informer on error
      setTimeout(() => {
        if (this.isRunning) {
          this.informer?.start();
        }
      }, 5000);
    });

    // Start informer
    this.isRunning = true;
    await this.informer.start();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    this.informer?.stop();
  }

  private async reconcile(appConfig: AppConfig): Promise<void> {
    const name = appConfig.metadata?.name;
    const namespace = appConfig.metadata?.namespace ?? 'default';
    const spec = appConfig.spec;

    if (!name || !spec) {
      console.error('Invalid AppConfig: missing name or spec');
      return;
    }

    const configMapName = `${name}-config`;

    try {
      // Check if ConfigMap exists
      try {
        await this.coreApi.readNamespacedConfigMap(configMapName, namespace);
        // Update existing ConfigMap
        await this.updateConfigMap(configMapName, namespace, spec);
        console.log(`✅ Updated ConfigMap: ${configMapName}`);
      } catch (error: unknown) {
        // Create new ConfigMap if it doesn't exist
        if ((error as { statusCode?: number }).statusCode === 404) {
          await this.createConfigMap(configMapName, namespace, name, spec);
          console.log(`✅ Created ConfigMap: ${configMapName}`);
        } else {
          throw error;
        }
      }

      // Update status
      await this.updateStatus(appConfig, 'Ready', 'ConfigMap synchronized');
    } catch (error) {
      console.error(`❌ Failed to reconcile ${name}:`, error);
      await this.updateStatus(appConfig, 'Error', String(error));
    }
  }

  private async createConfigMap(
    name: string,
    namespace: string,
    ownerName: string,
    spec: AppConfigSpec
  ): Promise<void> {
    const configMap: k8s.V1ConfigMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name,
        namespace,
        labels: {
          'app.kubernetes.io/managed-by': 'simple-operator',
          'app.kubernetes.io/name': ownerName,
        },
      },
      data: this.buildConfigData(spec),
    };

    await this.coreApi.createNamespacedConfigMap(namespace, configMap);
  }

  private async updateConfigMap(
    name: string,
    namespace: string,
    spec: AppConfigSpec
  ): Promise<void> {
    const patch = {
      data: this.buildConfigData(spec),
    };

    await this.coreApi.patchNamespacedConfigMap(
      name,
      namespace,
      patch,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/merge-patch+json' } }
    );
  }

  private buildConfigData(spec: AppConfigSpec): Record<string, string> {
    const data: Record<string, string> = {};

    // Add environment variables
    if (spec.environment) {
      data['environment'] = spec.environment;
    }

    // Add replicas as string
    if (spec.replicas !== undefined) {
      data['replicas'] = String(spec.replicas);
    }

    // Add custom config
    if (spec.config) {
      for (const [key, value] of Object.entries(spec.config)) {
        data[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }

    // Add timestamp
    data['lastUpdated'] = new Date().toISOString();

    return data;
  }

  private async handleDelete(appConfig: AppConfig): Promise<void> {
    const name = appConfig.metadata?.name;
    const namespace = appConfig.metadata?.namespace ?? 'default';

    if (!name) return;

    const configMapName = `${name}-config`;

    try {
      await this.coreApi.deleteNamespacedConfigMap(configMapName, namespace);
      console.log(`🗑️ Deleted ConfigMap: ${configMapName}`);
    } catch (error: unknown) {
      if ((error as { statusCode?: number }).statusCode !== 404) {
        console.error(`❌ Failed to delete ConfigMap ${configMapName}:`, error);
      }
    }
  }

  private async updateStatus(
    appConfig: AppConfig,
    state: string,
    message: string
  ): Promise<void> {
    const name = appConfig.metadata?.name;
    const namespace = appConfig.metadata?.namespace ?? 'default';

    if (!name) return;

    try {
      await this.customApi.patchNamespacedCustomObjectStatus(
        GROUP,
        VERSION,
        namespace,
        PLURAL,
        name,
        {
          status: {
            state,
            message,
            lastUpdated: new Date().toISOString(),
          },
        },
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
    } catch (error) {
      console.error(`Failed to update status for ${name}:`, error);
    }
  }
}
