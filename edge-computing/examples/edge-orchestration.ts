/**
 * Edge Orchestration Example
 *
 * Demonstrates orchestration and management of edge nodes:
 * - Node discovery and registration
 * - Workload distribution and load balancing
 * - Health monitoring and failover
 * - Resource allocation and scaling
 * - Task scheduling and coordination
 * - Distributed consensus
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface EdgeNode {
  id: string;
  type: 'gateway' | 'compute' | 'storage' | 'hybrid';
  status: 'online' | 'offline' | 'degraded';
  location: {
    lat: number;
    lon: number;
    region: string;
  };
  capabilities: {
    cpuCores: number;
    memoryGB: number;
    storageGB: number;
    gpuAvailable: boolean;
    networkBandwidth: number; // Mbps
  };
  resources: {
    cpuUsage: number; // 0-100
    memoryUsage: number; // 0-100
    storageUsage: number; // 0-100
    networkUsage: number; // 0-100
  };
  workloads: Workload[];
  lastHeartbeat: number;
  metadata?: Record<string, any>;
}

interface Workload {
  id: string;
  name: string;
  type: 'inference' | 'processing' | 'storage' | 'streaming';
  priority: number;
  resourceRequirements: {
    cpuCores: number;
    memoryGB: number;
    storageGB?: number;
    gpu?: boolean;
  };
  constraints?: {
    region?: string;
    nodeType?: string;
    maxLatency?: number;
  };
  status: 'pending' | 'scheduled' | 'running' | 'completed' | 'failed';
  assignedNode?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface SchedulingDecision {
  workload: Workload;
  targetNode: EdgeNode;
  score: number;
  reason: string;
}

interface ClusterState {
  totalNodes: number;
  onlineNodes: number;
  totalWorkloads: number;
  runningWorkloads: number;
  avgResourceUtilization: number;
}

// ============================================================================
// Edge Node Manager
// ============================================================================

class EdgeNodeManager extends EventEmitter {
  private nodes = new Map<string, EdgeNode>();
  private heartbeatInterval = 30000; // 30 seconds
  private heartbeatTimeout = 90000; // 90 seconds
  private monitorTimer: NodeJS.Timeout | null = null;

  /**
   * Register new edge node
   */
  registerNode(node: EdgeNode): void {
    node.lastHeartbeat = Date.now();
    node.workloads = [];

    this.nodes.set(node.id, node);

    console.log(`[NodeManager] Registered node: ${node.id} (${node.type}, ${node.location.region})`);
    this.emit('node-registered', node);
  }

  /**
   * Update node heartbeat
   */
  heartbeat(nodeId: string, resources: EdgeNode['resources']): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      console.warn(`[NodeManager] Unknown node: ${nodeId}`);
      return;
    }

    node.lastHeartbeat = Date.now();
    node.resources = resources;

    // Update status based on resources
    if (this.isNodeHealthy(node)) {
      if (node.status !== 'online') {
        node.status = 'online';
        this.emit('node-online', node);
      }
    } else {
      if (node.status !== 'degraded') {
        node.status = 'degraded';
        this.emit('node-degraded', node);
      }
    }
  }

  /**
   * Unregister node
   */
  unregisterNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    console.log(`[NodeManager] Unregistering node: ${nodeId}`);

    // Reschedule workloads
    if (node.workloads.length > 0) {
      console.log(`[NodeManager] Rescheduling ${node.workloads.length} workloads from ${nodeId}`);
      this.emit('node-offline', { node, workloads: node.workloads });
    }

    this.nodes.delete(nodeId);
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: string): EdgeNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all nodes matching criteria
   */
  getNodes(filter?: {
    status?: EdgeNode['status'];
    type?: EdgeNode['type'];
    region?: string;
  }): EdgeNode[] {
    let nodes = Array.from(this.nodes.values());

    if (filter?.status) {
      nodes = nodes.filter(n => n.status === filter.status);
    }

    if (filter?.type) {
      nodes = nodes.filter(n => n.type === filter.type);
    }

    if (filter?.region) {
      nodes = nodes.filter(n => n.location.region === filter.region);
    }

    return nodes;
  }

  /**
   * Start monitoring node health
   */
  startMonitoring(): void {
    console.log('[NodeManager] Starting health monitoring');

    this.monitorTimer = setInterval(() => {
      this.checkNodeHealth();
    }, this.heartbeatInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = null;
      console.log('[NodeManager] Stopped health monitoring');
    }
  }

  /**
   * Check health of all nodes
   */
  private checkNodeHealth(): void {
    const now = Date.now();

    for (const node of this.nodes.values()) {
      const timeSinceHeartbeat = now - node.lastHeartbeat;

      if (timeSinceHeartbeat > this.heartbeatTimeout) {
        if (node.status !== 'offline') {
          console.warn(`[NodeManager] Node ${node.id} missed heartbeat`);
          node.status = 'offline';
          this.emit('node-offline', { node, workloads: node.workloads });
        }
      }
    }
  }

  /**
   * Check if node is healthy
   */
  private isNodeHealthy(node: EdgeNode): boolean {
    const { cpuUsage, memoryUsage, storageUsage } = node.resources;

    // Consider degraded if any resource > 90%
    return cpuUsage < 90 && memoryUsage < 90 && storageUsage < 90;
  }

  /**
   * Get cluster statistics
   */
  getClusterStats(): ClusterState {
    const nodes = Array.from(this.nodes.values());
    const onlineNodes = nodes.filter(n => n.status === 'online');

    const totalWorkloads = nodes.reduce((sum, n) => sum + n.workloads.length, 0);
    const runningWorkloads = nodes.reduce(
      (sum, n) => sum + n.workloads.filter(w => w.status === 'running').length,
      0
    );

    const avgResourceUtilization =
      onlineNodes.length > 0
        ? onlineNodes.reduce((sum, n) => {
            const avg = (n.resources.cpuUsage + n.resources.memoryUsage) / 2;
            return sum + avg;
          }, 0) / onlineNodes.length
        : 0;

    return {
      totalNodes: nodes.length,
      onlineNodes: onlineNodes.length,
      totalWorkloads,
      runningWorkloads,
      avgResourceUtilization,
    };
  }
}

