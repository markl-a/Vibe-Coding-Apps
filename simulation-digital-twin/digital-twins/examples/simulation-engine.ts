/**
 * Simulation Engine Examples
 *
 * Demonstrates running simulations on digital twins to test
 * scenarios, optimize parameters, and predict outcomes.
 */

// ============================================================================
// Core Simulation Types
// ============================================================================

interface SimulationConfig {
  id: string;
  name: string;
  description?: string;
  duration: number; // simulation time in seconds
  timeStep: number; // seconds per step
  realTimeSpeed: number; // 1.0 = real-time, 10.0 = 10x faster
  recordInterval?: number; // Record state every N steps
}

interface SimulationParameter {
  name: string;
  value: number;
  unit?: string;
  min?: number;
  max?: number;
  description?: string;
}

interface SimulationState {
  time: number; // current simulation time
  step: number; // current step number
  variables: Map<string, number>;
  events: SimulationEvent[];
}

interface SimulationEvent {
  time: number;
  type: string;
  description: string;
  data?: Record<string, unknown>;
}

interface SimulationResult {
  configId: string;
  startTime: Date;
  endTime: Date;
  success: boolean;
  finalState: SimulationState;
  history: StateSnapshot[];
  statistics: SimulationStatistics;
  errors?: string[];
}

interface StateSnapshot {
  time: number;
  step: number;
  variables: Record<string, number>;
}

interface SimulationStatistics {
  totalSteps: number;
  averageStepTime: number; // ms
  minValues: Record<string, number>;
  maxValues: Record<string, number>;
  avgValues: Record<string, number>;
  eventCounts: Record<string, number>;
}

interface OptimizationGoal {
  variable: string;
  target: 'minimize' | 'maximize' | 'target';
  targetValue?: number;
  weight?: number; // for multi-objective optimization
}

// ============================================================================
// Physics-Based Simulation Models
// ============================================================================

class ThermodynamicsModel {
  // Simulate heat transfer
  static heatTransfer(
    tempHot: number,
    tempCold: number,
    thermalConductivity: number,
    area: number,
    thickness: number,
    timeStep: number
  ): { heatFlow: number; newTempHot: number; newTempCold: number } {
    // Q = k * A * (T_hot - T_cold) / d
    const heatFlow = (thermalConductivity * area * (tempHot - tempCold)) / thickness;

    // Simplified temperature change (assumes equal thermal mass)
    const tempChange = (heatFlow * timeStep) / 1000; // Simplified

    return {
      heatFlow,
      newTempHot: tempHot - tempChange,
      newTempCold: tempCold + tempChange,
    };
  }

  // Cooling with ambient
  static ambientCooling(
    temp: number,
    ambientTemp: number,
    coolingCoefficient: number,
    timeStep: number
  ): number {
    // Newton's law of cooling: dT/dt = -k(T - T_ambient)
    const tempDiff = temp - ambientTemp;
    const coolingRate = coolingCoefficient * tempDiff;
    return temp - coolingRate * timeStep;
  }
}

class FluidDynamicsModel {
  // Bernoulli's equation for flow
  static flowRate(
    pressureDiff: number,
    density: number,
    pipeArea: number
  ): number {
    // v = sqrt(2 * dP / rho)
    const velocity = Math.sqrt((2 * Math.abs(pressureDiff)) / density);
    return velocity * pipeArea * Math.sign(pressureDiff);
  }

  // Pressure drop in pipe
  static pressureDrop(
    flowRate: number,
    viscosity: number,
    length: number,
    diameter: number
  ): number {
    // Hagen-Poiseuille for laminar flow
    const radius = diameter / 2;
    return (8 * viscosity * length * flowRate) / (Math.PI * Math.pow(radius, 4));
  }
}

class ElectricalModel {
  // Power consumption
  static power(voltage: number, current: number, powerFactor: number = 1.0): number {
    return voltage * current * powerFactor;
  }

  // Battery discharge
  static batteryDischarge(
    currentCharge: number,
    dischargeCurrent: number,
    timeStep: number
  ): number {
    // Simple linear discharge (real batteries are non-linear)
    return Math.max(0, currentCharge - dischargeCurrent * timeStep);
  }

