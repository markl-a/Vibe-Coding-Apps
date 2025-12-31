/**
 * Quantum Gates Examples
 *
 * This file demonstrates various quantum gates including:
 * - Pauli gates (X, Y, Z)
 * - Hadamard gate
 * - Phase gates (S, T)
 * - Rotation gates (Rx, Ry, Rz)
 * - Controlled gates (CNOT, CZ)
 * - Multi-qubit gates (SWAP, Toffoli)
 * - Gate properties and compositions
 */

import { QuantumSimulator } from '../quantum-algorithms/quantum-simulator/src/simulator.js';
import * as Gates from '../quantum-algorithms/quantum-simulator/src/gates.js';
import type { GateOperation } from '../quantum-algorithms/quantum-simulator/src/types.js';

// ============================================================================
// Example 1: Pauli Gates (X, Y, Z)
// ============================================================================

function example1_PauliGates(): void {
  console.log('\n=== Example 1: Pauli Gates ===\n');

  console.log('Pauli-X Gate (Bit Flip):');
  let sim = new QuantumSimulator(1);
  console.log('  Before: ' + sim.stateToString());
  sim.executeOperation({ gate: 'X', targets: [0] });
  console.log('  After:  ' + sim.stateToString());
  console.log('  Effect: |0⟩ ↔ |1⟩ (quantum NOT gate)');

  console.log('\nPauli-Y Gate (Bit and Phase Flip):');
  sim = new QuantumSimulator(1);
  console.log('  Before: ' + sim.stateToString());
  sim.executeOperation({ gate: 'Y', targets: [0] });
  console.log('  After:  ' + sim.stateToString());
  console.log('  Effect: |0⟩ → i|1⟩, |1⟩ → -i|0⟩');

  console.log('\nPauli-Z Gate (Phase Flip):');
  sim = new QuantumSimulator(1);
  sim.executeOperation({ gate: 'H', targets: [0] }); // Create superposition
  console.log('  Before: ' + sim.stateToString());
  sim.executeOperation({ gate: 'Z', targets: [0] });
  console.log('  After:  ' + sim.stateToString());
  console.log('  Effect: |0⟩ → |0⟩, |1⟩ → -|1⟩');
}

// ============================================================================
// Example 2: Hadamard Gate
// ============================================================================

function example2_HadamardGate(): void {
  console.log('\n=== Example 2: Hadamard Gate ===\n');

  console.log('Creating superposition from |0⟩:');
  let sim = new QuantumSimulator(1);
  console.log('  Initial: ' + sim.stateToString());
  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('  After H: ' + sim.stateToString());

  const probs = sim.getProbabilities();
  console.log(`  P(0) = ${(probs[0] * 100).toFixed(1)}%, P(1) = ${(probs[1] * 100).toFixed(1)}%`);

  console.log('\nHadamard is self-inverse (H² = I):');
  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('  After H²: ' + sim.stateToString());
  console.log('  Back to |0⟩!');

  console.log('\nCreating superposition from |1⟩:');
  sim = new QuantumSimulator(1);
  sim.executeOperation({ gate: 'X', targets: [0] });
  console.log('  Initial: ' + sim.stateToString());
  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('  After H: ' + sim.stateToString());
  console.log('  Note: Negative amplitude on |1⟩ component');
}

// ============================================================================
// Example 3: Phase Gates (S, T)
// ============================================================================

function example3_PhaseGates(): void {
  console.log('\n=== Example 3: Phase Gates ===\n');

  console.log('S Gate (π/2 phase gate):');
  let sim = new QuantumSimulator(1);
  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('  Before S: ' + sim.stateToString());
  sim.executeOperation({ gate: 'S', targets: [0] });
  console.log('  After S:  ' + sim.stateToString());
  console.log('  Effect: Adds π/2 phase to |1⟩ component');

  console.log('\nT Gate (π/4 phase gate):');
  sim = new QuantumSimulator(1);
  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('  Before T: ' + sim.stateToString());
  sim.executeOperation({ gate: 'T', targets: [0] });
  console.log('  After T:  ' + sim.stateToString());
  console.log('  Effect: Adds π/4 phase to |1⟩ component');

  console.log('\nRelationship: S = T²');
  sim = new QuantumSimulator(1);
  sim.executeOperation({ gate: 'H', targets: [0] });
  const afterH = sim.getState();

  sim.executeOperation({ gate: 'T', targets: [0] });
  sim.executeOperation({ gate: 'T', targets: [0] });
  console.log('  After T²: ' + sim.stateToString());

  sim.reset();
  sim.executeOperation({ gate: 'H', targets: [0] });
  sim.executeOperation({ gate: 'S', targets: [0] });
  console.log('  After S:  ' + sim.stateToString());
}

