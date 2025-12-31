/**
 * Water Conservation and Usage Tracking Example
 *
 * Demonstrates water consumption monitoring, leak detection,
 * conservation strategies, and water quality management.
 */

// ============================================================================
// Water Management Types
// ============================================================================

interface WaterMeter {
  id: string;
  location: string;
  type: 'main' | 'irrigation' | 'indoor' | 'industrial';
  reading: number; // cubic meters
  timestamp: Date;
  flowRate: number; // liters per minute
  pressure: number; // psi
}

interface WaterUsage {
  timestamp: Date;
  source: 'municipal' | 'well' | 'rainwater' | 'recycled';
  category: 'drinking' | 'irrigation' | 'sanitation' | 'cooling' | 'industrial' | 'other';
  volume: number; // liters
  cost: number; // $ per cubic meter
  quality: 'potable' | 'non-potable' | 'treated' | 'grey_water';
}

interface LeakDetection {
  id: string;
  timestamp: Date;
  location: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  estimatedLoss: number; // liters per day
  detected: boolean;
  repaired: boolean;
  costImpact: number; // $ per day
}

interface WaterQuality {
  timestamp: Date;
  location: string;
  pH: number;
  turbidity: number; // NTU
  tds: number; // Total Dissolved Solids (ppm)
  chlorine: number; // ppm
  hardness: number; // ppm as CaCO3
  bacteria: number; // CFU/100ml
  compliant: boolean;
}

interface ConservationMeasure {
  id: string;
  name: string;
  description: string;
  category: 'fixture' | 'behavior' | 'landscape' | 'technology' | 'recycling';
  estimatedSavings: number; // liters per day
  implementationCost: number; // $
  paybackPeriod: number; // months
  priority: 'high' | 'medium' | 'low';
}

interface IrrigationSchedule {
  zone: string;
  days: string[];
  startTime: string;
  duration: number; // minutes
  waterVolume: number; // liters
  efficiency: number; // 0-1
  soilMoisture: number; // percentage
  weatherAdjusted: boolean;
}

// ============================================================================
// Water Monitoring System
// ============================================================================

class WaterMonitor {
  private meters: Map<string, WaterMeter> = new Map();
  private usage: WaterUsage[] = [];
  private leaks: LeakDetection[] = [];
  private qualityTests: WaterQuality[] = [];
  private waterRate: number = 0.003; // $ per liter
  private sewerRate: number = 0.002; // $ per liter

  constructor(waterRate: number = 0.003, sewerRate: number = 0.002) {
    this.waterRate = waterRate;
    this.sewerRate = sewerRate;
  }

  /**
   * Register a water meter
   */
  registerMeter(meter: WaterMeter): void {
    this.meters.set(meter.id, meter);
    console.log(`Registered meter: ${meter.id} at ${meter.location}`);
  }

  /**
   * Record water usage
   */
  recordUsage(usage: WaterUsage): void {
    this.usage.push(usage);
  }

  /**
   * Update meter reading
   */
  updateMeter(meterId: string, reading: number, flowRate: number, pressure: number): void {
    const meter = this.meters.get(meterId);
    if (meter) {
      const previousReading = meter.reading;
      meter.reading = reading;
      meter.flowRate = flowRate;
      meter.pressure = pressure;
      meter.timestamp = new Date();

      // Check for abnormal flow (potential leak)
      if (flowRate > 0 && this.isNighttime()) {
        this.detectPotentialLeak(meterId, flowRate);
      }

      // Check for pressure issues
      if (pressure < 40 || pressure > 80) {
        console.log(`⚠ Warning: Abnormal pressure at ${meter.location}: ${pressure} psi`);
      }
    }
  }

  /**
   * Check if current time is nighttime (10 PM - 5 AM)
   */
  private isNighttime(): boolean {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 5;
  }

  /**
   * Detect potential leak
   */
  private detectPotentialLeak(meterId: string, flowRate: number): void {
    const meter = this.meters.get(meterId);
    if (!meter) return;

    // Nighttime flow threshold (liters per minute)
    const threshold = 2;

    if (flowRate > threshold) {
      const estimatedLoss = flowRate * 60 * 24; // liters per day
      let severity: LeakDetection['severity'];

      if (flowRate > 10) severity = 'critical';
      else if (flowRate > 5) severity = 'major';
      else if (flowRate > 2) severity = 'moderate';
      else severity = 'minor';

      const leak: LeakDetection = {
        id: `leak_${this.leaks.length + 1}`,
        timestamp: new Date(),
        location: meter.location,
        severity,
        estimatedLoss,
        detected: true,
        repaired: false,
        costImpact: (estimatedLoss / 1000) * (this.waterRate * 1000 + this.sewerRate * 1000),
      };

      this.leaks.push(leak);
      console.log(`🚨 Potential ${severity} leak detected at ${meter.location}!`);
      console.log(`   Estimated loss: ${estimatedLoss.toFixed(0)} liters/day ($${leak.costImpact.toFixed(2)}/day)`);
    }
  }

