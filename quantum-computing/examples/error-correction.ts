/**
 * Quantum Error Correction Examples
 *
 * This file demonstrates quantum error correction:
 * - Bit flip errors
 * - Phase flip errors
 * - Bit-flip code (3-qubit repetition)
 * - Phase-flip code
 * - Shor's 9-qubit code
 * - Stabilizer codes
 * - Syndrome measurement
 * - Error detection vs correction
 * - Fault-tolerant quantum computing
 */

import { QuantumSimulator } from '../quantum-algorithms/quantum-simulator/src/simulator.js';
import type { QuantumCircuit, GateOperation } from '../quantum-algorithms/quantum-simulator/src/types.js';

// ============================================================================
// Example 1: Types of Quantum Errors
// ============================================================================

function example1_ErrorTypes(): void {
  console.log('\n=== Example 1: Types of Quantum Errors ===\n');

  console.log('Three main types of single-qubit errors:\n');

  // Bit flip error (X error)
  console.log('1. Bit Flip Error (X):');
  const sim1 = new QuantumSimulator(1);
  sim1.executeOperation({ gate: 'H', targets: [0] }); // Create superposition
  console.log('   Before error:', sim1.stateToString());
  sim1.executeOperation({ gate: 'X', targets: [0] }); // Bit flip error
  console.log('   After X error:', sim1.stateToString());
  console.log('   Effect: |0⟩ ↔ |1⟩');

  // Phase flip error (Z error)
  console.log('\n2. Phase Flip Error (Z):');
  const sim2 = new QuantumSimulator(1);
  sim2.executeOperation({ gate: 'H', targets: [0] });
  console.log('   Before error:', sim2.stateToString());
  sim2.executeOperation({ gate: 'Z', targets: [0] }); // Phase flip error
  console.log('   After Z error:', sim2.stateToString());
  console.log('   Effect: Changes relative phase');

  // Combined error (Y error)
  console.log('\n3. Combined Error (Y = iXZ):');
  const sim3 = new QuantumSimulator(1);
  sim3.executeOperation({ gate: 'H', targets: [0] });
  console.log('   Before error:', sim3.stateToString());
  sim3.executeOperation({ gate: 'Y', targets: [0] }); // Y error
  console.log('   After Y error:', sim3.stateToString());
  console.log('   Effect: Both bit flip and phase flip');

  console.log('\nAny single-qubit error can be decomposed as:');
  console.log('  E = aI + bX + cZ + dY');
  console.log('where a, b, c, d are complex coefficients');
}

// ============================================================================
// Example 2: Classical Repetition Code
// ============================================================================

function example2_ClassicalRepetition(): void {
  console.log('\n=== Example 2: Classical Repetition Code (Context) ===\n');

  console.log('Classical approach: Repeat information');
  console.log('  Encode: 0 → 000, 1 → 111');
  console.log('  Decode: Majority vote\n');

  console.log('Example with single bit flip:');
  console.log('  000 → 001 (error) → detect and correct to 000');
  console.log('  111 → 110 (error) → detect and correct to 111');

  console.log('\nChallenge for quantum:');
  console.log('  - Cannot simply copy quantum states (no-cloning theorem)');
  console.log('  - Cannot directly measure without destroying superposition');
  console.log('  - Need clever encoding that preserves quantum properties');
}

// ============================================================================
// Example 3: Bit-Flip Code (3-Qubit Repetition)
// ============================================================================

