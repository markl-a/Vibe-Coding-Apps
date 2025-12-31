/**
 * Kubernetes Deployment Patterns
 *
 * Comprehensive examples of Kubernetes deployment strategies, rolling updates,
 * blue-green deployments, canary releases, and production-ready configurations.
 */

/**
 * ============================================================================
 * 1. Basic Deployment
 * ============================================================================
 *
 * Simplest deployment pattern with replicas and resource limits.
 *
 * basic-deployment.yaml:
 * ----------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 *   namespace: production
 *   labels:
 *     app: myapp
 *     version: v1
 * spec:
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         version: v1
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 *           name: http
 *         resources:
 *           requests:
 *             memory: "256Mi"
 *             cpu: "250m"
 *           limits:
 *             memory: "512Mi"
 *             cpu: "500m"
 *         env:
 *         - name: NODE_ENV
 *           value: "production"
 */

/**
 * ============================================================================
 * 2. Production-Ready Deployment with Health Checks
 * ============================================================================
 *
 * Enhanced deployment with liveness, readiness probes and proper lifecycle.
 *
 * production-deployment.yaml:
 * ---------------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp
 *   namespace: production
 *   labels:
 *     app: myapp
 *     tier: backend
 *   annotations:
 *     deployment.kubernetes.io/revision: "1"
 * spec:
 *   replicas: 3
 *   revisionHistoryLimit: 10
 *   strategy:
 *     type: RollingUpdate
 *     rollingUpdate:
 *       maxSurge: 1
 *       maxUnavailable: 0
 *   selector:
 *     matchLabels:
 *       app: myapp
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         version: v1.0.0
 *       annotations:
 *         prometheus.io/scrape: "true"
 *         prometheus.io/port: "9090"
 *         prometheus.io/path: "/metrics"
 *     spec:
 *       # Security context
 *       securityContext:
 *         runAsNonRoot: true
 *         runAsUser: 1001
 *         fsGroup: 1001
 *
 *       # Service account
 *       serviceAccountName: myapp
 *
 *       # Init containers
 *       initContainers:
 *       - name: wait-for-db
 *         image: busybox:1.35
 *         command: ['sh', '-c', 'until nc -z postgres 5432; do echo waiting for db; sleep 2; done;']
 *
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         imagePullPolicy: IfNotPresent
 *
 *         ports:
 *         - containerPort: 3000
 *           name: http
 *           protocol: TCP
 *         - containerPort: 9090
 *           name: metrics
 *           protocol: TCP
 *
 *         # Environment variables
 *         env:
 *         - name: NODE_ENV
 *           value: "production"
 *         - name: PORT
 *           value: "3000"
 *         - name: DB_HOST
 *           valueFrom:
 *             configMapKeyRef:
 *               name: app-config
 *               key: database.host
 *         - name: DB_PASSWORD
 *           valueFrom:
 *             secretKeyRef:
 *               name: app-secrets
 *               key: database.password
 *
 *         # Resource limits
 *         resources:
 *           requests:
 *             memory: "256Mi"
 *             cpu: "250m"
 *           limits:
 *             memory: "512Mi"
 *             cpu: "500m"
 *
 *         # Liveness probe
 *         livenessProbe:
 *           httpGet:
 *             path: /healthz
 *             port: http
 *             scheme: HTTP
 *           initialDelaySeconds: 30
 *           periodSeconds: 10
 *           timeoutSeconds: 5
 *           successThreshold: 1
 *           failureThreshold: 3
 *
 *         # Readiness probe
 *         readinessProbe:
 *           httpGet:
 *             path: /readyz
 *             port: http
 *           initialDelaySeconds: 5
 *           periodSeconds: 5
 *           timeoutSeconds: 3
 *           successThreshold: 1
 *           failureThreshold: 3
 *
 *         # Startup probe
 *         startupProbe:
 *           httpGet:
 *             path: /startupz
 *             port: http
 *           initialDelaySeconds: 0
 *           periodSeconds: 10
 *           timeoutSeconds: 3
 *           successThreshold: 1
 *           failureThreshold: 30
 *
 *         # Lifecycle hooks
 *         lifecycle:
 *           preStop:
 *             exec:
 *               command: ["/bin/sh", "-c", "sleep 15"]
 *
 *         # Volume mounts
 *         volumeMounts:
 *         - name: config
 *           mountPath: /app/config
 *           readOnly: true
 *         - name: tmp
 *           mountPath: /tmp
 *
 *       # Volumes
 *       volumes:
 *       - name: config
 *         configMap:
 *           name: app-config
 *       - name: tmp
 *         emptyDir: {}
 *
 *       # Termination grace period
 *       terminationGracePeriodSeconds: 30
 *
 *       # Pod anti-affinity for high availability
 *       affinity:
 *         podAntiAffinity:
 *           preferredDuringSchedulingIgnoredDuringExecution:
 *           - weight: 100
 *             podAffinityTerm:
 *               labelSelector:
 *                 matchExpressions:
 *                 - key: app
 *                   operator: In
 *                   values:
 *                   - myapp
 *               topologyKey: kubernetes.io/hostname
 */