  /**
   * Test water quality
   */
  testWaterQuality(test: Omit<WaterQuality, 'compliant'>): WaterQuality {
    // Check compliance with EPA standards
    const compliant =
      test.pH >= 6.5 &&
      test.pH <= 8.5 &&
      test.turbidity < 1 &&
      test.tds < 500 &&
      test.chlorine >= 0.2 &&
      test.chlorine <= 4.0 &&
      test.bacteria === 0;

    const fullTest: WaterQuality = {
      ...test,
      compliant,
    };

    this.qualityTests.push(fullTest);

    if (!compliant) {
      console.log(`⚠ Water quality issue at ${test.location}:`);
      if (test.pH < 6.5 || test.pH > 8.5) console.log(`   - pH out of range: ${test.pH}`);
      if (test.turbidity >= 1) console.log(`   - High turbidity: ${test.turbidity} NTU`);
      if (test.tds >= 500) console.log(`   - High TDS: ${test.tds} ppm`);
      if (test.chlorine < 0.2 || test.chlorine > 4.0)
        console.log(`   - Chlorine out of range: ${test.chlorine} ppm`);
      if (test.bacteria > 0) console.log(`   - Bacteria detected: ${test.bacteria} CFU/100ml`);
    }

    return fullTest;
  }

  /**
   * Calculate total water consumption
   */
  getTotalConsumption(startDate?: Date, endDate?: Date): number {
    let filteredUsage = this.usage;

    if (startDate || endDate) {
      filteredUsage = this.usage.filter((u) => {
        const afterStart = !startDate || u.timestamp >= startDate;
        const beforeEnd = !endDate || u.timestamp <= endDate;
        return afterStart && beforeEnd;
      });
    }

    return filteredUsage.reduce((total, u) => total + u.volume, 0);
  }

  /**
   * Get consumption by category
   */
  getConsumptionByCategory(): Map<string, number> {
    const byCategory = new Map<string, number>();

    this.usage.forEach((u) => {
      const current = byCategory.get(u.category) || 0;
      byCategory.set(u.category, current + u.volume);
    });

    return byCategory;
  }

  /**
   * Calculate water cost
   */
  calculateCost(volume: number): { water: number; sewer: number; total: number } {
    const waterCost = (volume / 1000) * (this.waterRate * 1000);
    const sewerCost = (volume / 1000) * (this.sewerRate * 1000);
    const total = waterCost + sewerCost;

    return { water: waterCost, sewer: sewerCost, total };
  }

  /**
   * Get active leaks
   */
  getActiveLeaks(): LeakDetection[] {
    return this.leaks.filter((l) => l.detected && !l.repaired);
  }

  /**
   * Repair leak
   */
  repairLeak(leakId: string): void {
    const leak = this.leaks.find((l) => l.id === leakId);
    if (leak) {
      leak.repaired = true;
      console.log(`✓ Leak repaired at ${leak.location}`);
    }
  }

