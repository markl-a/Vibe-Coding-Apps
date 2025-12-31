/**
 * Sensor Integration Examples
 *
 * Demonstrates integrating various sensor types with digital twins,
 * including data acquisition, processing, validation, and aggregation.
 */

// ============================================================================
// Sensor Types and Interfaces
// ============================================================================

interface SensorReading {
  sensorId: string;
  timestamp: Date;
  value: number | string | boolean | Record<string, unknown>;
  unit?: string;
  quality: 'good' | 'uncertain' | 'bad';
  confidence?: number; // 0-1
}

interface SensorMetadata {
  id: string;
  name: string;
  type: 'temperature' | 'pressure' | 'flow' | 'vibration' | 'proximity' | 'level' | 'position' | 'camera' | 'custom';
  location: { x: number; y: number; z: number };
  unit: string;
  range: { min: number; max: number };
  accuracy: number; // percentage
  sampleRate: number; // Hz
  protocol: 'modbus' | 'opcua' | 'mqtt' | 'http' | 'ble' | 'zigbee';
  calibrationDate?: Date;
  nextCalibrationDate?: Date;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
}

interface SensorConfig {
  enabled: boolean;
  samplingInterval: number; // ms
  bufferSize: number;
  filterType?: 'none' | 'moving_average' | 'kalman' | 'median';
  filterWindow?: number;
  outlierDetection: boolean;
  outlierThreshold?: number; // standard deviations
  validation: boolean;
  validationRules?: ValidationRule[];
}

interface ValidationRule {
  type: 'range' | 'rate_of_change' | 'pattern' | 'correlation';
  params: Record<string, unknown>;
  action: 'warn' | 'reject' | 'flag';
}

interface AggregatedData {
  sensorId: string;
  startTime: Date;
  endTime: Date;
  count: number;
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  median?: number;
}

// ============================================================================
// Sensor Base Class
// ============================================================================

class Sensor {
  private metadata: SensorMetadata;
  private config: SensorConfig;
  private readingBuffer: SensorReading[] = [];
  private listeners: Array<(reading: SensorReading) => void> = [];
  private isActive = false;
  private intervalId?: NodeJS.Timeout;
  private stats = {
    totalReadings: 0,
    validReadings: 0,
    rejectedReadings: 0,
    lastReading?: SensorReading,
  };

  constructor(metadata: SensorMetadata, config: Partial<SensorConfig> = {}) {
    this.metadata = metadata;
    this.config = {
      enabled: true,
      samplingInterval: 1000,
      bufferSize: 100,
      filterType: 'moving_average',
      filterWindow: 5,
      outlierDetection: true,
      outlierThreshold: 3,
      validation: true,
      validationRules: [],
      ...config,
    };
  }

  // Start sensor data acquisition
  start(): void {
    if (this.isActive) return;

    this.isActive = true;
    console.log(`[SENSOR] Started ${this.metadata.name} (${this.metadata.id})`);

    if (this.config.samplingInterval > 0) {
      this.intervalId = setInterval(() => {
        this.acquireReading();
      }, this.config.samplingInterval);
    }
  }

  // Stop sensor
  stop(): void {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log(`[SENSOR] Stopped ${this.metadata.name}`);
  }

  // Acquire a reading (override in subclasses)
  protected generateRawValue(): number {
    // Default: random value within range
    const { min, max } = this.metadata.range;
    return min + Math.random() * (max - min);
  }

