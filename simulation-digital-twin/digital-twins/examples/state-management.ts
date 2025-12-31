/**
 * State Management Examples
 *
 * Demonstrates advanced state management for digital twins including
 * state snapshots, versioning, rollback, and distributed state synchronization.
 */

// ============================================================================
// Core State Management Types
// ============================================================================

interface StateVersion {
  version: number;
  timestamp: Date;
  description: string;
  author?: string;
  tags?: string[];
}

interface StateSnapshot<T = any> {
  id: string;
  twinId: string;
  version: StateVersion;
  state: T;
  checksum: string;
  parentSnapshotId?: string;
}

interface StateDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
}

interface StateTransition {
  id: string;
  fromState: string;
  toState: string;
  timestamp: Date;
  trigger: string;
  valid: boolean;
  metadata?: Record<string, unknown>;
}

interface StateValidationRule {
  field: string;
  validator: (value: unknown, state: any) => boolean;
  errorMessage: string;
}

interface StateQuery {
  twinId?: string;
  fromTime?: Date;
  toTime?: Date;
  version?: number;
  tags?: string[];
  limit?: number;
}

// ============================================================================
// State Manager
// ============================================================================

class StateManager<T extends Record<string, any>> {
  private twinId: string;
  private currentState: T;
  private snapshots: StateSnapshot<T>[] = [];
  private transitions: StateTransition[] = [];
  private validationRules: StateValidationRule[] = [];
  private changeListeners: Array<(oldState: T, newState: T, diff: StateDiff[]) => void> = [];
  private versionCounter = 0;
  private maxSnapshots = 100;

  constructor(twinId: string, initialState: T) {
    this.twinId = twinId;
    this.currentState = { ...initialState };

    // Create initial snapshot
    this.createSnapshot('Initial state', 'system');
  }

  // Get current state
  getState(): T {
    return { ...this.currentState };
  }

  // Update state
  setState(updates: Partial<T>, description: string = 'State update', author?: string): boolean {
    const oldState = { ...this.currentState };
    const newState = { ...this.currentState, ...updates };

    // Validate new state
    const validationErrors = this.validateState(newState);
    if (validationErrors.length > 0) {
      console.error('[STATE] Validation failed:', validationErrors);
      return false;
    }

    // Calculate diff
    const diff = this.calculateDiff(oldState, newState);

    // Update state
    this.currentState = newState;

    // Notify listeners
    this.notifyListeners(oldState, newState, diff);

    // Create snapshot
    this.createSnapshot(description, author);

    console.log(`[STATE] Updated ${this.twinId}: ${diff.length} changes`);

    return true;
  }

  // Batch update
  batchUpdate(updates: Array<{ field: keyof T; value: any }>, description: string = 'Batch update'): boolean {
    const changes: Partial<T> = {};
    updates.forEach(({ field, value }) => {
      changes[field] = value;
    });

    return this.setState(changes, description);
  }

  // Create snapshot
  createSnapshot(description: string, author?: string, tags?: string[]): StateSnapshot<T> {
    this.versionCounter++;

    const snapshot: StateSnapshot<T> = {
      id: `${this.twinId}-v${this.versionCounter}`,
      twinId: this.twinId,
      version: {
        version: this.versionCounter,
        timestamp: new Date(),
        description,
        author,
        tags,
      },
      state: { ...this.currentState },
      checksum: this.calculateChecksum(this.currentState),
      parentSnapshotId: this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1].id : undefined,
    };

    this.snapshots.push(snapshot);

    // Limit snapshot history
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  // Get snapshot by version
  getSnapshot(version: number): StateSnapshot<T> | undefined {
    return this.snapshots.find(s => s.version.version === version);
  }

