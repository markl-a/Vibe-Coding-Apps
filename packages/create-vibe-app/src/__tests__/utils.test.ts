import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import {
  validateProjectName,
  generatePackageJsonDependencies,
  templates,
  features,
  type ProjectConfig,
} from '../utils';

describe('validateProjectName', () => {
  it('should accept valid npm package names', () => {
    expect(validateProjectName('my-app')).toBe(true);
    expect(validateProjectName('my-vibe-app')).toBe(true);
    expect(validateProjectName('app123')).toBe(true);
    expect(validateProjectName('@scope/package')).toBe(true);
  });

  it('should reject invalid npm package names', () => {
    const result = validateProjectName('My App');
    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  it('should reject names with capital letters', () => {
    const result = validateProjectName('MyApp');
    expect(result).not.toBe(true);
  });

  it('should reject names starting with dot', () => {
    const result = validateProjectName('.myapp');
    expect(result).not.toBe(true);
  });

  it('should reject empty names', () => {
    const result = validateProjectName('');
    expect(result).not.toBe(true);
  });
});

describe('templates configuration', () => {
  it('should have all template types defined', () => {
    expect(templates).toHaveProperty('web-app');
    expect(templates).toHaveProperty('api');
    expect(templates).toHaveProperty('mobile');
    expect(templates).toHaveProperty('desktop');
    expect(templates).toHaveProperty('fullstack');
  });

  it('should have frameworks for each template', () => {
    Object.values(templates).forEach((template) => {
      expect(template.frameworks).toBeDefined();
      expect(Array.isArray(template.frameworks)).toBe(true);
      expect(template.frameworks.length).toBeGreaterThan(0);
    });
  });

  it('should have correct web-app frameworks', () => {
    expect(templates['web-app'].frameworks).toContain('react');
    expect(templates['web-app'].frameworks).toContain('vue');
    expect(templates['web-app'].frameworks).toContain('next');
  });

  it('should have correct api frameworks', () => {
    expect(templates['api'].frameworks).toContain('express');
    expect(templates['api'].frameworks).toContain('nestjs');
    expect(templates['api'].frameworks).toContain('fastify');
  });
});

describe('features configuration', () => {
  it('should have required features', () => {
    const featureValues = features.map((f) => f.value);
    expect(featureValues).toContain('typescript');
    expect(featureValues).toContain('eslint');
    expect(featureValues).toContain('prettier');
    expect(featureValues).toContain('testing');
  });

  it('should have name and value for each feature', () => {
    features.forEach((feature) => {
      expect(feature.name).toBeDefined();
      expect(feature.value).toBeDefined();
      expect(typeof feature.name).toBe('string');
      expect(typeof feature.value).toBe('string');
    });
  });
});

describe('generatePackageJsonDependencies', () => {
  it('should generate empty dependencies when no features selected', () => {
    const result = generatePackageJsonDependencies([]);
    expect(result.dependencies).toEqual({});
    expect(result.devDependencies).toEqual({});
  });

  it('should include typescript dependencies when typescript feature selected', () => {
    const result = generatePackageJsonDependencies(['typescript']);
    expect(result.devDependencies.typescript).toBe('^5.3.3');
    expect(result.devDependencies['@types/node']).toBe('^20.10.0');
  });

  it('should include eslint when eslint feature selected', () => {
    const result = generatePackageJsonDependencies(['eslint']);
    expect(result.devDependencies.eslint).toBe('^8.55.0');
  });

  it('should include prettier when prettier feature selected', () => {
    const result = generatePackageJsonDependencies(['prettier']);
    expect(result.devDependencies.prettier).toBe('^3.1.1');
  });

  it('should include vitest when testing feature selected', () => {
    const result = generatePackageJsonDependencies(['testing']);
    expect(result.devDependencies.vitest).toBe('^1.0.4');
  });

  it('should handle multiple features', () => {
    const result = generatePackageJsonDependencies([
      'typescript',
      'eslint',
      'prettier',
      'testing',
    ]);
    expect(result.devDependencies.typescript).toBeDefined();
    expect(result.devDependencies.eslint).toBeDefined();
    expect(result.devDependencies.prettier).toBeDefined();
    expect(result.devDependencies.vitest).toBeDefined();
  });

  it('should not include dependencies for unselected features', () => {
    const result = generatePackageJsonDependencies(['typescript']);
    expect(result.devDependencies.eslint).toBeUndefined();
    expect(result.devDependencies.prettier).toBeUndefined();
    expect(result.devDependencies.vitest).toBeUndefined();
  });
});
