# Quantum Computing Examples

This directory contains comprehensive examples demonstrating quantum computing concepts using TypeScript. All examples use the quantum simulator located in `../quantum-algorithms/quantum-simulator/`.

## Example Files

### 1. qubit-operations.ts
**Basic Qubit Operations**

Demonstrates fundamental qubit operations including:
- Qubit initialization and state vectors
- State manipulation (X, Z gates)
- Creating superposition (Hadamard gate)
- Measurement and state collapse
- Measurement statistics
- Multi-qubit states
- Phase manipulation
- Rotation gates
- Bloch sphere representation
- State fidelity calculations

**Run:** Learn the basics of qubit states and how to manipulate them.

### 2. quantum-gates.ts
**Quantum Gate Implementations**

Covers all essential quantum gates:
- Pauli gates (X, Y, Z)
- Hadamard gate
- Phase gates (S, T)
- Rotation gates (Rx, Ry, Rz)
- Controlled gates (CNOT, CZ)
- SWAP gate
- Gate compositions and equivalences
- Universal gate sets
- Gate matrix properties
- Custom gate sequences
- Multi-controlled gates

**Run:** Understand how quantum gates work and their properties.

### 3. quantum-circuits.ts
**Building Quantum Circuits**

Shows how to construct and execute quantum circuits:
- Circuit construction and execution
- Bell state circuits
- Multi-qubit circuits (GHZ states)
- Parameterized circuits
- Circuit composition
- Circuit depth and gate count
- Running circuits with shots
- Inverse circuits
- Conditional operations
- Circuit optimization techniques
- Variational circuits
- Circuit transpilation

**Run:** Learn to build complex quantum circuits from basic gates.

### 4. quantum-algorithms.ts
**Famous Quantum Algorithms**

Implements and demonstrates major quantum algorithms:
- Deutsch-Jozsa Algorithm (constant vs balanced functions)
- Grover's Search Algorithm (database search)
- Quantum Fourier Transform (QFT)
- Quantum Phase Estimation
- Variational Quantum Eigensolver (VQE)
- QAOA (Quantum Approximate Optimization)
- Quantum Teleportation
- Superdense Coding
- Quantum Counting
- Quantum Random Number Generation

**Run:** See quantum advantage in action with famous algorithms.

### 5. quantum-simulation.ts
**Simulating Quantum Systems**

Demonstrates quantum simulation of physical systems:
- Single spin dynamics
- Two-spin interactions (Ising model)
- Spin chain dynamics (Heisenberg model)
- Trotter decomposition
- Molecular simulation (simplified H₂)
- Quantum harmonic oscillator
- Quantum phase transitions
- Adiabatic state preparation
- Many-body localization
- Quantum thermalization

**Run:** Understand how quantum computers can simulate quantum physics.

### 6. error-correction.ts
**Quantum Error Correction**

Covers error correction techniques essential for fault-tolerant quantum computing:
- Types of quantum errors (bit flip, phase flip, combined)
- Classical repetition code (context)
- Bit-flip code (3-qubit repetition)
- Phase-flip code
- Shor's 9-qubit code
- Stabilizer codes
- Syndrome measurement
- Error detection vs correction
- Fault-tolerant quantum computing
- Surface codes
- Logical qubit operations
- QEC summary and outlook

**Run:** Learn how to protect quantum information from errors.

## Usage

Each example file can be run independently and contains multiple numbered examples with detailed explanations.

### Running Examples

If using Node.js with TypeScript support:

```bash
# Run individual example files
npx tsx quantum-computing/examples/qubit-operations.ts
npx tsx quantum-computing/examples/quantum-gates.ts
npx tsx quantum-computing/examples/quantum-circuits.ts
npx tsx quantum-computing/examples/quantum-algorithms.ts
npx tsx quantum-computing/examples/quantum-simulation.ts
npx tsx quantum-computing/examples/error-correction.ts
```

### Importing Specific Examples

Each file exports individual example functions that can be imported:

```typescript
import {
  example1_InitializeQubits,
  example3_Superposition
} from './examples/qubit-operations.js';

example1_InitializeQubits();
example3_Superposition();
```

## Learning Path

Recommended order for learning:

1. **Start with basics**: `qubit-operations.ts`
   - Understand qubits, superposition, and measurement

2. **Learn gates**: `quantum-gates.ts`
   - Master the building blocks of quantum circuits

3. **Build circuits**: `quantum-circuits.ts`
   - Combine gates into meaningful quantum programs

4. **Study algorithms**: `quantum-algorithms.ts`
   - See quantum advantage in famous algorithms

5. **Explore simulation**: `quantum-simulation.ts`
   - Understand quantum physics applications

6. **Advanced topic**: `error-correction.ts`
   - Learn about fault-tolerant quantum computing

## Key Concepts Covered

### Fundamental Concepts
- Qubits and quantum states
- Superposition and entanglement
- Quantum measurement
- Quantum gates and circuits
- Bloch sphere representation

### Quantum Phenomena
- Wave-particle duality
- Quantum interference
- Quantum parallelism
- No-cloning theorem
- Quantum entanglement

### Practical Applications
- Quantum algorithms
- Quantum simulation
- Quantum cryptography
- Quantum optimization
- Quantum chemistry

### Advanced Topics
- Variational quantum algorithms
- Error correction
- Fault tolerance
- Surface codes
- Logical qubits

## Requirements

- TypeScript/JavaScript runtime
- Quantum simulator from `../quantum-algorithms/quantum-simulator/`
- Basic understanding of complex numbers (helpful but not required)

## Additional Resources

For more information about quantum computing:

- **Quantum Simulator**: See `../quantum-algorithms/quantum-simulator/README.md`
- **Theory**: Research quantum mechanics fundamentals
- **Practice**: Experiment with different parameters in the examples
- **Hardware**: Explore real quantum computers (IBM Quantum, AWS Braket, etc.)

## Contributing

Feel free to add more examples or improve existing ones! Some ideas:

- More quantum algorithms (Simon's, HHL, etc.)
- Advanced error correction codes
- Quantum machine learning examples
- Quantum cryptography protocols
- Noise models and mitigation
- Compilation and optimization techniques

## Notes

- All examples use a state vector simulator
- Simulations are exact (no noise) unless specified
- Some examples are simplified for educational purposes
- Real quantum hardware has additional constraints and limitations

## License

Part of the Vibe-Coding-Apps quantum computing collection.