/**
 * ============================================================================
 * 3. Rolling Update Deployment
 * ============================================================================
 *
 * Zero-downtime rolling updates with controlled rollout.
 *
 * rolling-update-deployment.yaml:
 * -------------------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp-rolling
 * spec:
 *   replicas: 10
 *   strategy:
 *     type: RollingUpdate
 *     rollingUpdate:
 *       # Maximum additional pods during update
 *       maxSurge: 25%
 *       # Maximum unavailable pods during update
 *       maxUnavailable: 0
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
 *         image: myapp:2.0.0
 *         ports:
 *         - containerPort: 3000
 *
 * Update commands:
 * kubectl set image deployment/myapp-rolling app=myapp:2.0.0
 * kubectl rollout status deployment/myapp-rolling
 * kubectl rollout pause deployment/myapp-rolling
 * kubectl rollout resume deployment/myapp-rolling
 * kubectl rollout undo deployment/myapp-rolling
 * kubectl rollout history deployment/myapp-rolling
 */

/**
 * ============================================================================
 * 4. Blue-Green Deployment
 * ============================================================================
 *
 * Zero-downtime deployment with instant rollback capability.
 *
 * blue-deployment.yaml:
 * ---------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp-blue
 * spec:
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: myapp
 *       version: blue
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         version: blue
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 * ---
 * # Green deployment (new version)
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp-green
 * spec:
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: myapp
 *       version: green
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         version: green
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:2.0.0
 *         ports:
 *         - containerPort: 3000
 * ---
 * # Service (switch between blue and green)
 * apiVersion: v1
 * kind: Service
 * metadata:
 *   name: myapp
 * spec:
 *   selector:
 *     app: myapp
 *     version: blue  # Change to 'green' to switch
 *   ports:
 *   - port: 80
 *     targetPort: 3000
 *
 * Switch traffic:
 * kubectl patch service myapp -p '{"spec":{"selector":{"version":"green"}}}'
 * # Rollback if needed:
 * kubectl patch service myapp -p '{"spec":{"selector":{"version":"blue"}}}'
 */

/**
 * ============================================================================
 * 5. Canary Deployment
 * ============================================================================
 *
 * Gradual rollout to subset of users for testing.
 *
 * stable-deployment.yaml:
 * -----------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp-stable
 * spec:
 *   replicas: 9
 *   selector:
 *     matchLabels:
 *       app: myapp
 *       track: stable
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         track: stable
 *         version: v1.0.0
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 * ---
 * # Canary deployment (10% traffic)
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp-canary
 * spec:
 *   replicas: 1  # 10% of traffic
 *   selector:
 *     matchLabels:
 *       app: myapp
 *       track: canary
 *   template:
 *     metadata:
 *       labels:
 *         app: myapp
 *         track: canary
 *         version: v2.0.0
 *     spec:
 *       containers:
 *       - name: app
 *         image: myapp:2.0.0
 *         ports:
 *         - containerPort: 3000
 * ---
 * # Service (routes to both stable and canary)
 * apiVersion: v1
 * kind: Service
 * metadata:
 *   name: myapp
 * spec:
 *   selector:
 *     app: myapp  # Matches both stable and canary
 *   ports:
 *   - port: 80
 *     targetPort: 3000
 *
 * Gradual rollout:
 * 1. Start: 9 stable, 1 canary (10%)
 * 2. Monitor metrics
 * 3. Scale: 5 stable, 5 canary (50%)
 * 4. Final: 0 stable, 10 canary (100%)
 */

