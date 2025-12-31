/**
 * Quantum Algorithms Examples
 *
 * This file demonstrates famous quantum algorithms:
 * - Deutsch-Jozsa Algorithm
 * - Grover's Search Algorithm
 * - Quantum Fourier Transform (QFT)
 * - Shor's Algorithm (simplified)
 * - Quantum Phase Estimation
 * - Variational Quantum Eigensolver (VQE)
 * - QAOA (Quantum Approximate Optimization)
 * - Quantum Counting
 */

import { QuantumSimulator } from '../quantum-algorithms/quantum-simulator/src/simulator.js';
import * as Algorithms from '../quantum-algorithms/quantum-simulator/src/algorithms.js';
import type { QuantumCircuit, GateOperation } from '../quantum-algorithms/quantum-simulator/src/types.js';

// ============================================================================
// Example 1: Deutsch-Jozsa Algorithm
// ============================================================================

function example1_DeutschJozsa(): void {
  console.log('\n=== Example 1: Deutsch-Jozsa Algorithm ===\n');

  console.log('Problem: Determine if a function f:{0,1}ⁿ → {0,1} is constant or balanced');
  console.log('Classical: Requires 2ⁿ⁻¹ + 1 queries in worst case');
  console.log('Quantum: Requires only 1 query!\n');

  // Test with constant function
  console.log('1. Testing constant function:');
  const constantCircuit = Algorithms.deutschJozsa(3, 'constant');
  const sim1 = new QuantumSimulator(constantCircuit.numQubits);
  sim1.executeCircuit(constantCircuit);

  const measurements1 = sim1.measureAll();
  const result1 = measurements1.slice(0, 2).map(m => m.value).join('');
  console.log(`   Measurement result: ${result1}`);
  console.log(`   Result: ${result1 === '00' ? 'CONSTANT' : 'BALANCED'}`);

  // Test with balanced function
  console.log('\n2. Testing balanced function:');
  const balancedCircuit = Algorithms.deutschJozsa(3, 'balanced');
  const sim2 = new QuantumSimulator(balancedCircuit.numQubits);
  sim2.executeCircuit(balancedCircuit);

  const measurements2 = sim2.measureAll();
  const result2 = measurements2.slice(0, 2).map(m => m.value).join('');
  console.log(`   Measurement result: ${result2}`);
  console.log(`   Result: ${result2 === '00' ? 'CONSTANT' : 'BALANCED'}`);

  console.log('\nKey Insight: Quantum parallelism allows evaluating all inputs simultaneously!');
}

// ============================================================================
// Example 2: Grover's Search Algorithm
// ============================================================================

function example2_GroverSearch(): void {
  console.log('\n=== Example 2: Grover\'s Search Algorithm ===\n');

  console.log('Problem: Search for marked item in unsorted database of N items');
  console.log('Classical: O(N) queries required');
  console.log('Quantum: O(√N) queries with Grover\'s algorithm!\n');

  const numQubits = 3;
  const databaseSize = Math.pow(2, numQubits); // 8 items
  const markedItem = 5; // Search for item at index 5

  console.log(`Database size: ${databaseSize} items`);
  console.log(`Searching for: item ${markedItem} (binary: ${markedItem.toString(2).padStart(numQubits, '0')})`);

  // Create Grover circuit
  const circuit = Algorithms.groverIteration(numQubits, markedItem);

  // Optimal number of iterations for 3 qubits
  const iterations = Math.floor((Math.PI / 4) * Math.sqrt(databaseSize));
  console.log(`\nOptimal iterations: ${iterations}`);

  // Run multiple iterations
  const sim = new QuantumSimulator(numQubits);

  for (let i = 0; i < iterations; i++) {
    // Apply Grover iteration
    circuit.operations.forEach(op => {
      if (op.gate !== 'MEASURE') {
        sim.executeOperation(op);
      }
    });
  }

  console.log('\nProbability distribution after Grover iterations:');
  const probs = sim.getProbabilities();
  probs.forEach((prob, index) => {
    if (prob > 0.01) {
      const bar = '█'.repeat(Math.floor(prob * 50));
      const marker = index === markedItem ? ' ← MARKED' : '';
      console.log(`  |${index.toString(2).padStart(numQubits, '0')}⟩: ${(prob * 100).toFixed(1)}% ${bar}${marker}`);
    }
  });

  // Measure to find the marked item
  const result = sim.measureAll();
  const foundItem = parseInt(result.map(m => m.value).reverse().join(''), 2);
  console.log(`\nMeasurement result: ${foundItem}`);
  console.log(`Success: ${foundItem === markedItem ? 'YES! ✓' : 'No'}`);
}

