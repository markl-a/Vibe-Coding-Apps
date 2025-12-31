# Particle Physics Engine

A 2D particle physics simulation engine with springs, forces, and collision detection. Built in TypeScript for real-time physics simulations.

## Features

- **Particle System**: Mass, velocity, acceleration, friction
- **Spring Constraints**: Hooke's law with damping
- **Force Fields**: Gravity, wind, point forces, vortex
- **Collision Detection**: Particle-particle and boundary
- **Boundaries**: Box and circular constraints
- **Energy Tracking**: Kinetic and potential energy

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Basic Simulation

```typescript
import { PhysicsEngine } from '@vibe/particle-physics';

const engine = new PhysicsEngine({
  gravity: { x: 0, y: 9.81 },
  airResistance: 0.01,
});

// Add particles
const ball = engine.addParticle({
  position: { x: 100, y: 50 },
  velocity: { x: 10, y: 0 },
  mass: 1,
  radius: 20,
  restitution: 0.8,
});

// Simulation loop
setInterval(() => {
  engine.step();
  const state = engine.getState();
  console.log(state.particles[0].position);
}, 1000 / 60);
```

### Spring Connections

```typescript
// Create connected particles
const p1 = engine.addParticle({
  position: { x: 100, y: 100 },
  fixed: true, // Anchor point
});

const p2 = engine.addParticle({
  position: { x: 200, y: 100 },
  mass: 1,
});

// Connect with spring
engine.addSpring(p1.id, p2.id, {
  restLength: 100,
  stiffness: 200, // Spring constant
  damping: 5,     // Damping factor
});
```

### Force Fields

```typescript
// Gravitational point
engine.addForceField({
  type: 'point',
  position: { x: 250, y: 250 },
  strength: 1000,
  radius: 300,
  falloff: 'quadratic',
});

// Vortex (swirl)
engine.addForceField({
  type: 'vortex',
  position: { x: 250, y: 250 },
  strength: 500,
  radius: 200,
  falloff: 'linear',
});

// Wind
engine.addForceField({
  type: 'wind',
  direction: { x: 1, y: 0 },
  strength: 50,
});
```

### Boundaries

```typescript
// Box boundary
const engine = new PhysicsEngine({
  boundary: {
    type: 'box',
    center: { x: 250, y: 250 },
    size: { x: 500, y: 500 },
    restitution: 0.9,
  },
});

// Circular boundary
const engine = new PhysicsEngine({
  boundary: {
    type: 'circle',
    center: { x: 250, y: 250 },
    size: 200, // radius
    restitution: 0.8,
  },
});
```

## Configuration

```typescript
interface SimulationConfig {
  gravity: Vec2;        // World gravity (default: {x:0, y:9.81})
  airResistance: number; // Drag factor 0-1 (default: 0.01)
  timeStep: number;      // Seconds per step (default: 1/60)
  substeps: number;      // Iterations per step (default: 4)
  boundary?: Boundary;   // World boundary
  collisions: boolean;   // Enable collision detection (default: true)
  sleeping: boolean;     // Allow particles to sleep (default: false)
  sleepThreshold: number; // Velocity threshold for sleep
}
```

## Particle Properties

```typescript
interface Particle {
  id: string;
  position: Vec2;
  velocity: Vec2;
  acceleration: Vec2;
  mass: number;          // kg
  radius: number;        // pixels
  restitution: number;   // Bounciness 0-1
  friction: number;      // Surface friction 0-1
  fixed: boolean;        // Immovable if true
  color?: string;
  userData?: Record<string, unknown>;
}
```

## Vector Math Utilities

```typescript
import * as V from '@vibe/particle-physics';

// Create vectors
const a = V.vec2(10, 20);
const b = V.vec2(5, 15);

// Operations
V.add(a, b);          // {x: 15, y: 35}
V.subtract(a, b);     // {x: 5, y: 5}
V.scale(a, 2);        // {x: 20, y: 40}
V.magnitude(a);       // 22.36...
V.normalize(a);       // unit vector
V.dot(a, b);          // dot product
V.distance(a, b);     // distance between points
V.rotate(a, Math.PI); // rotate by radians
V.lerp(a, b, 0.5);    // linear interpolation
```

## Energy Tracking

```typescript
const state = engine.getState();

console.log('Kinetic energy:', state.energy.kinetic);
console.log('Potential energy:', state.energy.potential);
console.log('Total energy:', state.energy.total);
```

## Statistics

```typescript
const stats = engine.getStats();

console.log('Particles:', stats.particleCount);
console.log('Springs:', stats.springCount);
console.log('Collisions:', stats.collisionCount);
console.log('Avg velocity:', stats.avgVelocity);
console.log('Max velocity:', stats.maxVelocity);
console.log('Center of mass:', stats.centerOfMass);
console.log('Bounding box:', stats.boundingBox);
```

## Examples

### Bouncing Balls
```typescript
for (let i = 0; i < 10; i++) {
  engine.addParticle({
    position: { x: 50 + i * 50, y: 50 },
    velocity: { x: 0, y: 0 },
    mass: 1,
    radius: 20,
    restitution: 0.9,
  });
}
```

### Pendulum Chain
```typescript
const anchor = engine.addParticle({
  position: { x: 250, y: 50 },
  fixed: true,
});

let prev = anchor;
for (let i = 0; i < 10; i++) {
  const p = engine.addParticle({
    position: { x: 250, y: 50 + (i + 1) * 30 },
    mass: 1,
  });
  engine.addSpring(prev.id, p.id, {
    restLength: 30,
    stiffness: 100,
    damping: 1,
  });
  prev = p;
}
```

### Soft Body
```typescript
// Create grid of connected particles
const grid = [];
for (let y = 0; y < 5; y++) {
  grid[y] = [];
  for (let x = 0; x < 5; x++) {
    grid[y][x] = engine.addParticle({
      position: { x: 100 + x * 30, y: 100 + y * 30 },
      mass: 0.5,
    });
  }
}

// Connect neighbors
for (let y = 0; y < 5; y++) {
  for (let x = 0; x < 5; x++) {
    if (x < 4) engine.addSpring(grid[y][x].id, grid[y][x+1].id);
    if (y < 4) engine.addSpring(grid[y][x].id, grid[y+1][x].id);
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PhysicsEngine                             │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │   Particle   │  │    Spring     │  │    Force     │     │
│  │   Manager    │  │   Manager     │  │   Fields     │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌──────────────────────────────────────────────────┐      │
│  │               Integration Loop                    │      │
│  │  1. Apply forces (gravity, fields, springs)      │      │
│  │  2. Integrate (Verlet)                           │      │
│  │  3. Detect collisions                            │      │
│  │  4. Resolve collisions                           │      │
│  │  5. Apply boundary constraints                   │      │
│  └──────────────────────────────────────────────────┘      │
│                           │                                  │
│                           ▼                                  │
│         ┌───────────────────────────────────┐               │
│         │         Vector Math (Vec2)         │               │
│         └───────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Performance Tips

1. **Reduce particle count**: O(n²) collision detection
2. **Increase substeps**: More stable, slower
3. **Use sleeping**: Disable physics for stationary particles
4. **Larger timestep**: Less accurate but faster

## Limitations

- 2D only (no 3D)
- No rigid body rotation
- Simple collision shapes (circles only)
- No spatial partitioning (broad phase)

## License

MIT
