import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import {
  copyTemplate,
  createBasicFiles,
  createPackageJson,
  type ProjectConfig,
} from '../utils';

vi.mock('fs-extra');

type WriteFileCall = [path: string, content: string];

describe('Integration: Full project creation flow', () => {
  const projectPath = '/test/path/test-app';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a complete web app project with all features', async () => {
    const config: ProjectConfig = {
      name: 'my-web-app',
      template: 'web-app',
      framework: 'react',
      features: ['typescript', 'eslint', 'prettier', 'testing'],
      packageManager: 'pnpm',
    };

    // Create the full project
    await copyTemplate(config, projectPath);
    await createPackageJson(config, projectPath);

    // Verify directories were created
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'src'));
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'public'));
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'tests'));

    // Verify files were created
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.writeJSON).toHaveBeenCalled();

    // Verify package.json has all features
    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.eslint).toBeDefined();
    expect(packageJson.devDependencies.prettier).toBeDefined();
    expect(packageJson.devDependencies.vitest).toBeDefined();
  });

  it('should create a minimal API project', async () => {
    const config: ProjectConfig = {
      name: 'my-api',
      template: 'api',
      framework: 'express',
      features: [],
      packageManager: 'npm',
    };

    await copyTemplate(config, projectPath);
    await createPackageJson(config, projectPath);

    // Verify package.json is minimal
    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.name).toBe('my-api');
    expect(packageJson.devDependencies).toEqual({});
  });

  it('should create TypeScript-only project', async () => {
    const config: ProjectConfig = {
      name: 'ts-app',
      template: 'web-app',
      features: ['typescript'],
      packageManager: 'pnpm',
    };

    await copyTemplate(config, projectPath);
    await createPackageJson(config, projectPath);

    // Verify index.ts was created
    const indexCall = (fs.writeFile as any).mock.calls.find((call: WriteFileCall) =>
      call[0].endsWith('index.ts')
    ) as WriteFileCall | undefined;
    expect(indexCall).toBeDefined();

    // Verify only TypeScript dependencies
    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.eslint).toBeUndefined();
    expect(packageJson.devDependencies.prettier).toBeUndefined();
  });

  it('should handle different package managers correctly', async () => {
    const managers: Array<'npm' | 'pnpm' | 'yarn'> = ['npm', 'pnpm', 'yarn'];

    for (const packageManager of managers) {
      vi.clearAllMocks();

      const config: ProjectConfig = {
        name: 'test-app',
        template: 'web-app',
        features: [],
        packageManager,
      };

      await createBasicFiles(config, projectPath);

      const readmeCall = (fs.writeFile as any).mock.calls.find((call: WriteFileCall) =>
        call[0].endsWith('README.md')
      ) as WriteFileCall | undefined;

      expect(readmeCall[1]).toContain(`${packageManager} install`);
      expect(readmeCall[1]).toContain(`${packageManager} dev`);
    }
  });

  it('should create consistent file structure across templates', async () => {
    const templates: Array<ProjectConfig['template']> = [
      'web-app',
      'api',
      'mobile',
      'desktop',
      'fullstack',
    ];

    for (const template of templates) {
      vi.clearAllMocks();

      const config: ProjectConfig = {
        name: 'test-app',
        template,
        features: [],
        packageManager: 'npm',
      };

      await copyTemplate(config, projectPath);

      // All templates should create these directories
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'src'));
      expect(fs.ensureDir).toHaveBeenCalledWith(
        path.join(projectPath, 'public')
      );
      expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'tests'));
    }
  });
});

describe('Integration: Edge cases and error scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle projects with special characters in name', async () => {
    const config: ProjectConfig = {
      name: '@myorg/my-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    const projectPath = '/test/path/@myorg/my-app';
    await createBasicFiles(config, projectPath);

    const readmeCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('README.md')
    );
    expect(readmeCall[1]).toContain('# @myorg/my-app');
  });

  it('should handle empty features array', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    const projectPath = '/test/path/test-app';
    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies).toEqual({});
    expect(packageJson.scripts.test).toBe('echo "No tests"');
    expect(packageJson.scripts.lint).toBe('echo "No linter"');
    expect(packageJson.scripts.format).toBe('echo "No formatter"');
  });

  it('should handle all features enabled', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [
        'typescript',
        'eslint',
        'prettier',
        'testing',
        'husky',
        'docker',
        'cicd',
        'tailwind',
      ],
      packageManager: 'npm',
    };

    const projectPath = '/test/path/test-app';
    await createPackageJson(config, projectPath);

    const packageJson = (fs.writeJSON as any).mock.calls[0][1];
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.eslint).toBeDefined();
    expect(packageJson.devDependencies.prettier).toBeDefined();
    expect(packageJson.devDependencies.vitest).toBeDefined();
  });

  it('should create different index files based on typescript feature', async () => {
    const configs = [
      {
        config: {
          name: 'ts-app',
          template: 'web-app' as const,
          features: ['typescript'],
          packageManager: 'npm' as const,
        },
        expectedExt: '.ts',
      },
      {
        config: {
          name: 'js-app',
          template: 'web-app' as const,
          features: [],
          packageManager: 'npm' as const,
        },
        expectedExt: '.js',
      },
    ];

    for (const { config, expectedExt } of configs) {
      vi.clearAllMocks();
      const projectPath = '/test/path/test-app';
      await createBasicFiles(config, projectPath);

      const indexCall = (fs.writeFile as any).mock.calls.find((call: WriteFileCall) =>
        call[0].endsWith(`index${expectedExt}`)
      ) as WriteFileCall | undefined;
      expect(indexCall).toBeDefined();
    }
  });
});
