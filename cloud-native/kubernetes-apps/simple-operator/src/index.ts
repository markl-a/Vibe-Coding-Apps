/**
 * Simple Kubernetes Operator
 *
 * This operator watches for AppConfig custom resources and
 * creates/updates ConfigMaps based on the spec.
 */

import * as k8s from '@kubernetes/client-node';
import { AppConfigController } from './controller.js';

async function main() {
  console.log('🚀 Starting Simple Kubernetes Operator');

  // Load kubeconfig
  const kc = new k8s.KubeConfig();

  // Try in-cluster config first (when running in k8s)
  // Fall back to default kubeconfig (for local development)
  try {
    kc.loadFromCluster();
    console.log('📦 Running in-cluster');
  } catch {
    kc.loadFromDefault();
    console.log('💻 Running with local kubeconfig');
  }

  // Create API clients
  const customApi = kc.makeApiClient(k8s.CustomObjectsApi);
  const coreApi = kc.makeApiClient(k8s.CoreV1Api);

  // Initialize controller
  const controller = new AppConfigController(customApi, coreApi);

  // Start watching for AppConfig resources
  await controller.start();

  // Handle shutdown
  process.on('SIGTERM', async () => {
    console.log('📴 Received SIGTERM, shutting down...');
    await controller.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('📴 Received SIGINT, shutting down...');
    await controller.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Operator failed to start:', error);
  process.exit(1);
});
