/**
 * Energy Monitoring System Example
 *
 * Demonstrates real-time energy monitoring, consumption tracking,
 * and optimization strategies for buildings and facilities.
 */

// ============================================================================
// Energy Monitoring Types
// ============================================================================

interface EnergyReading {
  timestamp: Date;
  deviceId: string;
  consumption: number; // kWh
  power: number; // kW (instantaneous)
  voltage: number; // V
  current: number; // A
  powerFactor: number;
  source: 'grid' | 'solar' | 'wind' | 'battery';
}

interface EnergyDevice {
  id: string;
  name: string;
  type: 'hvac' | 'lighting' | 'appliance' | 'equipment' | 'ev_charger';
  location: string;
  ratedPower: number; // kW
  priority: 'critical' | 'high' | 'medium' | 'low';
  schedulable: boolean;
}

interface EnergyAlert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
  type: 'high_consumption' | 'anomaly' | 'efficiency' | 'cost';
  message: string;
  deviceId?: string;
  recommendedAction?: string;
}

interface EnergyOptimization {
  id: string;
  name: string;
  description: string;
  estimatedSavings: number; // kWh/year
  costSavings: number; // $/year
  co2Reduction: number; // kg/year
  implementationCost: number; // $
  paybackPeriod: number; // months
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Energy Monitoring System
// ============================================================================

class EnergyMonitor {
  private readings: EnergyReading[] = [];
  private devices: Map<string, EnergyDevice> = new Map();
  private alerts: EnergyAlert[] = [];
  private baselinePower: number = 0;
  private energyRate: number = 0.12; // $/kWh
  private peakRate: number = 0.18; // $/kWh during peak hours

  constructor(energyRate: number = 0.12, peakRate: number = 0.18) {
    this.energyRate = energyRate;
    this.peakRate = peakRate;
  }

  /**
   * Register an energy-consuming device
   */
  registerDevice(device: EnergyDevice): void {
    this.devices.set(device.id, device);
    console.log(`Registered device: ${device.name} (${device.ratedPower} kW)`);
  }

  /**
   * Record an energy reading
   */
  recordReading(reading: EnergyReading): void {
    this.readings.push(reading);
    this.checkForAnomalies(reading);
  }

  /**
   * Simulate real-time monitoring
   */
  async simulateMonitoring(durationMinutes: number = 60): Promise<void> {
    console.log(`\nSimulating ${durationMinutes} minutes of energy monitoring...\n`);

    const startTime = new Date();
    const intervalMinutes = 5;
    const readings = Math.floor(durationMinutes / intervalMinutes);

    for (let i = 0; i < readings; i++) {
      const timestamp = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000);

      // Simulate varying consumption patterns
      const baseLoad = 50; // kW
      const variableLoad = Math.sin(i / 2) * 20 + Math.random() * 10;
      const power = baseLoad + variableLoad;

      const reading: EnergyReading = {
        timestamp,
        deviceId: 'main_meter',
        consumption: (power * intervalMinutes) / 60, // kWh for this interval
        power,
        voltage: 240 + (Math.random() - 0.5) * 5,
        current: (power * 1000) / 240,
        powerFactor: 0.92 + Math.random() * 0.05,
        source: 'grid',
      };

      this.recordReading(reading);

      if (i % 3 === 0) {
        console.log(
          `[${timestamp.toLocaleTimeString()}] Power: ${reading.power.toFixed(1)} kW, ` +
            `Consumption: ${reading.consumption.toFixed(2)} kWh, ` +
            `PF: ${reading.powerFactor.toFixed(2)}`
        );
      }
    }
  }

