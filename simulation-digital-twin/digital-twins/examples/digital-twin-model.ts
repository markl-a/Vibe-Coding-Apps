/**
 * Digital Twin Model Examples
 *
 * Demonstrates creating digital twin models for physical assets
 * with properties, relationships, and lifecycle management.
 */

// ============================================================================
// Core Digital Twin Types
// ============================================================================

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

interface Transform {
  position: Vec3;
  rotation: Quaternion;
  scale: Vec3;
}

interface Property {
  name: string;
  value: unknown;
  unit?: string;
  timestamp: Date;
  confidence?: number; // 0-1 for sensor reliability
  source?: string;
}

interface Relationship {
  type: 'parent' | 'child' | 'sibling' | 'connected' | 'dependency';
  targetId: string;
  metadata?: Record<string, unknown>;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'failed' | 'unknown';
  components: Record<string, {
    status: string;
    score: number; // 0-100
    lastCheck: Date;
    issues?: string[];
  }>;
  predictions?: {
    failureProbability: number; // 0-1
    remainingUsefulLife?: number; // hours
    nextMaintenanceDate?: Date;
  };
}

interface DigitalTwinMetadata {
  id: string;
  name: string;
  type: string;
  description?: string;
  created: Date;
  updated: Date;
  version: string;
  tags: string[];
  customFields?: Record<string, unknown>;
}

interface DigitalTwin {
  metadata: DigitalTwinMetadata;
  properties: Map<string, Property>;
  relationships: Relationship[];
  transform?: Transform;
  health: HealthStatus;
  state: 'active' | 'inactive' | 'maintenance' | 'error';
  history: HistoryEntry[];
}

interface HistoryEntry {
  timestamp: Date;
  type: 'property_change' | 'state_change' | 'event' | 'alert';
  description: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// Digital Twin Model Manager
// ============================================================================

class DigitalTwinModel {
  private twin: DigitalTwin;
  private changeListeners: Array<(twin: DigitalTwin) => void> = [];

  constructor(config: {
    id: string;
    name: string;
    type: string;
    description?: string;
    tags?: string[];
  }) {
    this.twin = {
      metadata: {
        id: config.id,
        name: config.name,
        type: config.type,
        description: config.description,
        created: new Date(),
        updated: new Date(),
        version: '1.0.0',
        tags: config.tags || [],
      },
      properties: new Map(),
      relationships: [],
      health: {
        overall: 'unknown',
        components: {},
      },
      state: 'inactive',
      history: [],
    };
  }

  // Property management
  setProperty(name: string, value: unknown, unit?: string, source?: string): void {
    const oldValue = this.twin.properties.get(name);

    const property: Property = {
      name,
      value,
      unit,
      timestamp: new Date(),
      source,
    };

    this.twin.properties.set(name, property);
    this.twin.metadata.updated = new Date();

    // Add to history
    this.addHistoryEntry({
      type: 'property_change',
      description: `Property '${name}' changed from ${oldValue?.value} to ${value}`,
      data: { name, oldValue: oldValue?.value, newValue: value, unit },
    });

    this.notifyChanges();
  }

  getProperty(name: string): Property | undefined {
    return this.twin.properties.get(name);
  }

  getAllProperties(): Property[] {
    return Array.from(this.twin.properties.values());
  }

  // Relationship management
  addRelationship(relationship: Relationship): void {
    this.twin.relationships.push(relationship);
    this.addHistoryEntry({
      type: 'event',
      description: `Added ${relationship.type} relationship to ${relationship.targetId}`,
      data: relationship,
    });
    this.notifyChanges();
  }

  removeRelationship(targetId: string, type?: string): void {
    const initialLength = this.twin.relationships.length;
    this.twin.relationships = this.twin.relationships.filter(
      r => r.targetId !== targetId || (type && r.type !== type)
    );

    if (this.twin.relationships.length !== initialLength) {
      this.addHistoryEntry({
        type: 'event',
        description: `Removed relationship to ${targetId}`,
      });
      this.notifyChanges();
    }
  }

