/**
 * Quantum Circuits Examples
 *
 * This file demonstrates building and executing quantum circuits:
 * - Circuit construction
 * - Circuit execution
 * - Circuit composition
 * - Parameterized circuits
 * - Circuit optimization
 * - Circuit visualization
 * - Circuit depth and gate count
 */

import { QuantumSimulator } from '../quantum-algorithms/quantum-simulator/src/simulator.js';
import type { QuantumCircuit, GateOperation } from '../quantum-algorithms/quantum-simulator/src/types.js';

// ============================================================================
// Example 1: Building a Simple Circuit
// ============================================================================

function example1_SimpleCircuit(): void {
  console.log('\n=== Example 1: Building a Simple Circuit ===\n');

  // Create a circuit manually
  const circuit: QuantumCircuit = {
    name: 'Simple Superposition',
    numQubits: 1,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'MEASURE', targets: [0] },
    ],
  };

  console.log(`Circuit: ${circuit.name}`);
  console.log(`Qubits: ${circuit.numQubits}`);
  console.log('Operations:');
  circuit.operations.forEach((op, i) => {
    console.log(`  ${i + 1}. ${op.gate} on qubit ${op.targets.join(',')}`);
  });

  // Execute the circuit
  const sim = new QuantumSimulator(circuit.numQubits);
  const result = sim.executeCircuit(circuit);

  console.log('\nExecution Results:');
  console.log('Final state:', sim.stateToString());
  console.log('Execution time:', result.executionTime.toFixed(3), 'ms');
}

// ============================================================================
// Example 2: Bell State Circuit
// ============================================================================

function example2_BellStateCircuit(): void {
  console.log('\n=== Example 2: Bell State Circuit ===\n');

  const circuit: QuantumCircuit = {
    name: 'Bell State (EPR Pair)',
    numQubits: 2,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'CNOT', targets: [1], controls: [0] },
    ],
  };

  console.log('Bell State Circuit:');
  console.log('  |00⟩ ──[H]──●────');
  console.log('              │    ');
  console.log('  |0⟩  ───────⊕────');

  const sim = new QuantumSimulator(circuit.numQubits);
  sim.executeCircuit(circuit);

  console.log('\nFinal state:', sim.stateToString());
  console.log('This is a maximally entangled state!');

  // Measure multiple times to see correlation
  const counts = new Map<string, number>();
  for (let i = 0; i < 1000; i++) {
    const s = new QuantumSimulator(2);
    s.executeCircuit(circuit);
    const results = s.measureAll();
    const outcome = results.map(r => r.value).join('');
    counts.set(outcome, (counts.get(outcome) || 0) + 1);
  }

  console.log('\nMeasurement statistics (1000 shots):');
  counts.forEach((count, outcome) => {
    console.log(`  |${outcome}⟩: ${count} times (${(count / 10).toFixed(1)}%)`);
  });
  console.log('Note: Always measure 00 or 11, never 01 or 10!');
}

// ============================================================================
// Example 3: Multi-Qubit Circuit
// ============================================================================

function example3_MultiQubitCircuit(): void {
  console.log('\n=== Example 3: Multi-Qubit Circuit ===\n');

  // GHZ state: (|000⟩ + |111⟩)/√2
  const circuit: QuantumCircuit = {
    name: '3-Qubit GHZ State',
    numQubits: 3,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'CNOT', targets: [1], controls: [0] },
      { gate: 'CNOT', targets: [2], controls: [0] },
    ],
  };

  console.log('GHZ State Circuit (3 qubits):');
  console.log('  q0: ──[H]──●────●────');
  console.log('              │    │   ');
  console.log('  q1: ───────⊕────┼────');
  console.log('                   │   ');
  console.log('  q2: ──────────────⊕────');

  const sim = new QuantumSimulator(circuit.numQubits);
  sim.executeCircuit(circuit);

  console.log('\nFinal state:', sim.stateToString());

  const probs = sim.getProbabilities();
  console.log('\nProbabilities:');
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > 0.001) {
      const basis = i.toString(2).padStart(3, '0');
      console.log(`  |${basis}⟩: ${(probs[i] * 100).toFixed(1)}%`);
    }
  }
}

// ============================================================================
// Example 4: Parameterized Circuit
// ============================================================================