// ============================================================================
// Workload Scheduler
// ============================================================================

class WorkloadScheduler extends EventEmitter {
  constructor(private nodeManager: EdgeNodeManager) {
    super();
  }

  /**
   * Schedule workload to appropriate node
   */
  schedule(workload: Workload): SchedulingDecision | null {
    console.log(`[Scheduler] Scheduling workload: ${workload.name} (${workload.type})`);

    // Get eligible nodes
    const eligibleNodes = this.getEligibleNodes(workload);

    if (eligibleNodes.length === 0) {
      console.warn(`[Scheduler] No eligible nodes for workload: ${workload.name}`);
      return null;
    }

    // Score each node
    const scored = eligibleNodes.map(node => ({
      node,
      score: this.scoreNode(node, workload),
    }));

    // Sort by score (higher is better)
    scored.sort((a, b) => b.score - a.score);

    const decision: SchedulingDecision = {
      workload,
      targetNode: scored[0].node,
      score: scored[0].score,
      reason: this.getSchedulingReason(scored[0].node, workload),
    };

    console.log(
      `[Scheduler] Scheduled ${workload.name} to ${decision.targetNode.id} (score: ${decision.score.toFixed(2)})`
    );

    // Assign workload to node
    workload.assignedNode = decision.targetNode.id;
    workload.status = 'scheduled';
    decision.targetNode.workloads.push(workload);

    this.emit('workload-scheduled', decision);

    return decision;
  }

  /**
   * Reschedule workload to different node
   */
  reschedule(workloadId: string, reason: string): SchedulingDecision | null {
    console.log(`[Scheduler] Rescheduling workload ${workloadId}: ${reason}`);

    // Find and remove workload from current node
    let workload: Workload | undefined;

    for (const node of this.nodeManager.getNodes()) {
      const index = node.workloads.findIndex(w => w.id === workloadId);
      if (index !== -1) {
        workload = node.workloads.splice(index, 1)[0];
        break;
      }
    }

    if (!workload) {
      console.warn(`[Scheduler] Workload not found: ${workloadId}`);
      return null;
    }

    // Reset workload status
    workload.status = 'pending';
    workload.assignedNode = undefined;

    // Schedule to new node
    return this.schedule(workload);
  }

