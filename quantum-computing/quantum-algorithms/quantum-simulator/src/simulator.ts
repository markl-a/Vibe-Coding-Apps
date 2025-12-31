/**
 * Quantum Circuit Simulator
 *
 * Simulates quantum circuits using state vector representation
 */

import type {
  Complex,
  StateVector,
  Matrix2x2,
  QuantumCircuit,
  GateOperation,
  CircuitResult,
  MeasurementResult,
  MeasurementHistogram,
  SimulationOptions,
} from './types.js';

import * as C from './complex.js';
import { getGateMatrix } from './gates.js';

export class QuantumSimulator {
  private numQubits: number;
  private stateVector: StateVector;
  private measurements: MeasurementResult[];
  private rng: () => number;

  constructor(numQubits: number, seed?: number) {
    if (numQubits < 1 || numQubits > 20) {
      throw new Error('Number of qubits must be between 1 and 20');
    }

    this.numQubits = numQubits;
    this.stateVector = this.initializeState();
    this.measurements = [];

    // Simple seeded random number generator
    if (seed !== undefined) {
      let s = seed;
      this.rng = () => {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    } else {
      this.rng = Math.random;
    }
  }

  /**
   * Initialize state to |00...0⟩
   */
  private initializeState(): StateVector {
    const size = 1 << this.numQubits; // 2^n
    const state: StateVector = new Array(size).fill(null).map(() => C.ZERO);
    state[0] = C.ONE; // |00...0⟩
    return state;
  }

  /**
   * Reset simulator to initial state
   */
  reset(): void {
    this.stateVector = this.initializeState();
    this.measurements = [];
  }

  /**
   * Get current state vector
   */
  getState(): StateVector {
    return [...this.stateVector];
  }

  /**
   * Get probability of each basis state
   */
  getProbabilities(): number[] {
    return this.stateVector.map((amplitude) => C.magnitudeSquared(amplitude));
  }

  /**
   * Apply single-qubit gate
   */
  applyGate(gate: Matrix2x2, target: number): void {
    if (target < 0 || target >= this.numQubits) {
      throw new Error(`Invalid target qubit: ${target}`);
    }

    const size = 1 << this.numQubits;
    const newState: StateVector = new Array(size)
      .fill(null)
      .map(() => C.ZERO);

    for (let i = 0; i < size; i++) {
      const bit = (i >> target) & 1;
      const partner = i ^ (1 << target);

      if (bit === 0) {
        // |0⟩ component
        newState[i] = C.add(
          C.multiply(gate[0][0], this.stateVector[i]),
          C.multiply(gate[0][1], this.stateVector[partner])
        );
        // |1⟩ component
        newState[partner] = C.add(
          C.multiply(gate[1][0], this.stateVector[i]),
          C.multiply(gate[1][1], this.stateVector[partner])
        );
      }
    }

    this.stateVector = newState;
  }

  /**
   * Apply controlled gate (e.g., CNOT, CZ)
   */
  applyControlledGate(
    gate: Matrix2x2,
    control: number,
    target: number
  ): void {
    if (control === target) {
      throw new Error('Control and target must be different qubits');
    }

    const size = 1 << this.numQubits;
    const newState: StateVector = [...this.stateVector];

    for (let i = 0; i < size; i++) {
      const controlBit = (i >> control) & 1;
      const targetBit = (i >> target) & 1;

      // Only apply gate when control is |1⟩
      if (controlBit === 1 && targetBit === 0) {
        const partner = i ^ (1 << target);

        newState[i] = C.add(
          C.multiply(gate[0][0], this.stateVector[i]),
          C.multiply(gate[0][1], this.stateVector[partner])
        );
        newState[partner] = C.add(
          C.multiply(gate[1][0], this.stateVector[i]),
          C.multiply(gate[1][1], this.stateVector[partner])
        );
      }
    }

    this.stateVector = newState;
  }

  /**
   * Apply SWAP gate
   */
  applySwap(qubit1: number, qubit2: number): void {
    if (qubit1 === qubit2) return;

    const size = 1 << this.numQubits;

    for (let i = 0; i < size; i++) {
      const bit1 = (i >> qubit1) & 1;
      const bit2 = (i >> qubit2) & 1;

      if (bit1 !== bit2 && bit1 < bit2) {
        const swapped = i ^ (1 << qubit1) ^ (1 << qubit2);
        const temp = this.stateVector[i];
        this.stateVector[i] = this.stateVector[swapped];
        this.stateVector[swapped] = temp;
      }
    }
  }

  /**
   * Measure a single qubit
   */
  measure(qubit: number): MeasurementResult {
    const size = 1 << this.numQubits;

    // Calculate probability of measuring |0⟩
    let prob0 = 0;
    for (let i = 0; i < size; i++) {
      if (((i >> qubit) & 1) === 0) {
        prob0 += C.magnitudeSquared(this.stateVector[i]);
      }
    }

    // Random measurement
    const random = this.rng();
    const measuredValue: 0 | 1 = random < prob0 ? 0 : 1;
    const probability = measuredValue === 0 ? prob0 : 1 - prob0;

    // Collapse state
    const normFactor = 1 / Math.sqrt(probability);
    for (let i = 0; i < size; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === measuredValue) {
        this.stateVector[i] = C.scale(this.stateVector[i], normFactor);
      } else {
        this.stateVector[i] = C.ZERO;
      }
    }

    const result: MeasurementResult = {
      qubit,
      value: measuredValue,
      probability,
    };

    this.measurements.push(result);
    return result;
  }

