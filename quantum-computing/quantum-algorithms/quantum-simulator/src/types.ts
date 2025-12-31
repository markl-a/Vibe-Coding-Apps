/**
 * Quantum Simulator Types
 */

// Complex number representation
export interface Complex {
  real: number;
  imag: number;
}

// Qubit state (superposition of |0⟩ and |1⟩)
export interface QubitState {
  alpha: Complex; // amplitude for |0⟩
  beta: Complex;  // amplitude for |1⟩
}

// Quantum gate types
export type GateType =
  | 'I'      // Identity
  | 'X'      // Pauli-X (NOT)
  | 'Y'      // Pauli-Y
  | 'Z'      // Pauli-Z
  | 'H'      // Hadamard
  | 'S'      // Phase gate
  | 'T'      // π/8 gate
  | 'CNOT'   // Controlled-NOT
  | 'CZ'     // Controlled-Z
  | 'SWAP'   // Swap
  | 'Rx'     // Rotation around X-axis
  | 'Ry'     // Rotation around Y-axis
  | 'Rz'     // Rotation around Z-axis
  | 'MEASURE'; // Measurement

// Gate operation
export interface GateOperation {
  gate: GateType;
  targets: number[];      // target qubit indices
  controls?: number[];    // control qubit indices (for controlled gates)
  params?: number[];      // rotation angles etc.
}

// Quantum circuit
export interface QuantumCircuit {
  name: string;
  numQubits: number;
  operations: GateOperation[];
}

// Measurement result
export interface MeasurementResult {
  qubit: number;
  value: 0 | 1;
  probability: number;
}

// Circuit execution result
export interface CircuitResult {
  circuit: QuantumCircuit;
  finalState: Complex[];
  measurements: MeasurementResult[];
  probabilities: number[];
  executionTime: number;
}

// Simulation options
export interface SimulationOptions {
  shots?: number;        // number of measurement shots
  seed?: number;         // random seed for reproducibility
  verbose?: boolean;     // log intermediate states
}

// State vector (2^n amplitudes for n qubits)
export type StateVector = Complex[];

// 2x2 matrix for single-qubit gates
export type Matrix2x2 = [[Complex, Complex], [Complex, Complex]];

// Histogram of measurement outcomes
export interface MeasurementHistogram {
  outcomes: Record<string, number>;
  totalShots: number;
}