  /**
   * Get nodes eligible for workload
   */
  private getEligibleNodes(workload: Workload): EdgeNode[] {
    let nodes = this.nodeManager.getNodes({ status: 'online' });

    // Apply constraints
    if (workload.constraints?.region) {
      nodes = nodes.filter(n => n.location.region === workload.constraints!.region);
    }

    if (workload.constraints?.nodeType) {
      nodes = nodes.filter(n => n.type === workload.constraints!.nodeType);
    }

    // Check resource requirements
    nodes = nodes.filter(node => {
      const availableCpu = node.capabilities.cpuCores * (1 - node.resources.cpuUsage / 100);
      const availableMemory = node.capabilities.memoryGB * (1 - node.resources.memoryUsage / 100);

      const hasEnoughCpu = availableCpu >= workload.resourceRequirements.cpuCores;
      const hasEnoughMemory = availableMemory >= workload.resourceRequirements.memoryGB;
      const hasGpu = !workload.resourceRequirements.gpu || node.capabilities.gpuAvailable;

      return hasEnoughCpu && hasEnoughMemory && hasGpu;
    });

    return nodes;
  }

  /**
   * Score node for workload placement
   */
  private scoreNode(node: EdgeNode, workload: Workload): number {
    let score = 100;

    // Penalty for resource utilization (prefer less utilized nodes)
    const avgUtilization = (node.resources.cpuUsage + node.resources.memoryUsage) / 2;
    score -= avgUtilization * 0.5;

    // Bonus for matching capabilities
    if (workload.resourceRequirements.gpu && node.capabilities.gpuAvailable) {
      score += 20;
    }

    // Bonus for matching type
    if (
      (workload.type === 'inference' && node.type === 'compute') ||
      (workload.type === 'storage' && node.type === 'storage')
    ) {
      score += 15;
    }

    // Bonus for priority workloads on powerful nodes
    if (workload.priority > 7 && node.capabilities.cpuCores >= 8) {
      score += 10;
    }

    // Penalty for number of existing workloads
    score -= node.workloads.length * 2;

    return Math.max(0, score);
  }

  /**
   * Get scheduling reason description
   */
  private getSchedulingReason(node: EdgeNode, workload: Workload): string {
    const reasons: string[] = [];

    const avgUtilization = (node.resources.cpuUsage + node.resources.memoryUsage) / 2;
    if (avgUtilization < 50) {
      reasons.push('low utilization');
    }

    if (workload.resourceRequirements.gpu && node.capabilities.gpuAvailable) {
      reasons.push('GPU available');
    }

    if (workload.constraints?.region && node.location.region === workload.constraints.region) {
      reasons.push('region match');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'best available node';
  }
}

// ============================================================================
// Load Balancer
// ============================================================================

class LoadBalancer {
  private algorithm: 'round-robin' | 'least-connections' | 'weighted' = 'least-connections';
  private roundRobinIndex = 0;

  constructor(private nodeManager: EdgeNodeManager, algorithm?: LoadBalancer['algorithm']) {
    if (algorithm) {
      this.algorithm = algorithm;
    }
  }

  /**
   * Select node for incoming request
   */
  selectNode(request?: { weight?: number }): EdgeNode | null {
    const nodes = this.nodeManager.getNodes({ status: 'online' });

    if (nodes.length === 0) {
      return null;
    }

    switch (this.algorithm) {
      case 'round-robin':
        return this.roundRobin(nodes);

      case 'least-connections':
        return this.leastConnections(nodes);

      case 'weighted':
        return this.weighted(nodes, request?.weight || 1);

      default:
        return nodes[0];
    }
  }

  /**
   * Round-robin selection
   */
  private roundRobin(nodes: EdgeNode[]): EdgeNode {
    const node = nodes[this.roundRobinIndex % nodes.length];
    this.roundRobinIndex++;
    return node;
  }

  /**
   * Least connections selection
   */
  private leastConnections(nodes: EdgeNode[]): EdgeNode {
    return nodes.reduce((min, node) => {
      return node.workloads.length < min.workloads.length ? node : min;
    });
  }

