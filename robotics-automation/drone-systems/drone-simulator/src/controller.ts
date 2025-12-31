import type {
  DroneState,
  DroneConfig,
  ControlInput,
  Waypoint,
  FlightPlan,
  FlightMode,
  DroneEvent,
  DroneEventHandler,
  Telemetry,
  Vector3,
} from './types.js';
import { PhysicsEngine, vec3 } from './physics.js';

/**
 * Drone Flight Controller
 *
 * Handles:
 * - Flight mode management
 * - Waypoint navigation
 * - PID control
 * - Safety features
 */

// PID controller gains
const PID_GAINS = {
  position: { kP: 0.5, kI: 0.01, kD: 0.2 },
  altitude: { kP: 0.8, kI: 0.02, kD: 0.3 },
  velocity: { kP: 0.3, kI: 0.01, kD: 0.1 },
};

// Default drone configuration
const DEFAULT_CONFIG: DroneConfig = {
  mass: 1.5, // kg
  maxThrust: 30, // N
  maxSpeed: 15, // m/s
  maxAcceleration: 5, // m/s²
  maxAltitude: 120, // m
  batteryCapacity: 5000, // mAh
  hoverPowerConsumption: 500, // mA
  movementPowerConsumption: 100, // mA per m/s
};

export class DroneController {
  private state: DroneState;
  private config: DroneConfig;
  private physics: PhysicsEngine;
  private flightPlan: FlightPlan | null = null;
  private currentWaypointIndex = 0;
  private waypointHoldTimer = 0;
  private homePosition: Vector3;
  private eventHandlers: DroneEventHandler[] = [];
  private flightTime = 0;
  private distanceTraveled = 0;
  private lastPosition: Vector3;

  // PID state
  private integralError: Vector3 = vec3.zero();
  private lastError: Vector3 = vec3.zero();

  constructor(config: Partial<DroneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.physics = new PhysicsEngine(this.config);

    // Initialize state
    this.state = {
      position: vec3.zero(),
      velocity: vec3.zero(),
      acceleration: vec3.zero(),
      orientation: vec3.zero(),
      angularVelocity: vec3.zero(),
      batteryLevel: 100,
      isArmed: false,
      flightMode: 'idle',
    };

    this.homePosition = { ...this.state.position };
    this.lastPosition = { ...this.state.position };
  }

  /**
   * Register event handler
   */
  onEvent(handler: DroneEventHandler): void {
    this.eventHandlers.push(handler);
  }