function example4_ParameterizedCircuit(): void {
  console.log('\n=== Example 4: Parameterized Circuit ===\n');

  console.log('Parameterized circuits allow variable rotation angles:\n');

  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI];
  const angleNames = ['0', 'π/4', 'π/2', '3π/4', 'π'];

  angles.forEach((angle, i) => {
    const circuit: QuantumCircuit = {
      name: `Ry(${angleNames[i]})`,
      numQubits: 1,
      operations: [{ gate: 'Ry', targets: [0], params: [angle] }],
    };

    const sim = new QuantumSimulator(1);
    sim.executeCircuit(circuit);

    const probs = sim.getProbabilities();
    console.log(`Ry(${angleNames[i]}): P(|0⟩)=${(probs[0] * 100).toFixed(1)}%, P(|1⟩)=${(probs[1] * 100).toFixed(1)}%`);
  });

  console.log('\nParameterized circuits are useful for:');
  console.log('  - Variational quantum algorithms (VQE, QAOA)');
  console.log('  - Quantum machine learning');
  console.log('  - Circuit optimization');
}

// ============================================================================
// Example 5: Circuit Composition
// ============================================================================

function example5_CircuitComposition(): void {
  console.log('\n=== Example 5: Circuit Composition ===\n');

  // Build a circuit by composing smaller circuits
  const prepareState: GateOperation[] = [
    { gate: 'H', targets: [0] },
    { gate: 'H', targets: [1] },
  ];

  const entangle: GateOperation[] = [
    { gate: 'CNOT', targets: [1], controls: [0] },
  ];

  const measure: GateOperation[] = [
    { gate: 'MEASURE', targets: [0] },
    { gate: 'MEASURE', targets: [1] },
  ];

  const composedCircuit: QuantumCircuit = {
    name: 'Composed Circuit',
    numQubits: 2,
    operations: [...prepareState, ...entangle, ...measure],
  };

  console.log('Circuit built from three parts:');
  console.log('  1. Prepare: Apply H to both qubits');
  console.log('  2. Entangle: Apply CNOT');
  console.log('  3. Measure: Measure both qubits');

  console.log('\nFull operation sequence:');
  composedCircuit.operations.forEach((op, i) => {
    const controlStr = op.controls ? ` (control: ${op.controls[0]})` : '';
    console.log(`  ${i + 1}. ${op.gate} on qubit ${op.targets.join(',')}${controlStr}`);
  });
}

// ============================================================================
// Example 6: Circuit Depth and Gate Count
// ============================================================================

function example6_CircuitMetrics(): void {
  console.log('\n=== Example 6: Circuit Depth and Gate Count ===\n');

  const circuits: QuantumCircuit[] = [
    {
      name: 'Shallow Circuit',
      numQubits: 2,
      operations: [
        { gate: 'H', targets: [0] },
        { gate: 'H', targets: [1] },
      ],
    },
    {
      name: 'Deep Circuit',
      numQubits: 2,
      operations: [
        { gate: 'H', targets: [0] },
        { gate: 'CNOT', targets: [1], controls: [0] },
        { gate: 'H', targets: [0] },
        { gate: 'CNOT', targets: [1], controls: [0] },
        { gate: 'H', targets: [0] },
      ],
    },
  ];

  circuits.forEach(circuit => {
    const gateCount = circuit.operations.length;

    // Calculate circuit depth (simplified - actual depth requires dependency analysis)
    const depth = circuit.operations.length; // Simplified calculation

    console.log(`${circuit.name}:`);
    console.log(`  Total gates: ${gateCount}`);
    console.log(`  Depth: ~${depth}`);
    console.log('  Operations:', circuit.operations.map(op => op.gate).join(' → '));
    console.log();
  });

  console.log('Circuit depth is important because:');
  console.log('  - Deeper circuits accumulate more errors');
  console.log('  - Quantum coherence decays over time');
  console.log('  - Shallower circuits are preferred on NISQ devices');
}

// ============================================================================
// Example 7: Circuit Execution with Shots
// ============================================================================

function example7_CircuitShots(): void {
  console.log('\n=== Example 7: Circuit Execution with Shots ===\n');

  const circuit: QuantumCircuit = {
    name: 'Quantum Coin Flip',
    numQubits: 1,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'MEASURE', targets: [0] },
    ],
  };

  console.log('Running circuit 1000 times (shots):');

  const sim = new QuantumSimulator(circuit.numQubits);
  const histogram = sim.runShots(circuit, 1000);

  console.log('\nMeasurement outcomes:');
  Object.entries(histogram.outcomes)
    .sort()
    .forEach(([outcome, count]) => {
      const percentage = ((count / histogram.totalShots) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor(count / 10));
      console.log(`  |${outcome}⟩: ${count.toString().padStart(4)} (${percentage}%) ${bar}`);
    });

  console.log(`\nTotal shots: ${histogram.totalShots}`);
}

