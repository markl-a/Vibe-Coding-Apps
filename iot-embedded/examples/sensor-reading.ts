/**
 * IoT Sensor Reading Example
 * Demonstrates reading data from various sensors with proper error handling and calibration
 */

import { EventEmitter } from 'events';

// ===== Type Definitions =====

/**
 * Sensor data reading interface
 */
export interface SensorReading {
  timestamp: number;
  sensorId: string;
  sensorType: SensorType;
  value: number;
  unit: string;
  quality: 'good' | 'fair' | 'poor';
  metadata?: Record<string, any>;
}

/**
 * Supported sensor types
 */
export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  LIGHT = 'light',
  MOTION = 'motion',
  AIR_QUALITY = 'air_quality',
  SOIL_MOISTURE = 'soil_moisture',
  WATER_LEVEL = 'water_level',
  VIBRATION = 'vibration',
  SOUND = 'sound',
}

/**
 * Sensor configuration
 */
export interface SensorConfig {
  id: string;
  type: SensorType;
  pin?: number;
  address?: number;
  samplingRate: number; // Hz
  calibration?: CalibrationConfig;
  thresholds?: {
    min?: number;
    max?: number;
    critical?: number;
  };
}

/**
 * Calibration configuration
 */
export interface CalibrationConfig {
  offset: number;
  scale: number;
  polynomial?: number[]; // Coefficients for polynomial calibration
}

// ===== Base Sensor Class =====

/**
 * Abstract base class for all sensors
 */
export abstract class Sensor extends EventEmitter {
  protected config: SensorConfig;
  protected isReading: boolean = false;
  protected lastReading?: SensorReading;
  protected readingInterval?: NodeJS.Timeout;

  constructor(config: SensorConfig) {
    super();
    this.config = config;
  }

  /**
   * Initialize the sensor
   */
  abstract initialize(): Promise<void>;

  /**
   * Read raw value from sensor
   */
  protected abstract readRaw(): Promise<number>;

  /**
   * Get the unit for this sensor type
   */
  protected abstract getUnit(): string;

  /**
   * Start continuous reading
   */
  public async startReading(): Promise<void> {
    if (this.isReading) {
      throw new Error('Sensor is already reading');
    }

    await this.initialize();
    this.isReading = true;

    const intervalMs = 1000 / this.config.samplingRate;

    this.readingInterval = setInterval(async () => {
      try {
        const reading = await this.read();
        this.lastReading = reading;
        this.emit('reading', reading);

        // Check thresholds
        this.checkThresholds(reading);
      } catch (error) {
        this.emit('error', error);
      }
    }, intervalMs);

    this.emit('started');
  }

  /**
   * Stop continuous reading
   */
  public stopReading(): void {
    if (this.readingInterval) {
      clearInterval(this.readingInterval);
      this.readingInterval = undefined;
    }
    this.isReading = false;
    this.emit('stopped');
  }

  /**
   * Read single value from sensor
   */
  public async read(): Promise<SensorReading> {
    const rawValue = await this.readRaw();
    const calibratedValue = this.calibrate(rawValue);
    const quality = this.assessQuality(calibratedValue);

    return {
      timestamp: Date.now(),
      sensorId: this.config.id,
      sensorType: this.config.type,
      value: calibratedValue,
      unit: this.getUnit(),
      quality,
    };
  }

  /**
   * Apply calibration to raw sensor value
   */
  protected calibrate(rawValue: number): number {
    if (!this.config.calibration) {
      return rawValue;
    }

    const { offset, scale, polynomial } = this.config.calibration;

    // Apply polynomial calibration if configured
    if (polynomial && polynomial.length > 0) {
      let value = 0;
      for (let i = 0; i < polynomial.length; i++) {
        value += polynomial[i]! * Math.pow(rawValue, i);
      }
      return value;
    }

    // Simple linear calibration
    return (rawValue + offset) * scale;
  }

  /**
   * Assess the quality of the reading
   */
  protected assessQuality(value: number): 'good' | 'fair' | 'poor' {
    const { thresholds } = this.config;

    if (!thresholds) {
      return 'good';
    }

    if (thresholds.critical !== undefined) {
      if (value >= thresholds.critical) {
        return 'poor';
      }
    }

    if (thresholds.min !== undefined && value < thresholds.min) {
      return 'fair';
    }

    if (thresholds.max !== undefined && value > thresholds.max) {
      return 'fair';
    }

    return 'good';
  }

