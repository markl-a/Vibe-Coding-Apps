/**
 * Renewable Energy System Example
 *
 * Demonstrates solar and wind energy calculations, production forecasting,
 * battery storage optimization, and grid integration.
 */

// ============================================================================
// Renewable Energy Types
// ============================================================================

interface SolarPanel {
  id: string;
  manufacturer: string;
  model: string;
  ratedPower: number; // Watts
  efficiency: number; // 0-1
  area: number; // square meters
  temperature: number; // Celsius
  angle: number; // degrees from horizontal
  azimuth: number; // degrees (0=North, 90=East, 180=South, 270=West)
}

interface SolarProduction {
  timestamp: Date;
  irradiance: number; // W/m²
  temperature: number; // Celsius
  cloudCover: number; // 0-1
  power: number; // kW actual production
  energy: number; // kWh for the period
  efficiency: number; // actual vs theoretical
}

interface WindTurbine {
  id: string;
  manufacturer: string;
  model: string;
  ratedPower: number; // kW
  cutInSpeed: number; // m/s
  ratedSpeed: number; // m/s
  cutOutSpeed: number; // m/s
  rotorDiameter: number; // meters
  hubHeight: number; // meters
}

interface WindProduction {
  timestamp: Date;
  windSpeed: number; // m/s
  windDirection: number; // degrees
  power: number; // kW actual production
  energy: number; // kWh for the period
  capacity: number; // capacity factor 0-1
}

interface BatteryStorage {
  id: string;
  capacity: number; // kWh
  maxCharge: number; // kW
  maxDischarge: number; // kW
  currentCharge: number; // kWh
  efficiency: number; // 0-1 (round-trip)
  cycleCount: number;
  health: number; // 0-1 (state of health)
}

interface EnergyForecast {
  timestamp: Date;
  solar: number; // kWh expected
  wind: number; // kWh expected
  demand: number; // kWh expected
  confidence: number; // 0-1
}

// ============================================================================
// Solar Energy Calculator
// ============================================================================

class SolarEnergySystem {
  private panels: SolarPanel[] = [];
  private production: SolarProduction[] = [];

  /**
   * Add solar panel
   */
  addPanel(panel: SolarPanel): void {
    this.panels.push(panel);
    console.log(`Added panel: ${panel.manufacturer} ${panel.model} (${panel.ratedPower}W)`);
  }

  /**
   * Calculate solar power production
   */
  calculateProduction(
    irradiance: number,
    temperature: number,
    cloudCover: number,
    timestamp: Date = new Date()
  ): SolarProduction {
    let totalPower = 0;

    for (const panel of this.panels) {
      // Temperature coefficient (typically -0.4% to -0.5% per degree C above 25°C)
      const tempCoefficient = -0.004;
      const tempLoss = tempCoefficient * (temperature - 25);
      const tempEfficiency = 1 + tempLoss;

      // Cloud impact
      const cloudFactor = 1 - cloudCover * 0.75;

      // Calculate power
      const effectiveIrradiance = irradiance * cloudFactor;
      const theoreticalPower =
        (panel.area * effectiveIrradiance * panel.efficiency) / 1000; // kW
      const actualPower = theoreticalPower * tempEfficiency;

      totalPower += Math.max(0, actualPower);
    }

    const production: SolarProduction = {
      timestamp,
      irradiance,
      temperature,
      cloudCover,
      power: totalPower,
      energy: totalPower * (1 / 60), // Assuming 1-minute intervals
      efficiency: this.panels.length > 0 ? this.panels[0].efficiency : 0,
    };

    this.production.push(production);
    return production;
  }

