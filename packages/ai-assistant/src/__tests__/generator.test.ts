import { describe, it, expect, beforeEach } from 'vitest';
import { CodeGenerator } from '../generator';

describe('CodeGenerator', () => {
  let generator: CodeGenerator;

  beforeEach(() => {
    generator = new CodeGenerator();
  });

  describe('generateComponent', () => {
    it('should return generated code object', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'typescript',
        framework: 'react',
      });
      expect(result).toHaveProperty('code');
    });

    it('should generate React component code', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'typescript',
        framework: 'react',
      });
      expect(result.code).toContain('import React');
      expect(result.code).toContain('MyButton');
      expect(result.code).toContain('MyButtonProps');
    });

    it('should include interface with component name', async () => {
      const result = await generator.generateComponent('TestComponent', 'component', {
        language: 'typescript',
        framework: 'react',
      });
      expect(result.code).toContain('interface TestComponentProps');
    });

    it('should generate tests when includeTests is true', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'typescript',
        framework: 'react',
        includeTests: true,
      });
      expect(result.tests).toBeDefined();
      expect(result.tests).toContain('describe');
      expect(result.tests).toContain('MyButton');
    });

    it('should not include tests when includeTests is false', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'typescript',
        framework: 'react',
        includeTests: false,
      });
      expect(result.tests).toBeUndefined();
    });

    it('should generate docs when includeDocs is true', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'typescript',
        framework: 'react',
        includeDocs: true,
      });
      expect(result.docs).toBeDefined();
      expect(result.docs).toContain('# MyButton');
      expect(result.docs).toContain('## Usage');
    });

    it('should not include docs when includeDocs is false', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'typescript',
        framework: 'react',
        includeDocs: false,
      });
      expect(result.docs).toBeUndefined();
    });

    it('should return empty code for unsupported language', async () => {
      const result = await generator.generateComponent('MyButton', 'component', {
        language: 'rust',
      });
      expect(result.code).toBe('');
    });
  });

  describe('generateFromSpec', () => {
    it('should return generated code object', async () => {
      const result = await generator.generateFromSpec('A button component', {
        language: 'typescript',
      });
      expect(result).toHaveProperty('code');
    });
  });

  // Note: generateTests public method has naming conflict with private method
  // This would need to be fixed in source code

  describe('generateDocumentation', () => {
    it('should return string for documentation', async () => {
      const result = await generator.generateDocumentation('component.tsx');
      expect(typeof result).toBe('string');
    });
  });
});