  /**
   * Generate conservation recommendations
   */
  generateConservationMeasures(): ConservationMeasure[] {
    const measures: ConservationMeasure[] = [];
    const consumption = this.getConsumptionByCategory();
    const totalDaily = this.getTotalConsumption() / 30; // Assume 30 days of data

    // Low-flow fixtures
    measures.push({
      id: 'measure_1',
      name: 'Install Low-Flow Fixtures',
      description: 'Replace toilets, faucets, and showerheads with low-flow alternatives',
      category: 'fixture',
      estimatedSavings: totalDaily * 0.3, // 30% reduction
      implementationCost: 2500,
      paybackPeriod: 0,
      priority: 'high',
    });

    // Irrigation optimization
    const irrigationUsage = consumption.get('irrigation') || 0;
    if (irrigationUsage > 0) {
      measures.push({
        id: 'measure_2',
        name: 'Smart Irrigation System',
        description: 'Install weather-based smart irrigation controller',
        category: 'technology',
        estimatedSavings: irrigationUsage * 0.25, // 25% reduction
        implementationCost: 1500,
        paybackPeriod: 0,
        priority: 'high',
      });

      measures.push({
        id: 'measure_3',
        name: 'Drip Irrigation',
        description: 'Convert spray irrigation to drip irrigation',
        category: 'landscape',
        estimatedSavings: irrigationUsage * 0.35, // 35% reduction
        implementationCost: 3000,
        paybackPeriod: 0,
        priority: 'medium',
      });
    }

    // Rainwater harvesting
    measures.push({
      id: 'measure_4',
      name: 'Rainwater Harvesting System',
      description: 'Install rainwater collection system for irrigation',
      category: 'recycling',
      estimatedSavings: 500, // liters per day
      implementationCost: 5000,
      paybackPeriod: 0,
      priority: 'medium',
    });

    // Grey water recycling
    measures.push({
      id: 'measure_5',
      name: 'Grey Water Recycling',
      description: 'Reuse water from sinks and showers for toilet flushing',
      category: 'recycling',
      estimatedSavings: totalDaily * 0.15, // 15% reduction
      implementationCost: 8000,
      paybackPeriod: 0,
      priority: 'low',
    });

    // Calculate payback periods
    measures.forEach((measure) => {
      const annualSavings = (measure.estimatedSavings * 365) / 1000; // cubic meters
      const costSavings = annualSavings * (this.waterRate * 1000 + this.sewerRate * 1000);
      measure.paybackPeriod =
        costSavings > 0 ? Math.round((measure.implementationCost / costSavings) * 12) : 999;
    });

    return measures.sort((a, b) => a.paybackPeriod - b.paybackPeriod);
  }

  /**
   * Generate detailed report
   */
  generateReport(): void {
    const totalConsumption = this.getTotalConsumption();
    const byCategory = this.getConsumptionByCategory();
    const costs = this.calculateCost(totalConsumption);
    const activeLeaks = this.getActiveLeaks();
    const totalLeakLoss = activeLeaks.reduce((sum, l) => sum + l.estimatedLoss, 0);

    console.log('\n' + '='.repeat(70));
    console.log('WATER MONITORING REPORT');
    console.log('='.repeat(70));

    console.log('\n--- Consumption Summary ---');
    console.log(`Total Consumption: ${(totalConsumption / 1000).toFixed(2)} cubic meters`);
    console.log(`Water Cost: $${costs.water.toFixed(2)}`);
    console.log(`Sewer Cost: $${costs.sewer.toFixed(2)}`);
    console.log(`Total Cost: $${costs.total.toFixed(2)}`);

    console.log('\n--- Consumption by Category ---');
    const sortedCategories = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
    sortedCategories.forEach(([category, volume]) => {
      const percentage = ((volume / totalConsumption) * 100).toFixed(1);
      console.log(`  ${category}: ${(volume / 1000).toFixed(2)} m³ (${percentage}%)`);
    });

    if (activeLeaks.length > 0) {
      console.log('\n--- Active Leaks ---');
      console.log(`Number of Leaks: ${activeLeaks.length}`);
      console.log(`Estimated Daily Loss: ${totalLeakLoss.toFixed(0)} liters`);
      console.log(`Estimated Annual Cost: $${(totalLeakLoss * 365 * (this.waterRate + this.sewerRate)).toFixed(2)}`);

      activeLeaks.forEach((leak) => {
        console.log(`\n  ${leak.id} - ${leak.severity.toUpperCase()}`);
        console.log(`    Location: ${leak.location}`);
        console.log(`    Loss: ${leak.estimatedLoss.toFixed(0)} L/day`);
        console.log(`    Cost Impact: $${leak.costImpact.toFixed(2)}/day`);
      });
    }

    if (this.qualityTests.length > 0) {
      console.log('\n--- Water Quality ---');
      const compliantTests = this.qualityTests.filter((t) => t.compliant).length;
      const complianceRate = (compliantTests / this.qualityTests.length) * 100;
      console.log(`Compliance Rate: ${complianceRate.toFixed(1)}%`);
      console.log(`Tests Performed: ${this.qualityTests.length}`);

      const latestTest = this.qualityTests[this.qualityTests.length - 1];
      console.log(`\nLatest Test (${latestTest.location}):`);
      console.log(`  pH: ${latestTest.pH.toFixed(2)} (target: 6.5-8.5)`);
      console.log(`  Turbidity: ${latestTest.turbidity.toFixed(2)} NTU (target: <1)`);
      console.log(`  TDS: ${latestTest.tds} ppm (target: <500)`);
      console.log(`  Chlorine: ${latestTest.chlorine.toFixed(2)} ppm (target: 0.2-4.0)`);
      console.log(`  Status: ${latestTest.compliant ? '✓ Compliant' : '✗ Non-compliant'}`);
    }

    console.log('\n--- Conservation Opportunities ---');
    const measures = this.generateConservationMeasures();
    measures.slice(0, 5).forEach((measure, i) => {
      console.log(`\n${i + 1}. ${measure.name} (${measure.priority} priority)`);
      console.log(`   ${measure.description}`);
      console.log(`   Savings: ${measure.estimatedSavings.toFixed(0)} L/day (${(measure.estimatedSavings * 365 / 1000).toFixed(1)} m³/year)`);
      console.log(`   Investment: $${measure.implementationCost.toLocaleString()}`);
      if (measure.paybackPeriod < 999) {
        console.log(`   Payback: ${measure.paybackPeriod} months`);
      } else {
        console.log(`   Payback: Environmental benefit (not cost-justified)`);
      }
    });
  }
}

