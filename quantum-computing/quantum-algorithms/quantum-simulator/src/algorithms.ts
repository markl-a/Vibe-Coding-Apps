/**
 * Common Quantum Algorithms
 *
 * Pre-built circuits for famous quantum algorithms
 */

import type { QuantumCircuit, GateOperation } from './types.js';

/**
 * Bell State Preparation
 * Creates maximally entangled state (|00⟩ + |11⟩)/√2
 */
export function bellState(): QuantumCircuit {
  return {
    name: 'Bell State',
    numQubits: 2,
    operations: [
      { gate: 'H', targets: [0] },
      { gate: 'CNOT', targets: [1], controls: [0] },
    ],
  };
}

/**
 * GHZ State Preparation
 * Creates n-qubit GHZ state (|00...0⟩ + |11...1⟩)/√2
 */
export function ghzState(numQubits: number): QuantumCircuit {
  const operations: GateOperation[] = [{ gate: 'H', targets: [0] }];

  for (let i = 1; i < numQubits; i++) {
    operations.push({ gate: 'CNOT', targets: [i], controls: [0] });
  }

  return {
    name: `${numQubits}-qubit GHZ State`,
    numQubits,
    operations,
  };
}

/**
 * Quantum Teleportation Circuit
 * Teleports qubit 0 to qubit 2 using entanglement
 */
export function quantumTeleportation(): QuantumCircuit {
  return {
    name: 'Quantum Teleportation',
    numQubits: 3,
    operations: [
      // Prepare Bell pair between qubits 1 and 2
      { gate: 'H', targets: [1] },
      { gate: 'CNOT', targets: [2], controls: [1] },
      // Bell measurement on qubits 0 and 1
      { gate: 'CNOT', targets: [1], controls: [0] },
      { gate: 'H', targets: [0] },
      // Measurements would go here
      { gate: 'MEASURE', targets: [0] },
      { gate: 'MEASURE', targets: [1] },
      // Corrections (in real implementation, these would be conditional)
      { gate: 'X', targets: [2] }, // Conditional on qubit 1
      { gate: 'Z', targets: [2] }, // Conditional on qubit 0
    ],
  };
}

/**
 * Deutsch-Jozsa Algorithm
 * Determines if a function is constant or balanced
 */
export function deutschJozsa(
  numQubits: number,
  oracleType: 'constant' | 'balanced' = 'balanced'
): QuantumCircuit {
  const n = numQubits - 1; // Last qubit is auxiliary
  const operations: GateOperation[] = [];

  // Initialize auxiliary qubit to |1⟩
  operations.push({ gate: 'X', targets: [n] });

  // Apply Hadamard to all qubits
  for (let i = 0; i <= n; i++) {
    operations.push({ gate: 'H', targets: [i] });
  }

  // Oracle (simplified - just for demonstration)
  if (oracleType === 'balanced') {
    // Balanced oracle: CNOT from first qubit to auxiliary
    operations.push({ gate: 'CNOT', targets: [n], controls: [0] });
  }
  // Constant oracle: do nothing (f(x) = 0) or X on auxiliary (f(x) = 1)

  // Apply Hadamard to input qubits
  for (let i = 0; i < n; i++) {
    operations.push({ gate: 'H', targets: [i] });
  }

  // Measure input qubits
  for (let i = 0; i < n; i++) {
    operations.push({ gate: 'MEASURE', targets: [i] });
  }

  return {
    name: `Deutsch-Jozsa (${oracleType})`,
    numQubits,
    operations,
  };
}

/**
 * Quantum Fourier Transform
 */
export function qft(numQubits: number): QuantumCircuit {
  const operations: GateOperation[] = [];

  for (let i = 0; i < numQubits; i++) {
    // Apply Hadamard
    operations.push({ gate: 'H', targets: [i] });

    // Apply controlled rotations
    for (let j = i + 1; j < numQubits; j++) {
      const angle = Math.PI / Math.pow(2, j - i);
      operations.push({
        gate: 'Rz',
        targets: [j],
        controls: [i],
        params: [angle],
      });
    }
  }

  // Swap qubits to reverse order
  for (let i = 0; i < Math.floor(numQubits / 2); i++) {
    operations.push({ gate: 'SWAP', targets: [i, numQubits - 1 - i] });
  }

  return {
    name: `${numQubits}-qubit QFT`,
    numQubits,
    operations,
  };
}

/**
 * Grover's Search (single iteration)
 * Searches for marked item in unsorted database
 */
export function groverIteration(numQubits: number, marked: number): QuantumCircuit {
  const operations: GateOperation[] = [];

  // Initialize superposition
  for (let i = 0; i < numQubits; i++) {
    operations.push({ gate: 'H', targets: [i] });
  }

  // Oracle: flip phase of marked state
  // This is a simplified version - just applies Z to qubits in marked state
  for (let i = 0; i < numQubits; i++) {
    if ((marked >> i) & 1) {
      operations.push({ gate: 'Z', targets: [i] });
    }
  }

  // Diffusion operator (inversion about mean)
  for (let i = 0; i < numQubits; i++) {
    operations.push({ gate: 'H', targets: [i] });
    operations.push({ gate: 'X', targets: [i] });
  }

  // Multi-controlled Z (simplified as series of CZ)
  if (numQubits >= 2) {
    operations.push({ gate: 'CZ', targets: [numQubits - 1], controls: [0] });
  }

  for (let i = 0; i < numQubits; i++) {
    operations.push({ gate: 'X', targets: [i] });
    operations.push({ gate: 'H', targets: [i] });
  }

  return {
    name: `Grover Search (marked=${marked})`,
    numQubits,
    operations,
  };
}

/**
 * Quantum Random Number Generator
 */
export function quantumRNG(numBits: number): QuantumCircuit {
  const operations: GateOperation[] = [];

  // Apply Hadamard to create superposition
  for (let i = 0; i < numBits; i++) {
    operations.push({ gate: 'H', targets: [i] });
  }

  // Measure all qubits
  for (let i = 0; i < numBits; i++) {
    operations.push({ gate: 'MEASURE', targets: [i] });
  }

  return {
    name: `${numBits}-bit Quantum RNG`,
    numQubits: numBits,
    operations,
  };
}

/**
 * Superdense Coding
 * Send 2 classical bits using 1 qubit
 */
export function superdenseCoding(bits: [0 | 1, 0 | 1]): QuantumCircuit {
  const [b1, b2] = bits;
  const operations: GateOperation[] = [];

  // Create Bell pair
  operations.push({ gate: 'H', targets: [0] });
  operations.push({ gate: 'CNOT', targets: [1], controls: [0] });

  // Encode message on qubit 0
  if (b2 === 1) operations.push({ gate: 'X', targets: [0] });
  if (b1 === 1) operations.push({ gate: 'Z', targets: [0] });

  // Decode
  operations.push({ gate: 'CNOT', targets: [1], controls: [0] });
  operations.push({ gate: 'H', targets: [0] });

  // Measure
  operations.push({ gate: 'MEASURE', targets: [0] });
  operations.push({ gate: 'MEASURE', targets: [1] });

  return {
    name: `Superdense Coding (${b1}${b2})`,
    numQubits: 2,
    operations,
  };
}
