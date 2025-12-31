/**
 * MQTT Communication Example
 * Demonstrates publish/subscribe patterns for IoT device communication
 */

import { EventEmitter } from 'events';

// ===== Type Definitions =====

/**
 * MQTT connection options
 */
export interface MQTTConnectionOptions {
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  keepAlive?: number; // seconds
  cleanSession?: boolean;
  reconnectPeriod?: number; // milliseconds
  connectTimeout?: number; // milliseconds
  will?: {
    topic: string;
    payload: string;
    qos: QoS;
    retain: boolean;
  };
  ssl?: {
    ca?: string;
    cert?: string;
    key?: string;
  };
}

/**
 * Quality of Service levels
 */
export enum QoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
  EXACTLY_ONCE = 2,
}

/**
 * MQTT message
 */
export interface MQTTMessage {
  topic: string;
  payload: Buffer | string;
  qos: QoS;
  retain: boolean;
  timestamp: number;
}

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  qos: QoS;
  handler: (message: MQTTMessage) => void | Promise<void>;
}

// ===== MQTT Client Implementation =====

/**
 * MQTT Client for IoT devices
 * Simulates MQTT client behavior (in real implementation, use 'mqtt' package)
 */
export class MQTTClient extends EventEmitter {
  private options: MQTTConnectionOptions;
  private connected: boolean = false;
  private subscriptions: Map<string, SubscriptionOptions> = new Map();
  private messageQueue: MQTTMessage[] = [];
  private reconnectTimer?: NodeJS.Timeout;
  private keepAliveTimer?: NodeJS.Timeout;

  constructor(options: MQTTConnectionOptions) {
    super();
    this.options = {
      keepAlive: 60,
      cleanSession: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      ...options,
    };
  }

  /**
   * Connect to MQTT broker
   */
  public async connect(): Promise<void> {
    console.log(`Connecting to MQTT broker at ${this.options.host}:${this.options.port}...`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.options.connectTimeout);

      // Simulate connection
      setTimeout(() => {
        clearTimeout(timeout);
        this.connected = true;
        this.emit('connect');

        // Send Last Will if configured
        if (this.options.will) {
          console.log('Last Will configured:', this.options.will.topic);
        }

        // Start keep-alive mechanism
        this.startKeepAlive();

        // Process queued messages
        this.processMessageQueue();

        console.log('Connected to MQTT broker');
        resolve();
      }, 1000);
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  public async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    this.stopKeepAlive();
    this.stopReconnect();

    // Simulate disconnection
    await this.sleep(100);

    this.connected = false;
    this.emit('disconnect');
    console.log('Disconnected from MQTT broker');
  }

  /**
   * Publish message to topic
   */
  public async publish(
    topic: string,
    payload: string | Buffer | object,
    options: { qos?: QoS; retain?: boolean } = {}
  ): Promise<void> {
    const message: MQTTMessage = {
      topic,
      payload: typeof payload === 'object' && !(payload instanceof Buffer)
        ? JSON.stringify(payload)
        : payload as string | Buffer,
      qos: options.qos ?? QoS.AT_LEAST_ONCE,
      retain: options.retain ?? false,
      timestamp: Date.now(),
    };

    if (!this.connected) {
      console.log(`Queuing message for ${topic} (not connected)`);
      this.messageQueue.push(message);
      return;
    }

    // Simulate publishing
    await this.sleep(10);

    console.log(`Published to ${topic}: ${typeof message.payload === 'string' ? message.payload.substring(0, 50) : `<Buffer ${message.payload.length} bytes>`}`);

    this.emit('published', message);
  }

  /**
   * Subscribe to topic
   */
  public async subscribe(
    topic: string,
    options: { qos?: QoS } = {},
    handler: (message: MQTTMessage) => void | Promise<void>
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Cannot subscribe: not connected');
    }

    const subOptions: SubscriptionOptions = {
      qos: options.qos ?? QoS.AT_LEAST_ONCE,
      handler,
    };

    this.subscriptions.set(topic, subOptions);

    // Simulate subscription
    await this.sleep(10);