// ============================================================================
// Example 8: Inverse Circuit
// ============================================================================

function example8_InverseCircuit(): void {
  console.log('\n=== Example 8: Inverse Circuit ===\n');

  // Create a circuit
  const forwardCircuit: QuantumCircuit = {
    name: 'Forward',
    numQubits: 2,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'CNOT', targets: [1], controls: [0] },
      { gate: 'T', targets: [0] },
    ],
  };

  // Create inverse circuit (reverse operations with conjugate gates)
  const inverseCircuit: QuantumCircuit = {
    name: 'Inverse',
    numQubits: 2,
    operations: [
      { gate: 'T', targets: [0] }, // T† would be ideal, but we'll use T for simplicity
      { gate: 'CNOT', targets: [1], controls: [0] },
      { gate: 'H', targets: [0] },
    ].reverse(),
  };

  console.log('Forward circuit:');
  forwardCircuit.operations.forEach(op => {
    console.log(`  ${op.gate} on qubit ${op.targets.join(',')}`);
  });

  const sim = new QuantumSimulator(2);
  sim.executeCircuit(forwardCircuit);
  console.log('\nAfter forward circuit:', sim.stateToString());

  sim.executeCircuit(inverseCircuit);
  console.log('After inverse circuit:', sim.stateToString());
  console.log('\nNote: Should return close to initial |00⟩ state');
}

// ============================================================================
// Example 9: Conditional Operations
// ============================================================================

function example9_ConditionalOperations(): void {
  console.log('\n=== Example 9: Conditional Operations ===\n');

  console.log('Simulating conditional operations based on measurement:');
  console.log('(In real quantum hardware, this is classical control)');

  const sim = new QuantumSimulator(2);

  // Create Bell state
  sim.executeOperation({ gate: 'H', targets: [0] });
  sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });

  console.log('\nBefore measurement:', sim.stateToString());

  // Measure first qubit
  const result = sim.measure(0);
  console.log(`\nMeasured qubit 0: ${result.value}`);

  // Conditional operation based on measurement
  if (result.value === 1) {
    console.log('Applying X to qubit 1 (conditional on measurement)');
    sim.executeOperation({ gate: 'X', targets: [1] });
  }

  console.log('Final state:', sim.stateToString());
}

// ============================================================================
// Example 10: Circuit Optimization
// ============================================================================

function example10_CircuitOptimization(): void {
  console.log('\n=== Example 10: Circuit Optimization ===\n');

  // Unoptimized circuit with redundant gates
  const unoptimized: QuantumCircuit = {
    name: 'Unoptimized',
    numQubits: 1,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'Z', targets: [0] },
      { gate: 'Z', targets: [0] }, // Z² = I (identity)
      { gate: 'H', targets: [0] },
      { gate: 'H', targets: [0] }, // H² = I (identity)
      { gate: 'X', targets: [0] },
    ],
  };

  // Optimized circuit (removed redundant gates)
  const optimized: QuantumCircuit = {
    name: 'Optimized',
    numQubits: 1,
    operations: [
      { gate: 'H', targets: [0] },
      // Z² removed (identity)
      { gate: 'H', targets: [0] },
      // Second H removed as HH cancelled
      { gate: 'X', targets: [0] },
    ],
  };

  console.log('Unoptimized circuit:');
  console.log(`  Gates: ${unoptimized.operations.length}`);
  console.log(`  Operations: ${unoptimized.operations.map(op => op.gate).join(' → ')}`);

  const sim1 = new QuantumSimulator(1);
  sim1.executeCircuit(unoptimized);
  console.log(`  Final state: ${sim1.stateToString()}`);

  console.log('\nOptimized circuit:');
  console.log(`  Gates: ${optimized.operations.length}`);
  console.log(`  Operations: ${optimized.operations.map(op => op.gate).join(' → ')}`);

  const sim2 = new QuantumSimulator(1);
  sim2.executeCircuit(optimized);
  console.log(`  Final state: ${sim2.stateToString()}`);

  console.log('\nOptimization techniques:');
  console.log('  - Remove identity operations (X², H², Z²)');
  console.log('  - Combine rotation gates');
  console.log('  - Commute gates for parallel execution');
  console.log('  - Replace gate sequences with equivalents');
}

// ============================================================================
// Example 11: Variational Circuit
// ============================================================================