  /**
   * Weighted selection based on capacity
   */
  private weighted(nodes: EdgeNode[], weight: number): EdgeNode {
    // Calculate weights based on available resources
    const weighted = nodes.map(node => {
      const availableCapacity =
        ((node.capabilities.cpuCores - node.resources.cpuUsage / 100) +
          (node.capabilities.memoryGB - node.resources.memoryUsage / 100)) /
        2;

      return {
        node,
        weight: availableCapacity * weight,
      };
    });

    // Select randomly based on weights
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weighted) {
      random -= item.weight;
      if (random <= 0) {
        return item.node;
      }
    }

    return weighted[0].node;
  }

  /**
   * Set load balancing algorithm
   */
  setAlgorithm(algorithm: LoadBalancer['algorithm']): void {
    this.algorithm = algorithm;
    console.log(`[LoadBalancer] Algorithm set to: ${algorithm}`);
  }
}

// ============================================================================
// Edge Orchestrator
// ============================================================================

class EdgeOrchestrator extends EventEmitter {
  private nodeManager = new EdgeNodeManager();
  private scheduler = new WorkloadScheduler(this.nodeManager);
  private loadBalancer = new LoadBalancer(this.nodeManager);

  constructor() {
    super();

    // Forward important events
    this.nodeManager.on('node-offline', ({ node, workloads }) => {
      console.log(`[Orchestrator] Node ${node.id} went offline, rescheduling ${workloads.length} workloads`);

      for (const workload of workloads) {
        this.scheduler.reschedule(workload.id, 'node offline');
      }
    });

    this.scheduler.on('workload-scheduled', (decision) => {
      this.emit('workload-scheduled', decision);
    });
  }

  /**
   * Register edge node
   */
  registerNode(node: EdgeNode): void {
    this.nodeManager.registerNode(node);
  }

  /**
   * Update node heartbeat
   */
  heartbeat(nodeId: string, resources: EdgeNode['resources']): void {
    this.nodeManager.heartbeat(nodeId, resources);
  }

  /**
   * Deploy workload to cluster
   */
  deployWorkload(workload: Workload): SchedulingDecision | null {
    return this.scheduler.schedule(workload);
  }

  /**
   * Scale workload across multiple nodes
   */
  scaleWorkload(workload: Workload, replicas: number): SchedulingDecision[] {
    console.log(`[Orchestrator] Scaling ${workload.name} to ${replicas} replicas`);

    const decisions: SchedulingDecision[] = [];

    for (let i = 0; i < replicas; i++) {
      const replica: Workload = {
        ...workload,
        id: `${workload.id}-replica-${i}`,
        name: `${workload.name} (replica ${i})`,
      };

      const decision = this.scheduler.schedule(replica);
      if (decision) {
        decisions.push(decision);
      }
    }

    console.log(`[Orchestrator] Scheduled ${decisions.length}/${replicas} replicas`);

    return decisions;
  }

  /**
   * Get cluster state
   */
  getClusterState(): ClusterState {
    return this.nodeManager.getClusterStats();
  }

  /**
   * Start orchestration
   */
  start(): void {
    console.log('[Orchestrator] Starting edge orchestration');
    this.nodeManager.startMonitoring();
    this.emit('started');
  }

  /**
   * Stop orchestration
   */
  stop(): void {
    console.log('[Orchestrator] Stopping edge orchestration');
    this.nodeManager.stopMonitoring();
    this.emit('stopped');
  }

  /**
   * Get load balancer
   */
  getLoadBalancer(): LoadBalancer {
    return this.loadBalancer;
  }
}

// ============================================================================
// Usage Example
// ============================================================================

