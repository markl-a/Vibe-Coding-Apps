import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generatePackageJsonDependencies,
  templates,
  features,
  validateProjectName,
} from '../utils';

describe('generatePackageJsonDependencies - Comprehensive Tests', () => {
  describe('Single Feature Dependencies', () => {
    it('should generate typescript dependencies only', () => {
      const result = generatePackageJsonDependencies(['typescript']);

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({
        typescript: '^5.3.3',
        '@types/node': '^20.10.0',
      });
    });

    it('should generate eslint dependencies only', () => {
      const result = generatePackageJsonDependencies(['eslint']);

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({
        eslint: '^8.55.0',
      });
    });

    it('should generate prettier dependencies only', () => {
      const result = generatePackageJsonDependencies(['prettier']);

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({
        prettier: '^3.1.1',
      });
    });

    it('should generate testing dependencies only', () => {
      const result = generatePackageJsonDependencies(['testing']);

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({
        vitest: '^1.0.4',
      });
    });
  });

  describe('Multiple Feature Combinations', () => {
    it('should generate dependencies for typescript and eslint', () => {
      const result = generatePackageJsonDependencies(['typescript', 'eslint']);

      expect(result.devDependencies).toEqual({
        typescript: '^5.3.3',
        '@types/node': '^20.10.0',
        eslint: '^8.55.0',
      });
    });

    it('should generate dependencies for all features', () => {
      const result = generatePackageJsonDependencies([
        'typescript',
        'eslint',
        'prettier',
        'testing',
      ]);

      expect(result.devDependencies).toEqual({
        typescript: '^5.3.3',
        '@types/node': '^20.10.0',
        eslint: '^8.55.0',
        prettier: '^3.1.1',
        vitest: '^1.0.4',
      });
    });

    it('should generate dependencies for linting tools', () => {
      const result = generatePackageJsonDependencies(['eslint', 'prettier']);

      expect(result.devDependencies).toEqual({
        eslint: '^8.55.0',
        prettier: '^3.1.1',
      });
    });

    it('should generate dependencies for typescript and testing', () => {
      const result = generatePackageJsonDependencies(['typescript', 'testing']);

      expect(result.devDependencies).toEqual({
        typescript: '^5.3.3',
        '@types/node': '^20.10.0',
        vitest: '^1.0.4',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should return empty objects for empty features array', () => {
      const result = generatePackageJsonDependencies([]);

      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({});
    });

    it('should ignore unknown features', () => {
      const result = generatePackageJsonDependencies([
        'typescript',
        'unknown-feature' as any,
        'eslint',
      ]);

      expect(result.devDependencies).toEqual({
        typescript: '^5.3.3',
        '@types/node': '^20.10.0',
        eslint: '^8.55.0',
      });
    });

    it('should handle duplicate features', () => {
      const result = generatePackageJsonDependencies([
        'typescript',
        'typescript',
        'eslint',
        'eslint',
      ]);

      // Should still only add each dependency once
      expect(result.devDependencies).toEqual({
        typescript: '^5.3.3',
        '@types/node': '^20.10.0',
        eslint: '^8.55.0',
      });
    });

    it('should handle features in any order', () => {
      const result1 = generatePackageJsonDependencies([
        'typescript',
        'eslint',
        'prettier',
      ]);
      const result2 = generatePackageJsonDependencies([
        'prettier',
        'typescript',
        'eslint',
      ]);

      expect(result1.devDependencies).toEqual(result2.devDependencies);
    });

    it('should always return dependencies object even if empty', () => {
      const result = generatePackageJsonDependencies(['testing']);

      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('devDependencies');
      expect(result.dependencies).toEqual({});
    });

    it('should handle non-tracked features gracefully', () => {
      const result = generatePackageJsonDependencies([
        'husky',
        'docker',
        'cicd',
        'tailwind',
      ] as any);

      // These features exist but don't have dependencies mapped
      expect(result.dependencies).toEqual({});
      expect(result.devDependencies).toEqual({});
    });
  });

  describe('Version Consistency', () => {
    it('should use consistent TypeScript version', () => {
      const result = generatePackageJsonDependencies(['typescript']);

      expect(result.devDependencies.typescript).toBe('^5.3.3');
    });

    it('should use consistent ESLint version', () => {
      const result = generatePackageJsonDependencies(['eslint']);

      expect(result.devDependencies.eslint).toBe('^8.55.0');
    });

    it('should use consistent Prettier version', () => {
      const result = generatePackageJsonDependencies(['prettier']);

      expect(result.devDependencies.prettier).toBe('^3.1.1');
    });

    it('should use consistent Vitest version', () => {
      const result = generatePackageJsonDependencies(['testing']);

      expect(result.devDependencies.vitest).toBe('^1.0.4');
    });

    it('should use caret ranges for all versions', () => {
      const result = generatePackageJsonDependencies([
        'typescript',
        'eslint',
        'prettier',
        'testing',
      ]);

      Object.values(result.devDependencies).forEach(version => {
        expect(version).toMatch(/^\^/);
      });
    });
  });

  describe('Object Structure', () => {
    it('should return object with dependencies and devDependencies keys', () => {
      const result = generatePackageJsonDependencies(['typescript']);

      expect(Object.keys(result)).toEqual(['dependencies', 'devDependencies']);
    });

    it('should have empty dependencies for all cases', () => {
      const testCases = [
        [],
        ['typescript'],
        ['eslint', 'prettier'],
        ['typescript', 'eslint', 'prettier', 'testing'],
      ];

      testCases.forEach(features => {
        const result = generatePackageJsonDependencies(features);
        expect(result.dependencies).toEqual({});
      });
    });

    it('should return new object each time', () => {
      const result1 = generatePackageJsonDependencies(['typescript']);
      const result2 = generatePackageJsonDependencies(['typescript']);

      expect(result1).not.toBe(result2); // Different object references
      expect(result1).toEqual(result2); // Same content
    });
  });
});

describe('Templates Configuration - Advanced Tests', () => {
  describe('Template Structure', () => {
    it('should have consistent structure across all templates', () => {
      Object.entries(templates).forEach(([key, template]) => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('frameworks');
        expect(typeof template.name).toBe('string');
        expect(Array.isArray(template.frameworks)).toBe(true);
      });
    });

    it('should have non-empty names', () => {
      Object.values(templates).forEach(template => {
        expect(template.name.length).toBeGreaterThan(0);
      });
    });

    it('should have at least one framework per template', () => {
      Object.values(templates).forEach(template => {
        expect(template.frameworks.length).toBeGreaterThan(0);
      });
    });

    it('should have unique template keys', () => {
      const keys = Object.keys(templates);
      const uniqueKeys = new Set(keys);

      expect(keys.length).toBe(uniqueKeys.size);
    });
  });

  describe('Framework Validation', () => {
    it('should have lowercase framework names', () => {
      Object.values(templates).forEach(template => {
        template.frameworks.forEach(framework => {
          expect(framework).toBe(framework.toLowerCase());
        });
      });
    });

    it('should have hyphenated framework names', () => {
      Object.values(templates).forEach(template => {
        template.frameworks.forEach(framework => {
          expect(framework).toMatch(/^[a-z0-9-]+$/);
        });
      });
    });

    it('should not have empty framework strings', () => {
      Object.values(templates).forEach(template => {
        template.frameworks.forEach(framework => {
          expect(framework.length).toBeGreaterThan(0);
        });
      });
    });

    it('should not have duplicate frameworks within a template', () => {
      Object.values(templates).forEach(template => {
        const frameworks = template.frameworks;
        const uniqueFrameworks = new Set(frameworks);

        expect(frameworks.length).toBe(uniqueFrameworks.size);
      });
    });
  });

  describe('Specific Template Tests', () => {
    it('should have web-app template with frontend frameworks', () => {
      const webApp = templates['web-app'];

      expect(webApp.name).toBe('Web Application');
      expect(webApp.frameworks).toContain('react');
      expect(webApp.frameworks).toContain('vue');
    });

    it('should have api template with backend frameworks', () => {
      const api = templates['api'];

      expect(api.name).toBe('API / Backend');
      expect(api.frameworks).toContain('express');
      expect(api.frameworks).toContain('fastify');
    });

    it('should have mobile template with mobile frameworks', () => {
      const mobile = templates['mobile'];

      expect(mobile.name).toBe('Mobile App');
      expect(mobile.frameworks).toContain('react-native');
    });

    it('should have desktop template', () => {
      const desktop = templates['desktop'];

      expect(desktop.name).toBe('Desktop App');
      expect(desktop.frameworks).toBeDefined();
    });

    it('should have fullstack template', () => {
      const fullstack = templates['fullstack'];

      expect(fullstack.name).toBe('Full Stack Application');
      expect(fullstack.frameworks).toBeDefined();
    });
  });
});

describe('Features Configuration - Advanced Tests', () => {
  describe('Feature Structure', () => {
    it('should have name and value for each feature', () => {
      features.forEach(feature => {
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('value');
      });
    });

    it('should have non-empty names and values', () => {
      features.forEach(feature => {
        expect(feature.name.length).toBeGreaterThan(0);
        expect(feature.value.length).toBeGreaterThan(0);
      });
    });

    it('should have unique values', () => {
      const values = features.map(f => f.value);
      const uniqueValues = new Set(values);

      expect(values.length).toBe(uniqueValues.size);
    });

    it('should have lowercase values', () => {
      features.forEach(feature => {
        expect(feature.value).toBe(feature.value.toLowerCase());
      });
    });
  });

  describe('Feature Names', () => {
    it('should have readable display names', () => {
      features.forEach(feature => {
        // Name should be capitalized and readable
        expect(feature.name.charAt(0)).toBe(feature.name.charAt(0).toUpperCase());
      });
    });

    it('should have different name and value', () => {
      features.forEach(feature => {
        // Display name should be more readable than value
        expect(feature.name).not.toBe(feature.value);
      });
    });
  });

  describe('Specific Features', () => {
    it('should have typescript feature', () => {
      const typescript = features.find(f => f.value === 'typescript');

      expect(typescript).toBeDefined();
      expect(typescript?.name).toBe('TypeScript');
    });

    it('should have eslint feature', () => {
      const eslint = features.find(f => f.value === 'eslint');

      expect(eslint).toBeDefined();
      expect(eslint?.name).toBe('ESLint');
    });

    it('should have prettier feature', () => {
      const prettier = features.find(f => f.value === 'prettier');

      expect(prettier).toBeDefined();
      expect(prettier?.name).toBe('Prettier');
    });

    it('should have testing feature', () => {
      const testing = features.find(f => f.value === 'testing');

      expect(testing).toBeDefined();
      expect(testing?.name).toContain('Test');
    });

    it('should have at least 5 features', () => {
      expect(features.length).toBeGreaterThanOrEqual(5);
    });
  });
});

describe('validateProjectName - Comprehensive Tests', () => {
  describe('Valid Names', () => {
    it('should accept simple lowercase names', () => {
      expect(validateProjectName('app')).toBe(true);
      expect(validateProjectName('myapp')).toBe(true);
    });

    it('should accept names with hyphens', () => {
      expect(validateProjectName('my-app')).toBe(true);
      expect(validateProjectName('my-awesome-app')).toBe(true);
    });

    it('should accept names with underscores', () => {
      expect(validateProjectName('my_app')).toBe(true);
    });

    it('should accept scoped packages', () => {
      expect(validateProjectName('@scope/package')).toBe(true);
      expect(validateProjectName('@org/my-app')).toBe(true);
    });

    it('should accept names with numbers', () => {
      expect(validateProjectName('app2')).toBe(true);
      expect(validateProjectName('my-app-v2')).toBe(true);
    });

    it('should accept very short names', () => {
      expect(validateProjectName('a')).toBe(true);
      expect(validateProjectName('ab')).toBe(true);
    });
  });

  describe('Invalid Names', () => {
    it('should reject empty strings', () => {
      expect(validateProjectName('')).not.toBe(true);
    });

    it('should reject names with spaces', () => {
      expect(validateProjectName('my app')).not.toBe(true);
      expect(validateProjectName('my  app')).not.toBe(true);
    });

    it('should reject names with uppercase', () => {
      expect(validateProjectName('MyApp')).not.toBe(true);
      expect(validateProjectName('MYAPP')).not.toBe(true);
    });

    it('should reject names starting with dot', () => {
      expect(validateProjectName('.myapp')).not.toBe(true);
    });

    it('should reject names starting with underscore', () => {
      expect(validateProjectName('_myapp')).not.toBe(true);
    });

    it('should reject names with special characters', () => {
      expect(validateProjectName('my!app')).not.toBe(true);
      expect(validateProjectName('my#app')).not.toBe(true);
      expect(validateProjectName('my$app')).not.toBe(true);
    });

    it('should reject reserved names', () => {
      expect(validateProjectName('node_modules')).not.toBe(true);
    });
  });

  describe('Error Messages', () => {
    it('should return string error message for invalid names', () => {
      const result = validateProjectName('My App');

      expect(typeof result).toBe('string');
      expect(result).not.toBe(true);
    });

    it('should return true for valid names', () => {
      const result = validateProjectName('my-app');

      expect(result).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long names', () => {
      const longName = 'a'.repeat(300);
      const result = validateProjectName(longName);

      expect(result).not.toBe(true);
    });

    it('should handle names at npm limit (214 chars)', () => {
      const maxLengthName = 'a'.repeat(214);
      const result = validateProjectName(maxLengthName);

      // This should be valid according to npm rules
      expect(typeof result).toBe('boolean');
    });

    it('should handle unicode characters', () => {
      const result = validateProjectName('my-app-测试');

      // npm doesn't allow unicode in new packages
      expect(result).not.toBe(true);
    });

    it('should handle scoped packages with invalid scope', () => {
      const result = validateProjectName('@/package');

      expect(result).not.toBe(true);
    });

    it('should handle multiple consecutive hyphens', () => {
      const result = validateProjectName('my---app');

      // This should be valid
      expect(result).toBe(true);
    });
  });
});
