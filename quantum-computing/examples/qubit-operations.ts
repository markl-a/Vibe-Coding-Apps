/**
 * Qubit Operations Examples
 *
 * This file demonstrates basic qubit operations including:
 * - Qubit initialization
 * - State vector manipulation
 * - Single qubit measurements
 * - Probability calculations
 * - State visualization
 */

import { QuantumSimulator } from '../quantum-algorithms/quantum-simulator/src/simulator.js';
import * as C from '../quantum-algorithms/quantum-simulator/src/complex.js';
import type { Complex } from '../quantum-algorithms/quantum-simulator/src/types.js';

// ============================================================================
// Example 1: Creating and Initializing Qubits
// ============================================================================

function example1_InitializeQubits(): void {
  console.log('\n=== Example 1: Initialize Qubits ===\n');

  // Create a quantum simulator with 1 qubit
  // Default state is |0⟩
  const sim = new QuantumSimulator(1);

  console.log('Initial state (|0⟩):');
  console.log(sim.stateToString());
  console.log('Probabilities:', sim.getProbabilities());

  // State vector for 1 qubit has 2 components: [|0⟩, |1⟩]
  // |0⟩ = [1, 0] means 100% probability of measuring 0
  // |1⟩ = [0, 1] means 100% probability of measuring 1
}

// ============================================================================
// Example 2: Qubit State Manipulation
// ============================================================================

function example2_StateManipulation(): void {
  console.log('\n=== Example 2: State Manipulation ===\n');

  const sim = new QuantumSimulator(1);

  console.log('1. Initial state |0⟩:');
  console.log(sim.stateToString());

  // Apply X gate (bit flip) to flip |0⟩ to |1⟩
  sim.executeOperation({ gate: 'X', targets: [0] });

  console.log('\n2. After X gate (|1⟩):');
  console.log(sim.stateToString());
  console.log('Probabilities:', sim.getProbabilities());

  // Apply X gate again to flip back to |0⟩
  sim.executeOperation({ gate: 'X', targets: [0] });

  console.log('\n3. After second X gate (back to |0⟩):');
  console.log(sim.stateToString());
}

// ============================================================================
// Example 3: Creating Superposition
// ============================================================================

function example3_Superposition(): void {
  console.log('\n=== Example 3: Creating Superposition ===\n');

  const sim = new QuantumSimulator(1);

  console.log('1. Initial state |0⟩:');
  console.log(sim.stateToString());

  // Apply Hadamard gate to create superposition
  // H|0⟩ = (|0⟩ + |1⟩)/√2
  sim.executeOperation({ gate: 'H', targets: [0] });

  console.log('\n2. After Hadamard gate (superposition):');
  console.log(sim.stateToString());

  const probs = sim.getProbabilities();
  console.log('Probabilities:');
  console.log(`  P(|0⟩) = ${(probs[0] * 100).toFixed(2)}%`);
  console.log(`  P(|1⟩) = ${(probs[1] * 100).toFixed(2)}%`);

  console.log('\nNote: The qubit is in equal superposition - 50% chance of measuring 0 or 1');
}

// ============================================================================
// Example 4: Qubit Measurement
// ============================================================================

function example4_Measurement(): void {
  console.log('\n=== Example 4: Qubit Measurement ===\n');

  // Create superposition state
  const sim = new QuantumSimulator(1, 42); // Seed for reproducibility
  sim.executeOperation({ gate: 'H', targets: [0] });

  console.log('State before measurement (superposition):');
  console.log(sim.stateToString());

  // Measure the qubit (collapses superposition)
  const result = sim.measure(0);

  console.log(`\nMeasurement result: |${result.value}⟩`);
  console.log(`Measurement probability: ${(result.probability * 100).toFixed(2)}%`);

  console.log('\nState after measurement (collapsed):');
  console.log(sim.stateToString());
  console.log('Note: Superposition has collapsed to a definite state');
}

// ============================================================================
// Example 5: Multiple Measurements (Statistics)
// ============================================================================

function example5_MeasurementStatistics(): void {
  console.log('\n=== Example 5: Measurement Statistics ===\n');

  const numShots = 1000;
  const counts = { '0': 0, '1': 0 };

  for (let i = 0; i < numShots; i++) {
    const sim = new QuantumSimulator(1);

    // Create superposition
    sim.executeOperation({ gate: 'H', targets: [0] });

    // Measure
    const result = sim.measure(0);
    counts[result.value.toString()]++;
  }

  console.log(`Results from ${numShots} measurements:`);
  console.log(`  |0⟩: ${counts['0']} times (${(counts['0'] / numShots * 100).toFixed(2)}%)`);
  console.log(`  |1⟩: ${counts['1']} times (${(counts['1'] / numShots * 100).toFixed(2)}%)`);
  console.log('\nNote: Results should be approximately 50/50');
}

// ============================================================================
// Example 6: Multi-Qubit States
// ============================================================================

function example6_MultiQubitStates(): void {
  console.log('\n=== Example 6: Multi-Qubit States ===\n');

  // Create 2-qubit system
  const sim = new QuantumSimulator(2);

  console.log('1. Initial 2-qubit state |00⟩:');
  console.log(sim.stateToString());

  const state = sim.getState();
  console.log(`\nState vector (${state.length} components):`);
  state.forEach((amp, i) => {
    const basis = i.toString(2).padStart(2, '0');
    if (!C.isZero(amp)) {
      console.log(`  |${basis}⟩: ${C.toString(amp)}`);
    }
  });

  // Apply X gate to second qubit to get |01⟩
  sim.executeOperation({ gate: 'X', targets: [1] });

  console.log('\n2. After X on qubit 1 (|01⟩):');
  console.log(sim.stateToString());

  // Apply X gate to first qubit to get |11⟩
  sim.executeOperation({ gate: 'X', targets: [0] });

  console.log('\n3. After X on qubit 0 (|11⟩):');
  console.log(sim.stateToString());
}