  // Get all snapshots
  getSnapshots(query?: StateQuery): StateSnapshot<T>[] {
    let results = [...this.snapshots];

    if (query) {
      if (query.fromTime) {
        results = results.filter(s => s.version.timestamp >= query.fromTime!);
      }
      if (query.toTime) {
        results = results.filter(s => s.version.timestamp <= query.toTime!);
      }
      if (query.version !== undefined) {
        results = results.filter(s => s.version.version === query.version);
      }
      if (query.tags && query.tags.length > 0) {
        results = results.filter(s =>
          query.tags!.some(tag => s.version.tags?.includes(tag))
        );
      }
      if (query.limit) {
        results = results.slice(-query.limit);
      }
    }

    return results;
  }

  // Rollback to previous version
  rollback(version: number): boolean {
    const snapshot = this.getSnapshot(version);
    if (!snapshot) {
      console.error(`[STATE] Snapshot version ${version} not found`);
      return false;
    }

    const oldState = { ...this.currentState };
    this.currentState = { ...snapshot.state };

    const diff = this.calculateDiff(oldState, this.currentState);
    this.notifyListeners(oldState, this.currentState, diff);

    this.createSnapshot(`Rolled back to version ${version}`, 'system', ['rollback']);

    console.log(`[STATE] Rolled back to version ${version}`);

    return true;
  }

  // Compare two states
  compare(version1: number, version2: number): StateDiff[] {
    const snap1 = this.getSnapshot(version1);
    const snap2 = this.getSnapshot(version2);

    if (!snap1 || !snap2) {
      return [];
    }

    return this.calculateDiff(snap1.state, snap2.state);
  }

  // Calculate diff between states
  private calculateDiff(oldState: T, newState: T): StateDiff[] {
    const diff: StateDiff[] = [];
    const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);

    for (const key of allKeys) {
      if (oldState[key] !== newState[key]) {
        diff.push({
          field: key,
          oldValue: oldState[key],
          newValue: newState[key],
          timestamp: new Date(),
        });
      }
    }

