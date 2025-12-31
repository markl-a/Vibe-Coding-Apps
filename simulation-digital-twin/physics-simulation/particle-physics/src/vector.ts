/**
 * 2D Vector Math Utilities
 */

import type { Vec2 } from './types.js';

// Create vector
export function vec2(x: number = 0, y: number = 0): Vec2 {
  return { x, y };
}

// Zero vector
export const ZERO: Vec2 = { x: 0, y: 0 };

// Add vectors
export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

// Subtract vectors
export function subtract(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

// Scale vector
export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

// Negate vector
export function negate(v: Vec2): Vec2 {
  return { x: -v.x, y: -v.y };
}

// Dot product
export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

// Cross product (returns scalar for 2D)
export function cross(a: Vec2, b: Vec2): number {
  return a.x * b.y - a.y * b.x;
}

// Magnitude (length)
export function magnitude(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

// Magnitude squared (faster, for comparisons)
export function magnitudeSquared(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

// Distance between two points
export function distance(a: Vec2, b: Vec2): number {
  return magnitude(subtract(a, b));
}

// Distance squared
export function distanceSquared(a: Vec2, b: Vec2): number {
  return magnitudeSquared(subtract(a, b));
}

// Normalize vector
export function normalize(v: Vec2): Vec2 {
  const mag = magnitude(v);
  if (mag === 0) return ZERO;
  return scale(v, 1 / mag);
}

// Rotate vector by angle (radians)
export function rotate(v: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

// Perpendicular vector (90° counter-clockwise)
export function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

// Linear interpolation
export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

// Reflect vector off surface with normal n
export function reflect(v: Vec2, n: Vec2): Vec2 {
  const d = 2 * dot(v, n);
  return subtract(v, scale(n, d));
}

// Project a onto b
export function project(a: Vec2, b: Vec2): Vec2 {
  const bMagSq = magnitudeSquared(b);
  if (bMagSq === 0) return ZERO;
  return scale(b, dot(a, b) / bMagSq);
}

// Clamp vector magnitude
export function clampMagnitude(v: Vec2, maxMag: number): Vec2 {
  const mag = magnitude(v);
  if (mag > maxMag) {
    return scale(v, maxMag / mag);
  }
  return v;
}

// Angle of vector (radians)
export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

// Angle between two vectors (radians)
export function angleBetween(a: Vec2, b: Vec2): number {
  return Math.acos(dot(a, b) / (magnitude(a) * magnitude(b)));
}

// Random vector with given magnitude
export function random(mag: number = 1): Vec2 {
  const theta = Math.random() * Math.PI * 2;
  return { x: Math.cos(theta) * mag, y: Math.sin(theta) * mag };
}

// Check if approximately equal
export function equals(a: Vec2, b: Vec2, epsilon: number = 1e-6): boolean {
  return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
}

// Clone vector
export function clone(v: Vec2): Vec2 {
  return { x: v.x, y: v.y };
}

// Format as string
export function toString(v: Vec2, precision: number = 2): string {
  return `(${v.x.toFixed(precision)}, ${v.y.toFixed(precision)})`;
}