  /**
   * Check for consumption anomalies
   */
  private checkForAnomalies(reading: EnergyReading): void {
    // High consumption alert
    if (reading.power > 80) {
      this.addAlert({
        id: `alert_${Date.now()}`,
        timestamp: reading.timestamp,
        severity: 'warning',
        type: 'high_consumption',
        message: `High power consumption detected: ${reading.power.toFixed(1)} kW`,
        recommendedAction: 'Check for unnecessary loads or equipment issues',
      });
    }

    // Low power factor alert
    if (reading.powerFactor < 0.85) {
      this.addAlert({
        id: `alert_${Date.now()}`,
        timestamp: reading.timestamp,
        severity: 'warning',
        type: 'efficiency',
        message: `Low power factor: ${reading.powerFactor.toFixed(2)}`,
        recommendedAction: 'Consider installing power factor correction equipment',
      });
    }
  }

  /**
   * Add an alert
   */
  private addAlert(alert: EnergyAlert): void {
    this.alerts.push(alert);
  }

  /**
   * Get current power consumption
   */
  getCurrentPower(): number {
    if (this.readings.length === 0) return 0;
    return this.readings[this.readings.length - 1].power;
  }

  /**
   * Get total energy consumption
   */
  getTotalConsumption(startDate?: Date, endDate?: Date): number {
    let readings = this.readings;

    if (startDate || endDate) {
      readings = readings.filter((r) => {
        const afterStart = !startDate || r.timestamp >= startDate;
        const beforeEnd = !endDate || r.timestamp <= endDate;
        return afterStart && beforeEnd;
      });
    }

    return readings.reduce((total, r) => total + r.consumption, 0);
  }

  /**
   * Calculate energy cost
   */
  calculateCost(consumption: number, peakHours: boolean = false): number {
    const rate = peakHours ? this.peakRate : this.energyRate;
    return consumption * rate;
  }

  /**
   * Get peak demand
   */
  getPeakDemand(startDate?: Date, endDate?: Date): { power: number; timestamp: Date } {
    let readings = this.readings;

    if (startDate || endDate) {
      readings = readings.filter((r) => {
        const afterStart = !startDate || r.timestamp >= startDate;
        const beforeEnd = !endDate || r.timestamp <= endDate;
        return afterStart && beforeEnd;
      });
    }

    if (readings.length === 0) {
      return { power: 0, timestamp: new Date() };
    }

    const peak = readings.reduce((max, r) => (r.power > max.power ? r : max));
    return { power: peak.power, timestamp: peak.timestamp };
  }

  /**
   * Calculate average power factor
   */
  getAveragePowerFactor(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((total, r) => total + r.powerFactor, 0);
    return sum / this.readings.length;
  }

  /**
   * Get energy consumption by time of day
   */
  getConsumptionByHour(): Map<number, number> {
    const hourlyConsumption = new Map<number, number>();

    for (let i = 0; i < 24; i++) {
      hourlyConsumption.set(i, 0);
    }

    for (const reading of this.readings) {
      const hour = reading.timestamp.getHours();
      const current = hourlyConsumption.get(hour) || 0;
      hourlyConsumption.set(hour, current + reading.consumption);
    }

    return hourlyConsumption;
  }

  /**
   * Analyze consumption patterns
   */
  analyzePatterns(): {
    averagePower: number;
    peakPower: number;
    minimumPower: number;
    loadFactor: number;
    averagePowerFactor: number;
  } {
    if (this.readings.length === 0) {
      return {
        averagePower: 0,
        peakPower: 0,
        minimumPower: 0,
        loadFactor: 0,
        averagePowerFactor: 0,
      };
    }

    const powers = this.readings.map((r) => r.power);
    const averagePower = powers.reduce((a, b) => a + b, 0) / powers.length;
    const peakPower = Math.max(...powers);
    const minimumPower = Math.min(...powers);
    const loadFactor = averagePower / peakPower;
    const averagePowerFactor = this.getAveragePowerFactor();

    return {
      averagePower,
      peakPower,
      minimumPower,
      loadFactor,
      averagePowerFactor,
    };
  }