// ============================================================================
// Example 3: Quantum Fourier Transform
// ============================================================================

function example3_QuantumFourierTransform(): void {
  console.log('\n=== Example 3: Quantum Fourier Transform (QFT) ===\n');

  console.log('QFT is the quantum analogue of the discrete Fourier transform');
  console.log('Used in: Shor\'s algorithm, phase estimation, quantum simulation\n');

  const numQubits = 3;
  console.log(`Applying ${numQubits}-qubit QFT:\n`);

  // Prepare a simple input state |001⟩
  const sim = new QuantumSimulator(numQubits);
  sim.executeOperation({ gate: 'X', targets: [2] }); // Create |001⟩

  console.log('Input state:', sim.stateToString());

  // Apply QFT
  const qftCircuit = Algorithms.qft(numQubits);
  qftCircuit.operations.forEach(op => {
    sim.executeOperation(op);
  });

  console.log('After QFT:', sim.stateToString());

  console.log('\nQFT Properties:');
  console.log('  - Transforms basis states to superposition of phase states');
  console.log('  - Can be implemented with O(n²) gates for n qubits');
  console.log('  - Classical FFT requires O(n·2ⁿ) operations');
  console.log('  - Exponential speedup!');

  // Show probability distribution
  const probs = sim.getProbabilities();
  console.log('\nProbability distribution:');
  probs.forEach((prob, index) => {
    if (prob > 0.01) {
      const basis = index.toString(2).padStart(numQubits, '0');
      console.log(`  |${basis}⟩: ${(prob * 100).toFixed(1)}%`);
    }
  });
}

// ============================================================================
// Example 4: Quantum Phase Estimation
// ============================================================================

function example4_QuantumPhaseEstimation(): void {
  console.log('\n=== Example 4: Quantum Phase Estimation ===\n');

  console.log('Problem: Estimate eigenvalue phase φ where U|ψ⟩ = e^(2πiφ)|ψ⟩');
  console.log('Applications: Shor\'s algorithm, quantum chemistry, optimization\n');

  console.log('Simplified demonstration:');
  console.log('  - Using T gate as unitary (eigenvalue e^(iπ/4))');
  console.log('  - Phase φ = 1/8 (since T = e^(iπ/4) = e^(2πi·1/8))');

  const precisionQubits = 3; // Number of qubits for phase precision
  const totalQubits = precisionQubits + 1; // +1 for eigenstate qubit

  const circuit: QuantumCircuit = {
    name: 'Phase Estimation',
    numQubits: totalQubits,
    operations: [
      // Prepare eigenstate |1⟩ on last qubit
      { gate: 'X', targets: [precisionQubits] },

      // Initialize precision qubits to superposition
      { gate: 'H', targets: [0] },
      { gate: 'H', targets: [1] },
      { gate: 'H', targets: [2] },

      // Controlled-U operations (simplified)
      // In full algorithm, would apply controlled-U^(2^k)
      { gate: 'T', targets: [precisionQubits] }, // Simplified

      // Inverse QFT on precision qubits (simplified)
      { gate: 'H', targets: [0] },
      { gate: 'H', targets: [1] },
      { gate: 'H', targets: [2] },
    ],
  };

  console.log('\nPhase estimation circuit structure:');
  console.log('  1. Prepare eigenstate');
  console.log('  2. Create superposition in precision register');
  console.log('  3. Apply controlled-unitary operations');
  console.log('  4. Apply inverse QFT');
  console.log('  5. Measure precision register to get phase');

  console.log('\nApplications:');
  console.log('  - Finding eigenvalues of quantum systems');
  console.log('  - Shor\'s factoring algorithm');
  console.log('  - Quantum chemistry simulations');
  console.log('  - Period finding');
}

