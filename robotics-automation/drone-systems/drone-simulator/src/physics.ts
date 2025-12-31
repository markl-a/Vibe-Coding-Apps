import type { Vector3, DroneState, DroneConfig, ControlInput } from './types.js';

/**
 * Physics Engine
 *
 * Simulates drone physics including:
 * - Gravity
 * - Thrust
 * - Drag
 * - Wind effects
 */

// Constants
const GRAVITY = 9.81; // m/s²
const AIR_DENSITY = 1.225; // kg/m³
const DRAG_COEFFICIENT = 0.5;
const DRONE_CROSS_SECTION = 0.1; // m²

// Vector math utilities
export const vec3 = {
  zero: (): Vector3 => ({ x: 0, y: 0, z: 0 }),

  add: (a: Vector3, b: Vector3): Vector3 => ({
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }),

  sub: (a: Vector3, b: Vector3): Vector3 => ({
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z,
  }),

  scale: (v: Vector3, s: number): Vector3 => ({
    x: v.x * s,
    y: v.y * s,
    z: v.z * s,
  }),

  magnitude: (v: Vector3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),

  normalize: (v: Vector3): Vector3 => {
    const mag = vec3.magnitude(v);
    if (mag === 0) return vec3.zero();
    return vec3.scale(v, 1 / mag);
  },

  distance: (a: Vector3, b: Vector3): number => vec3.magnitude(vec3.sub(a, b)),

  dot: (a: Vector3, b: Vector3): number => a.x * b.x + a.y * b.y + a.z * b.z,

  clamp: (v: Vector3, max: number): Vector3 => {
    const mag = vec3.magnitude(v);
    if (mag <= max) return v;
    return vec3.scale(vec3.normalize(v), max);
  },
};

export class PhysicsEngine {
  private config: DroneConfig;
  private wind: Vector3 = vec3.zero();

  constructor(config: DroneConfig) {
    this.config = config;
  }

  /**
   * Set wind velocity
   */
  setWind(wind: Vector3): void {
    this.wind = wind;
  }

  /**
   * Calculate forces and update state
   */
  update(state: DroneState, control: ControlInput, deltaTime: number): DroneState {
    if (!state.isArmed) {
      return state;
    }

    // Calculate forces
    const gravity = this.calculateGravity();
    const thrust = this.calculateThrust(state, control);
    const drag = this.calculateDrag(state);
    const windForce = this.calculateWindForce();

    // Net force
    const netForce = vec3.add(
      vec3.add(vec3.add(gravity, thrust), drag),
      windForce
    );

    // Acceleration (F = ma)
    const acceleration: Vector3 = vec3.scale(netForce, 1 / this.config.mass);

    // Clamp acceleration
    const clampedAcceleration = vec3.clamp(acceleration, this.config.maxAcceleration);

    // Update velocity (v = v0 + at)
    let newVelocity = vec3.add(state.velocity, vec3.scale(clampedAcceleration, deltaTime));

    // Clamp velocity
    newVelocity = vec3.clamp(newVelocity, this.config.maxSpeed);

    // Update position (p = p0 + vt)
    let newPosition = vec3.add(state.position, vec3.scale(newVelocity, deltaTime));

    // Ground collision
    if (newPosition.z < 0) {
      newPosition.z = 0;
      newVelocity.z = 0;
    }

    // Altitude limit
    if (newPosition.z > this.config.maxAltitude) {
      newPosition.z = this.config.maxAltitude;
      newVelocity.z = Math.min(0, newVelocity.z);
    }

    // Update orientation based on control inputs
    const newOrientation = this.updateOrientation(state.orientation, control, deltaTime);

    return {
      ...state,
      position: newPosition,
      velocity: newVelocity,
      acceleration: clampedAcceleration,
      orientation: newOrientation,
    };
  }

  /**
   * Calculate gravity force
   */
  private calculateGravity(): Vector3 {
    return { x: 0, y: 0, z: -GRAVITY * this.config.mass };
  }

  /**
   * Calculate thrust force based on control input
   */
  private calculateThrust(state: DroneState, control: ControlInput): Vector3 {
    const throttleForce = control.throttle * this.config.maxThrust;

    // Thrust direction based on orientation
    const pitch = state.orientation.y;
    const roll = state.orientation.x;

    return {
      x: throttleForce * Math.sin(pitch) * Math.cos(roll),
      y: throttleForce * Math.sin(roll),
      z: throttleForce * Math.cos(pitch) * Math.cos(roll),
    };
  }

  /**
   * Calculate drag force
   */
  private calculateDrag(state: DroneState): Vector3 {
    const speed = vec3.magnitude(state.velocity);
    if (speed === 0) return vec3.zero();

    // Drag force = 0.5 * ρ * v² * Cd * A
    const dragMagnitude =
      0.5 * AIR_DENSITY * speed * speed * DRAG_COEFFICIENT * DRONE_CROSS_SECTION;

    // Drag opposes velocity
    const dragDirection = vec3.normalize(vec3.scale(state.velocity, -1));
    return vec3.scale(dragDirection, dragMagnitude);
  }

  /**
   * Calculate wind force
   */
  private calculateWindForce(): Vector3 {
    const windSpeed = vec3.magnitude(this.wind);
    if (windSpeed === 0) return vec3.zero();

    // Simplified wind force
    const windForce =
      0.5 * AIR_DENSITY * windSpeed * windSpeed * DRAG_COEFFICIENT * DRONE_CROSS_SECTION;

    return vec3.scale(vec3.normalize(this.wind), windForce);
  }

  /**
   * Update orientation based on control inputs
   */
  private updateOrientation(
    orientation: Vector3,
    control: ControlInput,
    deltaTime: number
  ): Vector3 {
    const maxRotationRate = Math.PI / 4; // 45 degrees per second

    return {
      x: orientation.x + control.roll * maxRotationRate * deltaTime,
      y: orientation.y + control.pitch * maxRotationRate * deltaTime,
      z: orientation.z + control.yaw * maxRotationRate * deltaTime,
    };
  }

  /**
   * Calculate power consumption
   */
  calculatePowerConsumption(state: DroneState): number {
    const speed = vec3.magnitude(state.velocity);
    return (
      this.config.hoverPowerConsumption +
      speed * this.config.movementPowerConsumption
    );
  }
}
