import { describe, it, expect } from 'vitest';
import { validateProjectName, templates, features } from '../utils';

describe('Project Name Validation', () => {
  describe('valid package names', () => {
    it('should accept lowercase names', () => {
      expect(validateProjectName('myapp')).toBe(true);
    });

    it('should accept names with hyphens', () => {
      expect(validateProjectName('my-app')).toBe(true);
      expect(validateProjectName('my-awesome-app')).toBe(true);
    });

    it('should accept names with numbers', () => {
      expect(validateProjectName('app123')).toBe(true);
      expect(validateProjectName('my-app-v2')).toBe(true);
    });

    it('should accept scoped packages', () => {
      expect(validateProjectName('@scope/package')).toBe(true);
      expect(validateProjectName('@myorg/my-app')).toBe(true);
    });

    it('should accept single character names', () => {
      expect(validateProjectName('a')).toBe(true);
    });

    it('should accept names with underscores', () => {
      expect(validateProjectName('my_app')).toBe(true);
    });
  });

  describe('invalid package names', () => {
    it('should reject names with spaces', () => {
      const result = validateProjectName('my app');
      expect(result).not.toBe(true);
      expect(typeof result).toBe('string');
    });

    it('should reject names with uppercase letters', () => {
      expect(validateProjectName('MyApp')).not.toBe(true);
      expect(validateProjectName('myApp')).not.toBe(true);
      expect(validateProjectName('MYAPP')).not.toBe(true);
    });

    it('should reject names starting with dot', () => {
      expect(validateProjectName('.myapp')).not.toBe(true);
    });

    it('should reject names starting with underscore', () => {
      expect(validateProjectName('_myapp')).not.toBe(true);
    });

    it('should reject empty string', () => {
      expect(validateProjectName('')).not.toBe(true);
    });

    it('should reject names with special characters', () => {
      expect(validateProjectName('my@app')).not.toBe(true);
      expect(validateProjectName('my!app')).not.toBe(true);
      expect(validateProjectName('my#app')).not.toBe(true);
    });

    it('should reject npm reserved names', () => {
      expect(validateProjectName('node_modules')).not.toBe(true);
      expect(validateProjectName('favicon.ico')).not.toBe(true);
    });
  });
});

describe('Templates Configuration Validation', () => {
  it('should have unique template keys', () => {
    const keys = Object.keys(templates);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  it('should have non-empty framework arrays', () => {
    Object.values(templates).forEach((template) => {
      expect(template.frameworks.length).toBeGreaterThan(0);
    });
  });

  it('should have unique frameworks within each template', () => {
    Object.values(templates).forEach((template) => {
      const frameworks = template.frameworks;
      const uniqueFrameworks = new Set(frameworks);
      expect(frameworks.length).toBe(uniqueFrameworks.size);
    });
  });

  it('should have valid framework names (no empty strings)', () => {
    Object.values(templates).forEach((template) => {
      template.frameworks.forEach((framework) => {
        expect(framework).toBeTruthy();
        expect(framework.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have display names for all templates', () => {
    Object.values(templates).forEach((template) => {
      expect(template.name).toBeTruthy();
      expect(template.name.length).toBeGreaterThan(0);
    });
  });

  it('should have at least 5 template types', () => {
    expect(Object.keys(templates).length).toBeGreaterThanOrEqual(5);
  });
});

describe('Features Configuration Validation', () => {
  it('should have unique feature values', () => {
    const values = features.map((f) => f.value);
    const uniqueValues = new Set(values);
    expect(values.length).toBe(uniqueValues.size);
  });

  it('should have non-empty names and values', () => {
    features.forEach((feature) => {
      expect(feature.name.length).toBeGreaterThan(0);
      expect(feature.value.length).toBeGreaterThan(0);
    });
  });

  it('should have lowercase values', () => {
    features.forEach((feature) => {
      expect(feature.value).toBe(feature.value.toLowerCase());
    });
  });

  it('should have at least 5 features', () => {
    expect(features.length).toBeGreaterThanOrEqual(5);
  });

  it('should include essential features', () => {
    const values = features.map((f) => f.value);
    expect(values).toContain('typescript');
    expect(values).toContain('eslint');
    expect(values).toContain('prettier');
  });
});