// ============================================================================
// Smart Irrigation System
// ============================================================================

class SmartIrrigation {
  private schedules: Map<string, IrrigationSchedule> = new Map();
  private weatherData: { temperature: number; rainfall: number; humidity: number } = {
    temperature: 25,
    rainfall: 0,
    humidity: 60,
  };

  /**
   * Add irrigation zone
   */
  addZone(schedule: IrrigationSchedule): void {
    this.schedules.set(schedule.zone, schedule);
    console.log(`Added irrigation zone: ${schedule.zone}`);
  }

  /**
   * Update weather data
   */
  updateWeather(temperature: number, rainfall: number, humidity: number): void {
    this.weatherData = { temperature, rainfall, humidity };
  }

  /**
   * Calculate ET (Evapotranspiration) adjustment
   */
  private calculateETAdjustment(): number {
    const { temperature, rainfall, humidity } = this.weatherData;

    // Simplified ET calculation
    let adjustment = 1.0;

    // Temperature factor
    if (temperature < 15) adjustment *= 0.7;
    else if (temperature > 30) adjustment *= 1.3;

    // Rainfall factor
    if (rainfall > 5) adjustment *= 0.5;
    else if (rainfall > 2) adjustment *= 0.7;

    // Humidity factor
    if (humidity > 80) adjustment *= 0.8;
    else if (humidity < 40) adjustment *= 1.2;

    return Math.max(0, Math.min(adjustment, 1.5));
  }

  /**
   * Optimize irrigation schedule based on weather
   */
  optimizeSchedules(): Map<string, IrrigationSchedule> {
    const optimized = new Map<string, IrrigationSchedule>();
    const etAdjustment = this.calculateETAdjustment();

    console.log(`\nWeather-based ET adjustment: ${(etAdjustment * 100).toFixed(0)}%`);

    this.schedules.forEach((schedule, zone) => {
      const adjustedSchedule = { ...schedule };

      // Skip irrigation if it rained recently
      if (this.weatherData.rainfall > 10) {
        adjustedSchedule.duration = 0;
        adjustedSchedule.waterVolume = 0;
        console.log(`  ${zone}: Irrigation skipped due to rainfall`);
      } else {
        // Adjust duration based on ET
        adjustedSchedule.duration = Math.round(schedule.duration * etAdjustment);
        adjustedSchedule.waterVolume = schedule.waterVolume * etAdjustment;
        adjustedSchedule.weatherAdjusted = true;

        const change = ((etAdjustment - 1) * 100).toFixed(0);
        const changeStr = etAdjustment >= 1 ? `+${change}%` : `${change}%`;
        console.log(`  ${zone}: Duration adjusted ${changeStr} to ${adjustedSchedule.duration} min`);
      }

      optimized.set(zone, adjustedSchedule);
    });

    return optimized;
  }

