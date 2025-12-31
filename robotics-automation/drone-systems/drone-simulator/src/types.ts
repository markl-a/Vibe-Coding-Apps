/**
 * Drone Simulator Types
 */

// 3D Vector
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// Drone state
export interface DroneState {
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  orientation: Vector3; // roll, pitch, yaw in radians
  angularVelocity: Vector3;
  batteryLevel: number; // 0-100%
  isArmed: boolean;
  flightMode: FlightMode;
}

// Flight modes
export type FlightMode = 'idle' | 'takeoff' | 'hover' | 'waypoint' | 'return_home' | 'landing' | 'emergency';

// Waypoint
export interface Waypoint {
  position: Vector3;
  speed: number; // m/s
  holdTime: number; // seconds to hover at waypoint
  action?: WaypointAction;
}

// Actions at waypoint
export type WaypointAction = 'none' | 'photo' | 'video_start' | 'video_stop' | 'rotate';

// Flight plan
export interface FlightPlan {
  name: string;
  waypoints: Waypoint[];
  returnToHome: boolean;
  maxAltitude: number;
  geofenceRadius: number;
}

// Drone configuration
export interface DroneConfig {
  mass: number; // kg
  maxThrust: number; // N
  maxSpeed: number; // m/s
  maxAcceleration: number; // m/s²
  maxAltitude: number; // m
  batteryCapacity: number; // mAh
  hoverPowerConsumption: number; // mA
  movementPowerConsumption: number; // mA per m/s
}

// Sensor readings
export interface SensorData {
  gps: Vector3;
  barometer: number; // altitude
  imu: {
    accelerometer: Vector3;
    gyroscope: Vector3;
    magnetometer: Vector3;
  };
  ultrasonic: number; // ground distance
  battery: number;
  timestamp: number;
}

// Control input
export interface ControlInput {
  throttle: number; // 0-1
  pitch: number; // -1 to 1
  roll: number; // -1 to 1
  yaw: number; // -1 to 1
}

// Telemetry data
export interface Telemetry {
  state: DroneState;
  sensors: SensorData;
  timestamp: number;
  flightTime: number; // seconds
  distanceTraveled: number; // meters
  currentWaypointIndex: number;
  estimatedBatteryRemaining: number; // minutes
}

// Event types
export type DroneEvent =
  | { type: 'armed' }
  | { type: 'disarmed' }
  | { type: 'takeoff_complete'; altitude: number }
  | { type: 'landing_complete' }
  | { type: 'waypoint_reached'; index: number; waypoint: Waypoint }
  | { type: 'mission_complete' }
  | { type: 'low_battery'; level: number }
  | { type: 'geofence_breach'; position: Vector3 }
  | { type: 'emergency'; reason: string };

export type DroneEventHandler = (event: DroneEvent) => void;