/**
 * ============================================================================
 * 6. StatefulSet for Stateful Applications
 * ============================================================================
 *
 * Ordered deployment for stateful workloads with persistent storage.
 *
 * statefulset.yaml:
 * -----------------
 * apiVersion: apps/v1
 * kind: StatefulSet
 * metadata:
 *   name: database
 * spec:
 *   serviceName: database
 *   replicas: 3
 *   selector:
 *     matchLabels:
 *       app: database
 *   template:
 *     metadata:
 *       labels:
 *         app: database
 *     spec:
 *       containers:
 *       - name: postgres
 *         image: postgres:15
 *         ports:
 *         - containerPort: 5432
 *           name: postgres
 *         env:
 *         - name: POSTGRES_PASSWORD
 *           valueFrom:
 *             secretKeyRef:
 *               name: db-secret
 *               key: password
 *         volumeMounts:
 *         - name: data
 *           mountPath: /var/lib/postgresql/data
 *   volumeClaimTemplates:
 *   - metadata:
 *       name: data
 *     spec:
 *       accessModes: ["ReadWriteOnce"]
 *       storageClassName: fast-ssd
 *       resources:
 *         requests:
 *           storage: 10Gi
 * ---
 * # Headless service for StatefulSet
 * apiVersion: v1
 * kind: Service
 * metadata:
 *   name: database
 * spec:
 *   clusterIP: None
 *   selector:
 *     app: database
 *   ports:
 *   - port: 5432
 *     targetPort: 5432
 */

/**
 * ============================================================================
 * 7. DaemonSet for Node-Level Services
 * ============================================================================
 *
 * Ensures one pod per node (monitoring, logging, etc.).
 *
 * daemonset.yaml:
 * ---------------
 * apiVersion: apps/v1
 * kind: DaemonSet
 * metadata:
 *   name: node-exporter
 *   namespace: monitoring
 * spec:
 *   selector:
 *     matchLabels:
 *       app: node-exporter
 *   template:
 *     metadata:
 *       labels:
 *         app: node-exporter
 *     spec:
 *       hostNetwork: true
 *       hostPID: true
 *       containers:
 *       - name: node-exporter
 *         image: prom/node-exporter:latest
 *         ports:
 *         - containerPort: 9100
 *           name: metrics
 *         volumeMounts:
 *         - name: proc
 *           mountPath: /host/proc
 *           readOnly: true
 *         - name: sys
 *           mountPath: /host/sys
 *           readOnly: true
 *       volumes:
 *       - name: proc
 *         hostPath:
 *           path: /proc
 *       - name: sys
 *         hostPath:
 *           path: /sys
 *       tolerations:
 *       - effect: NoSchedule
 *         key: node-role.kubernetes.io/master
 */

/**
 * ============================================================================
 * 8. HorizontalPodAutoscaler (HPA)
 * ============================================================================
 *
 * Automatic scaling based on CPU/memory/custom metrics.
 *
 * hpa.yaml:
 * ---------
 * apiVersion: autoscaling/v2
 * kind: HorizontalPodAutoscaler
 * metadata:
 *   name: myapp-hpa
 * spec:
 *   scaleTargetRef:
 *     apiVersion: apps/v1
 *     kind: Deployment
 *     name: myapp
 *   minReplicas: 3
 *   maxReplicas: 100
 *   metrics:
 *   # CPU-based scaling
 *   - type: Resource
 *     resource:
 *       name: cpu
 *       target:
 *         type: Utilization
 *         averageUtilization: 70
 *   # Memory-based scaling
 *   - type: Resource
 *     resource:
 *       name: memory
 *       target:
 *         type: Utilization
 *         averageUtilization: 80
 *   # Custom metric (requests per second)
 *   - type: Pods
 *     pods:
 *       metric:
 *         name: http_requests_per_second
 *       target:
 *         type: AverageValue
 *         averageValue: "1000"
 *   behavior:
 *     scaleDown:
 *       stabilizationWindowSeconds: 300
 *       policies:
 *       - type: Percent
 *         value: 50
 *         periodSeconds: 60
 *     scaleUp:
 *       stabilizationWindowSeconds: 0
 *       policies:
 *       - type: Percent
 *         value: 100
 *         periodSeconds: 15
 */

/**
 * ============================================================================
 * 9. Pod Disruption Budget (PDB)
 * ============================================================================
 *
 * Ensure availability during voluntary disruptions.
 *
 * pdb.yaml:
 * ---------
 * apiVersion: policy/v1
 * kind: PodDisruptionBudget
 * metadata:
 *   name: myapp-pdb
 * spec:
 *   minAvailable: 2  # Or use maxUnavailable: 1
 *   selector:
 *     matchLabels:
 *       app: myapp
 */