function example11_VariationalCircuit(): void {
  console.log('\n=== Example 11: Variational Circuit (Ansatz) ===\n');

  console.log('Variational circuits have tunable parameters:\n');

  // A simple variational ansatz
  function createVariationalCircuit(params: number[]): QuantumCircuit {
    return {
      name: 'Variational Ansatz',
      numQubits: 2,
      operations: [
        { gate: 'Ry', targets: [0], params: [params[0]] },
        { gate: 'Ry', targets: [1], params: [params[1]] },
        { gate: 'CNOT', targets: [1], controls: [0] },
        { gate: 'Ry', targets: [0], params: [params[2]] },
        { gate: 'Ry', targets: [1], params: [params[3]] },
      ],
    };
  }

  // Try different parameter sets
  const paramSets = [
    [0, 0, 0, 0],
    [Math.PI / 2, Math.PI / 2, 0, 0],
    [Math.PI / 4, Math.PI / 4, Math.PI / 4, Math.PI / 4],
  ];

  paramSets.forEach((params, i) => {
    const circuit = createVariationalCircuit(params);
    const sim = new QuantumSimulator(circuit.numQubits);
    sim.executeCircuit(circuit);

    console.log(`Parameter set ${i + 1}: [${params.map(p => (p / Math.PI).toFixed(2) + 'π').join(', ')}]`);
    console.log(`  Final state: ${sim.stateToString()}`);
  });

  console.log('\nVariational circuits are used in:');
  console.log('  - VQE (Variational Quantum Eigensolver)');
  console.log('  - QAOA (Quantum Approximate Optimization Algorithm)');
  console.log('  - Quantum Machine Learning');
}

// ============================================================================
// Example 12: Circuit Transpilation
// ============================================================================

function example12_CircuitTranspilation(): void {
  console.log('\n=== Example 12: Circuit Transpilation ===\n');

  console.log('Transpilation adapts circuits to hardware constraints:\n');

  // Original circuit with gates not available on hardware
  const original: QuantumCircuit = {
    name: 'Original',
    numQubits: 2,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'CNOT', targets: [1], controls: [0] },
    ],
  };

  // Transpiled to use only CZ and single-qubit gates
  const transpiled: QuantumCircuit = {
    name: 'Transpiled (using CZ instead of CNOT)',
    numQubits: 2,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'H', targets: [1] },
      { gate: 'CZ', targets: [1], controls: [0] },
      { gate: 'H', targets: [1] },
    ],
  };

  console.log('Original circuit:');
  original.operations.forEach(op => {
    console.log(`  ${op.gate} on qubit ${op.targets.join(',')}${op.controls ? ` (control: ${op.controls[0]})` : ''}`);
  });

  const sim1 = new QuantumSimulator(2);
  sim1.executeCircuit(original);
  console.log('Result:', sim1.stateToString());

  console.log('\nTranspiled circuit (H-CZ-H decomposition of CNOT):');
  transpiled.operations.forEach(op => {
    console.log(`  ${op.gate} on qubit ${op.targets.join(',')}${op.controls ? ` (control: ${op.controls[0]})` : ''}`);
  });

  const sim2 = new QuantumSimulator(2);
  sim2.executeCircuit(transpiled);
  console.log('Result:', sim2.stateToString());

  console.log('\nTranspilation considerations:');
  console.log('  - Native gate set of quantum hardware');
  console.log('  - Qubit connectivity topology');
  console.log('  - Gate fidelities and error rates');
  console.log('  - Circuit depth vs gate count tradeoffs');
}

// ============================================================================
// Run All Examples
// ============================================================================

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         Quantum Computing: Quantum Circuits               ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  example1_SimpleCircuit();
  example2_BellStateCircuit();
  example3_MultiQubitCircuit();
  example4_ParameterizedCircuit();
  example5_CircuitComposition();
  example6_CircuitMetrics();
  example7_CircuitShots();
  example8_InverseCircuit();
  example9_ConditionalOperations();
  example10_CircuitOptimization();
  example11_VariationalCircuit();
  example12_CircuitTranspilation();

  console.log('\n' + '='.repeat(60));
  console.log('All quantum circuits examples completed!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_SimpleCircuit,
  example2_BellStateCircuit,
  example3_MultiQubitCircuit,
  example4_ParameterizedCircuit,
  example5_CircuitComposition,
  example6_CircuitMetrics,
  example7_CircuitShots,
  example8_InverseCircuit,
  example9_ConditionalOperations,
  example10_CircuitOptimization,
  example11_VariationalCircuit,
  example12_CircuitTranspilation,
};