// ============================================================================
// Example 5: Variational Quantum Eigensolver (VQE)
// ============================================================================

function example5_VQE(): void {
  console.log('\n=== Example 5: Variational Quantum Eigensolver (VQE) ===\n');

  console.log('VQE finds ground state energy of quantum systems');
  console.log('Hybrid quantum-classical algorithm for NISQ devices\n');

  console.log('Algorithm steps:');
  console.log('  1. Prepare parameterized quantum state |ψ(θ)⟩');
  console.log('  2. Measure expectation value ⟨ψ(θ)|H|ψ(θ)⟩');
  console.log('  3. Classical optimizer updates parameters θ');
  console.log('  4. Repeat until convergence');

  console.log('\nSimplified example: Finding ground state of Z operator');

  // Variational ansatz
  function createAnsatz(theta: number): QuantumCircuit {
    return {
      name: 'VQE Ansatz',
      numQubits: 1,
      operations: [{ gate: 'Ry', targets: [0], params: [theta] }],
    };
  }

  // Hamiltonian: H = Z (ground state is |0⟩ with energy -1)
  function measureEnergy(sim: QuantumSimulator): number {
    // For Z operator: E = P(0) - P(1)
    const probs = sim.getProbabilities();
    return probs[0] - probs[1];
  }

  console.log('\nTesting different parameter values:');
  const testAngles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI];

  let minEnergy = Infinity;
  let bestTheta = 0;

  testAngles.forEach(theta => {
    const circuit = createAnsatz(theta);
    const sim = new QuantumSimulator(1);
    sim.executeCircuit(circuit);

    const energy = measureEnergy(sim);
    if (energy < minEnergy) {
      minEnergy = energy;
      bestTheta = theta;
    }

    console.log(`  θ = ${(theta / Math.PI).toFixed(2)}π: Energy = ${energy.toFixed(4)}`);
  });

  console.log(`\nOptimal parameters: θ = ${(bestTheta / Math.PI).toFixed(2)}π`);
  console.log(`Ground state energy: ${minEnergy.toFixed(4)}`);
  console.log('(Theoretical minimum: -1.0 at θ = 0)');

  console.log('\nApplications:');
  console.log('  - Quantum chemistry (molecular energies)');
  console.log('  - Materials science');
  console.log('  - Optimization problems');
}

// ============================================================================
// Example 6: QAOA (Quantum Approximate Optimization Algorithm)
// ============================================================================