  /**
   * Get active alerts
   */
  getAlerts(severity?: 'critical' | 'warning' | 'info'): EnergyAlert[] {
    if (severity) {
      return this.alerts.filter((a) => a.severity === severity);
    }
    return [...this.alerts];
  }

  /**
   * Generate optimization recommendations
   */
  generateOptimizations(): EnergyOptimization[] {
    const optimizations: EnergyOptimization[] = [];
    const analysis = this.analyzePatterns();

    // LED lighting upgrade
    optimizations.push({
      id: 'opt_1',
      name: 'LED Lighting Upgrade',
      description: 'Replace all fluorescent and incandescent lighting with LED fixtures',
      estimatedSavings: 12000, // kWh/year
      costSavings: 12000 * this.energyRate,
      co2Reduction: 12000 * 0.42, // kg CO2e
      implementationCost: 8000,
      paybackPeriod: Math.round((8000 / (12000 * this.energyRate)) * 12),
      priority: 'high',
    });

    // HVAC optimization
    if (analysis.averagePower > 40) {
      optimizations.push({
        id: 'opt_2',
        name: 'HVAC System Optimization',
        description: 'Install smart thermostats and optimize HVAC schedules',
        estimatedSavings: 18000,
        costSavings: 18000 * this.energyRate,
        co2Reduction: 18000 * 0.42,
        implementationCost: 12000,
        paybackPeriod: Math.round((12000 / (18000 * this.energyRate)) * 12),
        priority: 'high',
      });
    }

    // Power factor correction
    if (analysis.averagePowerFactor < 0.90) {
      optimizations.push({
        id: 'opt_3',
        name: 'Power Factor Correction',
        description: 'Install capacitor banks to improve power factor',
        estimatedSavings: 5000,
        costSavings: 5000 * this.energyRate + 500, // includes demand charge reduction
        co2Reduction: 5000 * 0.42,
        implementationCost: 15000,
        paybackPeriod: Math.round((15000 / (5000 * this.energyRate + 500)) * 12),
        priority: 'medium',
      });
    }

    // Load scheduling
    optimizations.push({
      id: 'opt_4',
      name: 'Load Scheduling',
      description: 'Shift non-critical loads to off-peak hours',
      estimatedSavings: 8000,
      costSavings: 8000 * (this.peakRate - this.energyRate),
      co2Reduction: 8000 * 0.42,
      implementationCost: 3000,
      paybackPeriod: Math.round((3000 / (8000 * (this.peakRate - this.energyRate))) * 12),
      priority: 'medium',
    });

    // Energy management system
    optimizations.push({
      id: 'opt_5',
      name: 'Building Energy Management System',
      description: 'Install comprehensive BMS for real-time monitoring and control',
      estimatedSavings: 25000,
      costSavings: 25000 * this.energyRate,
      co2Reduction: 25000 * 0.42,
      implementationCost: 50000,
      paybackPeriod: Math.round((50000 / (25000 * this.energyRate)) * 12),
      priority: 'high',
    });

    return optimizations.sort((a, b) => a.paybackPeriod - b.paybackPeriod);
  }