  // RC circuit charging
  static rcCircuitVoltage(
    sourceVoltage: number,
    resistance: number,
    capacitance: number,
    time: number
  ): number {
    const tau = resistance * capacitance;
    return sourceVoltage * (1 - Math.exp(-time / tau));
  }
}

// ============================================================================
// Simulation Engine
// ============================================================================

class SimulationEngine {
  private config: SimulationConfig;
  private state: SimulationState;
  private parameters = new Map<string, SimulationParameter>();
  private history: StateSnapshot[] = [];
  private updateCallbacks: Array<(state: SimulationState) => void> = [];
  private isRunning = false;
  private isPaused = false;
  private startWallTime = 0;
  private stepTimes: number[] = [];

  constructor(config: SimulationConfig) {
    this.config = config;
    this.state = {
      time: 0,
      step: 0,
      variables: new Map(),
      events: [],
    };
  }

  // Set parameter
  setParameter(param: SimulationParameter): void {
    this.parameters.set(param.name, param);
  }

  getParameter(name: string): SimulationParameter | undefined {
    return this.parameters.get(name);
  }

  // Set initial variable value
  setVariable(name: string, value: number): void {
    this.state.variables.set(name, value);
  }

  getVariable(name: string): number | undefined {
    return this.state.variables.get(name);
  }

  // Add event
  addEvent(type: string, description: string, data?: Record<string, unknown>): void {
    this.state.events.push({
      time: this.state.time,
      type,
      description,
      data,
    });
  }

  // Subscribe to updates
  onUpdate(callback: (state: SimulationState) => void): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Run simulation (override this method in subclasses)
  protected updateState(timeStep: number): void {
    // Default: no-op
    // Subclasses should implement their physics/logic here
  }