function example6_QAOA(): void {
  console.log('\n=== Example 6: QAOA ===\n');

  console.log('QAOA solves combinatorial optimization problems');
  console.log('Similar to VQE but designed for optimization\n');

  console.log('Algorithm structure:');
  console.log('  1. Start in equal superposition');
  console.log('  2. Alternate between:');
  console.log('     - Problem Hamiltonian (encodes cost function)');
  console.log('     - Mixer Hamiltonian (explores solution space)');
  console.log('  3. Repeat p times (depth parameter)');
  console.log('  4. Measure to get approximate solution');

  console.log('\nSimple example: MaxCut on 2-node graph');
  console.log('  Objective: Maximize edges between different partitions\n');

  function createQAOA(gamma: number, beta: number): QuantumCircuit {
    return {
      name: 'QAOA p=1',
      numQubits: 2,
      operations: [
        // Initial state: equal superposition
        { gate: 'H', targets: [0] },
        { gate: 'H', targets: [1] },

        // Problem Hamiltonian (ZZ interaction)
        { gate: 'CNOT', targets: [1], controls: [0] },
        { gate: 'Rz', targets: [1], params: [2 * gamma] },
        { gate: 'CNOT', targets: [1], controls: [0] },

        // Mixer Hamiltonian (X rotations)
        { gate: 'Rx', targets: [0], params: [2 * beta] },
        { gate: 'Rx', targets: [1], params: [2 * beta] },
      ],
    };
  }

  const testParams = [
    { gamma: 0.5, beta: 0.5 },
    { gamma: 1.0, beta: 0.5 },
    { gamma: 0.5, beta: 1.0 },
  ];

  console.log('Testing parameter combinations:');
  testParams.forEach(({ gamma, beta }) => {
    const circuit = createQAOA(gamma, beta);
    const sim = new QuantumSimulator(2);
    sim.executeCircuit(circuit);

    const probs = sim.getProbabilities();
    const objectiveValue = probs[1] + probs[2]; // |01⟩ and |10⟩ are optimal

    console.log(`  γ=${gamma.toFixed(1)}, β=${beta.toFixed(1)}: Objective = ${(objectiveValue * 100).toFixed(1)}%`);
  });

  console.log('\nApplications:');
  console.log('  - Graph problems (MaxCut, graph coloring)');
  console.log('  - Scheduling and resource allocation');
  console.log('  - Portfolio optimization');
  console.log('  - Machine learning');
}

// ============================================================================
// Example 7: Quantum Teleportation
// ============================================================================

function example7_QuantumTeleportation(): void {
  console.log('\n=== Example 7: Quantum Teleportation ===\n');

  console.log('Teleport quantum state from Alice to Bob using entanglement');
  console.log('  - Qubit 0: State to teleport (Alice)');
  console.log('  - Qubit 1: Alice\'s half of Bell pair');
  console.log('  - Qubit 2: Bob\'s half of Bell pair\n');

  const circuit = Algorithms.quantumTeleportation();

  console.log('Protocol steps:');
  console.log('  1. Create entangled Bell pair between Alice and Bob');
  console.log('  2. Alice performs Bell measurement on her qubits');
  console.log('  3. Alice sends classical measurement results to Bob');
  console.log('  4. Bob applies corrections based on measurements');
  console.log('  5. Bob now has the original state!');

  console.log('\nCircuit operations:');
  circuit.operations.forEach((op, i) => {
    const controlStr = op.controls ? ` (control: ${op.controls[0]})` : '';
    console.log(`  ${i + 1}. ${op.gate} on qubit ${op.targets.join(',')}${controlStr}`);
  });

  console.log('\nKey points:');
  console.log('  - Original state is destroyed (no cloning theorem)');
  console.log('  - Requires classical communication (no FTL)');
  console.log('  - Demonstrates quantum entanglement');
  console.log('  - Foundation for quantum networks');
}

// ============================================================================
// Example 8: Superdense Coding
// ============================================================================