/**
 * ============================================================================
 * 10. Multi-Container Pod Pattern
 * ============================================================================
 *
 * Sidecar, ambassador, and adapter patterns.
 *
 * multi-container.yaml:
 * ---------------------
 * apiVersion: apps/v1
 * kind: Deployment
 * metadata:
 *   name: myapp-with-sidecar
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
 *       # Main application container
 *       - name: app
 *         image: myapp:1.0.0
 *         ports:
 *         - containerPort: 3000
 *         volumeMounts:
 *         - name: shared-logs
 *           mountPath: /var/log/app
 *
 *       # Sidecar: Log shipper
 *       - name: log-shipper
 *         image: fluent/fluent-bit:latest
 *         volumeMounts:
 *         - name: shared-logs
 *           mountPath: /var/log/app
 *           readOnly: true
 *         - name: fluent-bit-config
 *           mountPath: /fluent-bit/etc/
 *
 *       # Sidecar: Metrics exporter
 *       - name: metrics-exporter
 *         image: prom/statsd-exporter:latest
 *         ports:
 *         - containerPort: 9102
 *           name: metrics
 *
 *       volumes:
 *       - name: shared-logs
 *         emptyDir: {}
 *       - name: fluent-bit-config
 *         configMap:
 *           name: fluent-bit-config
 */

// ============================================================================
// TypeScript Kubernetes Client Example
// ============================================================================

import * as k8s from '@kubernetes/client-node';

export class KubernetesDeploymentManager {
  private k8sApi: k8s.AppsV1Api;
  private coreApi: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    this.k8sApi = kc.makeApiClient(k8s.AppsV1Api);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  /**
   * Create a deployment programmatically
   */
  async createDeployment(
    namespace: string,
    name: string,
    image: string,
    replicas: number = 3
  ): Promise<void> {
    const deployment: k8s.V1Deployment = {
      metadata: {
        name,
        namespace,
        labels: { app: name }
      },
      spec: {
        replicas,
        selector: {
          matchLabels: { app: name }
        },
        template: {
          metadata: {
            labels: { app: name }
          },
          spec: {
            containers: [{
              name: 'app',
              image,
              ports: [{ containerPort: 3000 }],
              resources: {
                requests: {
                  memory: '256Mi',
                  cpu: '250m'
                },
                limits: {
                  memory: '512Mi',
                  cpu: '500m'
                }
              }
            }]
          }
        }
      }
    };

    try {
      await this.k8sApi.createNamespacedDeployment(namespace, deployment);
      console.log(`Deployment ${name} created successfully`);
    } catch (error) {
      console.error('Error creating deployment:', error);
      throw error;
    }
  }

  /**
   * Update deployment image (rolling update)
   */
  async updateDeploymentImage(
    namespace: string,
    name: string,
    newImage: string
  ): Promise<void> {
    try {
      const { body: deployment } = await this.k8sApi.readNamespacedDeployment(
        name,
        namespace
      );

      if (deployment.spec?.template.spec?.containers) {
        deployment.spec.template.spec.containers[0].image = newImage;

        await this.k8sApi.replaceNamespacedDeployment(
          name,
          namespace,
          deployment
        );

        console.log(`Deployment ${name} updated to image ${newImage}`);
      }
    } catch (error) {
      console.error('Error updating deployment:', error);
      throw error;
    }
  }

  /**
   * Scale deployment
   */
  async scaleDeployment(
    namespace: string,
    name: string,
    replicas: number
  ): Promise<void> {
    try {
      const { body: deployment } = await this.k8sApi.readNamespacedDeployment(
        name,
        namespace
      );

      if (deployment.spec) {
        deployment.spec.replicas = replicas;

        await this.k8sApi.replaceNamespacedDeployment(
          name,
          namespace,
          deployment
        );

        console.log(`Deployment ${name} scaled to ${replicas} replicas`);
      }
    } catch (error) {
      console.error('Error scaling deployment:', error);
      throw error;
    }
  }

  /**
   * Rollback deployment
   */
  async rollbackDeployment(
    namespace: string,
    name: string
  ): Promise<void> {
    // Note: K8s client doesn't have direct rollback, use kubectl or implement manually
    console.log(`Rolling back deployment ${name} in namespace ${namespace}`);
  }
}

export default KubernetesDeploymentManager;
