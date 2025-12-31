/**
 * Real-Time Synchronization Examples
 *
 * Demonstrates real-time synchronization between physical assets
 * and their digital twins using various protocols and patterns.
 */

// ============================================================================
// Core Sync Types
// ============================================================================

interface SyncMessage {
  twinId: string;
  timestamp: Date;
  type: 'property_update' | 'state_change' | 'event' | 'command';
  data: Record<string, unknown>;
  source: 'physical' | 'digital';
  priority: 'low' | 'normal' | 'high' | 'critical';
  sequenceNumber?: number;
}

interface SyncConfig {
  protocol: 'mqtt' | 'websocket' | 'http_polling' | 'grpc';
  updateInterval?: number; // ms for polling
  qos?: 0 | 1 | 2; // Quality of Service for MQTT
  compression?: boolean;
  encryption?: boolean;
  batchSize?: number;
  conflictResolution: 'physical_wins' | 'digital_wins' | 'latest_wins' | 'manual';
}

interface SyncState {
  twinId: string;
  lastSyncTime: Date;
  lastPhysicalUpdate: Date;
  lastDigitalUpdate: Date;
  syncStatus: 'synced' | 'syncing' | 'out_of_sync' | 'error';
  latency: number; // ms
  messagesProcessed: number;
  errorCount: number;
  queueDepth: number;
}

interface ConflictEvent {
  twinId: string;
  property: string;
  physicalValue: unknown;
  digitalValue: unknown;
  physicalTimestamp: Date;
  digitalTimestamp: Date;
  resolution?: 'physical' | 'digital' | 'merged';
}

// ============================================================================
// Real-Time Sync Engine
// ============================================================================

