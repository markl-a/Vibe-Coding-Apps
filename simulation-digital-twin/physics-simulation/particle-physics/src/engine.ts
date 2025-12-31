/**
 * Particle Physics Engine
 *
 * 2D physics simulation with particles, springs, and forces
 */

import type {
  Vec2,
  Particle,
  Spring,
  ForceField,
  CollisionEvent,
  Boundary,
  SimulationConfig,
  SimulationState,
  SimulationStats,
} from './types.js';

import * as V from './vector.js';

const DEFAULT_CONFIG: SimulationConfig = {
  gravity: { x: 0, y: 9.81 },
  airResistance: 0.01,
  timeStep: 1 / 60,
  substeps: 4,
  collisions: true,
  sleeping: false,
  sleepThreshold: 0.1,
};

export class PhysicsEngine {
  private config: SimulationConfig;
  private particles: Map<string, Particle>;
  private springs: Map<string, Spring>;
  private forceFields: Map<string, ForceField>;
  private time: number;
  private stepCount: number;
  private lastCollisions: CollisionEvent[];
  private idCounter: number;

  constructor(config: Partial<SimulationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.particles = new Map();
    this.springs = new Map();
    this.forceFields = new Map();
    this.time = 0;
    this.stepCount = 0;
    this.lastCollisions = [];
    this.idCounter = 0;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${++this.idCounter}`;
  }

  // Particle management
  addParticle(props: Partial<Particle> & { position: Vec2 }): Particle {
    const particle: Particle = {
      id: props.id || this.generateId('p'),
      position: V.clone(props.position),
      velocity: props.velocity ? V.clone(props.velocity) : V.ZERO,
      acceleration: V.ZERO,
      mass: props.mass ?? 1,
      radius: props.radius ?? 10,
      restitution: props.restitution ?? 0.8,
      friction: props.friction ?? 0.1,
      fixed: props.fixed ?? false,
      color: props.color,
      userData: props.userData,
    };
    this.particles.set(particle.id, particle);
    return particle;
  }

  removeParticle(id: string): boolean {
    // Remove associated springs
    for (const [springId, spring] of this.springs) {
      if (spring.particleA === id || spring.particleB === id) {
        this.springs.delete(springId);
      }
    }
    return this.particles.delete(id);
  }

  getParticle(id: string): Particle | undefined {
    return this.particles.get(id);
  }

  // Spring management
  addSpring(
    particleA: string,
    particleB: string,
    props: Partial<Omit<Spring, 'id' | 'particleA' | 'particleB'>> = {}
  ): Spring | null {
    const pA = this.particles.get(particleA);
    const pB = this.particles.get(particleB);
    if (!pA || !pB) return null;

    const restLength = props.restLength ?? V.distance(pA.position, pB.position);
    const spring: Spring = {
      id: this.generateId('s'),
      particleA,
      particleB,
      restLength,
      stiffness: props.stiffness ?? 100,
      damping: props.damping ?? 0.5,
    };
    this.springs.set(spring.id, spring);
    return spring;
  }

  removeSpring(id: string): boolean {
    return this.springs.delete(id);
  }

  // Force field management
  addForceField(props: Omit<ForceField, 'id'>): ForceField {
    const field: ForceField = {
      id: this.generateId('f'),
      ...props,
    };
    this.forceFields.set(field.id, field);
    return field;
  }

  removeForceField(id: string): boolean {
    return this.forceFields.delete(id);
  }

  // Apply forces to particles
  private applyForces(dt: number): void {
    for (const particle of this.particles.values()) {
      if (particle.fixed) continue;

      // Reset acceleration
      particle.acceleration = V.ZERO;

      // Gravity
      particle.acceleration = V.add(
        particle.acceleration,
        this.config.gravity
      );

      // Force fields
      for (const field of this.forceFields.values()) {
        const force = this.calculateFieldForce(particle, field);
        particle.acceleration = V.add(
          particle.acceleration,
          V.scale(force, 1 / particle.mass)
        );
      }

      // Air resistance
      const dragForce = V.scale(
        particle.velocity,
        -this.config.airResistance * V.magnitude(particle.velocity)
      );
      particle.acceleration = V.add(
        particle.acceleration,
        V.scale(dragForce, 1 / particle.mass)
      );
    }
  }

  private calculateFieldForce(particle: Particle, field: ForceField): Vec2 {
    switch (field.type) {
      case 'gravity':
        return V.scale(field.direction || { x: 0, y: 1 }, field.strength * particle.mass);

      case 'wind':
        return V.scale(field.direction || { x: 1, y: 0 }, field.strength);

      case 'point': {
        if (!field.position) return V.ZERO;
        const toCenter = V.subtract(field.position, particle.position);
        const dist = V.magnitude(toCenter);
        if (dist === 0 || (field.radius && dist > field.radius)) return V.ZERO;

        let strength = field.strength;
        if (field.falloff === 'linear' && field.radius) {
          strength *= 1 - dist / field.radius;
        } else if (field.falloff === 'quadratic') {
          strength /= dist * dist;
        }
        return V.scale(V.normalize(toCenter), strength);
      }

      case 'vortex': {
        if (!field.position) return V.ZERO;
        const toCenter = V.subtract(field.position, particle.position);
        const dist = V.magnitude(toCenter);
        if (dist === 0 || (field.radius && dist > field.radius)) return V.ZERO;

        const tangent = V.perpendicular(V.normalize(toCenter));
        let strength = field.strength;
        if (field.falloff === 'linear' && field.radius) {
          strength *= 1 - dist / field.radius;
        }
        return V.scale(tangent, strength);
      }

      default:
        return V.ZERO;
    }
  }

  // Apply spring forces
  private applySprings(): void {
    for (const spring of this.springs.values()) {
      const pA = this.particles.get(spring.particleA);
      const pB = this.particles.get(spring.particleB);
      if (!pA || !pB) continue;

      const delta = V.subtract(pB.position, pA.position);
      const distance = V.magnitude(delta);
      if (distance === 0) continue;

      const direction = V.scale(delta, 1 / distance);
      const stretch = distance - spring.restLength;

      // Spring force (Hooke's law)
      const springForce = spring.stiffness * stretch;

      // Damping force
      const relativeVelocity = V.subtract(pB.velocity, pA.velocity);
      const dampingForce = spring.damping * V.dot(relativeVelocity, direction);

      const totalForce = springForce + dampingForce;
      const forceVector = V.scale(direction, totalForce);

      if (!pA.fixed) {
        pA.acceleration = V.add(
          pA.acceleration,
          V.scale(forceVector, 1 / pA.mass)
        );
      }
      if (!pB.fixed) {
        pB.acceleration = V.add(
          pB.acceleration,
          V.scale(forceVector, -1 / pB.mass)
        );
      }
    }
  }

  // Integrate motion (Verlet integration)
  private integrate(dt: number): void {
    for (const particle of this.particles.values()) {
      if (particle.fixed) continue;

      // Update velocity
      particle.velocity = V.add(
        particle.velocity,
        V.scale(particle.acceleration, dt)
      );

      // Update position
      particle.position = V.add(
        particle.position,
        V.scale(particle.velocity, dt)
      );
    }
  }

  // Handle collisions between particles
  private handleCollisions(): void {
    this.lastCollisions = [];
    if (!this.config.collisions) return;

    const particles = Array.from(this.particles.values());

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const pA = particles[i];
        const pB = particles[j];

        const delta = V.subtract(pB.position, pA.position);
        const distance = V.magnitude(delta);
        const minDist = pA.radius + pB.radius;

        if (distance < minDist && distance > 0) {
          // Collision detected
          const normal = V.scale(delta, 1 / distance);
          const penetration = minDist - distance;

          // Separate particles
          const totalMass = pA.mass + pB.mass;
          if (!pA.fixed) {
            pA.position = V.subtract(
              pA.position,
              V.scale(normal, (penetration * pB.mass) / totalMass)
            );
          }
          if (!pB.fixed) {
            pB.position = V.add(
              pB.position,
              V.scale(normal, (penetration * pA.mass) / totalMass)
            );
          }

          // Calculate collision response
          const relVel = V.subtract(pA.velocity, pB.velocity);
          const relVelNormal = V.dot(relVel, normal);

          // Only resolve if approaching
          if (relVelNormal > 0) {
            const restitution = Math.min(pA.restitution, pB.restitution);
            const impulse =
              (-(1 + restitution) * relVelNormal) /
              (1 / pA.mass + 1 / pB.mass);

            const impulseVector = V.scale(normal, impulse);

            if (!pA.fixed) {
              pA.velocity = V.subtract(
                pA.velocity,
                V.scale(impulseVector, 1 / pA.mass)
              );
            }
            if (!pB.fixed) {
              pB.velocity = V.add(
                pB.velocity,
                V.scale(impulseVector, 1 / pB.mass)
              );
            }

            // Record collision
            this.lastCollisions.push({
              particleA: pA.id,
              particleB: pB.id,
              point: V.lerp(pA.position, pB.position, 0.5),
              normal,
              penetration,
              relativeVelocity: Math.abs(relVelNormal),
            });
          }
        }
      }
    }
  }

  // Handle boundary constraints
  private handleBoundary(): void {
    const boundary = this.config.boundary;
    if (!boundary) return;

    for (const particle of this.particles.values()) {
      if (particle.fixed) continue;

      if (boundary.type === 'box') {
        const size = boundary.size as Vec2;
        const halfW = size.x / 2;
        const halfH = size.y / 2;
        const minX = boundary.center.x - halfW + particle.radius;
        const maxX = boundary.center.x + halfW - particle.radius;
        const minY = boundary.center.y - halfH + particle.radius;
        const maxY = boundary.center.y + halfH - particle.radius;

        if (particle.position.x < minX) {
          particle.position.x = minX;
          particle.velocity.x *= -boundary.restitution;
        } else if (particle.position.x > maxX) {
          particle.position.x = maxX;
          particle.velocity.x *= -boundary.restitution;
        }

        if (particle.position.y < minY) {
          particle.position.y = minY;
          particle.velocity.y *= -boundary.restitution;
        } else if (particle.position.y > maxY) {
          particle.position.y = maxY;
          particle.velocity.y *= -boundary.restitution;
        }
      } else if (boundary.type === 'circle') {
        const radius = boundary.size as number;
        const delta = V.subtract(particle.position, boundary.center);
        const dist = V.magnitude(delta);
        const maxDist = radius - particle.radius;

        if (dist > maxDist) {
          const normal = V.normalize(delta);
          particle.position = V.add(
            boundary.center,
            V.scale(normal, maxDist)
          );
          const velNormal = V.dot(particle.velocity, normal);
          if (velNormal > 0) {
            particle.velocity = V.subtract(
              particle.velocity,
              V.scale(normal, velNormal * (1 + boundary.restitution))
            );
          }
        }
      }
    }
  }

  // Main simulation step
  step(): void {
    const dt = this.config.timeStep / this.config.substeps;

    for (let i = 0; i < this.config.substeps; i++) {
      this.applyForces(dt);
      this.applySprings();
      this.integrate(dt);
      this.handleCollisions();
      this.handleBoundary();
    }

    this.time += this.config.timeStep;
    this.stepCount++;
  }

  // Get current state
  getState(): SimulationState {
    const particles = Array.from(this.particles.values());
    let kinetic = 0;
    let potential = 0;

    for (const p of particles) {
      kinetic += 0.5 * p.mass * V.magnitudeSquared(p.velocity);
      potential += p.mass * this.config.gravity.y * p.position.y;
    }

    return {
      time: this.time,
      stepCount: this.stepCount,
      particles: particles.map((p) => ({ ...p })),
      springs: Array.from(this.springs.values()),
      forceFields: Array.from(this.forceFields.values()),
      collisions: [...this.lastCollisions],
      energy: {
        kinetic,
        potential,
        total: kinetic + potential,
      },
    };
  }

  // Get statistics
  getStats(): SimulationStats {
    const particles = Array.from(this.particles.values());
    let totalVelocity = 0;
    let maxVelocity = 0;
    let centerOfMass = V.ZERO;
    let totalMass = 0;
    let min = { x: Infinity, y: Infinity };
    let max = { x: -Infinity, y: -Infinity };

    for (const p of particles) {
      const vel = V.magnitude(p.velocity);
      totalVelocity += vel;
      maxVelocity = Math.max(maxVelocity, vel);
      centerOfMass = V.add(centerOfMass, V.scale(p.position, p.mass));
      totalMass += p.mass;
      min.x = Math.min(min.x, p.position.x - p.radius);
      min.y = Math.min(min.y, p.position.y - p.radius);
      max.x = Math.max(max.x, p.position.x + p.radius);
      max.y = Math.max(max.y, p.position.y + p.radius);
    }

    if (totalMass > 0) {
      centerOfMass = V.scale(centerOfMass, 1 / totalMass);
    }

    return {
      particleCount: particles.length,
      springCount: this.springs.size,
      collisionCount: this.lastCollisions.length,
      avgVelocity: particles.length > 0 ? totalVelocity / particles.length : 0,
      maxVelocity,
      centerOfMass,
      boundingBox: { min, max },
      stepTime: this.config.timeStep,
    };
  }

  // Reset simulation
  reset(): void {
    this.particles.clear();
    this.springs.clear();
    this.forceFields.clear();
    this.time = 0;
    this.stepCount = 0;
    this.lastCollisions = [];
  }

  // Configuration
  setConfig(config: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }
}