  /**
   * Check if reading exceeds thresholds
   */
  protected checkThresholds(reading: SensorReading): void {
    const { thresholds } = this.config;

    if (!thresholds) {
      return;
    }

    if (thresholds.critical !== undefined && reading.value >= thresholds.critical) {
      this.emit('critical', reading);
    }

    if (thresholds.max !== undefined && reading.value > thresholds.max) {
      this.emit('threshold-exceeded', { type: 'max', reading });
    }

    if (thresholds.min !== undefined && reading.value < thresholds.min) {
      this.emit('threshold-exceeded', { type: 'min', reading });
    }
  }

  /**
   * Get last reading
   */
  public getLastReading(): SensorReading | undefined {
    return this.lastReading;
  }
}

// ===== Concrete Sensor Implementations =====

/**
 * DHT22 Temperature & Humidity Sensor
 */
export class DHT22Sensor extends Sensor {
  private humidity?: number;

  async initialize(): Promise<void> {
    console.log(`Initializing DHT22 sensor on pin ${this.config.pin}`);
    // In real implementation, initialize GPIO pin
    await this.sleep(100);
  }

  protected async readRaw(): Promise<number> {
    // Simulate reading from DHT22
    // In real implementation, read from actual sensor
    const temp = 20 + Math.random() * 10; // 20-30°C
    this.humidity = 40 + Math.random() * 40; // 40-80%
    return temp;
  }

  protected getUnit(): string {
    return '°C';
  }

