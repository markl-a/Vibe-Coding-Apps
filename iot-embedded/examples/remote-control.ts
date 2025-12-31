/**
 * Remote Control Example
 * Demonstrates sending commands, device state management, and command acknowledgment
 */

import { EventEmitter } from 'events';

// ===== Type Definitions =====

/**
 * Device command
 */
export interface DeviceCommand {
  commandId: string;
  deviceId: string;
  type: 'set' | 'get' | 'action';
  action: string;
  parameters?: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeout: number; // milliseconds
  retries: number;
  timestamp: number;
}

/**
 * Command acknowledgment
 */
export interface CommandAcknowledgment {
  commandId: string;
  deviceId: string;
  status: 'received' | 'executing' | 'completed' | 'failed' | 'timeout';
  result?: any;
  error?: string;
  executionTime?: number; // milliseconds
  timestamp: number;
}

/**
 * Device state
 */
export interface DeviceState {
  deviceId: string;
  online: boolean;
  lastSeen: number;
  attributes: Record<string, any>;
  capabilities: string[];
  metadata: {
    firmwareVersion: string;
    hardwareRevision: string;
    uptime: number;
  };
}

/**
 * State update
 */
export interface StateUpdate {
  deviceId: string;
  changes: Record<string, any>;
  timestamp: number;
  source: 'device' | 'cloud' | 'user';
}

/**
 * Command queue entry
 */
interface CommandQueueEntry {
  command: DeviceCommand;
  attempts: number;
  nextRetry: number;
  callback?: (ack: CommandAcknowledgment) => void;
}

// ===== Remote Control Service =====

/**
 * Service for remote device control and state management
 */
export class RemoteControlService extends EventEmitter {
  private deviceStates: Map<string, DeviceState> = new Map();
  private commandQueue: Map<string, CommandQueueEntry> = new Map();
  private commandHistory: CommandAcknowledgment[] = [];
  private processingTimer?: NodeJS.Timeout;

  constructor() {
    super();
    this.startCommandProcessor();
  }

  /**
   * Send command to device
   */
  public async sendCommand(
    command: DeviceCommand,
    callback?: (ack: CommandAcknowledgment) => void
  ): Promise<CommandAcknowledgment> {
    console.log(`\nSending command to ${command.deviceId}:`);
    console.log(`  Command ID: ${command.commandId}`);
    console.log(`  Action: ${command.action}`);
    console.log(`  Priority: ${command.priority}`);
    console.log(`  Parameters:`, command.parameters || {});

    // Check if device is online
    const state = this.deviceStates.get(command.deviceId);
    if (!state || !state.online) {
      const ack: CommandAcknowledgment = {
        commandId: command.commandId,
        deviceId: command.deviceId,
        status: 'failed',
        error: 'Device offline',
        timestamp: Date.now(),
      };
      console.error(`  Error: Device ${command.deviceId} is offline`);
      return ack;
    }

    // Add to command queue
    this.commandQueue.set(command.commandId, {
      command,
      attempts: 0,
      nextRetry: Date.now(),
      callback,
    });

    // Emit command sent event
    this.emit('command-sent', command);

    // Return initial acknowledgment
    return {
      commandId: command.commandId,
      deviceId: command.deviceId,
      status: 'received',
      timestamp: Date.now(),
    };
  }

  /**
   * Send batch of commands
   */
  public async sendBatchCommands(
    commands: DeviceCommand[]
  ): Promise<CommandAcknowledgment[]> {
    console.log(`\nSending batch of ${commands.length} commands`);

    const acknowledgments = await Promise.all(
      commands.map((cmd) => this.sendCommand(cmd))
    );

    return acknowledgments;
  }

  /**
   * Process command acknowledgment
   */
  public processAcknowledgment(ack: CommandAcknowledgment): void {
    console.log(`\nReceived acknowledgment for command ${ack.commandId}:`);
    console.log(`  Status: ${ack.status}`);
    if (ack.executionTime) {
      console.log(`  Execution Time: ${ack.executionTime}ms`);
    }
    if (ack.error) {
      console.error(`  Error: ${ack.error}`);
    }

    // Get command from queue
    const entry = this.commandQueue.get(ack.commandId);

    if (entry) {
      // Call callback if provided
      if (entry.callback) {
        entry.callback(ack);
      }

      // Remove from queue if completed or failed
      if (ack.status === 'completed' || ack.status === 'failed' || ack.status === 'timeout') {
        this.commandQueue.delete(ack.commandId);
      }
    }

    // Add to history
    this.commandHistory.push(ack);

    // Emit acknowledgment event
    this.emit('command-acknowledged', ack);

    // Update device state if result contains state changes
    if (ack.result && typeof ack.result === 'object') {
      this.updateDeviceState({
        deviceId: ack.deviceId,
        changes: ack.result,
        timestamp: ack.timestamp,
        source: 'device',
      });
    }
  }