  // Acquire and process reading
  private acquireReading(): void {
    const rawValue = this.generateRawValue();

    const reading: SensorReading = {
      sensorId: this.metadata.id,
      timestamp: new Date(),
      value: rawValue,
      unit: this.metadata.unit,
      quality: 'good',
      confidence: 1.0,
    };

    this.stats.totalReadings++;

    // Validate reading
    if (this.config.validation) {
      const validationResult = this.validateReading(reading);
      if (!validationResult.valid) {
        reading.quality = 'bad';
        this.stats.rejectedReadings++;
        console.warn(`[SENSOR] Invalid reading from ${this.metadata.id}: ${validationResult.reason}`);

        if (validationResult.action === 'reject') {
          return; // Don't process further
        }
      }
    }

    // Detect outliers
    if (this.config.outlierDetection && typeof reading.value === 'number') {
      if (this.isOutlier(reading.value)) {
        reading.quality = 'uncertain';
        reading.confidence = 0.5;
        console.warn(`[SENSOR] Outlier detected from ${this.metadata.id}: ${reading.value}`);
      }
    }

    // Apply filter
    const filteredValue = this.applyFilter(reading.value as number);
    if (filteredValue !== reading.value) {
      reading.value = filteredValue;
    }

    // Add to buffer
    this.readingBuffer.push(reading);
    if (this.readingBuffer.length > this.config.bufferSize) {
      this.readingBuffer.shift();
    }

    this.stats.validReadings++;
    this.stats.lastReading = reading;

    // Notify listeners
    this.notifyListeners(reading);
  }

  private validateReading(reading: SensorReading): { valid: boolean; reason?: string; action?: string } {
    if (!this.config.validationRules) {
      return { valid: true };
    }

    for (const rule of this.config.validationRules) {
      if (rule.type === 'range') {
        const { min, max } = rule.params as { min: number; max: number };
        const value = reading.value as number;
        if (value < min || value > max) {
          return {
            valid: false,
            reason: `Value ${value} outside range [${min}, ${max}]`,
            action: rule.action,
          };
        }
      } else if (rule.type === 'rate_of_change') {
        if (this.stats.lastReading && typeof reading.value === 'number' && typeof this.stats.lastReading.value === 'number') {
          const { maxChange } = rule.params as { maxChange: number };
          const change = Math.abs(reading.value - this.stats.lastReading.value);
          if (change > maxChange) {
            return {
              valid: false,
              reason: `Rate of change ${change} exceeds limit ${maxChange}`,
              action: rule.action,
            };
          }
        }
      }
    }

    return { valid: true };
  }

  private isOutlier(value: number): boolean {
    if (this.readingBuffer.length < 10) {
      return false; // Need enough data
    }

    const recentValues = this.readingBuffer
      .slice(-20)
      .map(r => r.value as number)
      .filter(v => !isNaN(v));

    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const variance = recentValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    const threshold = this.config.outlierThreshold || 3;
    return Math.abs(value - mean) > threshold * stdDev;
  }

  private applyFilter(value: number): number {
    if (this.config.filterType === 'none' || this.readingBuffer.length === 0) {
      return value;
    }

    if (this.config.filterType === 'moving_average') {
      const window = Math.min(this.config.filterWindow || 5, this.readingBuffer.length);
      const recentValues = this.readingBuffer
        .slice(-window)
        .map(r => r.value as number);
      recentValues.push(value);

      return recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    }

    if (this.config.filterType === 'median') {
      const window = Math.min(this.config.filterWindow || 5, this.readingBuffer.length);
      const recentValues = this.readingBuffer
        .slice(-window)
        .map(r => r.value as number);
      recentValues.push(value);
      recentValues.sort((a, b) => a - b);

      const mid = Math.floor(recentValues.length / 2);
      return recentValues.length % 2 === 0
        ? (recentValues[mid - 1] + recentValues[mid]) / 2
        : recentValues[mid];
    }

    return value;
  }

  // Subscribe to readings
  onReading(callback: (reading: SensorReading) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(reading: SensorReading): void {
    this.listeners.forEach(cb => cb(reading));
  }

  // Get readings
  getReadings(count?: number): SensorReading[] {
    return count ? this.readingBuffer.slice(-count) : [...this.readingBuffer];
  }

  getLastReading(): SensorReading | undefined {
    return this.stats.lastReading;
  }

  // Get aggregated data
  getAggregatedData(timeWindow?: number): AggregatedData | null {
    const readings = timeWindow
      ? this.readingBuffer.filter(r => Date.now() - r.timestamp.getTime() < timeWindow)
      : this.readingBuffer;

    if (readings.length === 0) return null;

    const values = readings.map(r => r.value as number).filter(v => !isNaN(v));
    if (values.length === 0) return null;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return {
      sensorId: this.metadata.id,
      startTime: readings[0].timestamp,
      endTime: readings[readings.length - 1].timestamp,
      count: values.length,
      mean,
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev: Math.sqrt(variance),
    };
  }

  getMetadata(): SensorMetadata {
    return this.metadata;
  }

  getStats() {
    return this.stats;
  }

  isRunning(): boolean {
    return this.isActive;
  }
}

// ============================================================================
// Specific Sensor Types
// ============================================================================

class TemperatureSensor extends Sensor {
  private baseTemp: number;
  private drift = 0;