  getRelationships(type?: string): Relationship[] {
    if (type) {
      return this.twin.relationships.filter(r => r.type === type);
    }
    return this.twin.relationships;
  }

  // Transform management
  setTransform(transform: Partial<Transform>): void {
    this.twin.transform = {
      position: transform.position || { x: 0, y: 0, z: 0 },
      rotation: transform.rotation || { x: 0, y: 0, z: 0, w: 1 },
      scale: transform.scale || { x: 1, y: 1, z: 1 },
    };
    this.notifyChanges();
  }

  getTransform(): Transform | undefined {
    return this.twin.transform;
  }

  // Health management
  updateHealth(health: Partial<HealthStatus>): void {
    this.twin.health = { ...this.twin.health, ...health };

    this.addHistoryEntry({
      type: 'event',
      description: `Health status updated: ${health.overall || 'components changed'}`,
      data: health,
    });

    if (health.overall === 'critical' || health.overall === 'failed') {
      this.addHistoryEntry({
        type: 'alert',
        description: `ALERT: Asset health is ${health.overall}`,
        data: health,
      });
    }

    this.notifyChanges();
  }

  setComponentHealth(component: string, status: string, score: number, issues?: string[]): void {
    this.twin.health.components[component] = {
      status,
      score,
      lastCheck: new Date(),
      issues,
    };

    // Update overall health based on components
    const scores = Object.values(this.twin.health.components).map(c => c.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore >= 80) this.twin.health.overall = 'healthy';
    else if (avgScore >= 60) this.twin.health.overall = 'degraded';
    else if (avgScore >= 40) this.twin.health.overall = 'critical';
    else this.twin.health.overall = 'failed';

    this.notifyChanges();
  }

  // State management
  setState(state: DigitalTwin['state']): void {
    const oldState = this.twin.state;
    this.twin.state = state;

    this.addHistoryEntry({
      type: 'state_change',
      description: `State changed from ${oldState} to ${state}`,
      data: { oldState, newState: state },
    });

    this.notifyChanges();
  }

  getState(): DigitalTwin['state'] {
    return this.twin.state;
  }

  // History management
  private addHistoryEntry(entry: Omit<HistoryEntry, 'timestamp'>): void {
    this.twin.history.push({
      ...entry,
      timestamp: new Date(),
    });

    // Keep last 1000 entries
    if (this.twin.history.length > 1000) {
      this.twin.history = this.twin.history.slice(-1000);
    }
  }

  getHistory(type?: HistoryEntry['type'], limit?: number): HistoryEntry[] {
    let history = this.twin.history;
    if (type) {
      history = history.filter(h => h.type === type);
    }
    if (limit) {
      history = history.slice(-limit);
    }
    return history;
  }

  // Change notification
  onChange(callback: (twin: DigitalTwin) => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter(cb => cb !== callback);
    };
  }

  private notifyChanges(): void {
    this.changeListeners.forEach(cb => cb(this.twin));
  }

  // Export/Import
  toJSON(): DigitalTwin {
    return {
      ...this.twin,
      properties: Array.from(this.twin.properties.entries()).reduce(
        (acc, [key, value]) => ({ ...acc, [key]: value }),
        {}
      ) as any,
    };
  }

  getTwin(): DigitalTwin {
    return this.twin;
  }

  // Cloning
  clone(newId: string, newName?: string): DigitalTwinModel {
    const cloned = new DigitalTwinModel({
      id: newId,
      name: newName || `${this.twin.metadata.name} (Clone)`,
      type: this.twin.metadata.type,
      description: this.twin.metadata.description,
      tags: [...this.twin.metadata.tags],
    });

    // Copy properties
    this.twin.properties.forEach((prop, name) => {
      cloned.setProperty(name, prop.value, prop.unit, prop.source);
    });

    // Copy transform
    if (this.twin.transform) {
      cloned.setTransform(this.twin.transform);
    }

    return cloned;
  }
}