// ============================================================================
// Example 7: Phase Manipulation
// ============================================================================

function example7_PhaseManipulation(): void {
  console.log('\n=== Example 7: Phase Manipulation ===\n');

  const sim = new QuantumSimulator(1);

  // Create superposition
  sim.executeOperation({ gate: 'H', targets: [0] });

  console.log('1. Superposition state (|0⟩ + |1⟩)/√2:');
  console.log(sim.stateToString());

  // Apply Z gate (phase flip on |1⟩)
  // (|0⟩ + |1⟩)/√2 → (|0⟩ - |1⟩)/√2
  sim.executeOperation({ gate: 'Z', targets: [0] });

  console.log('\n2. After Z gate (|0⟩ - |1⟩)/√2:');
  console.log(sim.stateToString());

  console.log('\nNote: The minus sign is a relative phase');
  console.log('Probabilities are still 50/50:');
  console.log(sim.getProbabilities());

  // Apply Hadamard again to see the effect
  sim.executeOperation({ gate: 'H', targets: [0] });

  console.log('\n3. After second Hadamard:');
  console.log(sim.stateToString());
  console.log('Note: We get |1⟩ instead of |0⟩ due to interference!');
}

// ============================================================================
// Example 8: Rotation Gates
// ============================================================================

function example8_RotationGates(): void {
  console.log('\n=== Example 8: Rotation Gates ===\n');

  const sim = new QuantumSimulator(1);

  // Rotate around Y-axis by π/2 (90 degrees)
  const angle = Math.PI / 2;
  sim.executeOperation({ gate: 'Ry', targets: [0], params: [angle] });

  console.log(`After Ry(π/2) rotation:`);
  console.log(sim.stateToString());

  const probs = sim.getProbabilities();
  console.log(`\nProbabilities:`);
  console.log(`  P(|0⟩) = ${(probs[0] * 100).toFixed(2)}%`);
  console.log(`  P(|1⟩) = ${(probs[1] * 100).toFixed(2)}%`);

  console.log('\nNote: Ry(π/2) rotates |0⟩ to equal superposition like Hadamard');
}

// ============================================================================
// Example 9: Bloch Sphere Representation
// ============================================================================

function example9_BlochSphere(): void {
  console.log('\n=== Example 9: Bloch Sphere Representation ===\n');

  console.log('Single qubit states can be visualized on the Bloch sphere:');
  console.log('  |0⟩ is at the north pole');
  console.log('  |1⟩ is at the south pole');
  console.log('  |+⟩ = (|0⟩ + |1⟩)/√2 is on the +X axis');
  console.log('  |-⟩ = (|0⟩ - |1⟩)/√2 is on the -X axis');
  console.log('  |i⟩ = (|0⟩ + i|1⟩)/√2 is on the +Y axis');
  console.log('  |-i⟩ = (|0⟩ - i|1⟩)/√2 is on the -Y axis');

  const states = [
    { name: '|0⟩', ops: [] },
    { name: '|1⟩', ops: [{ gate: 'X' as const, targets: [0] }] },
    { name: '|+⟩', ops: [{ gate: 'H' as const, targets: [0] }] },
    { name: '|-⟩', ops: [{ gate: 'X' as const, targets: [0] }, { gate: 'H' as const, targets: [0] }] },
  ];

  console.log('\nExamples:');
  states.forEach(({ name, ops }) => {
    const sim = new QuantumSimulator(1);
    ops.forEach(op => sim.executeOperation(op));
    console.log(`  ${name}: ${sim.stateToString()}`);
  });
}

// ============================================================================
// Example 10: State Fidelity
// ============================================================================

function example10_StateFidelity(): void {
  console.log('\n=== Example 10: State Fidelity ===\n');

  // Create two simulators with the same state
  const sim1 = new QuantumSimulator(1);
  const sim2 = new QuantumSimulator(1);

  // Apply same operations
  sim1.executeOperation({ gate: 'H', targets: [0] });
  sim2.executeOperation({ gate: 'H', targets: [0] });

  const state1 = sim1.getState();
  const state2 = sim2.getState();

  console.log('State 1:', state1.map(c => C.toString(c)).join(', '));
  console.log('State 2:', state2.map(c => C.toString(c)).join(', '));

  // Calculate fidelity (inner product)
  let fidelity = C.ZERO;
  for (let i = 0; i < state1.length; i++) {
    fidelity = C.add(fidelity, C.multiply(C.conjugate(state1[i]), state2[i]));
  }

  const fidelityMagnitude = C.magnitude(fidelity);
  console.log(`\nFidelity: ${fidelityMagnitude.toFixed(6)}`);
  console.log('Note: Fidelity of 1.0 means identical states');
}

// ============================================================================
// Run All Examples
// ============================================================================

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Quantum Computing: Qubit Operations               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  example1_InitializeQubits();
  example2_StateManipulation();
  example3_Superposition();
  example4_Measurement();
  example5_MeasurementStatistics();
  example6_MultiQubitStates();
  example7_PhaseManipulation();
  example8_RotationGates();
  example9_BlochSphere();
  example10_StateFidelity();

  console.log('\n' + '='.repeat(60));
  console.log('All qubit operations examples completed!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_InitializeQubits,
  example2_StateManipulation,
  example3_Superposition,
  example4_Measurement,
  example5_MeasurementStatistics,
  example6_MultiQubitStates,
  example7_PhaseManipulation,
  example8_RotationGates,
  example9_BlochSphere,
  example10_StateFidelity,
};
