import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { createPackageJson, type ProjectConfig } from '../utils';

vi.mock('fs-extra');

describe('createPackageJson', () => {
  const projectPath = '/test/path/test-app';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create package.json with basic structure', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    expect(fs.writeJSON).toHaveBeenCalledWith(
      path.join(projectPath, 'package.json'),
      expect.objectContaining({
        name: 'test-app',
        version: '0.1.0',
        private: true,
      }),
      { spaces: 2 }
    );
  });

  it('should include all required scripts', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.scripts).toHaveProperty('dev');
    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts).toHaveProperty('lint');
    expect(packageJson.scripts).toHaveProperty('format');
  });

  it('should set test script to vitest when testing feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['testing'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.scripts.test).toBe('vitest');
  });

  it('should set test script to echo when testing feature is disabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.scripts.test).toBe('echo "No tests"');
  });

  it('should set lint script to eslint when eslint feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['eslint'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.scripts.lint).toBe('eslint .');
  });

  it('should set format script to prettier when prettier feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['prettier'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.scripts.format).toBe('prettier --write .');
  });

  it('should add typescript dependencies when typescript feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['typescript'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.typescript).toBe('^5.3.3');
    expect(packageJson.devDependencies['@types/node']).toBe('^20.10.0');
  });

  it('should add eslint dependency when eslint feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['eslint'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.eslint).toBe('^8.55.0');
  });

  it('should add prettier dependency when prettier feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['prettier'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.prettier).toBe('^3.1.1');
  });

  it('should add vitest dependency when testing feature is enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['testing'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.vitest).toBe('^1.0.4');
  });

  it('should add all dependencies when all features are enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['typescript', 'eslint', 'prettier', 'testing'],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies['@types/node']).toBeDefined();
    expect(packageJson.devDependencies.eslint).toBeDefined();
    expect(packageJson.devDependencies.prettier).toBeDefined();
    expect(packageJson.devDependencies.vitest).toBeDefined();
  });

  it('should have empty dependencies and devDependencies when no features enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.dependencies).toEqual({});
    expect(packageJson.devDependencies).toEqual({});
  });

  it('should format package.json with 2 spaces', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    expect(fs.writeJSON).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      { spaces: 2 }
    );
  });

  it('should handle scoped package names', async () => {
    const config: ProjectConfig = {
      name: '@myorg/test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.name).toBe('@myorg/test-app');
  });
});