// ============================================================================
// Examples
// ============================================================================

function main() {
  console.log('='.repeat(70));
  console.log('Digital Twin Model Examples');
  console.log('='.repeat(70));

  // Example 1: Industrial Equipment Twin
  console.log('\n📊 Example 1: Industrial Pump Digital Twin');
  console.log('-'.repeat(50));

  const pump = new DigitalTwinModel({
    id: 'pump-001',
    name: 'Coolant Pump A',
    type: 'industrial-pump',
    description: 'Main coolant circulation pump in Building A',
    tags: ['critical', 'cooling-system', 'building-a'],
  });

  // Set initial properties
  pump.setProperty('flowRate', 150, 'L/min', 'flow-sensor-01');
  pump.setProperty('pressure', 45, 'PSI', 'pressure-sensor-01');
  pump.setProperty('temperature', 68, '°F', 'temp-sensor-01');
  pump.setProperty('vibration', 2.5, 'mm/s', 'vibration-sensor-01');
  pump.setProperty('powerConsumption', 7.5, 'kW', 'power-meter-01');
  pump.setProperty('runningHours', 12450, 'hours', 'controller');
  pump.setProperty('manufacturer', 'AcmePumps Inc.', undefined, 'config');
  pump.setProperty('modelNumber', 'AP-5000-X', undefined, 'config');
  pump.setProperty('installationDate', '2020-03-15', undefined, 'config');

  console.log(`Created twin: ${pump.getTwin().metadata.name}`);
  console.log(`Properties: ${pump.getAllProperties().length}`);

  // Set transform (position in facility)
  pump.setTransform({
    position: { x: 25.5, y: 10.2, z: 1.5 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

  // Set component health
  pump.setComponentHealth('motor', 'good', 85);
  pump.setComponentHealth('bearings', 'fair', 72, ['slight wear detected']);
  pump.setComponentHealth('seals', 'good', 88);
  pump.setComponentHealth('impeller', 'excellent', 95);

  console.log(`Overall health: ${pump.getTwin().health.overall}`);
  console.log('Component health:');
  Object.entries(pump.getTwin().health.components).forEach(([name, health]) => {
    console.log(`  ${name}: ${health.status} (${health.score}/100)`);
  });

  // Add relationships
  pump.addRelationship({
    type: 'parent',
    targetId: 'cooling-system-001',
    metadata: { role: 'primary-pump' },
  });
  pump.addRelationship({
    type: 'connected',
    targetId: 'heat-exchanger-001',
    metadata: { connectionType: 'output-flow' },
  });
  pump.addRelationship({
    type: 'dependency',
    targetId: 'power-supply-a1',
    metadata: { circuit: 'A1-3' },
  });

  console.log(`Relationships: ${pump.getRelationships().length}`);

  pump.setState('active');
  console.log(`State: ${pump.getState()}`);

  // Example 2: Vehicle Fleet Twin
  console.log('\n📊 Example 2: Delivery Vehicle Digital Twin');
  console.log('-'.repeat(50));

  const vehicle = new DigitalTwinModel({
    id: 'vehicle-truck-042',
    name: 'Delivery Truck 042',
    type: 'delivery-vehicle',
    description: '3-ton delivery truck for Route 7',
    tags: ['fleet', 'delivery', 'route-7'],
  });

  // Vehicle properties
  vehicle.setProperty('vin', '1HGBH41JXMN109186', undefined, 'config');
  vehicle.setProperty('make', 'Ford', undefined, 'config');
  vehicle.setProperty('model', 'F-350', undefined, 'config');
  vehicle.setProperty('year', 2022, undefined, 'config');
  vehicle.setProperty('odometer', 45230, 'miles', 'vehicle-ecu');
  vehicle.setProperty('fuelLevel', 68, '%', 'fuel-sensor');
  vehicle.setProperty('speed', 35, 'mph', 'gps');
  vehicle.setProperty('engineTemp', 195, '°F', 'engine-sensor');
  vehicle.setProperty('tirePressureFL', 32, 'PSI', 'tpms');
  vehicle.setProperty('tirePressureFR', 32, 'PSI', 'tpms');
  vehicle.setProperty('tirePressureRL', 31, 'PSI', 'tpms');
  vehicle.setProperty('tirePressureRR', 30, 'PSI', 'tpms');
  vehicle.setProperty('currentRoute', 'Route-7-Morning', undefined, 'dispatch');
  vehicle.setProperty('driverId', 'driver-128', undefined, 'dispatch');

  // GPS location
  vehicle.setTransform({
    position: { x: -122.4194, y: 37.7749, z: 0 }, // Lat/Long
  });

  // Component health
  vehicle.setComponentHealth('engine', 'good', 82);
  vehicle.setComponentHealth('transmission', 'good', 85);
  vehicle.setComponentHealth('brakes', 'fair', 65, ['front pads at 40%']);
  vehicle.setComponentHealth('tires', 'good', 78, ['RR pressure low']);
  vehicle.setComponentHealth('battery', 'excellent', 92);

  vehicle.setState('active');

  console.log(`Created vehicle twin: ${vehicle.getTwin().metadata.name}`);
  console.log(`Current location: ${vehicle.getTransform()?.position.x.toFixed(4)}, ${vehicle.getTransform()?.position.y.toFixed(4)}`);
  console.log(`Health: ${vehicle.getTwin().health.overall}`);

  // Example 3: Smart Building Twin
  console.log('\n📊 Example 3: Smart Building HVAC System Twin');
  console.log('-'.repeat(50));

  const hvac = new DigitalTwinModel({
    id: 'hvac-building-5-floor-3',
    name: 'HVAC System - Building 5, Floor 3',
    type: 'hvac-system',
    description: 'Climate control for 3rd floor office space',
    tags: ['building-5', 'floor-3', 'hvac', 'smart-building'],
  });

  // HVAC properties
  hvac.setProperty('targetTemperature', 72, '°F', 'thermostat');
  hvac.setProperty('currentTemperature', 71.5, '°F', 'temp-sensor-array');
  hvac.setProperty('humidity', 45, '%', 'humidity-sensor');
  hvac.setProperty('airQualityIndex', 28, 'AQI', 'air-quality-sensor');
  hvac.setProperty('co2Level', 420, 'ppm', 'co2-sensor');
  hvac.setProperty('filterStatus', 82, '%', 'filter-monitor');
  hvac.setProperty('fanSpeed', 65, '%', 'fan-controller');
  hvac.setProperty('mode', 'cooling', undefined, 'controller');
  hvac.setProperty('occupancy', 24, 'people', 'occupancy-sensor');
  hvac.setProperty('energyConsumption', 12.5, 'kWh', 'energy-monitor');

  // Component health
  hvac.setComponentHealth('compressor', 'good', 88);
  hvac.setComponentHealth('fans', 'good', 90);
  hvac.setComponentHealth('filters', 'good', 82, ['change in 6 weeks']);
  hvac.setComponentHealth('ductwork', 'excellent', 95);
  hvac.setComponentHealth('sensors', 'good', 86);

  // Relationships
  hvac.addRelationship({
    type: 'parent',
    targetId: 'building-5',
    metadata: { floor: 3, zone: 'north-wing' },
  });
  hvac.addRelationship({
    type: 'connected',
    targetId: 'thermostat-5-3-01',
  });
  hvac.addRelationship({
    type: 'dependency',
    targetId: 'electrical-panel-5-3',
  });

  hvac.setState('active');

  console.log(`Created HVAC twin: ${hvac.getTwin().metadata.name}`);
  console.log(`Current temp: ${hvac.getProperty('currentTemperature')?.value}°F (target: ${hvac.getProperty('targetTemperature')?.value}°F)`);
  console.log(`Air quality: ${hvac.getProperty('airQualityIndex')?.value} AQI`);
  console.log(`Occupancy: ${hvac.getProperty('occupancy')?.value} people`);

  // Example 4: Change Tracking and History
  console.log('\n📊 Example 4: Change Tracking and History');
  console.log('-'.repeat(50));

  // Subscribe to changes
  const unsubscribe = pump.onChange((twin) => {
    console.log(`[CHANGE EVENT] ${twin.metadata.name} was updated`);
  });

  // Simulate sensor updates
  console.log('\nSimulating sensor updates...');
  pump.setProperty('temperature', 72, '°F', 'temp-sensor-01');
  pump.setProperty('vibration', 3.2, 'mm/s', 'vibration-sensor-01');
  pump.setProperty('pressure', 43, 'PSI', 'pressure-sensor-01');

  // Update health based on sensor data
  pump.setComponentHealth('bearings', 'degraded', 65, ['increased vibration', 'temperature rising']);

  console.log(`\nHistory entries: ${pump.getHistory().length}`);
  console.log('Recent history:');
  pump.getHistory(undefined, 5).forEach(entry => {
    console.log(`  [${entry.timestamp.toISOString()}] ${entry.type}: ${entry.description}`);
  });

  unsubscribe();

  // Example 5: Twin Cloning
  console.log('\n📊 Example 5: Twin Cloning');
  console.log('-'.repeat(50));

  const pumpClone = pump.clone('pump-002', 'Coolant Pump B');
  console.log(`Cloned twin: ${pumpClone.getTwin().metadata.name}`);
  console.log(`Clone properties: ${pumpClone.getAllProperties().length}`);
  console.log(`Original twin still has: ${pump.getAllProperties().length} properties`);

  // Example 6: Complex Relationships
  console.log('\n📊 Example 6: Complex Asset Relationships');
  console.log('-'.repeat(50));

  // Create manufacturing line twins
  const robot1 = new DigitalTwinModel({
    id: 'robot-arm-01',
    name: 'Assembly Robot 1',
    type: 'robotic-arm',
    tags: ['assembly-line-a', 'robotics'],
  });

  const robot2 = new DigitalTwinModel({
    id: 'robot-arm-02',
    name: 'Assembly Robot 2',
    type: 'robotic-arm',
    tags: ['assembly-line-a', 'robotics'],
  });

  const conveyor = new DigitalTwinModel({
    id: 'conveyor-belt-01',
    name: 'Main Conveyor',
    type: 'conveyor-system',
    tags: ['assembly-line-a', 'material-handling'],
  });

  // Build relationship network
  robot1.addRelationship({ type: 'sibling', targetId: 'robot-arm-02' });
  robot1.addRelationship({ type: 'connected', targetId: 'conveyor-belt-01', metadata: { position: 'station-1' } });

  robot2.addRelationship({ type: 'sibling', targetId: 'robot-arm-01' });
  robot2.addRelationship({ type: 'connected', targetId: 'conveyor-belt-01', metadata: { position: 'station-2' } });

  conveyor.addRelationship({ type: 'child', targetId: 'robot-arm-01' });
  conveyor.addRelationship({ type: 'child', targetId: 'robot-arm-02' });

  console.log('Assembly Line Relationship Map:');
  console.log(`  ${robot1.getTwin().metadata.name}: ${robot1.getRelationships().length} relationships`);
  console.log(`  ${robot2.getTwin().metadata.name}: ${robot2.getRelationships().length} relationships`);
  console.log(`  ${conveyor.getTwin().metadata.name}: ${conveyor.getRelationships().length} relationships`);

  console.log('\n' + '='.repeat(70));
  console.log('Digital Twin Model examples complete!');
  console.log('Created 6 different digital twins with properties, relationships, and health tracking');
}

// Run examples
main();