  /**
   * Measure all qubits
   */
  measureAll(): MeasurementResult[] {
    const results: MeasurementResult[] = [];
    for (let i = 0; i < this.numQubits; i++) {
      results.push(this.measure(i));
    }
    return results;
  }

  /**
   * Execute a gate operation
   */
  executeOperation(op: GateOperation): void {
    const { gate, targets, controls, params } = op;

    if (gate === 'MEASURE') {
      for (const target of targets) {
        this.measure(target);
      }
      return;
    }

    if (gate === 'SWAP') {
      if (targets.length !== 2) {
        throw new Error('SWAP requires exactly 2 targets');
      }
      this.applySwap(targets[0], targets[1]);
      return;
    }

    if (gate === 'CNOT') {
      if (!controls || controls.length !== 1 || targets.length !== 1) {
        throw new Error('CNOT requires 1 control and 1 target');
      }
      this.applyControlledGate(getGateMatrix('X'), controls[0], targets[0]);
      return;
    }

    if (gate === 'CZ') {
      if (!controls || controls.length !== 1 || targets.length !== 1) {
        throw new Error('CZ requires 1 control and 1 target');
      }
      this.applyControlledGate(getGateMatrix('Z'), controls[0], targets[0]);
      return;
    }

    // Single-qubit gates
    const matrix = getGateMatrix(gate, params);
    for (const target of targets) {
      this.applyGate(matrix, target);
    }
  }

  /**
   * Execute a quantum circuit
   */
  executeCircuit(
    circuit: QuantumCircuit,
    options: SimulationOptions = {}
  ): CircuitResult {
    const startTime = performance.now();

    // Reset if different number of qubits
    if (circuit.numQubits !== this.numQubits) {
      this.numQubits = circuit.numQubits;
    }
    this.reset();

    // Execute each operation
    for (const op of circuit.operations) {
      if (options.verbose) {
        console.log(`Applying ${op.gate} to qubit(s) ${op.targets.join(',')}`);
      }
      this.executeOperation(op);
    }

    const executionTime = performance.now() - startTime;

    return {
      circuit,
      finalState: this.getState(),
      measurements: [...this.measurements],
      probabilities: this.getProbabilities(),
      executionTime,
    };
  }

  /**
   * Run circuit multiple times and collect measurement statistics
   */
  runShots(
    circuit: QuantumCircuit,
    shots: number = 1000
  ): MeasurementHistogram {
    const outcomes: Record<string, number> = {};

    for (let i = 0; i < shots; i++) {
      this.reset();

      // Execute circuit
      for (const op of circuit.operations) {
        this.executeOperation(op);
      }

      // Measure all qubits
      const results = this.measureAll();
      const bitstring = results
        .map((r) => r.value)
        .reverse()
        .join('');

      outcomes[bitstring] = (outcomes[bitstring] || 0) + 1;
    }

    return { outcomes, totalShots: shots };
  }

  /**
   * Get state as ket notation string
   */
  stateToString(): string {
    const terms: string[] = [];
    const size = 1 << this.numQubits;

    for (let i = 0; i < size; i++) {
      const amplitude = this.stateVector[i];
      if (!C.isZero(amplitude)) {
        const basisState = i.toString(2).padStart(this.numQubits, '0');
        const ampStr = C.toString(amplitude, 3);
        terms.push(`${ampStr}|${basisState}⟩`);
      }
    }

    return terms.join(' + ') || '0';
  }
}