  /**
   * Calculate total water usage
   */
  calculateTotalUsage(): number {
    let total = 0;
    this.schedules.forEach((schedule) => {
      total += schedule.waterVolume * schedule.days.length;
    });
    return total;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('\n' + '*'.repeat(70));
  console.log('WATER CONSERVATION - COMPREHENSIVE EXAMPLE');
  console.log('*'.repeat(70));

  // ============================================================================
  // Water Monitoring
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('WATER MONITORING SYSTEM');
  console.log('='.repeat(70));

  const monitor = new WaterMonitor(0.003, 0.002);

  // Register meters
  console.log('\n--- Registering Water Meters ---\n');
  monitor.registerMeter({
    id: 'main_meter',
    location: 'Building Main',
    type: 'main',
    reading: 15000,
    timestamp: new Date(),
    flowRate: 25,
    pressure: 60,
  });

  monitor.registerMeter({
    id: 'irrigation_meter',
    location: 'Landscape System',
    type: 'irrigation',
    reading: 3000,
    timestamp: new Date(),
    flowRate: 50,
    pressure: 45,
  });

  // Simulate monthly water usage
  console.log('\n--- Recording Monthly Water Usage ---\n');

  const usageData = [
    { source: 'municipal' as const, category: 'sanitation' as const, volume: 45000, quality: 'potable' as const },
    { source: 'municipal' as const, category: 'drinking' as const, volume: 15000, quality: 'potable' as const },
    { source: 'municipal' as const, category: 'irrigation' as const, volume: 80000, quality: 'potable' as const },
    { source: 'municipal' as const, category: 'cooling' as const, volume: 30000, quality: 'non-potable' as const },
    { source: 'rainwater' as const, category: 'irrigation' as const, volume: 12000, quality: 'non-potable' as const },
  ];

  usageData.forEach((data) => {
    const usage: WaterUsage = {
      ...data,
      timestamp: new Date(),
      cost: 0.003,
    };
    monitor.recordUsage(usage);
    console.log(`Recorded: ${data.volume.toLocaleString()} L of ${data.category} water from ${data.source}`);
  });

  // Simulate meter readings with potential leak
  console.log('\n--- Simulating Meter Readings ---\n');
  monitor.updateMeter('main_meter', 15100, 25, 60);
  monitor.updateMeter('main_meter', 15200, 3.5, 58); // Potential leak detected

  // Test water quality
  console.log('\n--- Water Quality Testing ---\n');
  monitor.testWaterQuality({
    timestamp: new Date(),
    location: 'Main Supply',
    pH: 7.2,
    turbidity: 0.3,
    tds: 180,
    chlorine: 0.8,
    hardness: 120,
    bacteria: 0,
  });

  monitor.testWaterQuality({
    timestamp: new Date(),
    location: 'Cooling Tower',
    pH: 8.1,
    turbidity: 0.5,
    tds: 320,
    chlorine: 1.2,
    hardness: 250,
    bacteria: 0,
  });

  // Generate report
  monitor.generateReport();

  // ============================================================================
  // Smart Irrigation
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('SMART IRRIGATION SYSTEM');
  console.log('='.repeat(70));

  const irrigation = new SmartIrrigation();

  // Add irrigation zones
  console.log('\n--- Setting Up Irrigation Zones ---\n');
  irrigation.addZone({
    zone: 'Front Lawn',
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '06:00',
    duration: 20,
    waterVolume: 200,
    efficiency: 0.75,
    soilMoisture: 45,
    weatherAdjusted: false,
  });

  irrigation.addZone({
    zone: 'Garden Beds',
    days: ['Tue', 'Thu', 'Sat'],
    startTime: '06:00',
    duration: 15,
    waterVolume: 150,
    efficiency: 0.90, // Drip irrigation
    soilMoisture: 55,
    weatherAdjusted: false,
  });

  irrigation.addZone({
    zone: 'Back Lawn',
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '18:00',
    duration: 25,
    waterVolume: 250,
    efficiency: 0.70,
    soilMoisture: 40,
    weatherAdjusted: false,
  });

  // Scenario 1: Normal weather
  console.log('\n--- Scenario 1: Normal Weather ---');
  irrigation.updateWeather(25, 0, 60);
  irrigation.optimizeSchedules();
  const normalUsage = irrigation.calculateTotalUsage();
  console.log(`Weekly water usage: ${normalUsage.toLocaleString()} L`);

  // Scenario 2: After rainfall
  console.log('\n--- Scenario 2: After Heavy Rainfall ---');
  irrigation.updateWeather(22, 15, 80);
  irrigation.optimizeSchedules();
  const rainUsage = irrigation.calculateTotalUsage();
  console.log(`Weekly water usage: ${rainUsage.toLocaleString()} L`);
  console.log(`Savings: ${((normalUsage - rainUsage) / normalUsage * 100).toFixed(1)}%`);

  // Scenario 3: Hot and dry
  console.log('\n--- Scenario 3: Hot and Dry Weather ---');
  irrigation.updateWeather(35, 0, 30);
  irrigation.optimizeSchedules();
  const hotUsage = irrigation.calculateTotalUsage();
  console.log(`Weekly water usage: ${hotUsage.toLocaleString()} L`);
  console.log(`Increase: ${((hotUsage - normalUsage) / normalUsage * 100).toFixed(1)}%`);

  console.log('\n' + '*'.repeat(70));
  console.log('Example completed successfully!');
  console.log('*'.repeat(70) + '\n');
}

main().catch(console.error);