  /**
   * Simulate daily solar production
   */
  simulateDailyProduction(date: Date = new Date()): number {
    console.log(`\nSimulating solar production for ${date.toDateString()}...`);

    let totalEnergy = 0;
    const readings: SolarProduction[] = [];

    // Simulate 24 hours with hourly readings
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(date);
      timestamp.setHours(hour, 0, 0, 0);

      // Simulate solar irradiance (bell curve during daylight)
      let irradiance = 0;
      if (hour >= 6 && hour <= 18) {
        const solarNoon = 12;
        const hourFromNoon = Math.abs(hour - solarNoon);
        irradiance = 1000 * Math.cos((hourFromNoon * Math.PI) / 12);
        irradiance = Math.max(0, irradiance);
      }

      // Random cloud cover
      const cloudCover = Math.random() * 0.3;

      // Temperature varies through day
      const temperature = 20 + Math.sin(((hour - 6) * Math.PI) / 12) * 10;

      const production = this.calculateProduction(irradiance, temperature, cloudCover, timestamp);
      readings.push(production);
      totalEnergy += production.energy * 60; // Convert to hourly
    }

    // Print summary
    const peakProduction = Math.max(...readings.map((r) => r.power));
    const avgProduction = readings.reduce((sum, r) => sum + r.power, 0) / readings.length;

    console.log(`Total Energy: ${totalEnergy.toFixed(2)} kWh`);
    console.log(`Peak Power: ${peakProduction.toFixed(2)} kW`);
    console.log(`Average Power: ${avgProduction.toFixed(2)} kW`);

    return totalEnergy;
  }

  /**
   * Calculate annual production estimate
   */
  estimateAnnualProduction(): {
    total: number;
    byMonth: number[];
    capacity: number;
    capacityFactor: number;
  } {
    const systemCapacity = this.panels.reduce((sum, p) => sum + p.ratedPower, 0) / 1000; // kW
    const peakSunHours = 4.5; // Average for US
    const performanceRatio = 0.75; // System losses

    const monthlyProduction: number[] = [];
    const seasonalFactors = [0.7, 0.8, 0.9, 1.0, 1.1, 1.1, 1.1, 1.0, 0.95, 0.85, 0.75, 0.7];

    let annualTotal = 0;

    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(2024, month + 1, 0).getDate();
      const monthlyEnergy =
        systemCapacity * peakSunHours * daysInMonth * performanceRatio * seasonalFactors[month];
      monthlyProduction.push(monthlyEnergy);
      annualTotal += monthlyEnergy;
    }

    const capacityFactor = annualTotal / (systemCapacity * 8760);

    return {
      total: annualTotal,
      byMonth: monthlyProduction,
      capacity: systemCapacity,
      capacityFactor,
    };
  }

  /**
   * Get total system capacity
   */
  getTotalCapacity(): number {
    return this.panels.reduce((sum, p) => sum + p.ratedPower, 0) / 1000; // kW
  }
}

// ============================================================================
// Wind Energy Calculator
// ============================================================================

class WindEnergySystem {
  private turbines: WindTurbine[] = [];
  private production: WindProduction[] = [];

  /**
   * Add wind turbine
   */
  addTurbine(turbine: WindTurbine): void {
    this.turbines.push(turbine);
    console.log(`Added turbine: ${turbine.manufacturer} ${turbine.model} (${turbine.ratedPower}kW)`);
  }

  /**
   * Calculate wind power production
   */
  calculateProduction(
    windSpeed: number,
    windDirection: number,
    timestamp: Date = new Date()
  ): WindProduction {
    let totalPower = 0;

    for (const turbine of this.turbines) {
      let power = 0;

      if (windSpeed < turbine.cutInSpeed || windSpeed > turbine.cutOutSpeed) {
        // No production below cut-in or above cut-out speed
        power = 0;
      } else if (windSpeed >= turbine.ratedSpeed) {
        // Rated power
        power = turbine.ratedPower;
      } else {
        // Linear approximation between cut-in and rated speed
        const speedRange = turbine.ratedSpeed - turbine.cutInSpeed;
        const speedRatio = (windSpeed - turbine.cutInSpeed) / speedRange;
        power = turbine.ratedPower * Math.pow(speedRatio, 3);
      }

      totalPower += power;
    }

    const totalCapacity = this.turbines.reduce((sum, t) => sum + t.ratedPower, 0);
    const capacityFactor = totalCapacity > 0 ? totalPower / totalCapacity : 0;

    const production: WindProduction = {
      timestamp,
      windSpeed,
      windDirection,
      power: totalPower,
      energy: totalPower * (1 / 60), // kWh for 1-minute interval
      capacity: capacityFactor,
    };

    this.production.push(production);
    return production;
  }