  /**
   * Update device state
   */
  public updateDeviceState(update: StateUpdate): void {
    let state = this.deviceStates.get(update.deviceId);

    if (!state) {
      // Create new state
      state = {
        deviceId: update.deviceId,
        online: true,
        lastSeen: update.timestamp,
        attributes: {},
        capabilities: [],
        metadata: {
          firmwareVersion: 'unknown',
          hardwareRevision: 'unknown',
          uptime: 0,
        },
      };
      this.deviceStates.set(update.deviceId, state);
    }

    // Apply changes
    state.attributes = {
      ...state.attributes,
      ...update.changes,
    };
    state.lastSeen = update.timestamp;

    console.log(`\nDevice state updated for ${update.deviceId}:`);
    console.log(`  Source: ${update.source}`);
    console.log(`  Changes:`, update.changes);

    // Emit state change event
    this.emit('state-changed', update);
  }

  /**
   * Get device state
   */
  public getDeviceState(deviceId: string): DeviceState | undefined {
    return this.deviceStates.get(deviceId);
  }

  /**
   * Register device
   */
  public registerDevice(state: DeviceState): void {
    console.log(`\nRegistering device: ${state.deviceId}`);
    console.log(`  Capabilities: ${state.capabilities.join(', ')}`);
    console.log(`  Firmware: ${state.metadata.firmwareVersion}`);

    this.deviceStates.set(state.deviceId, state);
    this.emit('device-registered', state);
  }

  /**
   * Set device online status
   */
  public setDeviceOnline(deviceId: string, online: boolean): void {
    const state = this.deviceStates.get(deviceId);
    if (state) {
      state.online = online;
      state.lastSeen = Date.now();

      console.log(`Device ${deviceId} is now ${online ? 'online' : 'offline'}`);
      this.emit('device-status-changed', { deviceId, online });
    }
  }

  /**
   * Get command history
   */
  public getCommandHistory(deviceId?: string, limit: number = 10): CommandAcknowledgment[] {
    let history = this.commandHistory;

    if (deviceId) {
      history = history.filter((ack) => ack.deviceId === deviceId);
    }

    return history.slice(-limit);
  }

  /**
   * Cancel command
   */
  public cancelCommand(commandId: string): boolean {
    if (this.commandQueue.has(commandId)) {
      const entry = this.commandQueue.get(commandId)!;

      // Send cancellation acknowledgment
      const ack: CommandAcknowledgment = {
        commandId,
        deviceId: entry.command.deviceId,
        status: 'failed',
        error: 'Command cancelled',
        timestamp: Date.now(),
      };

      this.processAcknowledgment(ack);

      console.log(`Command ${commandId} cancelled`);
      return true;
    }

    return false;
  }

  /**
   * Get pending commands for device
   */
  public getPendingCommands(deviceId: string): DeviceCommand[] {
    const pending: DeviceCommand[] = [];

    for (const entry of this.commandQueue.values()) {
      if (entry.command.deviceId === deviceId) {
        pending.push(entry.command);
      }
    }

    return pending;
  }

  /**
   * Start command processor
   */
  private startCommandProcessor(): void {
    this.processingTimer = setInterval(() => {
      this.processCommandQueue();
    }, 1000);
  }

  /**
   * Process command queue
   */
  private processCommandQueue(): void {
    const now = Date.now();

    for (const [commandId, entry] of this.commandQueue.entries()) {
      // Check for timeout
      const age = now - entry.command.timestamp;
      if (age > entry.command.timeout) {
        const ack: CommandAcknowledgment = {
          commandId,
          deviceId: entry.command.deviceId,
          status: 'timeout',
          error: 'Command timeout',
          timestamp: now,
        };

        this.processAcknowledgment(ack);
        continue;
      }

      // Check if ready for retry
      if (now >= entry.nextRetry && entry.attempts < entry.command.retries) {
        entry.attempts++;
        entry.nextRetry = now + 5000; // Retry after 5 seconds

        console.log(
          `Retrying command ${commandId} (attempt ${entry.attempts}/${entry.command.retries})`
        );

        // Simulate command execution
        this.simulateCommandExecution(entry.command);
      }
    }
  }