  constructor(id: string, name: string, baseTemp: number = 20) {
    super({
      id,
      name,
      type: 'temperature',
      location: { x: 0, y: 0, z: 0 },
      unit: '°C',
      range: { min: -40, max: 150 },
      accuracy: 0.5,
      sampleRate: 1,
      protocol: 'modbus',
    });
    this.baseTemp = baseTemp;
  }

  protected generateRawValue(): number {
    // Simulate temperature with some drift and noise
    this.drift += (Math.random() - 0.5) * 0.1;
    const noise = (Math.random() - 0.5) * 0.5;
    return this.baseTemp + this.drift + noise;
  }
}

class PressureSensor extends Sensor {
  private basePressure: number;

  constructor(id: string, name: string, basePressure: number = 101.325) {
    super({
      id,
      name,
      type: 'pressure',
      location: { x: 0, y: 0, z: 0 },
      unit: 'kPa',
      range: { min: 0, max: 1000 },
      accuracy: 0.1,
      sampleRate: 10,
      protocol: 'opcua',
    });
    this.basePressure = basePressure;
  }

  protected generateRawValue(): number {
    // Simulate pressure variations
    const wave = Math.sin(Date.now() / 1000) * 5;
    const noise = (Math.random() - 0.5) * 0.5;
    return this.basePressure + wave + noise;
  }
}

class VibrationSensor extends Sensor {
  private frequency: number;

  constructor(id: string, name: string, frequency: number = 50) {
    super({
      id,
      name,
      type: 'vibration',
      location: { x: 0, y: 0, z: 0 },
      unit: 'mm/s',
      range: { min: 0, max: 100 },
      accuracy: 0.01,
      sampleRate: 1000,
      protocol: 'mqtt',
    });
    this.frequency = frequency;
  }

  protected generateRawValue(): number {
    // Simulate vibration at specific frequency
    const t = Date.now() / 1000;
    const signal = Math.sin(2 * Math.PI * this.frequency * t) * 5;
    const noise = (Math.random() - 0.5) * 0.5;
    return Math.abs(signal + noise);
  }
}

// ============================================================================
// Sensor Network Manager
// ============================================================================

class SensorNetworkManager {
  private sensors = new Map<string, Sensor>();
  private dataStore: SensorReading[] = [];
  private maxStoreSize = 10000;

  addSensor(sensor: Sensor): void {
    this.sensors.set(sensor.getMetadata().id, sensor);

    // Subscribe to sensor readings
    sensor.onReading((reading) => {
      this.storeReading(reading);
    });

    console.log(`[NETWORK] Added sensor: ${sensor.getMetadata().name}`);
  }

  removeSensor(sensorId: string): void {
    const sensor = this.sensors.get(sensorId);
    if (sensor) {
      sensor.stop();
      this.sensors.delete(sensorId);
      console.log(`[NETWORK] Removed sensor: ${sensorId}`);
    }
  }

  private storeReading(reading: SensorReading): void {
    this.dataStore.push(reading);
    if (this.dataStore.length > this.maxStoreSize) {
      this.dataStore.shift();
    }
  }

  startAll(): void {
    this.sensors.forEach(sensor => sensor.start());
    console.log(`[NETWORK] Started ${this.sensors.size} sensors`);
  }

  stopAll(): void {
    this.sensors.forEach(sensor => sensor.stop());
    console.log(`[NETWORK] Stopped all sensors`);
  }

  getSensor(id: string): Sensor | undefined {
    return this.sensors.get(id);
  }

  getAllSensors(): Sensor[] {
    return Array.from(this.sensors.values());
  }

  getReadingsByTimeRange(startTime: Date, endTime: Date): SensorReading[] {
    return this.dataStore.filter(
      r => r.timestamp >= startTime && r.timestamp <= endTime
    );
  }