  /**
   * Generate detailed report
   */
  generateReport(): void {
    const totalConsumption = this.getTotalConsumption();
    const totalCost = this.calculateCost(totalConsumption);
    const peak = this.getPeakDemand();
    const analysis = this.analyzePatterns();
    const co2Emissions = totalConsumption * 0.42; // kg CO2e

    console.log('\n' + '='.repeat(70));
    console.log('ENERGY MONITORING REPORT');
    console.log('='.repeat(70));

    console.log('\n--- Summary ---');
    console.log(`Total Consumption: ${totalConsumption.toFixed(2)} kWh`);
    console.log(`Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`CO2 Emissions: ${co2Emissions.toFixed(2)} kg`);
    console.log(`Number of Readings: ${this.readings.length}`);

    console.log('\n--- Demand Analysis ---');
    console.log(`Peak Demand: ${peak.power.toFixed(2)} kW at ${peak.timestamp.toLocaleString()}`);
    console.log(`Average Power: ${analysis.averagePower.toFixed(2)} kW`);
    console.log(`Minimum Power: ${analysis.minimumPower.toFixed(2)} kW`);
    console.log(`Load Factor: ${(analysis.loadFactor * 100).toFixed(1)}%`);

    console.log('\n--- Power Quality ---');
    console.log(`Average Power Factor: ${analysis.averagePowerFactor.toFixed(3)}`);
    if (analysis.averagePowerFactor < 0.90) {
      console.log('  ⚠ Warning: Low power factor detected. Consider correction equipment.');
    }

    console.log('\n--- Consumption by Hour ---');
    const hourlyData = this.getConsumptionByHour();
    const sortedHours = Array.from(hourlyData.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log('Top 5 consumption hours:');
    sortedHours.forEach(([hour, consumption], i) => {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      console.log(`  ${i + 1}. ${timeStr} - ${consumption.toFixed(2)} kWh`);
    });

    if (this.alerts.length > 0) {
      console.log('\n--- Active Alerts ---');
      const criticalAlerts = this.getAlerts('critical');
      const warningAlerts = this.getAlerts('warning');

      if (criticalAlerts.length > 0) {
        console.log(`Critical: ${criticalAlerts.length}`);
        criticalAlerts.slice(0, 3).forEach((alert) => {
          console.log(`  - ${alert.message}`);
        });
      }

      if (warningAlerts.length > 0) {
        console.log(`Warnings: ${warningAlerts.length}`);
        warningAlerts.slice(0, 3).forEach((alert) => {
          console.log(`  - ${alert.message}`);
        });
      }
    }

    console.log('\n--- Optimization Opportunities ---');
    const optimizations = this.generateOptimizations();
    optimizations.slice(0, 5).forEach((opt, i) => {
      console.log(`\n${i + 1}. ${opt.name} (${opt.priority} priority)`);
      console.log(`   ${opt.description}`);
      console.log(`   Savings: ${opt.estimatedSavings.toLocaleString()} kWh/year ($${opt.costSavings.toFixed(0)}/year)`);
      console.log(`   CO2 Reduction: ${opt.co2Reduction.toFixed(0)} kg/year`);
      console.log(`   Investment: $${opt.implementationCost.toLocaleString()}`);
      console.log(`   Payback Period: ${opt.paybackPeriod} months`);
    });
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('\n' + '*'.repeat(70));
  console.log('ENERGY MONITORING SYSTEM - COMPREHENSIVE EXAMPLE');
  console.log('*'.repeat(70));

  // Create energy monitor
  const monitor = new EnergyMonitor(0.12, 0.18);

  // Register devices
  console.log('\n--- Registering Devices ---\n');
  monitor.registerDevice({
    id: 'hvac_001',
    name: 'Main HVAC System',
    type: 'hvac',
    location: 'Mechanical Room',
    ratedPower: 25,
    priority: 'high',
    schedulable: true,
  });

  monitor.registerDevice({
    id: 'lighting_floor1',
    name: 'Floor 1 Lighting',
    type: 'lighting',
    location: 'Floor 1',
    ratedPower: 5,
    priority: 'medium',
    schedulable: true,
  });

  monitor.registerDevice({
    id: 'ev_charger_001',
    name: 'EV Charging Station',
    type: 'ev_charger',
    location: 'Parking Lot',
    ratedPower: 11,
    priority: 'low',
    schedulable: true,
  });

  // Simulate monitoring
  await monitor.simulateMonitoring(120); // 2 hours

  // Generate comprehensive report
  monitor.generateReport();

  console.log('\n' + '*'.repeat(70));
  console.log('Example completed successfully!');
  console.log('*'.repeat(70) + '\n');
}

main().catch(console.error);