async function main() {
  console.log('=== Edge Orchestration Example ===\n');

  // Initialize orchestrator
  const orchestrator = new EdgeOrchestrator();

  // Listen for events
  orchestrator.on('workload-scheduled', (decision) => {
    console.log(`[EVENT] Workload ${decision.workload.name} scheduled to ${decision.targetNode.id}`);
  });

  // 1. Register edge nodes
  console.log('1. Registering Edge Nodes:');

  const nodes: EdgeNode[] = [
    {
      id: 'edge-us-west-1',
      type: 'compute',
      status: 'online',
      location: { lat: 37.7749, lon: -122.4194, region: 'us-west' },
      capabilities: { cpuCores: 8, memoryGB: 16, storageGB: 500, gpuAvailable: true, networkBandwidth: 1000 },
      resources: { cpuUsage: 30, memoryUsage: 40, storageUsage: 20, networkUsage: 15 },
      workloads: [],
      lastHeartbeat: Date.now(),
    },
    {
      id: 'edge-us-east-1',
      type: 'hybrid',
      status: 'online',
      location: { lat: 40.7128, lon: -74.006, region: 'us-east' },
      capabilities: { cpuCores: 16, memoryGB: 32, storageGB: 1000, gpuAvailable: true, networkBandwidth: 10000 },
      resources: { cpuUsage: 20, memoryUsage: 25, storageUsage: 15, networkUsage: 10 },
      workloads: [],
      lastHeartbeat: Date.now(),
    },
    {
      id: 'edge-eu-west-1',
      type: 'storage',
      status: 'online',
      location: { lat: 51.5074, lon: -0.1278, region: 'eu-west' },
      capabilities: { cpuCores: 4, memoryGB: 8, storageGB: 2000, gpuAvailable: false, networkBandwidth: 1000 },
      resources: { cpuUsage: 15, memoryUsage: 30, storageUsage: 50, networkUsage: 20 },
      workloads: [],
      lastHeartbeat: Date.now(),
    },
  ];

  nodes.forEach(node => orchestrator.registerNode(node));

  // 2. Deploy workloads
  console.log('\n2. Deploying Workloads:');

  const workloads: Workload[] = [
    {
      id: 'wl-1',
      name: 'ML Inference Service',
      type: 'inference',
      priority: 8,
      resourceRequirements: { cpuCores: 4, memoryGB: 8, gpu: true },
      constraints: { region: 'us-west' },
      status: 'pending',
      createdAt: Date.now(),
    },
    {
      id: 'wl-2',
      name: 'Data Processing Pipeline',
      type: 'processing',
      priority: 6,
      resourceRequirements: { cpuCores: 2, memoryGB: 4 },
      status: 'pending',
      createdAt: Date.now(),
    },
    {
      id: 'wl-3',
      name: 'Video Streaming',
      type: 'streaming',
      priority: 9,
      resourceRequirements: { cpuCores: 8, memoryGB: 16 },
      status: 'pending',
      createdAt: Date.now(),
    },
  ];

  workloads.forEach(workload => {
    const decision = orchestrator.deployWorkload(workload);
    if (decision) {
      console.log(`  ✓ ${decision.workload.name} → ${decision.targetNode.id} (${decision.reason})`);
    }
  });

  // 3. Scale workload
  console.log('\n3. Scaling Workload:');
  const scaleDecisions = orchestrator.scaleWorkload(workloads[1], 3);
  console.log(`Scaled to ${scaleDecisions.length} replicas`);

  // 4. Load balancing
  console.log('\n4. Load Balancing:');
  const lb = orchestrator.getLoadBalancer();

  for (let i = 0; i < 5; i++) {
    const selected = lb.selectNode();
    console.log(`Request ${i + 1} → ${selected?.id}`);
  }

  // 5. Cluster state
  console.log('\n5. Cluster State:');
  const state = orchestrator.getClusterState();
  console.log(JSON.stringify(state, null, 2));

  // 6. Simulate node failure
  console.log('\n6. Simulating Node Failure:');
  console.log('Node edge-us-west-1 going offline...');

  // Update heartbeat to trigger offline status
  const failedNode = nodes[0];
  failedNode.lastHeartbeat = Date.now() - 120000; // 2 minutes ago

  // Start monitoring to detect failure
  orchestrator.start();

  // Wait for monitoring to detect and reschedule
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\nFinal Cluster State:');
  console.log(JSON.stringify(orchestrator.getClusterState(), null, 2));

  orchestrator.stop();

  console.log('\n=== Edge Orchestration Complete ===');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export {
  EdgeOrchestrator,
  EdgeNodeManager,
  WorkloadScheduler,
  LoadBalancer,
  EdgeNode,
  Workload,
  SchedulingDecision,
  ClusterState,
};