// ============================================================================
// Example 4: Rotation Gates
// ============================================================================

function example4_RotationGates(): void {
  console.log('\n=== Example 4: Rotation Gates ===\n');

  const angles = [Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI];
  const angleNames = ['π/4', 'π/2', 'π', '2π'];

  console.log('Rx (Rotation around X-axis):');
  angles.forEach((angle, i) => {
    const sim = new QuantumSimulator(1);
    sim.executeOperation({ gate: 'Rx', targets: [0], params: [angle] });
    console.log(`  Rx(${angleNames[i]}): ${sim.stateToString()}`);
  });

  console.log('\nRy (Rotation around Y-axis):');
  angles.forEach((angle, i) => {
    const sim = new QuantumSimulator(1);
    sim.executeOperation({ gate: 'Ry', targets: [0], params: [angle] });
    console.log(`  Ry(${angleNames[i]}): ${sim.stateToString()}`);
  });

  console.log('\nRz (Rotation around Z-axis):');
  angles.forEach((angle, i) => {
    const sim = new QuantumSimulator(1);
    sim.executeOperation({ gate: 'H', targets: [0] }); // Create superposition first
    sim.executeOperation({ gate: 'Rz', targets: [0], params: [angle] });
    console.log(`  Rz(${angleNames[i]}): ${sim.stateToString()}`);
  });

  console.log('\nNote: Rz only affects relative phase, visible in superposition');
}

// ============================================================================
// Example 5: CNOT Gate (Controlled-NOT)
// ============================================================================

function example5_CNOTGate(): void {
  console.log('\n=== Example 5: CNOT Gate ===\n');

  const testCases = [
    { name: '|00⟩', ops: [] },
    { name: '|01⟩', ops: [{ gate: 'X' as const, targets: [1] }] },
    { name: '|10⟩', ops: [{ gate: 'X' as const, targets: [0] }] },
    { name: '|11⟩', ops: [{ gate: 'X' as const, targets: [0] }, { gate: 'X' as const, targets: [1] }] },
  ];

  console.log('CNOT truth table (control=qubit 0, target=qubit 1):');
  testCases.forEach(({ name, ops }) => {
    const sim = new QuantumSimulator(2);
    ops.forEach(op => sim.executeOperation(op));
    const before = sim.stateToString();

    sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
    const after = sim.stateToString();

    console.log(`  ${name} → ${after}`);
  });

  console.log('\nCreating Bell state (maximally entangled state):');
  const sim = new QuantumSimulator(2);
  console.log('  Start: ' + sim.stateToString());

  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('  After H on qubit 0: ' + sim.stateToString());

  sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
  console.log('  After CNOT: ' + sim.stateToString());
  console.log('  Result: (|00⟩ + |11⟩)/√2 - Bell state!');
}

// ============================================================================
// Example 6: Controlled-Z Gate
// ============================================================================

function example6_CZGate(): void {
  console.log('\n=== Example 6: Controlled-Z Gate ===\n');

  console.log('CZ gate applies Z when control is |1⟩:');

  const testCases = [
    { name: '|00⟩', ops: [] },
    { name: '|01⟩', ops: [{ gate: 'X' as const, targets: [1] }] },
    { name: '|10⟩', ops: [{ gate: 'X' as const, targets: [0] }] },
    { name: '|11⟩', ops: [{ gate: 'X' as const, targets: [0] }, { gate: 'X' as const, targets: [1] }] },
  ];

  testCases.forEach(({ name, ops }) => {
    const sim = new QuantumSimulator(2);
    ops.forEach(op => sim.executeOperation(op));

    sim.executeOperation({ gate: 'CZ', targets: [1], controls: [0] });
    const after = sim.stateToString();

    console.log(`  ${name} → ${after}`);
  });

  console.log('\nCZ is symmetric (can swap control and target):');
  let sim1 = new QuantumSimulator(2);
  let sim2 = new QuantumSimulator(2);

  // Create superposition on both
  sim1.executeOperation({ gate: 'H', targets: [0] });
  sim1.executeOperation({ gate: 'H', targets: [1] });
  sim2.executeOperation({ gate: 'H', targets: [0] });
  sim2.executeOperation({ gate: 'H', targets: [1] });

  sim1.executeOperation({ gate: 'CZ', targets: [1], controls: [0] });
  sim2.executeOperation({ gate: 'CZ', targets: [0], controls: [1] });

  console.log('  CZ(0→1): ' + sim1.stateToString());
  console.log('  CZ(1→0): ' + sim2.stateToString());
  console.log('  Same result!');
}