function example3_BitFlipCode(): void {
  console.log('\n=== Example 3: Bit-Flip Code (3-Qubit) ===\n');

  console.log('Quantum bit-flip code:');
  console.log('  |0⟩ → |000⟩');
  console.log('  |1⟩ → |111⟩');
  console.log('  Protects against single bit-flip (X) error\n');

  // Encode |+⟩ state
  console.log('Encoding |+⟩ = (|0⟩ + |1⟩)/√2:\n');

  const sim = new QuantumSimulator(3);

  // Prepare |+⟩ on first qubit
  sim.executeOperation({ gate: 'H', targets: [0] });
  console.log('1. Initial state:', sim.stateToString());

  // Encode using CNOT gates
  sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
  sim.executeOperation({ gate: 'CNOT', targets: [2], controls: [0] });
  console.log('2. After encoding:', sim.stateToString());
  console.log('   Now: (|000⟩ + |111⟩)/√2');

  // Introduce bit-flip error on qubit 1
  console.log('\n3. Introducing bit-flip error on qubit 1...');
  sim.executeOperation({ gate: 'X', targets: [1] });
  console.log('   After error:', sim.stateToString());
  console.log('   Now: (|010⟩ + |101⟩)/√2');

  // Syndrome measurement (simplified)
  console.log('\n4. Syndrome measurement:');
  console.log('   Measure parity: qubit 0 ⊕ qubit 1, qubit 1 ⊕ qubit 2');
  console.log('   Syndrome tells us which qubit has error');

  // Error correction
  console.log('\n5. Applying correction (X on qubit 1)...');
  sim.executeOperation({ gate: 'X', targets: [1] }); // Correct the error
  console.log('   After correction:', sim.stateToString());
  console.log('   Restored to: (|000⟩ + |111⟩)/√2 ✓');

  // Decode
  sim.executeOperation({ gate: 'CNOT', targets: [2], controls: [0] });
  sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
  console.log('\n6. After decoding:', sim.stateToString());
  console.log('   Recovered |+⟩ state!');
}

// ============================================================================
// Example 4: Phase-Flip Code
// ============================================================================

function example4_PhaseFlipCode(): void {
  console.log('\n=== Example 4: Phase-Flip Code ===\n');

  console.log('Phase-flip code (dual of bit-flip code):');
  console.log('  |+⟩ → |+++⟩');
  console.log('  |-⟩ → |---⟩');
  console.log('  Protects against single phase-flip (Z) error\n');

  const sim = new QuantumSimulator(3);

  // Prepare state |0⟩
  console.log('Encoding |0⟩:\n');
  console.log('1. Initial state:', sim.stateToString());

  // Encode in Hadamard basis
  sim.executeOperation({ gate: 'H', targets: [0] });
  sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
  sim.executeOperation({ gate: 'CNOT', targets: [2], controls: [0] });
  sim.executeOperation({ gate: 'H', targets: [0] });
  sim.executeOperation({ gate: 'H', targets: [1] });
  sim.executeOperation({ gate: 'H', targets: [2] });

  console.log('2. After encoding (in X basis):', sim.stateToString());

  // Introduce phase-flip error
  console.log('\n3. Introducing phase-flip error on qubit 1...');
  sim.executeOperation({ gate: 'Z', targets: [1] });
  console.log('   After error:', sim.stateToString());

  // Correction (measure in X basis, apply Z)
  console.log('\n4. Error detection and correction:');
  console.log('   Measure X-parity between qubits');
  console.log('   Apply Z correction on qubit 1');

  sim.executeOperation({ gate: 'Z', targets: [1] }); // Correct

  // Decode
  sim.executeOperation({ gate: 'H', targets: [0] });
  sim.executeOperation({ gate: 'H', targets: [1] });
  sim.executeOperation({ gate: 'H', targets: [2] });
  sim.executeOperation({ gate: 'CNOT', targets: [2], controls: [0] });
  sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });
  sim.executeOperation({ gate: 'H', targets: [0] });

  console.log('5. After decoding:', sim.stateToString());
  console.log('   Recovered |0⟩ state!');
}

// ============================================================================
// Example 5: Shor's 9-Qubit Code
// ============================================================================