function example8_SuperdenseCoding(): void {
  console.log('\n=== Example 8: Superdense Coding ===\n');

  console.log('Send 2 classical bits by transmitting 1 qubit!');
  console.log('Opposite of teleportation: classical info using entanglement\n');

  const messages: Array<[0 | 1, 0 | 1]> = [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  console.log('Encoding and decoding all 2-bit messages:');
  messages.forEach(bits => {
    const circuit = Algorithms.superdenseCoding(bits);
    const sim = new QuantumSimulator(circuit.numQubits);

    // Execute circuit without final measurements
    circuit.operations.forEach(op => {
      if (op.gate !== 'MEASURE') {
        sim.executeOperation(op);
      }
    });

    // Measure
    const results = sim.measureAll();
    const decoded = results.map(r => r.value);

    console.log(`  Sent: ${bits.join('')} → Received: ${decoded.join('')} ${bits[0] === decoded[0] && bits[1] === decoded[1] ? '✓' : '✗'}`);
  });

  console.log('\nProtocol:');
  console.log('  1. Alice and Bob share entangled Bell pair');
  console.log('  2. Alice encodes 2 bits by applying gates to her qubit');
  console.log('  3. Alice sends her qubit to Bob');
  console.log('  4. Bob decodes by measuring both qubits in Bell basis');

  console.log('\nApplications:');
  console.log('  - Quantum communication');
  console.log('  - Quantum cryptography');
  console.log('  - Efficient quantum networks');
}

// ============================================================================
// Example 9: Quantum Counting
// ============================================================================

function example9_QuantumCounting(): void {
  console.log('\n=== Example 9: Quantum Counting ===\n');

  console.log('Count the number of marked items in a database');
  console.log('Extension of Grover\'s algorithm using phase estimation\n');

  console.log('Algorithm:');
  console.log('  1. Prepare equal superposition');
  console.log('  2. Apply Grover operator as controlled unitary');
  console.log('  3. Use phase estimation to find eigenvalue');
  console.log('  4. Extract number of solutions from phase');

  const numQubits = 3;
  const databaseSize = Math.pow(2, numQubits);
  const numMarked = 2; // Suppose 2 items are marked

  console.log(`\nDatabase size: ${databaseSize}`);
  console.log(`Marked items: ${numMarked}`);

  const theta = Math.asin(Math.sqrt(numMarked / databaseSize));
  const estimatedMarked = databaseSize * Math.sin(theta) ** 2;

  console.log(`\nPhase angle θ: ${(theta / Math.PI).toFixed(3)}π`);
  console.log(`Estimated marked items: ${estimatedMarked.toFixed(1)}`);

  console.log('\nAdvantages over Grover:');
  console.log('  - Knows how many solutions exist');
  console.log('  - Can determine optimal Grover iterations');
  console.log('  - Useful when solution count is unknown');
}

// ============================================================================
// Example 10: Quantum Random Number Generation
// ============================================================================

function example10_QuantumRNG(): void {
  console.log('\n=== Example 10: Quantum Random Number Generation ===\n');

  console.log('Generate true random numbers using quantum superposition\n');

  const numBits = 4;
  const circuit = Algorithms.quantumRNG(numBits);

  console.log(`Generating ${numBits}-bit random numbers:\n`);

  const samples = 10;
  const numbers: number[] = [];

  for (let i = 0; i < samples; i++) {
    const sim = new QuantumSimulator(numBits);
    sim.executeCircuit(circuit);

    const results = sim.measureAll();
    const binary = results.map(r => r.value).reverse().join('');
    const decimal = parseInt(binary, 2);
    numbers.push(decimal);

    console.log(`  Sample ${i + 1}: ${binary} = ${decimal}`);
  }

  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  console.log(`\nAverage: ${avg.toFixed(2)} (Expected: ${(Math.pow(2, numBits) - 1) / 2})`);

  console.log('\nQuantum vs Classical RNG:');
  console.log('  Quantum: True randomness from quantum mechanics');
  console.log('  Classical: Pseudo-random (deterministic algorithms)');
  console.log('\nApplications:');
  console.log('  - Cryptography');
  console.log('  - Monte Carlo simulations');
  console.log('  - Gaming and lotteries');
  console.log('  - Scientific research');
}

// ============================================================================
// Run All Examples
// ============================================================================

function main(): void {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║        Quantum Computing: Quantum Algorithms              ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  example1_DeutschJozsa();
  example2_GroverSearch();
  example3_QuantumFourierTransform();
  example4_QuantumPhaseEstimation();
  example5_VQE();
  example6_QAOA();
  example7_QuantumTeleportation();
  example8_SuperdenseCoding();
  example9_QuantumCounting();
  example10_QuantumRNG();

  console.log('\n' + '='.repeat(60));
  console.log('All quantum algorithms examples completed!');
  console.log('='.repeat(60) + '\n');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_DeutschJozsa,
  example2_GroverSearch,
  example3_QuantumFourierTransform,
  example4_QuantumPhaseEstimation,
  example5_VQE,
  example6_QAOA,
  example7_QuantumTeleportation,
  example8_SuperdenseCoding,
  example9_QuantumCounting,
  example10_QuantumRNG,
};