// ============================================================================
// Example 7: SWAP Gate
// ============================================================================

function example7_SWAPGate(): void {
  console.log('\n=== Example 7: SWAP Gate ===\n');

  console.log('Swapping qubit states:');
  const sim = new QuantumSimulator(2);

  sim.executeOperation({ gate: 'X', targets: [0] }); // |10⟩
  console.log('  Before SWAP: ' + sim.stateToString());

  sim.executeOperation({ gate: 'SWAP', targets: [0, 1] });
  console.log('  After SWAP:  ' + sim.stateToString());
  console.log('  Qubits exchanged!');

  console.log('\nSWAP in superposition:');
  const sim2 = new QuantumSimulator(2);
  sim2.executeOperation({ gate: 'H', targets: [0] }); // (|00⟩ + |10⟩)/√2
  console.log('  Before SWAP: ' + sim2.stateToString());

  sim2.executeOperation({ gate: 'SWAP', targets: [0, 1] });
  console.log('  After SWAP:  ' + sim2.stateToString());
  console.log('  Now: (|00⟩ + |01⟩)/√2');
}

// ============================================================================
// Example 8: Gate Compositions
// ============================================================================

function example8_GateCompositions(): void {
  console.log('\n=== Example 8: Gate Compositions ===\n');

  console.log('1. X = HZH (X gate from H and Z):');
  let sim1 = new QuantumSimulator(1);
  sim1.executeOperation({ gate: 'X', targets: [0] });

  let sim2 = new QuantumSimulator(1);
  sim2.executeOperation({ gate: 'H', targets: [0] });
  sim2.executeOperation({ gate: 'Z', targets: [0] });
  sim2.executeOperation({ gate: 'H', targets: [0] });

  console.log('  Direct X:    ' + sim1.stateToString());
  console.log('  HZH:         ' + sim2.stateToString());

  console.log('\n2. Y = iXZ (Y from X and Z):');
  sim1 = new QuantumSimulator(1);
  sim1.executeOperation({ gate: 'Y', targets: [0] });

  console.log('  Y gate:      ' + sim1.stateToString());
  console.log('  (Phase difference from XZ is global, not observable)');

  console.log('\n3. S² = Z:');
  sim1 = new QuantumSimulator(1);
  sim1.executeOperation({ gate: 'H', targets: [0] });
  sim1.executeOperation({ gate: 'Z', targets: [0] });

  sim2 = new QuantumSimulator(1);
  sim2.executeOperation({ gate: 'H', targets: [0] });
  sim2.executeOperation({ gate: 'S', targets: [0] });
  sim2.executeOperation({ gate: 'S', targets: [0] });

  console.log('  Z:           ' + sim1.stateToString());
  console.log('  S²:          ' + sim2.stateToString());
}

// ============================================================================
// Example 9: Universal Gate Sets
// ============================================================================

function example9_UniversalGates(): void {
  console.log('\n=== Example 9: Universal Gate Sets ===\n');

  console.log('A universal gate set can approximate any unitary operation.');
  console.log('\nCommon universal sets:');
  console.log('  1. {H, T, CNOT}     - Clifford+T (fault-tolerant)');
  console.log('  2. {H, S, CNOT}     - Requires more gates');
  console.log('  3. {Rx, Ry, Rz, CNOT} - Continuous rotations');
  console.log('  4. {U3, CNOT}       - General single-qubit + CNOT');

  console.log('\nExample: Approximating arbitrary rotation with H and T:');
  const sim = new QuantumSimulator(1);

  // Approximate Ry(π/8) using Clifford+T
  sim.executeOperation({ gate: 'H', targets: [0] });
  sim.executeOperation({ gate: 'T', targets: [0] });
  sim.executeOperation({ gate: 'H', targets: [0] });

  console.log('  HTH approximation: ' + sim.stateToString());

  const sim2 = new QuantumSimulator(1);
  sim2.executeOperation({ gate: 'Ry', targets: [0], params: [Math.PI / 4] });
  console.log('  Ry(π/4) direct:    ' + sim2.stateToString());
  console.log('  (Close approximation)');
}