    console.log(`Subscribed to ${topic} (QoS ${subOptions.qos})`);
    this.emit('subscribed', { topic, qos: subOptions.qos });
  }

  /**
   * Unsubscribe from topic
   */
  public async unsubscribe(topic: string): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      return;
    }

    this.subscriptions.delete(topic);

    // Simulate unsubscription
    await this.sleep(10);

    console.log(`Unsubscribed from ${topic}`);
    this.emit('unsubscribed', topic);
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Start keep-alive mechanism
   */
  private startKeepAlive(): void {
    if (!this.options.keepAlive) {
      return;
    }

    this.keepAliveTimer = setInterval(() => {
      if (this.connected) {
        // Send PINGREQ
        this.emit('ping');
      }
    }, this.options.keepAlive * 1000);
  }

  /**
   * Stop keep-alive mechanism
   */
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = undefined;
    }
  }

  /**
   * Start reconnection attempts
   */
  private startReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setInterval(() => {
      if (!this.connected) {
        console.log('Attempting to reconnect...');
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error.message);
        });
      } else {
        this.stopReconnect();
      }
    }, this.options.reconnectPeriod);
  }

  /**
   * Stop reconnection attempts
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * Process queued messages
   */
  private async processMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.publish(message.topic, message.payload, {
          qos: message.qos,
          retain: message.retain,
        });
      }
    }
  }

  /**
   * Simulate receiving message (for testing)
   */
  public simulateMessage(topic: string, payload: string | object): void {
    const message: MQTTMessage = {
      topic,
      payload: typeof payload === 'object' ? JSON.stringify(payload) : payload,
      qos: QoS.AT_LEAST_ONCE,
      retain: false,
      timestamp: Date.now(),
    };

    // Find matching subscriptions (support wildcards)
    for (const [subTopic, options] of this.subscriptions.entries()) {
      if (this.topicMatches(subTopic, topic)) {
        options.handler(message);
      }
    }

    this.emit('message', message);
  }

  /**
   * Check if topic matches subscription pattern
   */
  private topicMatches(pattern: string, topic: string): boolean {
    // Convert MQTT wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\+/g, '[^/]+')  // Single-level wildcard
      .replace(/#/g, '.*');      // Multi-level wildcard

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(topic);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== IoT Device with MQTT =====

/**
 * IoT Device that communicates via MQTT
 */
export class IoTDevice {
  private client: MQTTClient;
  private deviceId: string;
  private deviceType: string;
  private topicPrefix: string;

  constructor(deviceId: string, deviceType: string, client: MQTTClient) {
    this.deviceId = deviceId;
    this.deviceType = deviceType;
    this.client = client;
    this.topicPrefix = `devices/${deviceType}/${deviceId}`;
  }

  /**
   * Initialize device and set up MQTT subscriptions
   */
  public async initialize(): Promise<void> {
    // Connect to broker
    await this.client.connect();

    // Subscribe to command topic
    await this.client.subscribe(
      `${this.topicPrefix}/commands/#`,
      { qos: QoS.AT_LEAST_ONCE },
      this.handleCommand.bind(this)
    );

    // Subscribe to configuration updates
    await this.client.subscribe(
      `${this.topicPrefix}/config`,
      { qos: QoS.EXACTLY_ONCE },
      this.handleConfig.bind(this)
    );

    // Publish online status
    await this.publishStatus('online');

    console.log(`IoT Device ${this.deviceId} initialized`);
  }

  /**
   * Publish telemetry data
   */
  public async publishTelemetry(data: Record<string, any>): Promise<void> {
    const payload = {
      deviceId: this.deviceId,
      timestamp: Date.now(),
      data,
    };

    await this.client.publish(
      `${this.topicPrefix}/telemetry`,
      payload,
      { qos: QoS.AT_LEAST_ONCE }
    );
  }

  /**
   * Publish sensor readings
   */
  public async publishSensorData(sensorType: string, value: number, unit: string): Promise<void> {
    const payload = {
      deviceId: this.deviceId,
      sensor: sensorType,
      value,
      unit,
      timestamp: Date.now(),
    };

    await this.client.publish(
      `${this.topicPrefix}/sensors/${sensorType}`,
      payload,
      { qos: QoS.AT_LEAST_ONCE }
    );
  }

  /**
   * Publish device status
   */
  public async publishStatus(status: string, metadata?: Record<string, any>): Promise<void> {
    const payload = {
      deviceId: this.deviceId,
      status,
      timestamp: Date.now(),
      ...metadata,
    };

    await this.client.publish(
      `${this.topicPrefix}/status`,
      payload,
      { qos: QoS.AT_LEAST_ONCE, retain: true }
    );
  }

  /**
   * Publish alert
   */
  public async publishAlert(level: 'info' | 'warning' | 'error' | 'critical', message: string): Promise<void> {
    const payload = {
      deviceId: this.deviceId,
      level,
      message,
      timestamp: Date.now(),
    };

    await this.client.publish(
      `${this.topicPrefix}/alerts`,
      payload,
      { qos: QoS.EXACTLY_ONCE }
    );
  }

  /**
   * Handle incoming commands
   */
  private async handleCommand(message: MQTTMessage): Promise<void> {
    try {
      const payload = JSON.parse(message.payload.toString());
      console.log(`Received command:`, payload);

      // Extract command from topic
      const commandType = message.topic.split('/').pop();

      // Process different command types
      switch (commandType) {
        case 'restart':
          await this.handleRestart();
          break;
        case 'update':
          await this.handleUpdate(payload);
          break;
        case 'configure':
          await this.handleConfigure(payload);
          break;
        default:
          console.log(`Unknown command: ${commandType}`);
      }
    } catch (error) {
      console.error('Failed to process command:', error);
      await this.publishAlert('error', `Failed to process command: ${(error as Error).message}`);
    }
  }

  /**
   * Handle configuration updates
   */
  private async handleConfig(message: MQTTMessage): Promise<void> {
    try {
      const config = JSON.parse(message.payload.toString());
      console.log(`Received configuration update:`, config);

      // Apply configuration
      // ... implementation

      await this.publishStatus('configured', { config });
    } catch (error) {
      console.error('Failed to apply configuration:', error);
      await this.publishAlert('error', `Failed to apply configuration: ${(error as Error).message}`);
    }
  }

  /**
   * Handle restart command
   */
  private async handleRestart(): Promise<void> {
    console.log('Restarting device...');
    await this.publishStatus('restarting');

    // Simulate restart
    await this.sleep(2000);

    await this.publishStatus('online');
  }

  /**
   * Handle update command
   */
  private async handleUpdate(payload: any): Promise<void> {
    console.log('Updating device firmware...');
    await this.publishStatus('updating', { version: payload.version });

    // Simulate update
    await this.sleep(5000);

    await this.publishStatus('online', { version: payload.version });
  }

  /**
   * Handle configure command
   */
  private async handleConfigure(payload: any): Promise<void> {
    console.log('Configuring device...');
    await this.publishStatus('configuring');

    // Simulate configuration
    await this.sleep(1000);

    await this.publishStatus('online');
  }

  /**
   * Shutdown device gracefully
   */
  public async shutdown(): Promise<void> {
    await this.publishStatus('offline');
    await this.client.disconnect();
    console.log(`IoT Device ${this.deviceId} shut down`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== Example Usage =====

async function main() {
  // Create MQTT client with Last Will
  const client = new MQTTClient({
    host: 'mqtt.example.com',
    port: 1883,
    clientId: 'smart-sensor-001',
    username: 'iot-device',
    password: 'secret',
    cleanSession: true,
    keepAlive: 60,
    will: {
      topic: 'devices/sensor/smart-sensor-001/status',
      payload: JSON.stringify({
        deviceId: 'smart-sensor-001',
        status: 'offline',
        timestamp: Date.now(),
      }),
      qos: QoS.AT_LEAST_ONCE,
      retain: true,
    },
  });

  // Create IoT device
  const device = new IoTDevice('smart-sensor-001', 'sensor', client);

  // Initialize device
  await device.initialize();

  // Simulate sending telemetry data every 5 seconds
  const telemetryInterval = setInterval(async () => {
    await device.publishTelemetry({
      battery: 85 + Math.random() * 10,
      signal: -50 + Math.random() * 20,
      uptime: Math.floor(Math.random() * 86400),
    });
  }, 5000);

  // Simulate sending sensor data every 10 seconds
  const sensorInterval = setInterval(async () => {
    await device.publishSensorData('temperature', 20 + Math.random() * 10, '°C');
    await device.publishSensorData('humidity', 40 + Math.random() * 40, '%');
  }, 10000);

  // Simulate receiving commands
  setTimeout(() => {
    client.simulateMessage('devices/sensor/smart-sensor-001/commands/configure', {
      samplingRate: 1,
      threshold: 30,
    });
  }, 15000);

  setTimeout(() => {
    client.simulateMessage('devices/sensor/smart-sensor-001/commands/restart', {});
  }, 25000);

  // Run for 60 seconds then shutdown
  setTimeout(async () => {
    clearInterval(telemetryInterval);
    clearInterval(sensorInterval);

    await device.shutdown();
  }, 60000);
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