  /**
   * Simulate command execution (for testing)
   */
  private async simulateCommandExecution(command: DeviceCommand): Promise<void> {
    await this.sleep(Math.random() * 2000 + 500);

    // Simulate success/failure
    const success = Math.random() > 0.2; // 80% success rate

    const ack: CommandAcknowledgment = {
      commandId: command.commandId,
      deviceId: command.deviceId,
      status: success ? 'completed' : 'failed',
      result: success
        ? {
            acknowledged: true,
            ...command.parameters,
          }
        : undefined,
      error: success ? undefined : 'Execution failed',
      executionTime: Math.floor(Math.random() * 2000 + 500),
      timestamp: Date.now(),
    };

    this.processAcknowledgment(ack);
  }

  /**
   * Stop command processor
   */
  public stop(): void {
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== Example Usage =====

async function main() {
  // Create remote control service
  const remoteControl = new RemoteControlService();

  // Register devices
  const device1: DeviceState = {
    deviceId: 'smart-light-001',
    online: true,
    lastSeen: Date.now(),
    attributes: {
      power: 'off',
      brightness: 0,
      color: { r: 255, g: 255, b: 255 },
    },
    capabilities: ['power', 'brightness', 'color'],
    metadata: {
      firmwareVersion: '2.1.0',
      hardwareRevision: '1.0',
      uptime: 3600000,
    },
  };

  const device2: DeviceState = {
    deviceId: 'smart-thermostat-001',
    online: true,
    lastSeen: Date.now(),
    attributes: {
      mode: 'auto',
      temperature: 22,
      targetTemperature: 22,
      humidity: 45,
    },
    capabilities: ['temperature', 'mode', 'schedule'],
    metadata: {
      firmwareVersion: '3.0.1',
      hardwareRevision: '2.0',
      uptime: 7200000,
    },
  };

  remoteControl.registerDevice(device1);
  remoteControl.registerDevice(device2);

  // Listen to events
  remoteControl.on('command-sent', (cmd) => {
    console.log(`Event: Command sent - ${cmd.commandId}`);
  });

  remoteControl.on('command-acknowledged', (ack) => {
    console.log(`Event: Command acknowledged - ${ack.commandId} (${ack.status})`);
  });

  remoteControl.on('state-changed', (update) => {
    console.log(`Event: State changed - ${update.deviceId}`);
  });

  // Send commands
  console.log('\n=== Sending Remote Commands ===');

  // Turn on smart light
  await remoteControl.sendCommand(
    {
      commandId: 'cmd-001',
      deviceId: 'smart-light-001',
      type: 'set',
      action: 'setPower',
      parameters: { power: 'on' },
      priority: 'normal',
      timeout: 30000,
      retries: 3,
      timestamp: Date.now(),
    },
    (ack) => {
      console.log(`Callback: Light power command ${ack.status}`);
    }
  );

  // Set brightness
  await remoteControl.sendCommand({
    commandId: 'cmd-002',
    deviceId: 'smart-light-001',
    type: 'set',
    action: 'setBrightness',
    parameters: { brightness: 75 },
    priority: 'normal',
    timeout: 30000,
    retries: 3,
    timestamp: Date.now(),
  });

  // Set thermostat temperature
  await remoteControl.sendCommand({
    commandId: 'cmd-003',
    deviceId: 'smart-thermostat-001',
    type: 'set',
    action: 'setTargetTemperature',
    parameters: { temperature: 24 },
    priority: 'high',
    timeout: 30000,
    retries: 3,
    timestamp: Date.now(),
  });

  // Wait for commands to process
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Get device states
  console.log('\n=== Device States ===');
  const lightState = remoteControl.getDeviceState('smart-light-001');
  console.log('Smart Light:', lightState?.attributes);

  const thermostatState = remoteControl.getDeviceState('smart-thermostat-001');
  console.log('Smart Thermostat:', thermostatState?.attributes);

  // Get command history
  console.log('\n=== Command History ===');
  const history = remoteControl.getCommandHistory();
  history.forEach((ack) => {
    console.log(`${ack.commandId}: ${ack.status} (${ack.deviceId})`);
  });

  // Simulate device going offline
  console.log('\n=== Simulating Offline Device ===');
  remoteControl.setDeviceOnline('smart-light-001', false);

  // Try to send command to offline device
  await remoteControl.sendCommand({
    commandId: 'cmd-004',
    deviceId: 'smart-light-001',
    type: 'set',
    action: 'setPower',
    parameters: { power: 'off' },
    priority: 'normal',
    timeout: 30000,
    retries: 3,
    timestamp: Date.now(),
  });

  // Wait a bit then stop
  await new Promise((resolve) => setTimeout(resolve, 3000));
  remoteControl.stop();

  console.log('\n=== Remote Control Service Stopped ===');
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