  getReadingsBySensor(sensorId: string, limit?: number): SensorReading[] {
    const readings = this.dataStore.filter(r => r.sensorId === sensorId);
    return limit ? readings.slice(-limit) : readings;
  }

  getNetworkStats() {
    const sensorStats = Array.from(this.sensors.values()).map(s => ({
      id: s.getMetadata().id,
      name: s.getMetadata().name,
      type: s.getMetadata().type,
      running: s.isRunning(),
      ...s.getStats(),
    }));

    return {
      totalSensors: this.sensors.size,
      activeSensors: sensorStats.filter(s => s.running).length,
      totalReadings: this.dataStore.length,
      sensors: sensorStats,
    };
  }
}

// ============================================================================
// Examples
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Sensor Integration Examples');
  console.log('='.repeat(70));

  // Example 1: Basic Sensor Integration
  console.log('\n📊 Example 1: Basic Temperature Sensor');
  console.log('-'.repeat(50));

  const tempSensor = new TemperatureSensor('temp-001', 'Room Temperature', 22);

  tempSensor.onReading((reading) => {
    console.log(`[${reading.timestamp.toISOString()}] ${reading.value}${reading.unit} (quality: ${reading.quality})`);
  });

  tempSensor.start();

  // Collect some readings
  await new Promise(resolve => setTimeout(resolve, 3000));
  tempSensor.stop();

  const readings = tempSensor.getReadings();
  console.log(`\nCollected ${readings.length} readings`);
  console.log('Stats:', tempSensor.getStats());

  // Example 2: Sensor with Validation
  console.log('\n📊 Example 2: Pressure Sensor with Validation');
  console.log('-'.repeat(50));

  const pressureSensor = new PressureSensor('pressure-001', 'System Pressure', 100);

  // Configure validation rules
  const config: Partial<SensorConfig> = {
    samplingInterval: 500,
    validation: true,
    validationRules: [
      {
        type: 'range',
        params: { min: 90, max: 110 },
        action: 'warn',
      },
      {
        type: 'rate_of_change',
        params: { maxChange: 10 },
        action: 'flag',
      },
    ],
  };

  const validatedSensor = new Sensor(pressureSensor.getMetadata(), config);

  let validCount = 0;
  let warnCount = 0;

  validatedSensor.onReading((reading) => {
    if (reading.quality === 'good') validCount++;
    else warnCount++;
  });

  validatedSensor.start();
  await new Promise(resolve => setTimeout(resolve, 2000));
  validatedSensor.stop();

  console.log(`Valid readings: ${validCount}`);
  console.log(`Warnings: ${warnCount}`);

  // Example 3: Filtered Sensor Data
  console.log('\n📊 Example 3: Vibration Sensor with Filtering');
  console.log('-'.repeat(50));

  const vibSensor = new VibrationSensor('vib-001', 'Motor Vibration', 60);

  // Show raw vs filtered
  const rawValues: number[] = [];
  const filteredValues: number[] = [];

  // Temporarily capture raw values
  const originalGenerate = vibSensor['generateRawValue'].bind(vibSensor);
  vibSensor['generateRawValue'] = () => {
    const raw = originalGenerate();
    rawValues.push(raw);
    return raw;
  };

  vibSensor.onReading((reading) => {
    filteredValues.push(reading.value as number);
  });

  vibSensor.start();
  await new Promise(resolve => setTimeout(resolve, 2000));
  vibSensor.stop();

  console.log(`\nRaw values (last 10): ${rawValues.slice(-10).map(v => v.toFixed(2)).join(', ')}`);
  console.log(`Filtered values (last 10): ${filteredValues.slice(-10).map(v => v.toFixed(2)).join(', ')}`);

  const aggregated = vibSensor.getAggregatedData();
  if (aggregated) {
    console.log(`\nAggregated data:`);
    console.log(`  Mean: ${aggregated.mean.toFixed(2)} ${vibSensor.getMetadata().unit}`);
    console.log(`  Min: ${aggregated.min.toFixed(2)}, Max: ${aggregated.max.toFixed(2)}`);
    console.log(`  Std Dev: ${aggregated.stdDev.toFixed(2)}`);
  }

