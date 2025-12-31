/**
 * Quantum Gates
 *
 * Standard quantum gates as 2x2 unitary matrices
 */

import type { Matrix2x2, Complex } from './types.js';
import { complex, ZERO, ONE } from './complex.js';

// Helper for creating matrices
function matrix(
  a: Complex,
  b: Complex,
  c: Complex,
  d: Complex
): Matrix2x2 {
  return [[a, b], [c, d]];
}

// Identity gate
export const I: Matrix2x2 = matrix(ONE, ZERO, ZERO, ONE);

// Pauli-X gate (NOT gate)
// |0⟩ → |1⟩, |1⟩ → |0⟩
export const X: Matrix2x2 = matrix(ZERO, ONE, ONE, ZERO);

// Pauli-Y gate
export const Y: Matrix2x2 = matrix(
  ZERO,
  complex(0, -1),
  complex(0, 1),
  ZERO
);

// Pauli-Z gate
// |0⟩ → |0⟩, |1⟩ → -|1⟩
export const Z: Matrix2x2 = matrix(ONE, ZERO, ZERO, complex(-1, 0));

// Hadamard gate
// |0⟩ → (|0⟩ + |1⟩)/√2, |1⟩ → (|0⟩ - |1⟩)/√2
const SQRT2_INV = 1 / Math.sqrt(2);
export const H: Matrix2x2 = matrix(
  complex(SQRT2_INV),
  complex(SQRT2_INV),
  complex(SQRT2_INV),
  complex(-SQRT2_INV)
);

// Phase gate (S gate)
// |0⟩ → |0⟩, |1⟩ → i|1⟩
export const S: Matrix2x2 = matrix(ONE, ZERO, ZERO, complex(0, 1));

// T gate (π/8 gate)
// |0⟩ → |0⟩, |1⟩ → e^(iπ/4)|1⟩
const T_PHASE = Math.PI / 4;
export const T: Matrix2x2 = matrix(
  ONE,
  ZERO,
  ZERO,
  complex(Math.cos(T_PHASE), Math.sin(T_PHASE))
);

// S-dagger (S†)
export const S_DAG: Matrix2x2 = matrix(ONE, ZERO, ZERO, complex(0, -1));

// T-dagger (T†)
export const T_DAG: Matrix2x2 = matrix(
  ONE,
  ZERO,
  ZERO,
  complex(Math.cos(T_PHASE), -Math.sin(T_PHASE))
);

// Rotation gates
export function Rx(theta: number): Matrix2x2 {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return matrix(
    complex(cos),
    complex(0, -sin),
    complex(0, -sin),
    complex(cos)
  );
}

export function Ry(theta: number): Matrix2x2 {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return matrix(
    complex(cos),
    complex(-sin),
    complex(sin),
    complex(cos)
  );
}

export function Rz(theta: number): Matrix2x2 {
  const halfTheta = theta / 2;
  return matrix(
    complex(Math.cos(-halfTheta), Math.sin(-halfTheta)),
    ZERO,
    ZERO,
    complex(Math.cos(halfTheta), Math.sin(halfTheta))
  );
}

// Phase rotation gate
export function Phase(phi: number): Matrix2x2 {
  return matrix(
    ONE,
    ZERO,
    ZERO,
    complex(Math.cos(phi), Math.sin(phi))
  );
}

// Get gate matrix by name
export function getGateMatrix(
  gate: string,
  params?: number[]
): Matrix2x2 {
  switch (gate) {
    case 'I':
      return I;
    case 'X':
      return X;
    case 'Y':
      return Y;
    case 'Z':
      return Z;
    case 'H':
      return H;
    case 'S':
      return S;
    case 'T':
      return T;
    case 'Rx':
      return Rx(params?.[0] ?? 0);
    case 'Ry':
      return Ry(params?.[0] ?? 0);
    case 'Rz':
      return Rz(params?.[0] ?? 0);
    default:
      throw new Error(`Unknown gate: ${gate}`);
  }
}

// Gate descriptions
export const GATE_INFO: Record<string, { name: string; description: string }> = {
  I: { name: 'Identity', description: 'Does nothing to the qubit state' },
  X: { name: 'Pauli-X', description: 'Bit flip: |0⟩ ↔ |1⟩' },
  Y: { name: 'Pauli-Y', description: 'Bit and phase flip' },
  Z: { name: 'Pauli-Z', description: 'Phase flip: |1⟩ → -|1⟩' },
  H: { name: 'Hadamard', description: 'Creates superposition' },
  S: { name: 'Phase', description: 'π/2 phase rotation' },
  T: { name: 'T-gate', description: 'π/4 phase rotation' },
  CNOT: { name: 'Controlled-NOT', description: 'Flips target if control is |1⟩' },
  CZ: { name: 'Controlled-Z', description: 'Phase flip on target if control is |1⟩' },
  SWAP: { name: 'Swap', description: 'Swaps two qubit states' },
  Rx: { name: 'X-Rotation', description: 'Rotation around X-axis' },
  Ry: { name: 'Y-Rotation', description: 'Rotation around Y-axis' },
  Rz: { name: 'Z-Rotation', description: 'Rotation around Z-axis' },
  MEASURE: { name: 'Measurement', description: 'Collapses superposition' },
};