  /**
   * Emit event to all handlers
   */
  private emit(event: DroneEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  /**
   * Arm the drone
   */
  arm(): boolean {
    if (this.state.batteryLevel < 20) {
      console.log('Cannot arm: Low battery');
      return false;
    }

    this.state.isArmed = true;
    this.homePosition = { ...this.state.position };
    this.emit({ type: 'armed' });
    return true;
  }

  /**
   * Disarm the drone
   */
  disarm(): void {
    this.state.isArmed = false;
    this.state.flightMode = 'idle';
    this.emit({ type: 'disarmed' });
  }

  /**
   * Take off to specified altitude
   */
  takeoff(altitude: number = 10): void {
    if (!this.state.isArmed) {
      console.log('Cannot takeoff: Drone not armed');
      return;
    }

    this.state.flightMode = 'takeoff';
    this.flightPlan = {
      name: 'Takeoff',
      waypoints: [
        {
          position: { ...this.state.position, z: altitude },
          speed: 2,
          holdTime: 0,
        },
      ],
      returnToHome: false,
      maxAltitude: this.config.maxAltitude,
      geofenceRadius: 100,
    };
    this.currentWaypointIndex = 0;
  }

  /**
   * Land at current position
   */
  land(): void {
    this.state.flightMode = 'landing';
    this.flightPlan = {
      name: 'Landing',
      waypoints: [
        {
          position: { x: this.state.position.x, y: this.state.position.y, z: 0 },
          speed: 1,
          holdTime: 0,
        },
      ],
      returnToHome: false,
      maxAltitude: this.config.maxAltitude,
      geofenceRadius: 100,
    };
    this.currentWaypointIndex = 0;
  }

  /**
   * Return to home position
   */
  returnToHome(): void {
    this.state.flightMode = 'return_home';
    this.flightPlan = {
      name: 'Return Home',
      waypoints: [
        {
          position: { ...this.homePosition, z: Math.max(this.state.position.z, 20) },
          speed: 5,
          holdTime: 0,
        },
        {
          position: { ...this.homePosition, z: 0 },
          speed: 2,
          holdTime: 0,
        },
      ],
      returnToHome: false,
      maxAltitude: this.config.maxAltitude,
      geofenceRadius: 1000,
    };
    this.currentWaypointIndex = 0;
  }

  /**
   * Execute a flight plan
   */
  executePlan(plan: FlightPlan): void {
    if (!this.state.isArmed) {
      console.log('Cannot execute plan: Drone not armed');
      return;
    }

    this.flightPlan = plan;
    this.currentWaypointIndex = 0;
    this.waypointHoldTimer = 0;
    this.state.flightMode = 'waypoint';
  }

  /**
   * Emergency stop
   */
  emergency(): void {
    this.state.flightMode = 'emergency';
    this.emit({ type: 'emergency', reason: 'Manual emergency triggered' });
  }

  /**
   * Update simulation
   */
  update(deltaTime: number): Telemetry {
    // Update flight time
    if (this.state.isArmed && this.state.position.z > 0.1) {
      this.flightTime += deltaTime;
    }

    // Calculate distance traveled
    const distanceThisFrame = vec3.distance(this.state.position, this.lastPosition);
    this.distanceTraveled += distanceThisFrame;
    this.lastPosition = { ...this.state.position };

    // Calculate control input
    const control = this.calculateControl(deltaTime);

    // Update physics
    this.state = this.physics.update(this.state, control, deltaTime);

    // Update battery
    this.updateBattery(deltaTime);

    // Check safety
    this.checkSafety();

    // Check mission progress
    this.checkMissionProgress();

    return this.getTelemetry();
  }

  /**
   * Calculate control input based on flight mode
   */
  private calculateControl(deltaTime: number): ControlInput {
    switch (this.state.flightMode) {
      case 'idle':
        return { throttle: 0, pitch: 0, roll: 0, yaw: 0 };

      case 'emergency':
        // Cut throttle
        return { throttle: 0, pitch: 0, roll: 0, yaw: 0 };

      case 'hover':
        return this.calculateHoverControl();

      case 'takeoff':
      case 'landing':
      case 'waypoint':
      case 'return_home':
        return this.calculateWaypointControl(deltaTime);

      default:
        return { throttle: 0, pitch: 0, roll: 0, yaw: 0 };
    }
  }

  /**
   * Calculate control for hovering
   */
  private calculateHoverControl(): ControlInput {
    // Maintain current position
    const targetPosition = { ...this.state.position };
    return this.positionControl(targetPosition);
  }

  /**
   * Calculate control for waypoint navigation
   */
  private calculateWaypointControl(deltaTime: number): ControlInput {
    if (!this.flightPlan || this.currentWaypointIndex >= this.flightPlan.waypoints.length) {
      this.state.flightMode = 'hover';
      return this.calculateHoverControl();
    }

    const waypoint = this.flightPlan.waypoints[this.currentWaypointIndex];
    const distance = vec3.distance(this.state.position, waypoint.position);

    // Check if reached waypoint
    if (distance < 0.5) {
      // Hold at waypoint
      this.waypointHoldTimer += deltaTime;

      if (this.waypointHoldTimer >= waypoint.holdTime) {
        // Move to next waypoint
        this.emit({
          type: 'waypoint_reached',
          index: this.currentWaypointIndex,
          waypoint,
        });

        this.currentWaypointIndex++;
        this.waypointHoldTimer = 0;

        // Check if mission complete
        if (this.currentWaypointIndex >= this.flightPlan.waypoints.length) {
          if (this.state.flightMode === 'takeoff') {
            this.state.flightMode = 'hover';
            this.emit({ type: 'takeoff_complete', altitude: this.state.position.z });
          } else if (this.state.flightMode === 'landing') {
            this.disarm();
            this.emit({ type: 'landing_complete' });
          } else {
            this.emit({ type: 'mission_complete' });
            this.state.flightMode = 'hover';
          }
        }
      }

      return this.positionControl(waypoint.position);
    }

    return this.positionControl(waypoint.position);
  }

  /**
   * PID position control
   */
  private positionControl(target: Vector3): ControlInput {
    // Position error
    const error = vec3.sub(target, this.state.position);

    // PID control
    const pTerm = vec3.scale(error, PID_GAINS.position.kP);
    this.integralError = vec3.add(this.integralError, vec3.scale(error, 0.016));
    const iTerm = vec3.scale(this.integralError, PID_GAINS.position.kI);
    const dTerm = vec3.scale(vec3.sub(error, this.lastError), PID_GAINS.position.kD);
    this.lastError = error;

    const controlVector = vec3.add(vec3.add(pTerm, iTerm), dTerm);

    // Convert to control inputs
    const horizontalMag = Math.sqrt(controlVector.x ** 2 + controlVector.y ** 2);
    const maxHorizontal = 1;

    // Calculate throttle for altitude
    const altitudeError = target.z - this.state.position.z;
    const hoverThrottle = 0.5; // Approximate hover throttle
    const throttle = Math.max(0, Math.min(1, hoverThrottle + altitudeError * PID_GAINS.altitude.kP));

    // Calculate pitch and roll for horizontal movement
    const pitch = Math.max(-1, Math.min(1, controlVector.x / maxHorizontal));
    const roll = Math.max(-1, Math.min(1, controlVector.y / maxHorizontal));

    return {
      throttle,
      pitch: pitch * 0.3,
      roll: roll * 0.3,
      yaw: 0,
    };
  }

  /**
   * Update battery level
   */
  private updateBattery(deltaTime: number): void {
    const consumption = this.physics.calculatePowerConsumption(this.state);
    const consumedMah = (consumption * deltaTime) / 3600;
    const percentConsumed = (consumedMah / this.config.batteryCapacity) * 100;
    this.state.batteryLevel = Math.max(0, this.state.batteryLevel - percentConsumed);

    if (this.state.batteryLevel < 20 && this.state.batteryLevel > 19.9) {
      this.emit({ type: 'low_battery', level: this.state.batteryLevel });
    }

    if (this.state.batteryLevel < 10 && this.state.flightMode !== 'return_home') {
      console.log('Critical battery! Returning home...');
      this.returnToHome();
    }
  }

  /**
   * Check safety constraints
   */
  private checkSafety(): void {
    if (!this.flightPlan) return;

    // Check geofence
    const distanceFromHome = vec3.distance(
      { ...this.state.position, z: 0 },
      { ...this.homePosition, z: 0 }
    );

    if (distanceFromHome > this.flightPlan.geofenceRadius) {
      this.emit({ type: 'geofence_breach', position: this.state.position });
      this.returnToHome();
    }
  }

  /**
   * Check mission progress (placeholder)
   */
  private checkMissionProgress(): void {
    // Additional mission checks can be added here
  }

  /**
   * Get current telemetry
   */
  getTelemetry(): Telemetry {
    const speed = vec3.magnitude(this.state.velocity);
    const consumption = this.physics.calculatePowerConsumption(this.state);
    const remainingCapacity = (this.state.batteryLevel / 100) * this.config.batteryCapacity;
    const remainingMinutes = consumption > 0 ? (remainingCapacity / consumption) * 60 : 0;

    return {
      state: { ...this.state },
      sensors: {
        gps: { ...this.state.position },
        barometer: this.state.position.z,
        imu: {
          accelerometer: { ...this.state.acceleration },
          gyroscope: { ...this.state.angularVelocity },
          magnetometer: { x: 0, y: 1, z: 0 },
        },
        ultrasonic: this.state.position.z,
        battery: this.state.batteryLevel,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      flightTime: this.flightTime,
      distanceTraveled: this.distanceTraveled,
      currentWaypointIndex: this.currentWaypointIndex,
      estimatedBatteryRemaining: remainingMinutes,
    };
  }

  /**
   * Get current state
   */
  getState(): DroneState {
    return { ...this.state };
  }

  /**
   * Set wind for physics simulation
   */
  setWind(wind: Vector3): void {
    this.physics.setWind(wind);
  }
}