  // Example 4: Sensor Network
  console.log('\n📊 Example 4: Multi-Sensor Network');
  console.log('-'.repeat(50));

  const network = new SensorNetworkManager();

  // Add multiple sensors
  network.addSensor(new TemperatureSensor('temp-001', 'Inlet Temperature', 25));
  network.addSensor(new TemperatureSensor('temp-002', 'Outlet Temperature', 45));
  network.addSensor(new PressureSensor('pres-001', 'Inlet Pressure', 100));
  network.addSensor(new PressureSensor('pres-002', 'Outlet Pressure', 95));
  network.addSensor(new VibrationSensor('vib-001', 'Pump Vibration', 50));

  // Start network
  network.startAll();
  await new Promise(resolve => setTimeout(resolve, 3000));
  network.stopAll();

  const netStats = network.getNetworkStats();
  console.log(`\nNetwork statistics:`);
  console.log(`  Total sensors: ${netStats.totalSensors}`);
  console.log(`  Total readings: ${netStats.totalReadings}`);
  console.log(`\nIndividual sensor stats:`);
  netStats.sensors.forEach(s => {
    console.log(`  ${s.name}: ${s.totalReadings} readings (${s.validReadings} valid, ${s.rejectedReadings} rejected)`);
  });

  // Example 5: Time-Series Analysis
  console.log('\n📊 Example 5: Time-Series Data Analysis');
  console.log('-'.repeat(50));

  const analysisSensor = new TemperatureSensor('temp-analysis', 'Analysis Sensor', 30);
  analysisSensor.start();

  console.log('Collecting 5 seconds of data...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  analysisSensor.stop();

  const allReadings = analysisSensor.getReadings();
  const recent10s = analysisSensor.getAggregatedData(10000);
  const recent5s = analysisSensor.getAggregatedData(5000);

  console.log(`\nTotal readings: ${allReadings.length}`);
  console.log(`\nLast 10 seconds:`);
  if (recent10s) {
    console.log(`  Count: ${recent10s.count}`);
    console.log(`  Mean: ${recent10s.mean.toFixed(2)}°C`);
    console.log(`  Range: ${recent10s.min.toFixed(2)}°C - ${recent10s.max.toFixed(2)}°C`);
  }

  console.log(`\nLast 5 seconds:`);
  if (recent5s) {
    console.log(`  Count: ${recent5s.count}`);
    console.log(`  Mean: ${recent5s.mean.toFixed(2)}°C`);
    console.log(`  Range: ${recent5s.min.toFixed(2)}°C - ${recent5s.max.toFixed(2)}°C`);
  }

  // Example 6: Sensor Correlation
  console.log('\n📊 Example 6: Multi-Sensor Correlation');
  console.log('-'.repeat(50));

  const correlationNetwork = new SensorNetworkManager();

  const tempSensorA = new TemperatureSensor('temp-corr-a', 'Temperature A', 25);
  const tempSensorB = new TemperatureSensor('temp-corr-b', 'Temperature B', 25);

  correlationNetwork.addSensor(tempSensorA);
  correlationNetwork.addSensor(tempSensorB);

  correlationNetwork.startAll();
  await new Promise(resolve => setTimeout(resolve, 2000));
  correlationNetwork.stopAll();

  const readingsA = correlationNetwork.getReadingsBySensor('temp-corr-a');
  const readingsB = correlationNetwork.getReadingsBySensor('temp-corr-b');

  console.log(`Sensor A: ${readingsA.length} readings`);
  console.log(`Sensor B: ${readingsB.length} readings`);

  // Simple correlation check
  const avgA = readingsA.reduce((sum, r) => sum + (r.value as number), 0) / readingsA.length;
  const avgB = readingsB.reduce((sum, r) => sum + (r.value as number), 0) / readingsB.length;

  console.log(`\nAverage values:`);
  console.log(`  Sensor A: ${avgA.toFixed(2)}°C`);
  console.log(`  Sensor B: ${avgB.toFixed(2)}°C`);
  console.log(`  Difference: ${Math.abs(avgA - avgB).toFixed(2)}°C`);

  console.log('\n' + '='.repeat(70));
  console.log('Sensor Integration examples complete!');
}

// Run examples
main().catch(console.error);