  /**
   * Simulate daily wind production
   */
  simulateDailyProduction(date: Date = new Date()): number {
    console.log(`\nSimulating wind production for ${date.toDateString()}...`);

    let totalEnergy = 0;
    const readings: WindProduction[] = [];

    // Simulate 24 hours with hourly readings
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = new Date(date);
      timestamp.setHours(hour, 0, 0, 0);

      // Simulate wind speed (random with daily pattern)
      const baseWind = 8; // m/s average
      const variation = Math.sin((hour * Math.PI) / 12) * 3;
      const random = (Math.random() - 0.5) * 4;
      const windSpeed = Math.max(0, baseWind + variation + random);

      // Random wind direction
      const windDirection = Math.random() * 360;

      const production = this.calculateProduction(windSpeed, windDirection, timestamp);
      readings.push(production);
      totalEnergy += production.energy * 60; // Convert to hourly
    }

    // Print summary
    const peakProduction = Math.max(...readings.map((r) => r.power));
    const avgProduction = readings.reduce((sum, r) => sum + r.power, 0) / readings.length;
    const avgCapacity = readings.reduce((sum, r) => sum + r.capacity, 0) / readings.length;

    console.log(`Total Energy: ${totalEnergy.toFixed(2)} kWh`);
    console.log(`Peak Power: ${peakProduction.toFixed(2)} kW`);
    console.log(`Average Power: ${avgProduction.toFixed(2)} kW`);
    console.log(`Average Capacity Factor: ${(avgCapacity * 100).toFixed(1)}%`);

    return totalEnergy;
  }

  /**
   * Calculate annual production estimate
   */
  estimateAnnualProduction(): {
    total: number;
    capacity: number;
    capacityFactor: number;
  } {
    const totalCapacity = this.turbines.reduce((sum, t) => sum + t.ratedPower, 0);
    const capacityFactor = 0.35; // Typical onshore wind farm
    const annualTotal = totalCapacity * 8760 * capacityFactor;

    return {
      total: annualTotal,
      capacity: totalCapacity,
      capacityFactor,
    };
  }
}

// ============================================================================
// Battery Storage System
// ============================================================================

class BatteryStorageSystem {
  private battery: BatteryStorage;
  private chargeHistory: Array<{ timestamp: Date; charge: number; power: number }> = [];

  constructor(battery: BatteryStorage) {
    this.battery = battery;
  }

  /**
   * Charge the battery
   */
  charge(power: number, duration: number): { charged: number; newCharge: number } {
    const maxCharge = Math.min(power, this.battery.maxCharge);
    const energyToAdd = (maxCharge * duration) / 60; // kWh
    const actualEnergy = energyToAdd * this.battery.efficiency;
    const spaceAvailable = this.battery.capacity - this.battery.currentCharge;
    const actualCharged = Math.min(actualEnergy, spaceAvailable);

    this.battery.currentCharge += actualCharged;

    this.chargeHistory.push({
      timestamp: new Date(),
      charge: this.battery.currentCharge,
      power: maxCharge,
    });

    return {
      charged: actualCharged,
      newCharge: this.battery.currentCharge,
    };
  }

  /**
   * Discharge the battery
   */
  discharge(power: number, duration: number): { discharged: number; newCharge: number } {
    const maxDischarge = Math.min(power, this.battery.maxDischarge);
    const energyNeeded = (maxDischarge * duration) / 60; // kWh
    const availableEnergy = this.battery.currentCharge;
    const actualDischarged = Math.min(energyNeeded, availableEnergy);

    this.battery.currentCharge -= actualDischarged;
    this.battery.cycleCount += actualDischarged / this.battery.capacity;

    this.chargeHistory.push({
      timestamp: new Date(),
      charge: this.battery.currentCharge,
      power: -maxDischarge,
    });

    return {
      discharged: actualDischarged,
      newCharge: this.battery.currentCharge,
    };
  }

