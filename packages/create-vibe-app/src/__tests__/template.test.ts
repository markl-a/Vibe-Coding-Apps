import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { copyTemplate, createBasicFiles, type ProjectConfig } from '../utils';

vi.mock('fs-extra');

describe('copyTemplate', () => {
  const mockConfig: ProjectConfig = {
    name: 'test-app',
    template: 'web-app',
    framework: 'react',
    features: ['typescript', 'eslint'],
    packageManager: 'pnpm',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create all required directories', async () => {
    const projectPath = '/test/path/test-app';
    await copyTemplate(mockConfig, projectPath);

    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'src'));
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'public'));
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'tests'));
    expect(fs.ensureDir).toHaveBeenCalledWith(
      path.join(projectPath, '.github/workflows')
    );
    expect(fs.ensureDir).toHaveBeenCalledWith(path.join(projectPath, 'docs'));
  });

  it('should call createBasicFiles', async () => {
    const projectPath = '/test/path/test-app';
    await copyTemplate(mockConfig, projectPath);

    // Verify that writeFile was called (from createBasicFiles)
    expect(fs.writeFile).toHaveBeenCalled();
  });
});

describe('createBasicFiles', () => {
  const projectPath = '/test/path/test-app';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create README.md with correct content', async () => {
    const config: ProjectConfig = {
      name: 'my-test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, projectPath);

    const readmeCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('README.md')
    );
    expect(readmeCall).toBeDefined();
    expect(readmeCall[1]).toContain('# my-test-app');
    expect(readmeCall[1]).toContain('Generated with create-vibe-app');
    expect(readmeCall[1]).toContain('npm install');
  });

  it('should include correct package manager in README', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'pnpm',
    };

    await createBasicFiles(config, projectPath);

    const readmeCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('README.md')
    );
    expect(readmeCall[1]).toContain('pnpm install');
    expect(readmeCall[1]).toContain('pnpm dev');
  });

  it('should create .gitignore with standard entries', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, projectPath);

    const gitignoreCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('.gitignore')
    );
    expect(gitignoreCall).toBeDefined();
    expect(gitignoreCall[1]).toContain('node_modules');
    expect(gitignoreCall[1]).toContain('dist');
    expect(gitignoreCall[1]).toContain('.env*.local');
    expect(gitignoreCall[1]).toContain('coverage');
  });

  it('should create index.ts when typescript feature is included', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['typescript'],
      packageManager: 'npm',
    };

    await createBasicFiles(config, projectPath);

    const indexCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('index.ts')
    );
    expect(indexCall).toBeDefined();
    expect(indexCall[1]).toContain("console.log('Hello from test-app!');");
  });

  it('should create index.js when typescript feature is not included', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, projectPath);

    const indexCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('index.js')
    );
    expect(indexCall).toBeDefined();
  });

  it('should create exactly 3 files (README, gitignore, index)', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, projectPath);

    expect(fs.writeFile).toHaveBeenCalledTimes(3);
  });

  it('should handle special characters in project name', async () => {
    const config: ProjectConfig = {
      name: '@scope/my-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, projectPath);

    const readmeCall = (fs.writeFile as any).mock.calls.find((call: any) =>
      call[0].endsWith('README.md')
    );
    expect(readmeCall[1]).toContain('# @scope/my-app');
  });
});
