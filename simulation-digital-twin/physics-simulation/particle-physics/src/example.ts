/**
 * Particle Physics Engine Examples
 */

import { PhysicsEngine } from './engine.js';
import * as V from './vector.js';

function main() {
  console.log('='.repeat(60));
  console.log('Particle Physics Simulation Examples');
  console.log('='.repeat(60));

  // Example 1: Bouncing Balls
  console.log('\n📊 Example 1: Bouncing Balls');
  console.log('-'.repeat(40));

  const engine1 = new PhysicsEngine({
    gravity: { x: 0, y: 9.81 },
    boundary: {
      type: 'box',
      center: { x: 250, y: 250 },
      size: { x: 500, y: 500 },
      restitution: 0.9,
    },
  });

  // Add particles at different heights
  for (let i = 0; i < 5; i++) {
    engine1.addParticle({
      position: { x: 100 + i * 80, y: 50 + i * 20 },
      velocity: { x: (Math.random() - 0.5) * 100, y: 0 },
      mass: 1 + i * 0.5,
      radius: 15 + i * 3,
      restitution: 0.85,
    });
  }

  console.log(`Created ${engine1.getStats().particleCount} bouncing balls`);

  // Simulate for 2 seconds
  for (let i = 0; i < 120; i++) {
    engine1.step();
  }

  const stats1 = engine1.getStats();
  console.log(`After 2 seconds:`);
  console.log(`  Avg velocity: ${stats1.avgVelocity.toFixed(2)} m/s`);
  console.log(`  Max velocity: ${stats1.maxVelocity.toFixed(2)} m/s`);
  console.log(`  Collisions: ${stats1.collisionCount}`);

  // Example 2: Spring Chain
  console.log('\n📊 Example 2: Spring Chain (Pendulum)');
  console.log('-'.repeat(40));

  const engine2 = new PhysicsEngine({
    gravity: { x: 0, y: 9.81 },
    airResistance: 0.02,
  });

  // Create chain with fixed anchor
  const anchor = engine2.addParticle({
    position: { x: 250, y: 50 },
    fixed: true,
  });

  let prevParticle = anchor;
  for (let i = 0; i < 8; i++) {
    const p = engine2.addParticle({
      position: { x: 250 + (i + 1) * 30, y: 50 + (i + 1) * 30 },
      mass: 0.5,
      radius: 8,
    });
    engine2.addSpring(prevParticle.id, p.id, {
      restLength: 30,
      stiffness: 200,
      damping: 2,
    });
    prevParticle = p;
  }

  console.log(`Created chain with ${engine2.getStats().springCount} springs`);

  // Give initial push
  const lastParticle = engine2.getParticle(prevParticle.id);
  if (lastParticle) {
    lastParticle.velocity = { x: 100, y: 0 };
  }

  // Simulate
  const positions: string[] = [];
  for (let i = 0; i < 180; i++) {
    engine2.step();
    if (i % 30 === 0) {
      const state = engine2.getState();
      const lastP = state.particles[state.particles.length - 1];
      positions.push(V.toString(lastP.position));
    }
  }

  console.log('End position over time:');
  positions.forEach((pos, i) => console.log(`  t=${(i * 0.5).toFixed(1)}s: ${pos}`));

  // Example 3: Particle Explosion
  console.log('\n📊 Example 3: Particle Explosion');
  console.log('-'.repeat(40));

  const engine3 = new PhysicsEngine({
    gravity: { x: 0, y: 0 }, // No gravity in space
    airResistance: 0,
  });

  // Create explosion from center
  const center = { x: 250, y: 250 };
  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    engine3.addParticle({
      position: { x: center.x, y: center.y },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      mass: 0.5 + Math.random(),
      radius: 5 + Math.random() * 10,
    });
  }

  console.log(`Created ${particleCount} particles for explosion`);

  // Simulate
  for (let i = 0; i < 60; i++) {
    engine3.step();
  }

  const stats3 = engine3.getStats();
  console.log(`After 1 second:`);
  console.log(`  Bounding box: ${V.toString(stats3.boundingBox.min)} to ${V.toString(stats3.boundingBox.max)}`);
  console.log(`  Center of mass: ${V.toString(stats3.centerOfMass)}`);

  // Example 4: Force Fields
  console.log('\n📊 Example 4: Force Fields (Vortex)');
  console.log('-'.repeat(40));

  const engine4 = new PhysicsEngine({
    gravity: { x: 0, y: 0 },
    airResistance: 0.05,
  });

  // Add vortex force field
  engine4.addForceField({
    type: 'vortex',
    position: { x: 250, y: 250 },
    strength: 500,
    radius: 300,
    falloff: 'linear',
  });

  // Add particles around the vortex
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 100 + Math.random() * 50;
    engine4.addParticle({
      position: {
        x: 250 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
      },
      velocity: V.ZERO,
      mass: 1,
      radius: 8,
    });
  }

  console.log('Created vortex with 12 orbiting particles');

  // Simulate
  for (let i = 0; i < 300; i++) {
    engine4.step();
  }

  const state4 = engine4.getState();
  console.log(`After 5 seconds:`);
  console.log(`  Total kinetic energy: ${state4.energy.kinetic.toFixed(2)} J`);

  // Example 5: Soft Body (Connected Particles)
  console.log('\n📊 Example 5: Soft Body Square');
  console.log('-'.repeat(40));

  const engine5 = new PhysicsEngine({
    gravity: { x: 0, y: 9.81 },
    boundary: {
      type: 'box',
      center: { x: 250, y: 300 },
      size: { x: 500, y: 600 },
      restitution: 0.7,
    },
  });

  // Create 3x3 grid of particles
  const gridSize = 3;
  const spacing = 40;
  const startX = 200;
  const startY = 100;
  const gridParticles: string[][] = [];

  for (let row = 0; row < gridSize; row++) {
    gridParticles[row] = [];
    for (let col = 0; col < gridSize; col++) {
      const p = engine5.addParticle({
        position: {
          x: startX + col * spacing,
          y: startY + row * spacing,
        },
        mass: 1,
        radius: 10,
        restitution: 0.6,
      });
      gridParticles[row][col] = p.id;
    }
  }

  // Connect with springs (structural + shear)
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Right neighbor
      if (col < gridSize - 1) {
        engine5.addSpring(gridParticles[row][col], gridParticles[row][col + 1], {
          stiffness: 500,
          damping: 10,
        });
      }
      // Bottom neighbor
      if (row < gridSize - 1) {
        engine5.addSpring(gridParticles[row][col], gridParticles[row + 1][col], {
          stiffness: 500,
          damping: 10,
        });
      }
      // Diagonal (shear)
      if (row < gridSize - 1 && col < gridSize - 1) {
        engine5.addSpring(gridParticles[row][col], gridParticles[row + 1][col + 1], {
          stiffness: 300,
          damping: 5,
        });
        engine5.addSpring(gridParticles[row][col + 1], gridParticles[row + 1][col], {
          stiffness: 300,
          damping: 5,
        });
      }
    }
  }

  const stats5 = engine5.getStats();
  console.log(`Created soft body: ${stats5.particleCount} particles, ${stats5.springCount} springs`);

  // Give rotation impulse
  const topLeft = engine5.getParticle(gridParticles[0][0]);
  const bottomRight = engine5.getParticle(gridParticles[2][2]);
  if (topLeft) topLeft.velocity = { x: -50, y: -50 };
  if (bottomRight) bottomRight.velocity = { x: 50, y: 50 };

  // Simulate
  for (let i = 0; i < 300; i++) {
    engine5.step();
  }

  const finalState = engine5.getState();
  console.log(`After 5 seconds:`);
  console.log(`  Energy: ${finalState.energy.total.toFixed(2)} J`);
  console.log(`  Collisions detected: ${finalState.collisions.length}`);

  console.log('\n' + '='.repeat(60));
  console.log('Simulation examples complete!');
}

main();