function example5_ShorCode(): void {
  console.log('\n=== Example 5: Shor\'s 9-Qubit Code ===\n');

  console.log('First quantum error correction code (1995)');
  console.log('Protects against arbitrary single-qubit error\n');

  console.log('Structure:');
  console.log('  - Concatenates bit-flip and phase-flip codes');
  console.log('  - Uses 9 physical qubits to encode 1 logical qubit');
  console.log('  - Can correct any single-qubit error (X, Y, or Z)\n');

  console.log('Encoding:');
  console.log('  |0⟩_L → (|000⟩ + |111⟩)(|000⟩ + |111⟩)(|000⟩ + |111⟩) / 2√2');
  console.log('  |1⟩_L → (|000⟩ - |111⟩)(|000⟩ - |111⟩)(|000⟩ - |111⟩) / 2√2');

  console.log('\nError correction steps:');
  console.log('  1. Syndrome measurement within each block (bit flips)');
  console.log('  2. Syndrome measurement between blocks (phase flips)');
  console.log('  3. Apply corrections based on syndrome');
  console.log('  4. Original state is recovered');

  console.log('\nCode parameters:');
  console.log('  - [[9, 1, 3]] code');
  console.log('  - 9 physical qubits');
  console.log('  - 1 logical qubit');
  console.log('  - Distance 3 (corrects 1 error, detects 2)');

  console.log('\nSignificance:');
  console.log('  - First demonstration that quantum error correction is possible');
  console.log('  - Foundation for fault-tolerant quantum computing');
  console.log('  - Inspired many other quantum codes');
}

// ============================================================================
// Example 6: Stabilizer Codes
// ============================================================================

function example6_StabilizerCodes(): void {
  console.log('\n=== Example 6: Stabilizer Codes ===\n');

  console.log('Stabilizer formalism: Elegant framework for quantum codes\n');

  console.log('Three-qubit bit-flip code stabilizers:');
  console.log('  S₁ = Z₀Z₁ (parity of qubits 0 and 1)');
  console.log('  S₂ = Z₁Z₂ (parity of qubits 1 and 2)');

  console.log('\nCode space: States with eigenvalue +1 for all stabilizers');
  console.log('  |000⟩ and |111⟩ are in the code space');
  console.log('  |001⟩, |010⟩, etc. are not\n');

  console.log('Error syndromes:');
  console.log('  No error:     S₁ = +1, S₂ = +1');
  console.log('  X on qubit 0: S₁ = -1, S₂ = +1');
  console.log('  X on qubit 1: S₁ = -1, S₂ = -1');
  console.log('  X on qubit 2: S₁ = +1, S₂ = -1');

  console.log('\nAdvantages of stabilizer formalism:');
  console.log('  - Systematic way to construct codes');
  console.log('  - Efficient classical simulation');
  console.log('  - Clear error syndrome structure');
  console.log('  - Basis for many modern codes (surface codes, color codes)');
}

// ============================================================================
// Example 7: Syndrome Measurement
// ============================================================================

function example7_SyndromeMeasurement(): void {
  console.log('\n=== Example 7: Syndrome Measurement ===\n');

  console.log('Syndrome measurement extracts error information without');
  console.log('disturbing the encoded quantum state\n');

  console.log('Circuit for measuring Z₀Z₁ stabilizer:');
  console.log('  ancilla ──|0⟩──●────●────[Measure]──');
  console.log('                 │    │                 ');
  console.log('  qubit 0 ───────⊕────┼─────────────────');
  console.log('                      │                 ');
  console.log('  qubit 1 ────────────⊕─────────────────');

  console.log('\nKey features:');
  console.log('  1. Uses ancilla qubit (extra qubit)');
  console.log('  2. Ancilla couples to data qubits');
  console.log('  3. Measure ancilla, not data qubits');
  console.log('  4. Measurement outcome is the syndrome');

  console.log('\nExample: Detecting bit-flip on qubit 0');

  const sim = new QuantumSimulator(3);

  // Prepare encoded |0⟩_L = |000⟩
  console.log('\n  Initial: |000⟩');

  // Apply bit flip to qubit 0
  sim.executeOperation({ gate: 'X', targets: [0] });
  console.log('  After X on qubit 0: |100⟩');

  // In real implementation, would measure Z₀Z₁ and Z₁Z₂
  // Syndrome would be: (-1, +1) indicating error on qubit 0

  console.log('\n  Syndrome measurement results:');
  console.log('    Z₀Z₁: -1 (different parity)');
  console.log('    Z₁Z₂: +1 (same parity)');
  console.log('  → Error detected on qubit 0!');

  // Apply correction
  sim.executeOperation({ gate: 'X', targets: [0] });
  console.log('\n  After correction: |000⟩ ✓');
}

// ============================================================================
// Example 8: Error Detection vs Correction
// ============================================================================