// ============================================================================
// Example 10: Gate Matrix Properties
// ============================================================================

function example10_GateProperties(): void {
  console.log('\n=== Example 10: Gate Matrix Properties ===\n');

  console.log('All quantum gates are unitary matrices:');
  console.log('  - Preserve state normalization');
  console.log('  - Reversible (U† U = I)');
  console.log('  - Determinant has magnitude 1');

  console.log('\nGate inverses:');
  console.log('  X† = X   (self-inverse)');
  console.log('  Y† = Y   (self-inverse)');
  console.log('  Z† = Z   (self-inverse)');
  console.log('  H† = H   (self-inverse)');
  console.log('  S† = S‡  (S-dagger)');
  console.log('  T† = T‡  (T-dagger)');

  console.log('\nDemonstrating reversibility (X†X = I):');
  const sim = new QuantumSimulator(1);
  sim.executeOperation({ gate: 'H', targets: [0] });
  const initial = sim.stateToString();
  console.log('  Initial:   ' + initial);

  sim.executeOperation({ gate: 'X', targets: [0] });
  console.log('  After X:   ' + sim.stateToString());

  sim.executeOperation({ gate: 'X', targets: [0] });
  console.log('  After X†:  ' + sim.stateToString());
  console.log('  Back to initial state!');
}

// ============================================================================
// Example 11: Custom Gate Sequences
// ============================================================================

function example11_CustomSequences(): void {
  console.log('\n=== Example 11: Custom Gate Sequences ===\n');

  console.log('Building a √X gate (square root of NOT):');
  const sim = new QuantumSimulator(1);

  // √X can be constructed from rotation gates
  const angle = Math.PI / 2;
  sim.executeOperation({ gate: 'Ry', targets: [0], params: [angle] });

  console.log('  After √X:   ' + sim.stateToString());
  console.log('  State is between |0⟩ and |1⟩');

  sim.executeOperation({ gate: 'Ry', targets: [0], params: [angle] });
  console.log('  After (√X)²: ' + sim.stateToString());
  console.log('  Now at |1⟩ - same as X gate!');

  console.log('\nCreating arbitrary single-qubit rotations:');
  const theta = Math.PI / 3;
  const phi = Math.PI / 6;

  const sim2 = new QuantumSimulator(1);
  sim2.executeOperation({ gate: 'Rz', targets: [0], params: [phi] });
  sim2.executeOperation({ gate: 'Ry', targets: [0], params: [theta] });
  sim2.executeOperation({ gate: 'Rz', targets: [0], params: [phi] });

  console.log('  Rz(φ)Ry(θ)Rz(φ): ' + sim2.stateToString());
  console.log('  General qubit rotation achieved!');
}

// ============================================================================
// Example 12: Multi-Controlled Gates
// ============================================================================

function example12_MultiControlled(): void {
  console.log('\n=== Example 12: Multi-Controlled Gates ===\n');

  console.log('Toffoli gate (CCNOT - doubly controlled NOT):');
  console.log('  Flips target only when both controls are |1⟩');
  console.log('  Truth table:');
  console.log('    |000⟩ → |000⟩');
  console.log('    |001⟩ → |001⟩');
  console.log('    |110⟩ → |110⟩');
  console.log('    |111⟩ → |110⟩  (target flipped)');

  console.log('\nToffoli is universal for classical computation!');
  console.log('  Combined with Hadamard, it forms a universal quantum gate set');

  console.log('\nNote: Multi-controlled gates can be decomposed into');
  console.log('      single and two-qubit gates from the simulator');
}

// ============================================================================
// Run All Examples
// ============================================================================

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          Quantum Computing: Quantum Gates                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  example1_PauliGates();
  example2_HadamardGate();
  example3_PhaseGates();
  example4_RotationGates();
  example5_CNOTGate();
  example6_CZGate();
  example7_SWAPGate();
  example8_GateCompositions();
  example9_UniversalGates();
  example10_GateProperties();
  example11_CustomSequences();
  example12_MultiControlled();

  console.log('\n' + '='.repeat(60));
  console.log('All quantum gates examples completed!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_PauliGates,
  example2_HadamardGate,
  example3_PhaseGates,
  example4_RotationGates,
  example5_CNOTGate,
  example6_CZGate,
  example7_SWAPGate,
  example8_GateCompositions,
  example9_UniversalGates,
  example10_GateProperties,
  example11_CustomSequences,
  example12_MultiControlled,
};