  // Execute simulation
  async run(): Promise<SimulationResult> {
    if (this.isRunning) {
      throw new Error('Simulation already running');
    }

    this.isRunning = true;
    this.isPaused = false;
    this.startWallTime = Date.now();
    this.history = [];
    this.stepTimes = [];

    const startTime = new Date();
    const errors: string[] = [];

    console.log(`[SIM] Starting simulation: ${this.config.name}`);
    console.log(`[SIM] Duration: ${this.config.duration}s, Time step: ${this.config.timeStep}s`);

    const totalSteps = Math.floor(this.config.duration / this.config.timeStep);
    const recordInterval = this.config.recordInterval || 1;

    try {
      for (let step = 0; step < totalSteps && this.isRunning; step++) {
        const stepStartTime = Date.now();

        // Update simulation state
        try {
          this.updateState(this.config.timeStep);
        } catch (error) {
          errors.push(`Step ${step}: ${error}`);
          if (errors.length > 100) {
            throw new Error('Too many simulation errors');
          }
        }

        this.state.step = step;
        this.state.time = step * this.config.timeStep;

        // Record state
        if (step % recordInterval === 0) {
          this.recordSnapshot();
        }

        // Notify callbacks
        this.updateCallbacks.forEach(cb => cb(this.state));

        // Track step time
        const stepTime = Date.now() - stepStartTime;
        this.stepTimes.push(stepTime);

        // Simulate real-time if needed
        const targetStepTime = (this.config.timeStep * 1000) / this.config.realTimeSpeed;
        if (stepTime < targetStepTime) {
          await new Promise(resolve => setTimeout(resolve, targetStepTime - stepTime));
        }

        // Handle pause
        while (this.isPaused && this.isRunning) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      errors.push(`Fatal error: ${error}`);
      console.error('[SIM] Simulation failed:', error);
    }

    const endTime = new Date();
    this.isRunning = false;

    console.log(`[SIM] Simulation complete: ${this.state.step} steps in ${endTime.getTime() - startTime.getTime()}ms`);

    return {
      configId: this.config.id,
      startTime,
      endTime,
      success: errors.length === 0,
      finalState: this.state,
      history: this.history,
      statistics: this.calculateStatistics(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private recordSnapshot(): void {
    this.history.push({
      time: this.state.time,
      step: this.state.step,
      variables: Object.fromEntries(this.state.variables.entries()),
    });
  }

  private calculateStatistics(): SimulationStatistics {
    const varNames = Array.from(this.state.variables.keys());
    const minValues: Record<string, number> = {};
    const maxValues: Record<string, number> = {};
    const avgValues: Record<string, number> = {};

    // Calculate statistics from history
    for (const varName of varNames) {
      const values = this.history.map(s => s.variables[varName]).filter(v => v !== undefined);

      if (values.length > 0) {
        minValues[varName] = Math.min(...values);
        maxValues[varName] = Math.max(...values);
        avgValues[varName] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    // Count events by type
    const eventCounts: Record<string, number> = {};
    for (const event of this.state.events) {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    }

    const avgStepTime = this.stepTimes.length > 0
      ? this.stepTimes.reduce((a, b) => a + b, 0) / this.stepTimes.length
      : 0;

    return {
      totalSteps: this.state.step,
      averageStepTime: avgStepTime,
      minValues,
      maxValues,
      avgValues,
      eventCounts,
    };
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
  }

  getState(): SimulationState {
    return this.state;
  }

  getHistory(): StateSnapshot[] {
    return this.history;
  }
}

// ============================================================================
// Example Simulation: HVAC System
// ============================================================================

class HVACSimulation extends SimulationEngine {
  protected updateState(timeStep: number): void {
    // Get parameters
    const targetTemp = this.getParameter('targetTemperature')?.value || 22;
    const outdoorTemp = this.getParameter('outdoorTemperature')?.value || 30;
    const coolingPower = this.getParameter('coolingPower')?.value || 5000; // Watts
    const buildingThermalMass = this.getParameter('buildingThermalMass')?.value || 1000000; // J/K
    const insulation = this.getParameter('insulation')?.value || 0.1; // 0-1, higher is better

    // Get current state
    let indoorTemp = this.getVariable('indoorTemperature') || 25;
    let energyUsed = this.getVariable('energyUsed') || 0;
    let hvacState = this.getVariable('hvacState') || 0; // 0=off, 1=cooling

    // Control logic (simple bang-bang)
    if (indoorTemp > targetTemp + 1) {
      hvacState = 1; // Turn on cooling
    } else if (indoorTemp < targetTemp - 0.5) {
      hvacState = 0; // Turn off
    }

    // Heat gain from outdoor (simplified)
    const heatGainRate = (1 - insulation) * 500 * (outdoorTemp - indoorTemp);

    // Cooling effect
    const coolingRate = hvacState * coolingPower;

    // Net temperature change
    const netHeatRate = heatGainRate - coolingRate;
    const tempChange = (netHeatRate * timeStep) / buildingThermalMass;
    indoorTemp += tempChange;

    // Energy consumption
    energyUsed += hvacState * coolingPower * timeStep / 3600; // Wh

    // Update state
    this.setVariable('indoorTemperature', indoorTemp);
    this.setVariable('energyUsed', energyUsed);
    this.setVariable('hvacState', hvacState);

    // Log events
    if (hvacState === 1 && this.getVariable('hvacState') === 0) {
      this.addEvent('hvac_on', `HVAC turned on at ${indoorTemp.toFixed(1)}°C`);
    } else if (hvacState === 0 && this.getVariable('hvacState') === 1) {
      this.addEvent('hvac_off', `HVAC turned off at ${indoorTemp.toFixed(1)}°C`);
    }
  }
}

// ============================================================================
// Example Simulation: Water Tank
// ============================================================================

class WaterTankSimulation extends SimulationEngine {
  protected updateState(timeStep: number): void {
    // Parameters
    const tankCapacity = this.getParameter('tankCapacity')?.value || 1000; // liters
    const inflowRate = this.getParameter('inflowRate')?.value || 10; // L/min
    const outflowRate = this.getParameter('outflowRate')?.value || 8; // L/min
    const pumpEfficiency = this.getParameter('pumpEfficiency')?.value || 0.85;

    // State
    let waterLevel = this.getVariable('waterLevel') || 500; // liters
    let pumpRunning = this.getVariable('pumpRunning') || 1;
    let totalPumped = this.getVariable('totalPumped') || 0;

    // Control logic
    if (waterLevel >= tankCapacity * 0.9) {
      pumpRunning = 0; // Stop pump when nearly full
    } else if (waterLevel <= tankCapacity * 0.2) {
      pumpRunning = 1; // Start pump when low
    }

    // Calculate flow
    const inflow = pumpRunning * inflowRate * pumpEfficiency * (timeStep / 60);
    const outflow = outflowRate * (timeStep / 60);
    const netFlow = inflow - outflow;

    // Update water level
    waterLevel = Math.max(0, Math.min(tankCapacity, waterLevel + netFlow));
    totalPumped += inflow;

    // Update state
    this.setVariable('waterLevel', waterLevel);
    this.setVariable('pumpRunning', pumpRunning);
    this.setVariable('totalPumped', totalPumped);
    this.setVariable('fillPercentage', (waterLevel / tankCapacity) * 100);

    // Events
    if (waterLevel <= 0) {
      this.addEvent('tank_empty', 'WARNING: Tank is empty!');
    }
    if (waterLevel >= tankCapacity) {
      this.addEvent('tank_overflow', 'WARNING: Tank overflow!');
    }
  }
}

// ============================================================================
// Parameter Optimization
// ============================================================================

class ParameterOptimizer {
  private simulation: SimulationEngine;

  constructor(simulation: SimulationEngine) {
    this.simulation = simulation;
  }

  async optimize(
    parameterName: string,
    min: number,
    max: number,
    goal: OptimizationGoal,
    steps: number = 10
  ): Promise<{ bestValue: number; bestScore: number; results: Array<{ value: number; score: number }> }> {
    console.log(`[OPTIMIZE] Optimizing ${parameterName} from ${min} to ${max}`);

    const results: Array<{ value: number; score: number }> = [];
    const stepSize = (max - min) / steps;

    for (let i = 0; i <= steps; i++) {
      const value = min + i * stepSize;

      // Set parameter
      const param = this.simulation.getParameter(parameterName);
      if (param) {
        param.value = value;
        this.simulation.setParameter(param);
      }

      // Run simulation
      const result = await this.simulation.run();

      // Calculate score based on goal
      const finalValue = result.finalState.variables.get(goal.variable);
      if (finalValue === undefined) {
        continue;
      }

      let score = 0;
      if (goal.target === 'minimize') {
        score = -finalValue;
      } else if (goal.target === 'maximize') {
        score = finalValue;
      } else if (goal.target === 'target' && goal.targetValue !== undefined) {
        score = -Math.abs(finalValue - goal.targetValue);
      }

      results.push({ value, score });
      console.log(`[OPTIMIZE] ${parameterName}=${value.toFixed(2)}: score=${score.toFixed(2)}`);
    }

    // Find best result
    const best = results.reduce((a, b) => (b.score > a.score ? b : a));

    console.log(`[OPTIMIZE] Best ${parameterName}: ${best.value.toFixed(2)} (score: ${best.score.toFixed(2)})`);

    return {
      bestValue: best.value,
      bestScore: best.score,
      results,
    };
  }
}

// ============================================================================
// Examples
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('Simulation Engine Examples');
  console.log('='.repeat(70));

  // Example 1: HVAC System Simulation
  console.log('\n📊 Example 1: HVAC System Simulation');
  console.log('-'.repeat(50));

  const hvacSim = new HVACSimulation({
    id: 'hvac-sim-1',
    name: 'Office HVAC Simulation',
    duration: 3600, // 1 hour
    timeStep: 60, // 1 minute
    realTimeSpeed: 1000, // 1000x faster
    recordInterval: 1,
  });

  // Set parameters
  hvacSim.setParameter({ name: 'targetTemperature', value: 22, unit: '°C' });
  hvacSim.setParameter({ name: 'outdoorTemperature', value: 35, unit: '°C' });
  hvacSim.setParameter({ name: 'coolingPower', value: 5000, unit: 'W' });
  hvacSim.setParameter({ name: 'buildingThermalMass', value: 1000000, unit: 'J/K' });
  hvacSim.setParameter({ name: 'insulation', value: 0.8 });

  // Set initial state
  hvacSim.setVariable('indoorTemperature', 28);
  hvacSim.setVariable('energyUsed', 0);
  hvacSim.setVariable('hvacState', 0);

  // Run simulation
  const hvacResult = await hvacSim.run();

  console.log(`\nSimulation Results:`);
  console.log(`  Duration: ${hvacResult.finalState.time}s`);
  console.log(`  Steps: ${hvacResult.statistics.totalSteps}`);
  console.log(`  Final indoor temperature: ${hvacResult.finalState.variables.get('indoorTemperature')?.toFixed(2)}°C`);
  console.log(`  Total energy used: ${hvacResult.finalState.variables.get('energyUsed')?.toFixed(2)} Wh`);
  console.log(`  HVAC cycles: ${hvacResult.statistics.eventCounts['hvac_on'] || 0}`);

  // Example 2: Water Tank Simulation
  console.log('\n📊 Example 2: Water Tank Simulation');
  console.log('-'.repeat(50));

  const tankSim = new WaterTankSimulation({
    id: 'tank-sim-1',
    name: 'Water Storage Tank',
    duration: 7200, // 2 hours
    timeStep: 10, // 10 seconds
    realTimeSpeed: 1000,
    recordInterval: 6, // Record every minute
  });

  tankSim.setParameter({ name: 'tankCapacity', value: 1000, unit: 'L' });
  tankSim.setParameter({ name: 'inflowRate', value: 12, unit: 'L/min' });
  tankSim.setParameter({ name: 'outflowRate', value: 8, unit: 'L/min' });
  tankSim.setParameter({ name: 'pumpEfficiency', value: 0.85 });

  tankSim.setVariable('waterLevel', 300);
  tankSim.setVariable('pumpRunning', 1);
  tankSim.setVariable('totalPumped', 0);

  const tankResult = await tankSim.run();

  console.log(`\nSimulation Results:`);
  console.log(`  Final water level: ${tankResult.finalState.variables.get('waterLevel')?.toFixed(1)} L`);
  console.log(`  Fill percentage: ${tankResult.finalState.variables.get('fillPercentage')?.toFixed(1)}%`);
  console.log(`  Total pumped: ${tankResult.finalState.variables.get('totalPumped')?.toFixed(1)} L`);
  console.log(`  Min level: ${tankResult.statistics.minValues['waterLevel']?.toFixed(1)} L`);
  console.log(`  Max level: ${tankResult.statistics.maxValues['waterLevel']?.toFixed(1)} L`);

  // Example 3: Scenario Comparison
  console.log('\n📊 Example 3: Scenario Comparison');
  console.log('-'.repeat(50));

  console.log('Comparing different outdoor temperatures...\n');

  const scenarios = [25, 30, 35, 40];
  const scenarioResults: Array<{ temp: number; energy: number; cycles: number }> = [];

  for (const outdoorTemp of scenarios) {
    const sim = new HVACSimulation({
      id: `hvac-scenario-${outdoorTemp}`,
      name: `HVAC at ${outdoorTemp}°C outdoor`,
      duration: 3600,
      timeStep: 60,
      realTimeSpeed: 10000,
      recordInterval: 10,
    });

    sim.setParameter({ name: 'targetTemperature', value: 22, unit: '°C' });
    sim.setParameter({ name: 'outdoorTemperature', value: outdoorTemp, unit: '°C' });
    sim.setParameter({ name: 'coolingPower', value: 5000, unit: 'W' });
    sim.setParameter({ name: 'buildingThermalMass', value: 1000000, unit: 'J/K' });
    sim.setParameter({ name: 'insulation', value: 0.8 });

    sim.setVariable('indoorTemperature', 25);
    sim.setVariable('energyUsed', 0);

    const result = await sim.run();

    scenarioResults.push({
      temp: outdoorTemp,
      energy: result.finalState.variables.get('energyUsed') || 0,
      cycles: result.statistics.eventCounts['hvac_on'] || 0,
    });
  }

  console.log('Scenario Comparison Results:');
  console.log('Outdoor Temp | Energy Used | HVAC Cycles');
  console.log('-'.repeat(45));
  scenarioResults.forEach(s => {
    console.log(`${String(s.temp).padEnd(12)} | ${s.energy.toFixed(1).padEnd(11)} | ${s.cycles}`);
  });

  // Example 4: What-If Analysis
  console.log('\n📊 Example 4: What-If Analysis - Insulation Impact');
  console.log('-'.repeat(50));

  const insulationLevels = [0.5, 0.6, 0.7, 0.8, 0.9];
  const insulationResults: Array<{ insulation: number; energy: number; savings: number }> = [];

  let baselineEnergy = 0;

  for (let i = 0; i < insulationLevels.length; i++) {
    const insulation = insulationLevels[i];

    const sim = new HVACSimulation({
      id: `insulation-${insulation}`,
      name: `Insulation ${insulation}`,
      duration: 3600,
      timeStep: 60,
      realTimeSpeed: 10000,
    });

    sim.setParameter({ name: 'targetTemperature', value: 22 });
    sim.setParameter({ name: 'outdoorTemperature', value: 35 });
    sim.setParameter({ name: 'coolingPower', value: 5000 });
    sim.setParameter({ name: 'buildingThermalMass', value: 1000000 });
    sim.setParameter({ name: 'insulation', value: insulation });

    sim.setVariable('indoorTemperature', 28);
    sim.setVariable('energyUsed', 0);

    const result = await sim.run();
    const energy = result.finalState.variables.get('energyUsed') || 0;

    if (i === 0) {
      baselineEnergy = energy;
    }

    const savings = ((baselineEnergy - energy) / baselineEnergy) * 100;

    insulationResults.push({ insulation, energy, savings });
  }

  console.log('\nInsulation Impact Analysis:');
  console.log('Insulation | Energy (Wh) | Savings vs Baseline');
  console.log('-'.repeat(50));
  insulationResults.forEach(r => {
    console.log(
      `${r.insulation.toFixed(1).padEnd(10)} | ${r.energy.toFixed(1).padEnd(11)} | ${r.savings >= 0 ? '+' : ''}${r.savings.toFixed(1)}%`
    );
  });

  // Example 5: Time-Series Visualization Data
  console.log('\n📊 Example 5: Time-Series Data Export');
  console.log('-'.repeat(50));

  const timeSeriesSim = new HVACSimulation({
    id: 'timeseries-1',
    name: 'HVAC Time Series',
    duration: 1800, // 30 minutes
    timeStep: 30,
    realTimeSpeed: 10000,
    recordInterval: 1,
  });

  timeSeriesSim.setParameter({ name: 'targetTemperature', value: 22 });
  timeSeriesSim.setParameter({ name: 'outdoorTemperature', value: 32 });
  timeSeriesSim.setParameter({ name: 'coolingPower', value: 5000 });
  timeSeriesSim.setParameter({ name: 'buildingThermalMass', value: 1000000 });
  timeSeriesSim.setParameter({ name: 'insulation', value: 0.75 });

  timeSeriesSim.setVariable('indoorTemperature', 26);
  timeSeriesSim.setVariable('energyUsed', 0);

  const tsResult = await timeSeriesSim.run();

  console.log(`\nGenerated ${tsResult.history.length} data points`);
  console.log('Sample data (first 5 and last 5):');
  console.log('Time (s) | Indoor Temp | HVAC State | Energy');
  console.log('-'.repeat(50));

  const samplePoints = [
    ...tsResult.history.slice(0, 5),
    ...tsResult.history.slice(-5),
  ];

  samplePoints.forEach(snapshot => {
    console.log(
      `${String(snapshot.time).padEnd(8)} | ${snapshot.variables.indoorTemperature?.toFixed(2).padEnd(11)} | ${snapshot.variables.hvacState?.toFixed(0).padEnd(10)} | ${snapshot.variables.energyUsed?.toFixed(1)}`
    );
  });

  console.log('\n' + '='.repeat(70));
  console.log('Simulation Engine examples complete!');
  console.log('\nKey Insights:');
  console.log('  - HVAC simulation showed temperature control and energy usage patterns');
  console.log('  - Water tank simulation demonstrated level control and pump cycling');
  console.log('  - Scenario comparison revealed energy impact of outdoor temperature');
  console.log('  - What-if analysis showed 90% insulation saves energy vs 50% insulation');
  console.log('  - Time-series data can be exported for visualization and analysis');
}

// Run examples
main().catch(console.error);