  /**
   * Get state of charge
   */
  getStateOfCharge(): number {
    return (this.battery.currentCharge / this.battery.capacity) * 100;
  }

  /**
   * Optimize charging/discharging schedule
   */
  optimizeSchedule(
    production: number[],
    demand: number[],
    timeOfUseRates: number[]
  ): {
    schedule: Array<{ hour: number; action: 'charge' | 'discharge' | 'idle'; power: number }>;
    savings: number;
  } {
    const schedule: Array<{
      hour: number;
      action: 'charge' | 'discharge' | 'idle';
      power: number;
    }> = [];
    let savings = 0;

    for (let hour = 0; hour < 24; hour++) {
      const excess = production[hour] - demand[hour];
      const rate = timeOfUseRates[hour];

      if (excess > 0 && this.getStateOfCharge() < 90) {
        // Charge during excess production
        schedule.push({ hour, action: 'charge', power: Math.min(excess, this.battery.maxCharge) });
      } else if (excess < 0 && rate > 0.15 && this.getStateOfCharge() > 20) {
        // Discharge during high-rate periods
        const dischargeAmount = Math.min(
          Math.abs(excess),
          this.battery.maxDischarge,
          this.battery.currentCharge
        );
        schedule.push({ hour, action: 'discharge', power: dischargeAmount });
        savings += dischargeAmount * rate;
      } else {
        schedule.push({ hour, action: 'idle', power: 0 });
      }
    }

    return { schedule, savings };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  console.log('\n' + '*'.repeat(70));
  console.log('RENEWABLE ENERGY SYSTEMS - COMPREHENSIVE EXAMPLE');
  console.log('*'.repeat(70));

  // ============================================================================
  // Solar Energy System
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('SOLAR ENERGY SYSTEM');
  console.log('='.repeat(70));

  const solarSystem = new SolarEnergySystem();

  // Add solar panels
  console.log('\n--- Installing Solar Panels ---\n');
  for (let i = 0; i < 20; i++) {
    solarSystem.addPanel({
      id: `panel_${i + 1}`,
      manufacturer: 'SunPower',
      model: 'SPR-X22-370',
      ratedPower: 370, // Watts
      efficiency: 0.228,
      area: 1.63, // sq meters
      temperature: 25,
      angle: 30,
      azimuth: 180, // South-facing
    });
  }

  console.log(`\nTotal System Capacity: ${solarSystem.getTotalCapacity().toFixed(2)} kW`);

  // Simulate daily production
  solarSystem.simulateDailyProduction(new Date());

  // Annual estimate
  console.log('\n--- Annual Production Estimate ---');
  const solarAnnual = solarSystem.estimateAnnualProduction();
  console.log(`Annual Production: ${solarAnnual.total.toLocaleString()} kWh`);
  console.log(`System Capacity: ${solarAnnual.capacity.toFixed(2)} kW`);
  console.log(`Capacity Factor: ${(solarAnnual.capacityFactor * 100).toFixed(1)}%`);
  console.log(`\nMonthly Production:`);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  solarAnnual.byMonth.forEach((energy, i) => {
    console.log(`  ${months[i]}: ${energy.toFixed(0)} kWh`);
  });

  const co2Avoided = solarAnnual.total * 0.42; // kg CO2e
  console.log(`\nCO2 Emissions Avoided: ${(co2Avoided / 1000).toFixed(2)} tonnes/year`);
  console.log(`Equivalent to planting ${Math.round(co2Avoided / 21.77)} trees`);

  // ============================================================================
  // Wind Energy System
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('WIND ENERGY SYSTEM');
  console.log('='.repeat(70));

  const windSystem = new WindEnergySystem();

  // Add wind turbines
  console.log('\n--- Installing Wind Turbines ---\n');
  windSystem.addTurbine({
    id: 'turbine_1',
    manufacturer: 'Vestas',
    model: 'V90-2.0',
    ratedPower: 2000, // kW
    cutInSpeed: 3.5, // m/s
    ratedSpeed: 12, // m/s
    cutOutSpeed: 25, // m/s
    rotorDiameter: 90, // meters
    hubHeight: 80, // meters
  });

  // Simulate daily production
  windSystem.simulateDailyProduction(new Date());

  // Annual estimate
  console.log('\n--- Annual Production Estimate ---');
  const windAnnual = windSystem.estimateAnnualProduction();
  console.log(`Annual Production: ${windAnnual.total.toLocaleString()} kWh`);
  console.log(`System Capacity: ${windAnnual.capacity.toFixed(2)} kW`);
  console.log(`Capacity Factor: ${(windAnnual.capacityFactor * 100).toFixed(1)}%`);

  const windCO2Avoided = windAnnual.total * 0.42;
  console.log(`\nCO2 Emissions Avoided: ${(windCO2Avoided / 1000).toFixed(2)} tonnes/year`);

  // ============================================================================
  // Battery Storage System
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('BATTERY STORAGE SYSTEM');
  console.log('='.repeat(70));

  const battery: BatteryStorage = {
    id: 'battery_1',
    capacity: 100, // kWh
    maxCharge: 50, // kW
    maxDischarge: 50, // kW
    currentCharge: 50, // kWh
    efficiency: 0.95,
    cycleCount: 0,
    health: 1.0,
  };

  const storageSystem = new BatteryStorageSystem(battery);

  console.log('\n--- Battery Specifications ---');
  console.log(`Capacity: ${battery.capacity} kWh`);
  console.log(`Max Charge/Discharge: ${battery.maxCharge} kW`);
  console.log(`Round-trip Efficiency: ${(battery.efficiency * 100).toFixed(0)}%`);
  console.log(`Initial State of Charge: ${storageSystem.getStateOfCharge().toFixed(1)}%`);

  // Simulate charging
  console.log('\n--- Charging from Solar Excess ---');
  const charged = storageSystem.charge(30, 60); // 30 kW for 60 minutes
  console.log(`Charged: ${charged.charged.toFixed(2)} kWh`);
  console.log(`New State of Charge: ${storageSystem.getStateOfCharge().toFixed(1)}%`);

  // Simulate discharging
  console.log('\n--- Discharging During Peak Demand ---');
  const discharged = storageSystem.discharge(25, 120); // 25 kW for 120 minutes
  console.log(`Discharged: ${discharged.discharged.toFixed(2)} kWh`);
  console.log(`New State of Charge: ${storageSystem.getStateOfCharge().toFixed(1)}%`);

  // ============================================================================
  // Combined System Economics
  // ============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('RENEWABLE ENERGY ECONOMICS');
  console.log('='.repeat(70));

  const totalAnnualProduction = solarAnnual.total + windAnnual.total;
  const electricityRate = 0.12; // $/kWh
  const annualSavings = totalAnnualProduction * electricityRate;
  const systemCost = 50000 + 3500000; // Solar + Wind
  const paybackPeriod = systemCost / annualSavings;

  console.log('\n--- Economic Analysis ---');
  console.log(`Total Annual Production: ${totalAnnualProduction.toLocaleString()} kWh`);
  console.log(`Annual Savings: $${annualSavings.toLocaleString()}`);
  console.log(`System Cost: $${systemCost.toLocaleString()}`);
  console.log(`Simple Payback Period: ${paybackPeriod.toFixed(1)} years`);

  const totalCO2Avoided = totalAnnualProduction * 0.42;
  console.log(`\n--- Environmental Impact ---`);
  console.log(`Total CO2 Avoided: ${(totalCO2Avoided / 1000).toFixed(2)} tonnes/year`);
  console.log(`20-Year CO2 Reduction: ${((totalCO2Avoided / 1000) * 20).toFixed(0)} tonnes`);
  console.log(`Equivalent to removing ${Math.round(totalCO2Avoided / 4600)} cars from the road`);

  console.log('\n' + '*'.repeat(70));
  console.log('Example completed successfully!');
  console.log('*'.repeat(70) + '\n');
}

main().catch(console.error);
