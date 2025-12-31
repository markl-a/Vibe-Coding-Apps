import type * as k8s from '@kubernetes/client-node';

export interface AppConfigSpec {
  environment?: 'development' | 'staging' | 'production';
  replicas?: number;
  config?: Record<string, string | number | boolean>;
}

export interface AppConfigStatus {
  state: 'Pending' | 'Ready' | 'Error';
  message?: string;
  lastUpdated?: string;
}

export interface AppConfig {
  apiVersion: string;
  kind: string;
  metadata?: k8s.V1ObjectMeta;
  spec?: AppConfigSpec;
  status?: AppConfigStatus;
}