function example8_DetectionVsCorrection(): void {
  console.log('\n=== Example 8: Error Detection vs Correction ===\n');

  console.log('Error detection: Identify that error occurred');
  console.log('Error correction: Fix the error\n');

  console.log('[[n, k, d]] code parameters:');
  console.log('  n = number of physical qubits');
  console.log('  k = number of logical qubits');
  console.log('  d = code distance\n');

  console.log('Relationship:');
  console.log('  - Can detect up to (d-1) errors');
  console.log('  - Can correct up to ⌊(d-1)/2⌋ errors\n');

  console.log('Examples:');
  console.log('  [[3, 1, 3]] bit-flip code:');
  console.log('    - Detects 2 errors');
  console.log('    - Corrects 1 error');

  console.log('\n  [[5, 1, 3]] code (smallest perfect code):');
  console.log('    - 5 physical qubits');
  console.log('    - 1 logical qubit');
  console.log('    - Corrects any single-qubit error');

  console.log('\n  [[7, 1, 3]] Steane code:');
  console.log('    - Implements all Clifford gates fault-tolerantly');
  console.log('    - Part of CSS code family');

  console.log('\nTrade-off:');
  console.log('  - Better codes require more qubits (overhead)');
  console.log('  - Must balance protection vs resource cost');
}

// ============================================================================
// Example 9: Fault-Tolerant Quantum Computing
// ============================================================================

function example9_FaultTolerance(): void {
  console.log('\n=== Example 9: Fault-Tolerant Quantum Computing ===\n');

  console.log('Goal: Compute reliably even with noisy components\n');

  console.log('Fault-tolerance requirements:');
  console.log('  1. Errors don\'t spread uncontrollably');
  console.log('  2. Syndrome measurement doesn\'t introduce more errors');
  console.log('  3. Gates work on encoded qubits (logical gates)');
  console.log('  4. Physical error rate below threshold');

  console.log('\nFault-tolerant gate implementation:');
  console.log('  - Transversal gates: Apply same gate to each qubit');
  console.log('    Example: Logical CNOT from physical CNOTs');
  console.log('  - Non-transversal gates need special handling');
  console.log('    Example: T gate requires magic state distillation\n');

  console.log('Error threshold:');
  console.log('  - Surface code: ~1% physical error rate');
  console.log('  - Below threshold: logical error rate decreases exponentially');
  console.log('  - Above threshold: error correction fails');

  console.log('\nCurrent status (2024):');
  console.log('  - Best qubits: ~0.1% error rate');
  console.log('  - Below threshold for surface codes!');
  console.log('  - Working toward practical fault-tolerant computers');
}

// ============================================================================
// Example 10: Surface Codes
// ============================================================================

function example10_SurfaceCodes(): void {
  console.log('\n=== Example 10: Surface Codes ===\n');

  console.log('Most promising approach for fault-tolerant QC\n');

  console.log('Key features:');
  console.log('  - 2D lattice of qubits');
  console.log('  - Local interactions only (nearest neighbors)');
  console.log('  - High error threshold (~1%)');
  console.log('  - Relatively simple syndrome extraction');

  console.log('\nSmallest surface code: [[9, 1, 3]]');
  console.log('  Layout (data qubits: D, syndrome qubits: X/Z):');
  console.log('    D - X - D');
  console.log('    |   |   |');
  console.log('    Z - D - Z');
  console.log('    |   |   |');
  console.log('    D - X - D');

  console.log('\nError correction:');
  console.log('  - X stabilizers: detect phase flips');
  console.log('  - Z stabilizers: detect bit flips');
  console.log('  - Defect tracking and correction');

  console.log('\nScalability:');
  console.log('  - Larger codes: Better protection');
  console.log('  - Distance d requires ~2d² qubits');
  console.log('  - Can reach arbitrary logical error rate');

  console.log('\nWhy surface codes:');
  console.log('  1. Compatible with 2D qubit layouts (real hardware)');
  console.log('  2. High threshold for current technology');
  console.log('  3. Well-understood theory and practice');
  console.log('  4. Active development by Google, IBM, etc.');
}

// ============================================================================
// Example 11: Logical Qubit Operations
// ============================================================================

