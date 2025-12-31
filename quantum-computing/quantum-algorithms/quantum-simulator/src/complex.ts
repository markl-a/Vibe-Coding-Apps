/**
 * Complex Number Operations
 */

import type { Complex } from './types.js';

// Create complex number
export function complex(real: number, imag: number = 0): Complex {
  return { real, imag };
}

// Complex zero
export const ZERO: Complex = { real: 0, imag: 0 };

// Complex one
export const ONE: Complex = { real: 1, imag: 0 };

// Imaginary unit i
export const I: Complex = { real: 0, imag: 1 };

// Add two complex numbers
export function add(a: Complex, b: Complex): Complex {
  return {
    real: a.real + b.real,
    imag: a.imag + b.imag,
  };
}

// Subtract two complex numbers
export function subtract(a: Complex, b: Complex): Complex {
  return {
    real: a.real - b.real,
    imag: a.imag - b.imag,
  };
}

// Multiply two complex numbers
export function multiply(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

// Divide two complex numbers
export function divide(a: Complex, b: Complex): Complex {
  const denominator = b.real * b.real + b.imag * b.imag;
  if (denominator === 0) {
    throw new Error('Division by zero');
  }
  return {
    real: (a.real * b.real + a.imag * b.imag) / denominator,
    imag: (a.imag * b.real - a.real * b.imag) / denominator,
  };
}

// Complex conjugate
export function conjugate(c: Complex): Complex {
  return { real: c.real, imag: -c.imag };
}

// Magnitude (absolute value)
export function magnitude(c: Complex): number {
  return Math.sqrt(c.real * c.real + c.imag * c.imag);
}

// Magnitude squared (for probabilities)
export function magnitudeSquared(c: Complex): number {
  return c.real * c.real + c.imag * c.imag;
}

// Phase angle
export function phase(c: Complex): number {
  return Math.atan2(c.imag, c.real);
}

// Create from polar form
export function fromPolar(r: number, theta: number): Complex {
  return {
    real: r * Math.cos(theta),
    imag: r * Math.sin(theta),
  };
}

// Exponential of complex number
export function exp(c: Complex): Complex {
  const expReal = Math.exp(c.real);
  return {
    real: expReal * Math.cos(c.imag),
    imag: expReal * Math.sin(c.imag),
  };
}

// Scale by real number
export function scale(c: Complex, s: number): Complex {
  return { real: c.real * s, imag: c.imag * s };
}

// Check if approximately zero
export function isZero(c: Complex, epsilon: number = 1e-10): boolean {
  return magnitude(c) < epsilon;
}

// Check if approximately equal
export function equals(a: Complex, b: Complex, epsilon: number = 1e-10): boolean {
  return magnitude(subtract(a, b)) < epsilon;
}

// Format as string
export function toString(c: Complex, precision: number = 4): string {
  const re = c.real.toFixed(precision);
  const im = Math.abs(c.imag).toFixed(precision);

  if (Math.abs(c.imag) < 1e-10) {
    return re;
  }
  if (Math.abs(c.real) < 1e-10) {
    return c.imag >= 0 ? `${im}i` : `-${im}i`;
  }

  const sign = c.imag >= 0 ? '+' : '-';
  return `${re}${sign}${im}i`;
}