  /**
   * Get humidity reading
   */
  public async readHumidity(): Promise<SensorReading> {
    await this.read(); // This populates humidity

    return {
      timestamp: Date.now(),
      sensorId: this.config.id + '-humidity',
      sensorType: SensorType.HUMIDITY,
      value: this.humidity || 0,
      unit: '%',
      quality: 'good',
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * BMP280 Pressure Sensor
 */
export class BMP280Sensor extends Sensor {
  async initialize(): Promise<void> {
    console.log(`Initializing BMP280 sensor at I2C address 0x${this.config.address?.toString(16)}`);
    // In real implementation, initialize I2C communication
    await this.sleep(50);
  }

  protected async readRaw(): Promise<number> {
    // Simulate reading from BMP280
    // Standard atmospheric pressure with some variation
    return 1013.25 + (Math.random() - 0.5) * 20; // hPa
  }

  protected getUnit(): string {
    return 'hPa';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Analog Light Sensor (LDR)
 */
export class LightSensor extends Sensor {
  async initialize(): Promise<void> {
    console.log(`Initializing light sensor on analog pin ${this.config.pin}`);
    // In real implementation, configure ADC
    await this.sleep(50);
  }

  protected async readRaw(): Promise<number> {
    // Simulate ADC reading (0-4095 for 12-bit ADC)
    const adcValue = Math.floor(Math.random() * 4096);

    // Convert to lux (simplified)
    const voltage = (adcValue / 4095) * 3.3;
    const resistance = (10000 * voltage) / (3.3 - voltage);
    const lux = Math.pow(10, (Math.log10(resistance / 10000) - 0.7) / -0.5);

    return lux;
  }

  protected getUnit(): string {
    return 'lux';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * PIR Motion Sensor
 */
export class MotionSensor extends Sensor {
  private motionDetected: boolean = false;

  async initialize(): Promise<void> {
    console.log(`Initializing PIR motion sensor on pin ${this.config.pin}`);
    // In real implementation, set up GPIO interrupt
    await this.sleep(100);
  }

  protected async readRaw(): Promise<number> {
    // Simulate motion detection (0 = no motion, 1 = motion)
    this.motionDetected = Math.random() > 0.7;
    return this.motionDetected ? 1 : 0;
  }

  protected getUnit(): string {
    return 'boolean';
  }

  public isMotionDetected(): boolean {
    return this.motionDetected;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ===== Sensor Manager =====

/**
 * Manages multiple sensors
 */
export class SensorManager extends EventEmitter {
  private sensors: Map<string, Sensor> = new Map();
  private readings: Map<string, SensorReading[]> = new Map();
  private maxReadingsPerSensor: number = 1000;

  /**
   * Register a sensor
   */
  public registerSensor(sensor: Sensor): void {
    const sensorId = sensor['config'].id;

    if (this.sensors.has(sensorId)) {
      throw new Error(`Sensor ${sensorId} is already registered`);
    }

    this.sensors.set(sensorId, sensor);
    this.readings.set(sensorId, []);

    // Listen to sensor events
    sensor.on('reading', (reading: SensorReading) => {
      this.handleReading(reading);
    });

    sensor.on('error', (error: Error) => {
      this.emit('sensor-error', { sensorId, error });
    });

    sensor.on('critical', (reading: SensorReading) => {
      this.emit('critical-reading', reading);
    });

    this.emit('sensor-registered', sensorId);
  }

  /**
   * Start all sensors
   */
  public async startAll(): Promise<void> {
    const startPromises = Array.from(this.sensors.values()).map((sensor) =>
      sensor.startReading()
    );

    await Promise.all(startPromises);
    this.emit('all-started');
  }

  /**
   * Stop all sensors
   */
  public stopAll(): void {
    for (const sensor of this.sensors.values()) {
      sensor.stopReading();
    }
    this.emit('all-stopped');
  }

  /**
   * Get current readings from all sensors
   */
  public getCurrentReadings(): Record<string, SensorReading | undefined> {
    const readings: Record<string, SensorReading | undefined> = {};

    for (const [sensorId, sensor] of this.sensors.entries()) {
      readings[sensorId] = sensor.getLastReading();
    }

    return readings;
  }

  /**
   * Get historical readings for a sensor
   */
  public getHistory(sensorId: string, limit?: number): SensorReading[] {
    const history = this.readings.get(sensorId) || [];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Handle new reading
   */
  private handleReading(reading: SensorReading): void {
    const history = this.readings.get(reading.sensorId) || [];

    history.push(reading);

    // Limit history size
    if (history.length > this.maxReadingsPerSensor) {
      history.shift();
    }

    this.readings.set(reading.sensorId, history);
    this.emit('reading', reading);
  }
}

// ===== Example Usage =====

async function main() {
  // Create sensor manager
  const manager = new SensorManager();

  // Configure and register sensors
  const tempSensor = new DHT22Sensor({
    id: 'temp-01',
    type: SensorType.TEMPERATURE,
    pin: 4,
    samplingRate: 1, // 1 Hz (once per second)
    calibration: {
      offset: -0.5,
      scale: 1.02,
    },
    thresholds: {
      max: 30,
      critical: 35,
    },
  });

  const pressureSensor = new BMP280Sensor({
    id: 'pressure-01',
    type: SensorType.PRESSURE,
    address: 0x76,
    samplingRate: 0.5, // 0.5 Hz (every 2 seconds)
  });

  const lightSensor = new LightSensor({
    id: 'light-01',
    type: SensorType.LIGHT,
    pin: 34,
    samplingRate: 0.2, // 0.2 Hz (every 5 seconds)
  });

  const motionSensor = new MotionSensor({
    id: 'motion-01',
    type: SensorType.MOTION,
    pin: 13,
    samplingRate: 10, // 10 Hz
  });

  // Register all sensors
  manager.registerSensor(tempSensor);
  manager.registerSensor(pressureSensor);
  manager.registerSensor(lightSensor);
  manager.registerSensor(motionSensor);

  // Listen to events
  manager.on('reading', (reading: SensorReading) => {
    console.log(`[${new Date(reading.timestamp).toISOString()}] ${reading.sensorId}: ${reading.value.toFixed(2)} ${reading.unit} (${reading.quality})`);
  });

  manager.on('critical-reading', (reading: SensorReading) => {
    console.error(`CRITICAL: ${reading.sensorId} = ${reading.value} ${reading.unit}`);
  });

  manager.on('sensor-error', ({ sensorId, error }: { sensorId: string; error: Error }) => {
    console.error(`Sensor ${sensorId} error:`, error);
  });

  // Start all sensors
  console.log('Starting all sensors...');
  await manager.startAll();

  // Run for 30 seconds then stop
  setTimeout(() => {
    console.log('\nStopping all sensors...');
    manager.stopAll();

    // Display statistics
    console.log('\n=== Sensor Statistics ===');
    const readings = manager.getCurrentReadings();
    for (const [sensorId, reading] of Object.entries(readings)) {
      if (reading) {
        const history = manager.getHistory(sensorId);
        console.log(`${sensorId}: ${history.length} readings, last = ${reading.value.toFixed(2)} ${reading.unit}`);
      }
    }
  }, 30000);
}

// Run example if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };
