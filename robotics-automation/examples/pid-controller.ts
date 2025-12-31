/**
 * PID Controller Examples
 *
 * Demonstrates:
 * - Basic PID controller
 * - PID tuning methods
 * - Anti-windup techniques
 * - Cascaded PID control
 * - Adaptive PID
 * - Position, velocity, and angle control
 */

// Types
interface PIDGains {
  kP: number; // Proportional gain
  kI: number; // Integral gain
  kD: number; // Derivative gain
}

interface PIDState {
  error: number;
  integral: number;
  derivative: number;
  lastError: number;
  output: number;
}

interface ControlLimits {
  min: number;
  max: number;
}

/**
 * Basic PID Controller
 */
class PIDController {
  private kP: number;
  private kI: number;
  private kD: number;
  private integral: number = 0;
  private lastError: number = 0;
  private outputLimits: ControlLimits;
  private integralLimits: ControlLimits;

  constructor(
    gains: PIDGains,
    outputLimits: ControlLimits = { min: -Infinity, max: Infinity },
    integralLimits: ControlLimits = { min: -Infinity, max: Infinity }
  ) {
    this.kP = gains.kP;
    this.kI = gains.kI;
    this.kD = gains.kD;
    this.outputLimits = outputLimits;
    this.integralLimits = integralLimits;
  }

  /**
   * Compute control output
   */
  compute(setpoint: number, measurement: number, dt: number): number {
    // Calculate error
    const error = setpoint - measurement;

    // Proportional term
    const pTerm = this.kP * error;

    // Integral term with anti-windup
    this.integral += error * dt;
    this.integral = this.clamp(this.integral, this.integralLimits);
    const iTerm = this.kI * this.integral;

    // Derivative term
    const derivative = (error - this.lastError) / dt;
    const dTerm = this.kD * derivative;

    // Calculate output
    const output = pTerm + iTerm + dTerm;
    this.lastError = error;

    return this.clamp(output, this.outputLimits);
  }

  /**
   * Reset controller state
   */
  reset(): void {
    this.integral = 0;
    this.lastError = 0;
  }

  /**
   * Get current state
   */
  getState(): PIDState {
    return {
      error: this.lastError,
      integral: this.integral,
      derivative: (this.lastError - 0) / 0.01,
      lastError: this.lastError,
      output: 0
    };
  }

  /**
   * Update gains
   */
  setGains(gains: Partial<PIDGains>): void {
    if (gains.kP !== undefined) this.kP = gains.kP;
    if (gains.kI !== undefined) this.kI = gains.kI;
    if (gains.kD !== undefined) this.kD = gains.kD;
  }

  private clamp(value: number, limits: ControlLimits): number {
    return Math.max(limits.min, Math.min(limits.max, value));
  }
}

/**
 * PID Controller with Advanced Features
 */
class AdvancedPIDController extends PIDController {
  private setpointRampRate: number;
  private currentSetpoint: number = 0;
  private feedforwardGain: number;

  constructor(
    gains: PIDGains,
    outputLimits: ControlLimits = { min: -Infinity, max: Infinity },
    integralLimits: ControlLimits = { min: -Infinity, max: Infinity },
    setpointRampRate: number = Infinity,
    feedforwardGain: number = 0
  ) {
    super(gains, outputLimits, integralLimits);
    this.setpointRampRate = setpointRampRate;
    this.feedforwardGain = feedforwardGain;
  }

  /**
   * Compute with setpoint ramping and feedforward
   */
  computeAdvanced(setpoint: number, measurement: number, dt: number): number {
    // Apply setpoint ramping
    const delta = setpoint - this.currentSetpoint;
    const maxChange = this.setpointRampRate * dt;

    if (Math.abs(delta) > maxChange) {
      this.currentSetpoint += Math.sign(delta) * maxChange;
    } else {
      this.currentSetpoint = setpoint;
    }

    // Basic PID control
    const pidOutput = super.compute(this.currentSetpoint, measurement, dt);

    // Add feedforward term
    const feedforward = this.feedforwardGain * this.currentSetpoint;

    return pidOutput + feedforward;
  }
}

/**
 * Cascaded PID Controller (e.g., position -> velocity)
 */
class CascadedPIDController {
  private outerPID: PIDController; // Position control
  private innerPID: PIDController; // Velocity control

  constructor(
    outerGains: PIDGains,
    innerGains: PIDGains,
    outerLimits: ControlLimits,
    innerLimits: ControlLimits
  ) {
    this.outerPID = new PIDController(outerGains, outerLimits);
    this.innerPID = new PIDController(innerGains, innerLimits);
  }

  /**
   * Compute cascaded control
   */
  compute(
    positionSetpoint: number,
    position: number,
    velocity: number,
    dt: number
  ): number {
    // Outer loop: position control outputs desired velocity
    const desiredVelocity = this.outerPID.compute(positionSetpoint, position, dt);

    // Inner loop: velocity control outputs acceleration/force
    const output = this.innerPID.compute(desiredVelocity, velocity, dt);

    return output;
  }

  reset(): void {
    this.outerPID.reset();
    this.innerPID.reset();
  }
}

/**
 * Auto-tuning PID using Ziegler-Nichols method
 */
class AutoTunePID {
  /**
   * Calculate PID gains using Ziegler-Nichols method
   * Based on ultimate gain (Ku) and ultimate period (Tu)
   */
  static zieglerNichols(Ku: number, Tu: number): {
    classic: PIDGains;
    noOvershoot: PIDGains;
    someOvershoot: PIDGains;
  } {
    return {
      classic: {
        kP: 0.6 * Ku,
        kI: (1.2 * Ku) / Tu,
        kD: (0.075 * Ku * Tu)
      },
      noOvershoot: {
        kP: 0.2 * Ku,
        kI: (0.4 * Ku) / Tu,
        kD: (0.067 * Ku * Tu)
      },
      someOvershoot: {
        kP: 0.33 * Ku,
        kI: (0.66 * Ku) / Tu,
        kD: (0.11 * Ku * Tu)
      }
    };
  }

  /**
   * Calculate PID gains using Cohen-Coon method
   * Based on process parameters
   */
  static cohenCoon(K: number, tau: number, theta: number): PIDGains {
    const R = theta / tau;
    return {
      kP: (1 / K) * (1.35 / R + 0.27),
      kI: (1 / K) * ((1.35 / R + 0.27) / (tau * (0.54 + 0.33 * R))),
      kD: (1 / K) * (1.35 / R + 0.27) * tau * (0.37 / (1 + 0.37 * R))
    };
  }
}

/**
 * Adaptive PID Controller
 */
class AdaptivePIDController extends PIDController {
  private learningRate: number;
  private performanceHistory: number[] = [];
  private maxHistorySize: number = 100;

  constructor(
    initialGains: PIDGains,
    learningRate: number = 0.01,
    outputLimits: ControlLimits = { min: -Infinity, max: Infinity }
  ) {
    super(initialGains, outputLimits);
    this.learningRate = learningRate;
  }

  /**
   * Compute with adaptive gain adjustment
   */
  computeAdaptive(setpoint: number, measurement: number, dt: number): number {
    const output = super.compute(setpoint, measurement, dt);
    const error = Math.abs(setpoint - measurement);

    // Track performance
    this.performanceHistory.push(error);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }

    // Adapt gains based on error trend
    if (this.performanceHistory.length >= 10) {
      const recentErrors = this.performanceHistory.slice(-10);
      const avgError = recentErrors.reduce((a, b) => a + b, 0) / recentErrors.length;

      // Simple adaptation: increase P if error is large, increase D if oscillating
      const errorTrend = recentErrors[recentErrors.length - 1] - recentErrors[0];

      if (avgError > 1.0) {
        this.setGains({ kP: this.getGains().kP * (1 + this.learningRate) });
      } else if (Math.abs(errorTrend) > avgError) {
        this.setGains({ kD: this.getGains().kD * (1 + this.learningRate) });
      }
    }

    return output;
  }

  private getGains(): PIDGains {
    return { kP: 0, kI: 0, kD: 0 }; // Simplified
  }
}

/**
 * System Simulator
 */
class SystemSimulator {
  private position: number = 0;
  private velocity: number = 0;
  private mass: number;
  private damping: number;

  constructor(mass: number = 1.0, damping: number = 0.1) {
    this.mass = mass;
    this.damping = damping;
  }

  /**
   * Update system state with applied force
   */
  update(force: number, dt: number): { position: number; velocity: number } {
    // Physics: F = ma, with damping
    const acceleration = (force - this.damping * this.velocity) / this.mass;

    // Integrate
    this.velocity += acceleration * dt;
    this.position += this.velocity * dt;

    return { position: this.position, velocity: this.velocity };
  }

  reset(): void {
    this.position = 0;
    this.velocity = 0;
  }

  getState(): { position: number; velocity: number } {
    return { position: this.position, velocity: this.velocity };
  }
}

/**
 * Example Usage
 */
function main() {
  console.log('=== PID Controller Examples ===\n');

  // Example 1: Basic Position Control
  console.log('--- Basic Position Control ---');
  const basicPID = new PIDController(
    { kP: 2.0, kI: 0.5, kD: 0.8 },
    { min: -10, max: 10 }
  );

  const system1 = new SystemSimulator(1.0, 0.2);
  const setpoint = 10.0;
  const dt = 0.01;
  const duration = 3.0;

  console.log('Time | Setpoint | Position | Error  | Output');
  console.log('-----|----------|----------|--------|-------');

  for (let t = 0; t <= duration; t += 0.5) {
    let state = system1.getState();

    for (let step = 0; step < 50; step++) {
      const control = basicPID.compute(setpoint, state.position, dt);
      state = system1.update(control, dt);
    }

    const error = setpoint - state.position;
    console.log(
      `${t.toFixed(2)} | ${setpoint.toFixed(2).padEnd(8)} | ${state.position.toFixed(3).padEnd(8)} | ` +
      `${error.toFixed(3).padEnd(6)} | ${basicPID.getState().output.toFixed(3)}`
    );
  }

  // Example 2: Velocity Control
  console.log('\n--- Velocity Control ---');
  const velocityPID = new PIDController(
    { kP: 1.5, kI: 0.3, kD: 0.5 },
    { min: -5, max: 5 }
  );

  const system2 = new SystemSimulator(2.0, 0.5);
  system2.reset();

  const targetVelocity = 5.0;
  console.log(`Target velocity: ${targetVelocity} m/s`);
  console.log('\nTime | Velocity | Error  | Control');
  console.log('-----|----------|--------|--------');

  for (let t = 0; t <= 2.0; t += 0.4) {
    let state = system2.getState();

    for (let step = 0; step < 40; step++) {
      const control = velocityPID.compute(targetVelocity, state.velocity, dt);
      state = system2.update(control, dt);
    }

    const error = targetVelocity - state.velocity;
    console.log(
      `${t.toFixed(2)} | ${state.velocity.toFixed(3).padEnd(8)} | ${error.toFixed(3).padEnd(6)} | ${velocityPID.getState().output.toFixed(3)}`
    );
  }

  // Example 3: Cascaded Control
  console.log('\n--- Cascaded PID Control ---');
  const cascadedPID = new CascadedPIDController(
    { kP: 1.0, kI: 0.1, kD: 0.5 },  // Position loop
    { kP: 2.0, kI: 0.5, kD: 0.3 },  // Velocity loop
    { min: -10, max: 10 },
    { min: -15, max: 15 }
  );

  const system3 = new SystemSimulator(1.5, 0.3);
  system3.reset();

  const targetPosition = 15.0;
  console.log(`Target position: ${targetPosition} m`);
  console.log('\nTime | Position | Velocity | Error');
  console.log('-----|----------|----------|-------');

  for (let t = 0; t <= 3.0; t += 0.5) {
    let state = system3.getState();

    for (let step = 0; step < 50; step++) {
      const control = cascadedPID.compute(targetPosition, state.position, state.velocity, dt);
      state = system3.update(control, dt);
    }

    const error = targetPosition - state.position;
    console.log(
      `${t.toFixed(2)} | ${state.position.toFixed(3).padEnd(8)} | ${state.velocity.toFixed(3).padEnd(8)} | ${error.toFixed(3)}`
    );
  }

  // Example 4: Auto-tuning
  console.log('\n--- PID Auto-tuning (Ziegler-Nichols) ---');
  const Ku = 4.0;  // Ultimate gain
  const Tu = 0.5;  // Ultimate period

  const tunings = AutoTunePID.zieglerNichols(Ku, Tu);
  console.log('Tuning methods:');
  console.log('Classic PID:', tunings.classic);
  console.log('No Overshoot:', tunings.noOvershoot);
  console.log('Some Overshoot:', tunings.someOvershoot);

  // Test classic tuning
  const autoPID = new PIDController(tunings.classic, { min: -10, max: 10 });
  const system4 = new SystemSimulator(1.0, 0.2);
  system4.reset();

  console.log('\nTesting classic tuning:');
  console.log('Time | Position | Error');
  console.log('-----|----------|-------');

  for (let t = 0; t <= 2.0; t += 0.4) {
    let state = system4.getState();

    for (let step = 0; step < 40; step++) {
      const control = autoPID.compute(10, state.position, dt);
      state = system4.update(control, dt);
    }

    const error = 10 - state.position;
    console.log(`${t.toFixed(2)} | ${state.position.toFixed(3).padEnd(8)} | ${error.toFixed(3)}`);
  }

  // Example 5: Comparison of Different Gains
  console.log('\n--- Gain Comparison ---');
  const testConfigs = [
    { name: 'High P', gains: { kP: 5.0, kI: 0.5, kD: 0.5 } },
    { name: 'High I', gains: { kP: 2.0, kI: 2.0, kD: 0.5 } },
    { name: 'High D', gains: { kP: 2.0, kI: 0.5, kD: 2.0 } },
    { name: 'Balanced', gains: { kP: 2.0, kI: 0.5, kD: 0.8 } }
  ];

  console.log('Configuration | Settling Time | Overshoot | Steady-State Error');
  console.log('--------------|---------------|-----------|-------------------');

  for (const config of testConfigs) {
    const pid = new PIDController(config.gains, { min: -10, max: 10 });
    const sys = new SystemSimulator(1.0, 0.2);

    let settlingTime = 0;
    let maxOvershoot = 0;
    let finalError = 0;
    const target = 10;

    for (let t = 0; t <= 5.0; t += dt) {
      const control = pid.compute(target, sys.getState().position, dt);
      const state = sys.update(control, dt);

      const overshoot = Math.max(0, state.position - target);
      maxOvershoot = Math.max(maxOvershoot, overshoot);

      if (Math.abs(target - state.position) < 0.05 && settlingTime === 0) {
        settlingTime = t;
      }

      if (t >= 4.9) {
        finalError = Math.abs(target - state.position);
      }
    }

    console.log(
      `${config.name.padEnd(13)} | ${settlingTime.toFixed(3).padEnd(13)} | ` +
      `${maxOvershoot.toFixed(3).padEnd(9)} | ${finalError.toFixed(4)}`
    );
  }

  console.log('\n=== Examples Complete ===');
}

// Run examples
if (require.main === module) {
  main();
}

export {
  PIDController,
  AdvancedPIDController,
  CascadedPIDController,
  AutoTunePID,
  AdaptivePIDController,
  SystemSimulator,
  type PIDGains,
  type PIDState
};