function example11_LogicalOperations(): void {
  console.log('\n=== Example 11: Logical Qubit Operations ===\n');

  console.log('Performing gates on encoded (logical) qubits\n');

  console.log('Transversal gates (easy):');
  console.log('  - Logical X: Apply X to all qubits');
  console.log('  - Logical Z: Apply Z to all qubits');
  console.log('  - Logical H: Apply H to all qubits (for some codes)');
  console.log('  - Logical CNOT: Apply CNOT bitwise');

  console.log('\nExample: Logical X on 3-qubit code');
  console.log('  |000⟩_L → |111⟩_L');
  console.log('  |111⟩_L → |000⟩_L');
  console.log('  Implementation: X₀X₁X₂\n');

  const sim = new QuantumSimulator(3);

  // Encoded |0⟩_L
  console.log('  Before: |000⟩ (logical |0⟩)');

  // Logical X
  sim.executeOperation({ gate: 'X', targets: [0] });
  sim.executeOperation({ gate: 'X', targets: [1] });
  sim.executeOperation({ gate: 'X', targets: [2] });

  console.log('  After:  |111⟩ (logical |1⟩)');

  console.log('\nNon-transversal gates (hard):');
  console.log('  - T gate cannot be transversal for codes detecting X and Z');
  console.log('  - Requires magic state injection');
  console.log('  - Magic states prepared offline with distillation');

  console.log('\nEasbyth-Knill theorem:');
  console.log('  - No quantum code can implement all gates transversally');
  console.log('  - Need additional techniques for universal computation');
}

// ============================================================================
// Example 12: Quantum Error Correction Summary
// ============================================================================

function example12_QECSummary(): void {
  console.log('\n=== Example 12: Quantum Error Correction Summary ===\n');

  console.log('Why QEC is necessary:');
  console.log('  - Qubits are fragile (decoherence)');
  console.log('  - Gates are imperfect');
  console.log('  - Measurements have errors');
  console.log('  - Long computations need protection\n');

  console.log('Key insights:');
  console.log('  1. Quantum information can be protected');
  console.log('  2. Errors can be detected without measuring data');
  console.log('  3. Redundancy works despite no-cloning theorem');
  console.log('  4. Fault tolerance is achievable\n');

  console.log('Code evolution:');
  console.log('  1995: Shor code (9 qubits) - Proof of concept');
  console.log('  1996: Steane/CSS codes (7 qubits) - More efficient');
  console.log('  1997: Stabilizer formalism - Systematic construction');
  console.log('  1998: Surface codes - Practical implementation');
  console.log('  2000s: Color codes, LDPC codes - Ongoing research');
  console.log('  2020s: Implementation on real quantum hardware\n');

  console.log('Current challenges:');
  console.log('  - Overhead: Many physical qubits per logical qubit');
  console.log('  - Speed: Syndrome extraction takes time');
  console.log('  - Reaching error threshold on all qubit types');
  console.log('  - Scaling to thousands of physical qubits\n');

  console.log('Future outlook:');
  console.log('  - Logical qubits are becoming reality');
  console.log('  - First fault-tolerant algorithms being tested');
  console.log('  - Path to useful quantum computers is clear');
  console.log('  - QEC is essential for quantum advantage');
}

// ============================================================================
// Run All Examples
// ============================================================================

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       Quantum Computing: Error Correction                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  example1_ErrorTypes();
  example2_ClassicalRepetition();
  example3_BitFlipCode();
  example4_PhaseFlipCode();
  example5_ShorCode();
  example6_StabilizerCodes();
  example7_SyndromeMeasurement();
  example8_DetectionVsCorrection();
  example9_FaultTolerance();
  example10_SurfaceCodes();
  example11_LogicalOperations();
  example12_QECSummary();

  console.log('\n' + '='.repeat(60));
  console.log('All quantum error correction examples completed!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_ErrorTypes,
  example2_ClassicalRepetition,
  example3_BitFlipCode,
  example4_PhaseFlipCode,
  example5_ShorCode,
  example6_StabilizerCodes,
  example7_SyndromeMeasurement,
  example8_DetectionVsCorrection,
  example9_FaultTolerance,
  example10_SurfaceCodes,
  example11_LogicalOperations,
  example12_QECSummary,
};
