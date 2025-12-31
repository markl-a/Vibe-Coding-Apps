/**
 * Particle Physics Types
 */

// 2D Vector
export interface Vec2 {
  x: number;
  y: number;
}

// Particle properties
export interface Particle {
  id: string;
  position: Vec2;
  velocity: Vec2;
  acceleration: Vec2;
  mass: number;
  radius: number;
  restitution: number; // bounciness (0-1)
  friction: number;    // surface friction (0-1)
  fixed: boolean;      // immovable particle
  color?: string;
  userData?: Record<string, unknown>;
}

// Spring constraint
export interface Spring {
  id: string;
  particleA: string;
  particleB: string;
  restLength: number;
  stiffness: number;   // spring constant k
  damping: number;     // damping factor
}

// Force field
export interface ForceField {
  id: string;
  type: 'gravity' | 'wind' | 'point' | 'vortex';
  position?: Vec2;     // for point/vortex forces
  direction?: Vec2;    // for directional forces
  strength: number;
  radius?: number;     // for point forces
  falloff?: 'none' | 'linear' | 'quadratic';
}

// Collision event
export interface CollisionEvent {
  particleA: string;
  particleB: string;
  point: Vec2;
  normal: Vec2;
  penetration: number;
  relativeVelocity: number;
}

// Boundary constraint
export interface Boundary {
  type: 'box' | 'circle';
  center: Vec2;
  size: Vec2 | number; // Vec2 for box, number for circle radius
  restitution: number;
}

// Simulation config
export interface SimulationConfig {
  gravity: Vec2;
  airResistance: number;   // 0-1 drag factor
  timeStep: number;        // seconds per step
  substeps: number;        // iterations per step
  boundary?: Boundary;
  collisions: boolean;
  sleeping: boolean;       // allow particles to sleep when stationary
  sleepThreshold: number;
}

// Simulation state
export interface SimulationState {
  time: number;
  stepCount: number;
  particles: Particle[];
  springs: Spring[];
  forceFields: ForceField[];
  collisions: CollisionEvent[];
  energy: {
    kinetic: number;
    potential: number;
    total: number;
  };
}

// Simulation statistics
export interface SimulationStats {
  particleCount: number;
  springCount: number;
  collisionCount: number;
  avgVelocity: number;
  maxVelocity: number;
  centerOfMass: Vec2;
  boundingBox: { min: Vec2; max: Vec2 };
  stepTime: number;
}
