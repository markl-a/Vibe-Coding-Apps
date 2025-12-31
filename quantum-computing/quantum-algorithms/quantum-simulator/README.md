# Quantum Circuit Simulator

A TypeScript quantum circuit simulator for learning quantum computing concepts. Simulates quantum gates, circuits, and algorithms using state vector representation.

## Features

- **State Vector Simulation**: Full quantum state simulation up to 20 qubits
- **Quantum Gates**: Pauli (X, Y, Z), Hadamard, Phase, T, Rotation gates
- **Multi-Qubit Gates**: CNOT, CZ, SWAP
- **Measurements**: Single qubit and full register measurements
- **Pre-built Algorithms**: Bell state, GHZ, Deutsch-Jozsa, QFT, Grover's
- **Complex Number Library**: Full complex arithmetic support

## Quick Start

```bash
pnpm install
pnpm example
```

## Usage

### Basic Simulation

```typescript
import { QuantumSimulator } from '@vibe/quantum-simulator';

// Create 2-qubit simulator
const sim = new QuantumSimulator(2);

// Apply Hadamard to qubit 0
sim.executeOperation({ gate: 'H', targets: [0] });

// Apply CNOT (control: 0, target: 1)
sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });

// Get state
console.log(sim.stateToString()); // "0.707|00⟩ + 0.707|11⟩"

// Measure
const result = sim.measureAll();
console.log(result); // [{ qubit: 0, value: 0|1, probability: 0.5 }, ...]
```

### Run Pre-built Algorithms

```typescript
import { QuantumSimulator, bellState, ghzState } from '@vibe/quantum-simulator';

// Bell State
const sim = new QuantumSimulator(2);
const circuit = bellState();
sim.executeCircuit(circuit);
console.log(sim.stateToString());

// GHZ State (3 qubits)
const sim3 = new QuantumSimulator(3);
sim3.executeCircuit(ghzState(3));
```

### Measurement Statistics

```typescript
const circuit = bellState();
const histogram = sim.runShots(circuit, 1000);
console.log(histogram.outcomes);
// { "00": 498, "11": 502 }
```

## Quantum Gates

### Single-Qubit Gates

| Gate | Matrix | Description |
|------|--------|-------------|
| I | Identity | No operation |
| X | Pauli-X | Bit flip: \|0⟩ ↔ \|1⟩ |
| Y | Pauli-Y | Bit and phase flip |
| Z | Pauli-Z | Phase flip: \|1⟩ → -\|1⟩ |
| H | Hadamard | Creates superposition |
| S | Phase | π/2 phase rotation |
| T | T-gate | π/4 phase rotation |

### Rotation Gates

```typescript
// Rotation around X-axis by angle θ
sim.executeOperation({ gate: 'Rx', targets: [0], params: [Math.PI/2] });

// Rotation around Y-axis
sim.executeOperation({ gate: 'Ry', targets: [0], params: [Math.PI/4] });

// Rotation around Z-axis
sim.executeOperation({ gate: 'Rz', targets: [0], params: [Math.PI] });
```

### Multi-Qubit Gates

```typescript
// CNOT (Controlled-NOT)
sim.executeOperation({ gate: 'CNOT', targets: [1], controls: [0] });

// CZ (Controlled-Z)
sim.executeOperation({ gate: 'CZ', targets: [1], controls: [0] });

// SWAP
sim.executeOperation({ gate: 'SWAP', targets: [0, 1] });
```

## Pre-built Algorithms

### Bell State
Creates maximally entangled state (|00⟩ + |11⟩)/√2

```typescript
import { bellState } from '@vibe/quantum-simulator';
const circuit = bellState();
```

### GHZ State
N-qubit entangled state (|00...0⟩ + |11...1⟩)/√2

```typescript
import { ghzState } from '@vibe/quantum-simulator';
const circuit = ghzState(4); // 4-qubit GHZ
```

### Deutsch-Jozsa Algorithm
Determines if function is constant or balanced

```typescript
import { deutschJozsa } from '@vibe/quantum-simulator';
const circuit = deutschJozsa(3, 'balanced');
```

### Quantum Random Number Generator

```typescript
import { quantumRNG } from '@vibe/quantum-simulator';
const circuit = quantumRNG(8); // 8-bit random number
```

### Superdense Coding
Send 2 classical bits using 1 qubit

```typescript
import { superdenseCoding } from '@vibe/quantum-simulator';
const circuit = superdenseCoding([1, 0]); // Send "10"
```

## Complex Numbers

```typescript
import { complex, add, multiply, magnitude } from '@vibe/quantum-simulator';

const a = complex(1, 2);  // 1 + 2i
const b = complex(3, -1); // 3 - i

const sum = add(a, b);           // 4 + i
const product = multiply(a, b);  // 5 + 5i
const mag = magnitude(a);        // √5 ≈ 2.236
```

## Building Circuits

```typescript
import type { QuantumCircuit } from '@vibe/quantum-simulator';

const myCircuit: QuantumCircuit = {
  name: 'My Algorithm',
  numQubits: 3,
  operations: [
    { gate: 'H', targets: [0] },
    { gate: 'H', targets: [1] },
    { gate: 'CNOT', targets: [2], controls: [0] },
    { gate: 'CNOT', targets: [2], controls: [1] },
    { gate: 'MEASURE', targets: [0, 1, 2] },
  ],
};

const sim = new QuantumSimulator(3);
const result = sim.executeCircuit(myCircuit);
```

## State Representation

The simulator uses state vector representation:
- N qubits → 2^N complex amplitudes
- State |ψ⟩ = Σ αᵢ|i⟩ where |αᵢ|² is probability of measuring |i⟩

```typescript
// Get probability of each basis state
const probs = sim.getProbabilities();

// Get full state vector
const state = sim.getState();

// Human-readable state
console.log(sim.stateToString());
// "0.707|00⟩ + 0.707|11⟩"
```

## Limitations

- Maximum 20 qubits (2^20 = 1M amplitudes)
- No noise simulation
- No quantum error correction
- Simplified multi-controlled gates
- Educational purpose only

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   QuantumSimulator                           │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │    State     │  │     Gate      │  │   Circuit    │     │
│  │   Vector     │  │   Executor    │  │   Runner     │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
│         │                 │                   │             │
│         ▼                 ▼                   ▼             │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐     │
│  │   Complex    │  │    Gate       │  │  Algorithm   │     │
│  │    Math      │  │  Matrices     │  │   Library    │     │
│  └──────────────┘  └───────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## References

- [Qiskit Textbook](https://qiskit.org/textbook/)
- [IBM Quantum](https://quantum-computing.ibm.com/)
- [Nielsen & Chuang](https://www.cambridge.org/core/books/quantum-computation-and-quantum-information/)

## License

MIT