class RealTimeSyncEngine {
  private twins = new Map<string, any>();
  private syncStates = new Map<string, SyncState>();
  private messageQueue: SyncMessage[] = [];
  private conflictHandlers: Array<(conflict: ConflictEvent) => 'physical' | 'digital' | 'merged'> = [];
  private config: SyncConfig;
  private isRunning = false;
  private stats = {
    totalMessages: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflicts: 0,
    averageLatency: 0,
  };

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      protocol: 'websocket',
      updateInterval: 100,
      qos: 1,
      compression: true,
      encryption: true,
      batchSize: 10,
      conflictResolution: 'latest_wins',
      ...config,
    };
  }

  // Register a digital twin for sync
  registerTwin(twinId: string, initialState: any): void {
    this.twins.set(twinId, initialState);
    this.syncStates.set(twinId, {
      twinId,
      lastSyncTime: new Date(),
      lastPhysicalUpdate: new Date(),
      lastDigitalUpdate: new Date(),
      syncStatus: 'synced',
      latency: 0,
      messagesProcessed: 0,
      errorCount: 0,
      queueDepth: 0,
    });
    console.log(`[SYNC] Registered twin: ${twinId}`);
  }

  // Send update from physical to digital
  syncFromPhysical(twinId: string, data: Record<string, unknown>, priority: SyncMessage['priority'] = 'normal'): void {
    const message: SyncMessage = {
      twinId,
      timestamp: new Date(),
      type: 'property_update',
      data,
      source: 'physical',
      priority,
      sequenceNumber: this.stats.totalMessages++,
    };

    this.enqueueMessage(message);
  }

  // Send command from digital to physical
  syncToPhysical(twinId: string, command: Record<string, unknown>, priority: SyncMessage['priority'] = 'normal'): void {
    const message: SyncMessage = {
      twinId,
      timestamp: new Date(),
      type: 'command',
      data: command,
      source: 'digital',
      priority,
      sequenceNumber: this.stats.totalMessages++,
    };

    this.enqueueMessage(message);
  }

  private enqueueMessage(message: SyncMessage): void {
    // Insert based on priority
    if (message.priority === 'critical') {
      this.messageQueue.unshift(message);
    } else if (message.priority === 'high') {
      const firstNonCritical = this.messageQueue.findIndex(m => m.priority !== 'critical');
      this.messageQueue.splice(firstNonCritical === -1 ? this.messageQueue.length : firstNonCritical, 0, message);
    } else {
      this.messageQueue.push(message);
    }

    const state = this.syncStates.get(message.twinId);
    if (state) {
      state.queueDepth = this.messageQueue.filter(m => m.twinId === message.twinId).length;
    }
  }

  // Process sync messages
  async processSyncQueue(): Promise<void> {
    const batch = this.messageQueue.splice(0, this.config.batchSize);

    for (const message of batch) {
      const startTime = Date.now();

      try {
        await this.processMessage(message);
        this.stats.successfulSyncs++;

        // Update latency
        const latency = Date.now() - startTime;
        const state = this.syncStates.get(message.twinId);
        if (state) {
          state.latency = latency;
          state.messagesProcessed++;
          state.lastSyncTime = new Date();
          state.syncStatus = 'synced';

          if (message.source === 'physical') {
            state.lastPhysicalUpdate = message.timestamp;
          } else {
            state.lastDigitalUpdate = message.timestamp;
          }
        }

        // Update average latency
        this.stats.averageLatency =
          (this.stats.averageLatency * (this.stats.successfulSyncs - 1) + latency) / this.stats.successfulSyncs;
      } catch (error) {
        this.stats.failedSyncs++;
        const state = this.syncStates.get(message.twinId);
        if (state) {
          state.errorCount++;
          state.syncStatus = 'error';
        }
        console.error(`[SYNC ERROR] Failed to process message for ${message.twinId}:`, error);
      }
    }
  }

  private async processMessage(message: SyncMessage): Promise<void> {
    const twin = this.twins.get(message.twinId);
    if (!twin) {
      throw new Error(`Twin ${message.twinId} not found`);
    }

    // Simulate network latency
    await this.simulateNetworkDelay();

    if (message.source === 'physical') {
      // Update digital twin from physical
      await this.updateDigitalTwin(message);
    } else {
      // Send command to physical asset
      await this.sendCommandToPhysical(message);
    }
  }

  private async updateDigitalTwin(message: SyncMessage): Promise<void> {
    const twin = this.twins.get(message.twinId);

    // Check for conflicts
    for (const [key, physicalValue] of Object.entries(message.data)) {
      if (twin[key] !== undefined && twin[key] !== physicalValue) {
        const conflict: ConflictEvent = {
          twinId: message.twinId,
          property: key,
          physicalValue,
          digitalValue: twin[key],
          physicalTimestamp: message.timestamp,
          digitalTimestamp: twin[`${key}_timestamp`] || new Date(0),
        };

        const resolution = this.resolveConflict(conflict);
        conflict.resolution = resolution;

        if (resolution === 'physical') {
          twin[key] = physicalValue;
          twin[`${key}_timestamp`] = message.timestamp;
        }
        // If 'digital', keep current value
        // If 'merged', could implement custom merge logic

        this.stats.conflicts++;
      } else {
        twin[key] = physicalValue;
        twin[`${key}_timestamp`] = message.timestamp;
      }
    }
  }

  private async sendCommandToPhysical(message: SyncMessage): Promise<void> {
    // Simulate sending command to physical device
    console.log(`[SYNC] Sending command to physical asset ${message.twinId}:`, message.data);

    // In real implementation, this would use MQTT, HTTP, or other protocol
    // to communicate with the physical device
  }

  private resolveConflict(conflict: ConflictEvent): 'physical' | 'digital' | 'merged' {
    // Use custom handlers first
    for (const handler of this.conflictHandlers) {
      const resolution = handler(conflict);
      if (resolution) return resolution;
    }

    // Fall back to configured resolution strategy
    switch (this.config.conflictResolution) {
      case 'physical_wins':
        return 'physical';
      case 'digital_wins':
        return 'digital';
      case 'latest_wins':
        return conflict.physicalTimestamp > conflict.digitalTimestamp ? 'physical' : 'digital';
      default:
        return 'physical';
    }
  }

  onConflict(handler: (conflict: ConflictEvent) => 'physical' | 'digital' | 'merged'): void {
    this.conflictHandlers.push(handler);
  }

  private async simulateNetworkDelay(): Promise<void> {
    // Simulate network latency (5-50ms)
    const delay = 5 + Math.random() * 45;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Start continuous sync
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[SYNC] Started sync engine (${this.config.protocol})`);
  }

  // Stop sync
  stop(): void {
    this.isRunning = false;
    console.log('[SYNC] Stopped sync engine');
  }

  // Get sync state for a twin
  getSyncState(twinId: string): SyncState | undefined {
    return this.syncStates.get(twinId);
  }

  // Get all sync states
  getAllSyncStates(): SyncState[] {
    return Array.from(this.syncStates.values());
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      queueDepth: this.messageQueue.length,
      activeTwins: this.twins.size,
    };
  }

  // Get twin current state
  getTwinState(twinId: string): any {
    return this.twins.get(twinId);
  }
}

// ============================================================================
// Bi-directional Sync Manager
// ============================================================================

class BiDirectionalSyncManager {
  private physicalState = new Map<string, Record<string, unknown>>();
  private digitalState = new Map<string, Record<string, unknown>>();
  private syncEngine: RealTimeSyncEngine;

  constructor(syncEngine: RealTimeSyncEngine) {
    this.syncEngine = syncEngine;
  }

  // Register asset for bi-directional sync
  registerAsset(assetId: string, initialPhysicalState: Record<string, unknown>, initialDigitalState: Record<string, unknown>): void {
    this.physicalState.set(assetId, { ...initialPhysicalState });
    this.digitalState.set(assetId, { ...initialDigitalState });
    this.syncEngine.registerTwin(assetId, initialDigitalState);
  }

  // Simulate physical asset updating
  updatePhysicalAsset(assetId: string, updates: Record<string, unknown>, priority: SyncMessage['priority'] = 'normal'): void {
    const state = this.physicalState.get(assetId);
    if (!state) {
      throw new Error(`Asset ${assetId} not registered`);
    }

    // Update local physical state
    Object.assign(state, updates);

    // Sync to digital twin
    this.syncEngine.syncFromPhysical(assetId, updates, priority);

    console.log(`[PHYSICAL] Updated asset ${assetId}:`, updates);
  }

  // Simulate digital twin sending command
  sendCommandToPhysical(assetId: string, command: Record<string, unknown>, priority: SyncMessage['priority'] = 'normal'): void {
    const state = this.digitalState.get(assetId);
    if (!state) {
      throw new Error(`Asset ${assetId} not registered`);
    }

    // Update local digital state
    Object.assign(state, command);

    // Sync to physical asset
    this.syncEngine.syncToPhysical(assetId, command, priority);

    console.log(`[DIGITAL] Sent command to ${assetId}:`, command);
  }

  getPhysicalState(assetId: string): Record<string, unknown> | undefined {
    return this.physicalState.get(assetId);
  }

  getDigitalState(assetId: string): Record<string, unknown> | undefined {
    return this.digitalState.get(assetId);
  }
}

// ============================================================================
// Examples
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Real-Time Synchronization Examples');
  console.log('='.repeat(70));

  // Example 1: Basic Real-Time Sync
  console.log('\n📊 Example 1: Basic Real-Time Sync (WebSocket)');
  console.log('-'.repeat(50));

  const syncEngine1 = new RealTimeSyncEngine({
    protocol: 'websocket',
    conflictResolution: 'latest_wins',
  });

  syncEngine1.registerTwin('sensor-001', {
    temperature: 20,
    humidity: 50,
    pressure: 1013,
  });

  syncEngine1.start();

  // Simulate sensor updates
  syncEngine1.syncFromPhysical('sensor-001', { temperature: 21.5 }, 'normal');
  syncEngine1.syncFromPhysical('sensor-001', { humidity: 52 }, 'normal');
  syncEngine1.syncFromPhysical('sensor-001', { pressure: 1012 }, 'normal');

  await syncEngine1.processSyncQueue();

  const state1 = syncEngine1.getTwinState('sensor-001');
  console.log('Twin state after sync:', state1);

  const syncState1 = syncEngine1.getSyncState('sensor-001');
  console.log(`Sync status: ${syncState1?.syncStatus}, Latency: ${syncState1?.latency.toFixed(2)}ms`);

  // Example 2: High-Frequency Sync
  console.log('\n📊 Example 2: High-Frequency Sync (100Hz)');
  console.log('-'.repeat(50));

  const syncEngine2 = new RealTimeSyncEngine({
    protocol: 'mqtt',
    qos: 1,
    batchSize: 20,
  });

  syncEngine2.registerTwin('motor-001', {
    rpm: 0,
    current: 0,
    torque: 0,
    temperature: 25,
  });

  syncEngine2.start();

  console.log('Simulating 100 high-frequency updates...');

  // Simulate 100 updates at 100Hz
  for (let i = 0; i < 100; i++) {
    syncEngine2.syncFromPhysical('motor-001', {
      rpm: 1000 + Math.sin(i * 0.1) * 100,
      current: 5 + Math.random() * 2,
      torque: 10 + Math.random() * 3,
      temperature: 25 + i * 0.1,
    }, 'normal');
  }

  // Process in batches
  for (let i = 0; i < 5; i++) {
    await syncEngine2.processSyncQueue();
  }

  const stats2 = syncEngine2.getStats();
  console.log(`Processed ${stats2.totalMessages} messages`);
  console.log(`Success rate: ${((stats2.successfulSyncs / stats2.totalMessages) * 100).toFixed(2)}%`);
  console.log(`Average latency: ${stats2.averageLatency.toFixed(2)}ms`);

  // Example 3: Priority-Based Sync
  console.log('\n📊 Example 3: Priority-Based Sync');
  console.log('-'.repeat(50));

  const syncEngine3 = new RealTimeSyncEngine({
    protocol: 'websocket',
  });

  syncEngine3.registerTwin('safety-system-001', {
    emergencyStop: false,
    alarmActive: false,
    doorOpen: false,
    temperature: 25,
  });

  syncEngine3.start();

  // Normal priority updates
  syncEngine3.syncFromPhysical('safety-system-001', { temperature: 26 }, 'low');
  syncEngine3.syncFromPhysical('safety-system-001', { temperature: 27 }, 'low');

  // Critical alert
  syncEngine3.syncFromPhysical('safety-system-001', { emergencyStop: true, alarmActive: true }, 'critical');

  // More normal updates
  syncEngine3.syncFromPhysical('safety-system-001', { doorOpen: true }, 'normal');

  console.log('Message queue before processing (should process critical first)');
  await syncEngine3.processSyncQueue();

  const state3 = syncEngine3.getTwinState('safety-system-001');
  console.log('Final state:', state3);

  // Example 4: Conflict Resolution
  console.log('\n📊 Example 4: Conflict Resolution');
  console.log('-'.repeat(50));

  const syncEngine4 = new RealTimeSyncEngine({
    protocol: 'websocket',
    conflictResolution: 'latest_wins',
  });

  // Add custom conflict handler for critical properties
  syncEngine4.onConflict((conflict) => {
    console.log(`[CONFLICT] Property '${conflict.property}': physical=${conflict.physicalValue}, digital=${conflict.digitalValue}`);

    // For safety-critical properties, always trust physical
    if (conflict.property.includes('safety') || conflict.property.includes('emergency')) {
      console.log('  Resolution: Physical wins (safety-critical)');
      return 'physical';
    }

    // For setpoints, prefer digital (operator commands)
    if (conflict.property.includes('setpoint') || conflict.property.includes('target')) {
      console.log('  Resolution: Digital wins (operator command)');
      return 'digital';
    }

    // Default: latest timestamp wins
    const resolution = conflict.physicalTimestamp > conflict.digitalTimestamp ? 'physical' : 'digital';
    console.log(`  Resolution: ${resolution} wins (latest timestamp)`);
    return resolution;
  });

  syncEngine4.registerTwin('hvac-001', {
    temperature: 22,
    targetTemperature: 21,
    fanSpeed: 50,
    emergencyShutoff: false,
  });

  syncEngine4.start();

  // Create conflicts
  const twin = syncEngine4.getTwinState('hvac-001');
  twin.targetTemperature = 23; // Digital operator sets target to 23
  twin.targetTemperature_timestamp = new Date();

  // Physical sensor reports different value
  await new Promise(resolve => setTimeout(resolve, 10));
  syncEngine4.syncFromPhysical('hvac-001', { targetTemperature: 20 }, 'normal'); // Physical has 20

  await syncEngine4.processSyncQueue();

  const state4 = syncEngine4.getTwinState('hvac-001');
  console.log(`\nResolved targetTemperature: ${state4.targetTemperature}`);

  const stats4 = syncEngine4.getStats();
  console.log(`Conflicts resolved: ${stats4.conflicts}`);

  // Example 5: Bi-Directional Sync
  console.log('\n📊 Example 5: Bi-Directional Sync');
  console.log('-'.repeat(50));

  const syncEngine5 = new RealTimeSyncEngine({
    protocol: 'mqtt',
    qos: 2, // Exactly once delivery
  });

  const biSync = new BiDirectionalSyncManager(syncEngine5);

  biSync.registerAsset('robot-001', {
    x: 0,
    y: 0,
    z: 0,
    gripper: 'open',
    speed: 0,
  }, {
    x: 0,
    y: 0,
    z: 0,
    gripper: 'open',
    speed: 0,
  });

  syncEngine5.start();

  // Physical robot moves
  console.log('\n[Scenario] Physical robot moving...');
  biSync.updatePhysicalAsset('robot-001', { x: 10, y: 5, speed: 50 }, 'normal');
  await syncEngine5.processSyncQueue();

  // Digital twin sends command
  console.log('\n[Scenario] Digital twin sending command...');
  biSync.sendCommandToPhysical('robot-001', { gripper: 'closed', speed: 30 }, 'high');
  await syncEngine5.processSyncQueue();

  // Physical robot confirms command execution
  console.log('\n[Scenario] Physical robot confirming command...');
  biSync.updatePhysicalAsset('robot-001', { gripper: 'closed', speed: 30 }, 'normal');
  await syncEngine5.processSyncQueue();

  const physicalState = biSync.getPhysicalState('robot-001');
  const digitalState = biSync.getDigitalState('robot-001');

  console.log('\nPhysical state:', physicalState);
  console.log('Digital state:', digitalState);

  const syncState5 = syncEngine5.getSyncState('robot-001');
  console.log(`\nSync status: ${syncState5?.syncStatus}`);
  console.log(`Messages processed: ${syncState5?.messagesProcessed}`);

  // Example 6: Multi-Twin Sync Statistics
  console.log('\n📊 Example 6: Multi-Twin Sync Statistics');
  console.log('-'.repeat(50));

  const syncEngine6 = new RealTimeSyncEngine({
    protocol: 'websocket',
    batchSize: 50,
  });

  // Register multiple twins
  for (let i = 1; i <= 10; i++) {
    syncEngine6.registerTwin(`device-${String(i).padStart(3, '0')}`, {
      status: 'online',
      value: 0,
    });
  }

  syncEngine6.start();

  // Simulate updates from all devices
  for (let i = 1; i <= 10; i++) {
    const deviceId = `device-${String(i).padStart(3, '0')}`;
    for (let j = 0; j < 10; j++) {
      syncEngine6.syncFromPhysical(deviceId, { value: Math.random() * 100 }, 'normal');
    }
  }

  // Process all messages
  while (syncEngine6.getStats().queueDepth > 0) {
    await syncEngine6.processSyncQueue();
  }

  const allStates = syncEngine6.getAllSyncStates();
  console.log(`\nTotal twins synced: ${allStates.length}`);
  console.log('Individual sync states:');
  allStates.forEach(state => {
    console.log(`  ${state.twinId}: ${state.syncStatus}, latency=${state.latency.toFixed(2)}ms, msgs=${state.messagesProcessed}`);
  });

  const stats6 = syncEngine6.getStats();
  console.log(`\nTotal messages: ${stats6.totalMessages}`);
  console.log(`Success rate: ${((stats6.successfulSyncs / stats6.totalMessages) * 100).toFixed(2)}%`);
  console.log(`Average latency: ${stats6.averageLatency.toFixed(2)}ms`);

  console.log('\n' + '='.repeat(70));
  console.log('Real-Time Synchronization examples complete!');
}

// Run examples
main().catch(console.error);