    return diff;
  }

  // Calculate checksum
  private calculateChecksum(state: T): string {
    // Simple checksum (in production, use a proper hash function)
    const str = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Add validation rule
  addValidationRule(rule: StateValidationRule): void {
    this.validationRules.push(rule);
  }

  // Validate state
  private validateState(state: T): string[] {
    const errors: string[] = [];

    for (const rule of this.validationRules) {
      const value = state[rule.field];
      if (!rule.validator(value, state)) {
        errors.push(`${rule.field}: ${rule.errorMessage}`);
      }
    }

    return errors;
  }

  // Subscribe to state changes
  onChange(callback: (oldState: T, newState: T, diff: StateDiff[]) => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(oldState: T, newState: T, diff: StateDiff[]): void {
    this.changeListeners.forEach(cb => cb(oldState, newState, diff));
  }

  // Record state transition
  recordTransition(fromState: string, toState: string, trigger: string, metadata?: Record<string, unknown>): void {
    const transition: StateTransition = {
      id: `${this.twinId}-transition-${this.transitions.length}`,
      fromState,
      toState,
      timestamp: new Date(),
      trigger,
      valid: true,
      metadata,
    };

    this.transitions.push(transition);
    console.log(`[STATE] Transition: ${fromState} → ${toState} (${trigger})`);
  }

  getTransitionHistory(): StateTransition[] {
    return [...this.transitions];
  }

  // Export state history
  exportHistory(): {
    twinId: string;
    currentVersion: number;
    snapshots: StateSnapshot<T>[];
    transitions: StateTransition[];
  } {
    return {
      twinId: this.twinId,
      currentVersion: this.versionCounter,
      snapshots: this.snapshots,
      transitions: this.transitions,
    };
  }

  // Import state history
  importHistory(data: {
    snapshots: StateSnapshot<T>[];
    transitions: StateTransition[];
  }): void {
    this.snapshots = data.snapshots;
    this.transitions = data.transitions;

    if (this.snapshots.length > 0) {
      const latest = this.snapshots[this.snapshots.length - 1];
      this.currentState = { ...latest.state };
      this.versionCounter = latest.version.version;
    }

    console.log(`[STATE] Imported history: ${this.snapshots.length} snapshots, ${this.transitions.length} transitions`);
  }
}

// ============================================================================
// Distributed State Manager
// ============================================================================

class DistributedStateManager<T extends Record<string, any>> {
  private localState: StateManager<T>;
  private remoteStates = new Map<string, StateManager<T>>();
  private syncInterval: number;
  private conflictResolver: (local: T, remote: T) => T;

  constructor(
    twinId: string,
    initialState: T,
    syncInterval: number = 5000,
    conflictResolver?: (local: T, remote: T) => T
  ) {
    this.localState = new StateManager(twinId, initialState);
    this.syncInterval = syncInterval;
    this.conflictResolver = conflictResolver || this.defaultConflictResolver;
  }

  private defaultConflictResolver(local: T, remote: T): T {
    // Default: merge, preferring local values
    return { ...remote, ...local };
  }

  // Add remote state source
  addRemoteState(nodeId: string, state: StateManager<T>): void {
    this.remoteStates.set(nodeId, state);
    console.log(`[DISTRIBUTED] Added remote node: ${nodeId}`);
  }

  // Sync with remote states
  async sync(): Promise<void> {
    for (const [nodeId, remoteState] of this.remoteStates.entries()) {
      const localSnapshot = this.localState.getSnapshot(this.localState['versionCounter']);
      const remoteSnapshot = remoteState.getSnapshot(remoteState['versionCounter']);

      if (!localSnapshot || !remoteSnapshot) continue;

      // Check if states differ
      if (localSnapshot.checksum !== remoteSnapshot.checksum) {
        console.log(`[DISTRIBUTED] Conflict detected with ${nodeId}`);

        // Resolve conflict
        const resolvedState = this.conflictResolver(
          localSnapshot.state,
          remoteSnapshot.state
        );

        this.localState.setState(resolvedState, `Synced with ${nodeId}`, 'sync');
      }
    }
  }

  getLocalState(): StateManager<T> {
    return this.localState;
  }

  // Start automatic sync
  startSync(): NodeJS.Timeout {
    return setInterval(() => this.sync(), this.syncInterval);
  }
}

// ============================================================================
// State Machine
// ============================================================================

class StateMachine {
  private currentState: string;
  private states = new Map<string, {
    onEnter?: () => void;
    onExit?: () => void;
    transitions: Map<string, { to: string; condition?: () => boolean }>;
  }>();
  private history: Array<{ from: string; to: string; timestamp: Date }> = [];

  constructor(initialState: string) {
    this.currentState = initialState;
  }

  // Define a state
  defineState(
    name: string,
    config: {
      onEnter?: () => void;
      onExit?: () => void;
    } = {}
  ): void {
    this.states.set(name, {
      ...config,
      transitions: new Map(),
    });
  }

  // Define a transition
  defineTransition(from: string, trigger: string, to: string, condition?: () => boolean): void {
    const state = this.states.get(from);
    if (!state) {
      throw new Error(`State ${from} not defined`);
    }

    state.transitions.set(trigger, { to, condition });
  }

  // Trigger transition
  trigger(event: string): boolean {
    const currentStateConfig = this.states.get(this.currentState);
    if (!currentStateConfig) {
      return false;
    }

    const transition = currentStateConfig.transitions.get(event);
    if (!transition) {
      console.warn(`[STATE_MACHINE] No transition for '${event}' from '${this.currentState}'`);
      return false;
    }

    // Check condition if present
    if (transition.condition && !transition.condition()) {
      console.warn(`[STATE_MACHINE] Transition condition not met for '${event}'`);
      return false;
    }

    // Execute exit callback
    if (currentStateConfig.onExit) {
      currentStateConfig.onExit();
    }

    const previousState = this.currentState;
    this.currentState = transition.to;

    // Execute enter callback
    const newStateConfig = this.states.get(this.currentState);
    if (newStateConfig?.onEnter) {
      newStateConfig.onEnter();
    }

    // Record transition
    this.history.push({
      from: previousState,
      to: this.currentState,
      timestamp: new Date(),
    });

    console.log(`[STATE_MACHINE] ${previousState} --[${event}]--> ${this.currentState}`);

    return true;
  }

  getCurrentState(): string {
    return this.currentState;
  }

  getHistory(): Array<{ from: string; to: string; timestamp: Date }> {
    return [...this.history];
  }

  canTransition(event: string): boolean {
    const state = this.states.get(this.currentState);
    if (!state) return false;

    const transition = state.transitions.get(event);
    if (!transition) return false;

    return !transition.condition || transition.condition();
  }
}

// ============================================================================
// Examples
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('State Management Examples');
  console.log('='.repeat(70));

  // Example 1: Basic State Management
  console.log('\n📊 Example 1: Basic State Management');
  console.log('-'.repeat(50));

  interface RobotState {
    position: { x: number; y: number; z: number };
    battery: number;
    status: 'idle' | 'moving' | 'working' | 'charging';
    taskQueue: string[];
  }

  const robotState = new StateManager<RobotState>('robot-001', {
    position: { x: 0, y: 0, z: 0 },
    battery: 100,
    status: 'idle',
    taskQueue: [],
  });

  // Subscribe to changes
  robotState.onChange((oldState, newState, diff) => {
    console.log(`[CHANGE] ${diff.length} field(s) changed:`);
    diff.forEach(d => {
      console.log(`  ${d.field}: ${JSON.stringify(d.oldValue)} → ${JSON.stringify(d.newValue)}`);
    });
  });

  // Make some updates
  robotState.setState({ position: { x: 10, y: 5, z: 0 } }, 'Moved to station A');
  robotState.setState({ status: 'working', battery: 95 }, 'Started task');
  robotState.setState({ battery: 90, taskQueue: ['task-1', 'task-2'] }, 'Battery drain');

  console.log('\nCurrent state:', robotState.getState());
  console.log(`State version: ${robotState['versionCounter']}`);

  // Example 2: State Snapshots and Rollback
  console.log('\n📊 Example 2: State Snapshots and Rollback');
  console.log('-'.repeat(50));

  interface FactoryState {
    temperature: number;
    pressure: number;
    production_rate: number;
    alarm: boolean;
  }

  const factoryState = new StateManager<FactoryState>('factory-001', {
    temperature: 20,
    pressure: 1.0,
    production_rate: 100,
    alarm: false,
  });

  // Normal operation
  factoryState.setState({ temperature: 25, production_rate: 110 }, 'Ramp up');
  factoryState.setState({ temperature: 30, production_rate: 120 }, 'Full production');

  // Create tagged snapshot
  factoryState.createSnapshot('Optimal settings', 'operator-1', ['optimal', 'production']);

  // Continue operation
  factoryState.setState({ temperature: 35, production_rate: 125 }, 'Peak production');

  // Alert condition
  factoryState.setState({ temperature: 95, pressure: 2.5, alarm: true }, 'ALERT: Overheat');

  console.log('Current state (ALERT):', factoryState.getState());

  // Rollback to safe state
  const optimalSnapshot = factoryState.getSnapshots({ tags: ['optimal'] })[0];
  console.log(`\nRolling back to optimal settings (version ${optimalSnapshot.version.version})...`);
  factoryState.rollback(optimalSnapshot.version.version);

  console.log('State after rollback:', factoryState.getState());

  // Example 3: State Validation
  console.log('\n📊 Example 3: State Validation');
  console.log('-'.repeat(50));

  interface TankState {
    level: number;
    temperature: number;
    pressure: number;
  }

  const tankState = new StateManager<TankState>('tank-001', {
    level: 50,
    temperature: 20,
    pressure: 1.0,
  });

  // Add validation rules
  tankState.addValidationRule({
    field: 'level',
    validator: (value) => typeof value === 'number' && value >= 0 && value <= 100,
    errorMessage: 'Level must be between 0 and 100',
  });

  tankState.addValidationRule({
    field: 'temperature',
    validator: (value) => typeof value === 'number' && value >= -40 && value <= 150,
    errorMessage: 'Temperature must be between -40 and 150°C',
  });

  tankState.addValidationRule({
    field: 'pressure',
    validator: (value) => typeof value === 'number' && value >= 0 && value <= 10,
    errorMessage: 'Pressure must be between 0 and 10 bar',
  });

  // Valid update
  console.log('Valid update:');
  const success1 = tankState.setState({ level: 75, temperature: 25 }, 'Normal fill');
  console.log(`  Result: ${success1 ? 'SUCCESS' : 'FAILED'}`);

  // Invalid update (level out of range)
  console.log('\nInvalid update (level > 100):');
  const success2 = tankState.setState({ level: 150 }, 'Overfill attempt');
  console.log(`  Result: ${success2 ? 'SUCCESS' : 'FAILED'}`);

  console.log('\nFinal state:', tankState.getState());

  // Example 4: State Comparison
  console.log('\n📊 Example 4: State Comparison');
  console.log('-'.repeat(50));

  interface VehicleState {
    speed: number;
    fuel: number;
    odometer: number;
    location: string;
  }

  const vehicleState = new StateManager<VehicleState>('vehicle-001', {
    speed: 0,
    fuel: 100,
    odometer: 0,
    location: 'depot',
  });

  vehicleState.setState({ speed: 50, fuel: 95, location: 'route-a' }, 'Started journey');
  vehicleState.setState({ speed: 60, fuel: 85, odometer: 50, location: 'route-a' }, 'En route');
  vehicleState.setState({ speed: 55, fuel: 70, odometer: 120, location: 'route-b' }, 'Changed route');
  vehicleState.setState({ speed: 0, fuel: 50, odometer: 200, location: 'destination' }, 'Arrived');

  // Compare different versions
  console.log('Comparing state at start (v1) vs end (v5):');
  const diff = vehicleState.compare(1, 5);
  diff.forEach(d => {
    console.log(`  ${d.field}: ${d.oldValue} → ${d.newValue}`);
  });

  // Example 5: State Machine
  console.log('\n📊 Example 5: State Machine for Equipment Lifecycle');
  console.log('-'.repeat(50));

  const equipmentFSM = new StateMachine('offline');

  // Define states
  equipmentFSM.defineState('offline', {
    onEnter: () => console.log('  [FSM] Entered OFFLINE state'),
  });

  equipmentFSM.defineState('starting', {
    onEnter: () => console.log('  [FSM] Entered STARTING state'),
  });

  equipmentFSM.defineState('ready', {
    onEnter: () => console.log('  [FSM] Entered READY state'),
  });

  equipmentFSM.defineState('running', {
    onEnter: () => console.log('  [FSM] Entered RUNNING state'),
    onExit: () => console.log('  [FSM] Exited RUNNING state'),
  });

  equipmentFSM.defineState('maintenance', {
    onEnter: () => console.log('  [FSM] Entered MAINTENANCE state'),
  });

  equipmentFSM.defineState('error', {
    onEnter: () => console.log('  [FSM] Entered ERROR state'),
  });

  // Define transitions
  equipmentFSM.defineTransition('offline', 'power_on', 'starting');
  equipmentFSM.defineTransition('starting', 'startup_complete', 'ready');
  equipmentFSM.defineTransition('ready', 'start_operation', 'running');
  equipmentFSM.defineTransition('running', 'stop_operation', 'ready');
  equipmentFSM.defineTransition('running', 'error_detected', 'error');
  equipmentFSM.defineTransition('ready', 'schedule_maintenance', 'maintenance');
  equipmentFSM.defineTransition('error', 'reset', 'offline');
  equipmentFSM.defineTransition('maintenance', 'complete', 'offline');

  // Execute state transitions
  console.log('\nExecuting state transitions:');
  equipmentFSM.trigger('power_on');
  equipmentFSM.trigger('startup_complete');
  equipmentFSM.trigger('start_operation');
  equipmentFSM.trigger('stop_operation');
  equipmentFSM.trigger('schedule_maintenance');
  equipmentFSM.trigger('complete');

  console.log(`\nFinal state: ${equipmentFSM.getCurrentState()}`);
  console.log(`\nTransition history (${equipmentFSM.getHistory().length} transitions):`);
  equipmentFSM.getHistory().forEach(h => {
    console.log(`  ${h.from} → ${h.to}`);
  });

  // Example 6: Distributed State Management
  console.log('\n📊 Example 6: Distributed State Management');
  console.log('-'.repeat(50));

  interface SensorNetworkState {
    node_id: string;
    temperature: number;
    humidity: number;
    last_update: number;
  }

  // Create distributed state manager for node 1
  const node1 = new DistributedStateManager<SensorNetworkState>(
    'sensor-node-1',
    { node_id: 'node-1', temperature: 22, humidity: 50, last_update: Date.now() },
    1000
  );

  // Create node 2 and 3 as remote nodes
  const node2State = new StateManager<SensorNetworkState>('sensor-node-2', {
    node_id: 'node-2',
    temperature: 23,
    humidity: 52,
    last_update: Date.now(),
  });

  const node3State = new StateManager<SensorNetworkState>('sensor-node-3', {
    node_id: 'node-3',
    temperature: 21,
    humidity: 48,
    last_update: Date.now(),
  });

  node1.addRemoteState('node-2', node2State);
  node1.addRemoteState('node-3', node3State);

  console.log('Initial states:');
  console.log('  Node 1:', node1.getLocalState().getState());
  console.log('  Node 2:', node2State.getState());
  console.log('  Node 3:', node3State.getState());

  // Simulate some updates
  node1.getLocalState().setState({ temperature: 24, last_update: Date.now() }, 'Sensor reading');
  node2State.setState({ temperature: 25, humidity: 55, last_update: Date.now() }, 'Sensor reading');

  console.log('\nAfter updates:');
  console.log('  Node 1:', node1.getLocalState().getState());
  console.log('  Node 2:', node2State.getState());

  // Example 7: State History Export/Import
  console.log('\n📊 Example 7: State History Export/Import');
  console.log('-'.repeat(50));

  const source = new StateManager('asset-source', {
    value: 0,
    status: 'ok',
  });

  // Create some history
  for (let i = 1; i <= 5; i++) {
    source.setState({ value: i * 10 }, `Update ${i}`);
  }

  console.log(`Source state version: ${source['versionCounter']}`);
  console.log(`Source snapshots: ${source.getSnapshots().length}`);

  // Export history
  const exported = source.exportHistory();

  // Create new state manager and import
  const destination = new StateManager('asset-destination', {
    value: 0,
    status: 'unknown',
  });

  destination.importHistory(exported);

  console.log(`\nDestination state version: ${destination['versionCounter']}`);
  console.log(`Destination snapshots: ${destination.getSnapshots().length}`);
  console.log(`Destination current state:`, destination.getState());

  console.log('\n' + '='.repeat(70));
  console.log('State Management examples complete!');
  console.log('\nKey Features Demonstrated:');
  console.log('  - State versioning and snapshots with metadata');
  console.log('  - Rollback to previous states for recovery');
  console.log('  - Validation rules to ensure state integrity');
  console.log('  - State comparison and diff calculation');
  console.log('  - Finite state machine for lifecycle management');
  console.log('  - Distributed state synchronization');
  console.log('  - State history export/import for backup and migration');
}

// Run examples
main().catch(console.error);
