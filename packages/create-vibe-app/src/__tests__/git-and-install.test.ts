import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initGit, installDependencies, type ProjectConfig } from '../utils';

// Mock child_process
const mockExecSync = vi.fn();
vi.mock('child_process', () => ({
  execSync: mockExecSync,
}));

describe('initGit', () => {
  const projectPath = '/test/path/test-app';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize git repository', async () => {
    await initGit(projectPath);

    expect(mockExecSync).toHaveBeenCalledWith('git init', {
      cwd: projectPath,
      stdio: 'ignore',
    });
  });

  it('should add all files to git', async () => {
    await initGit(projectPath);

    expect(mockExecSync).toHaveBeenCalledWith('git add .', {
      cwd: projectPath,
      stdio: 'ignore',
    });
  });

  it('should create initial commit', async () => {
    await initGit(projectPath);

    expect(mockExecSync).toHaveBeenCalledWith(
      'git commit -m "Initial commit from create-vibe-app"',
      {
        cwd: projectPath,
        stdio: 'ignore',
      }
    );
  });

  it('should execute git commands in correct order', async () => {
    await initGit(projectPath);

    const calls = mockExecSync.mock.calls;
    expect(calls[0][0]).toBe('git init');
    expect(calls[1][0]).toBe('git add .');
    expect(calls[2][0]).toContain('git commit');
  });

  it('should execute exactly 3 git commands', async () => {
    await initGit(projectPath);

    expect(mockExecSync).toHaveBeenCalledTimes(3);
  });
});

describe('installDependencies', () => {
  const projectPath = '/test/path/test-app';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use npm install for npm package manager', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await installDependencies(config, projectPath);

    expect(mockExecSync).toHaveBeenCalledWith('npm install', {
      cwd: projectPath,
      stdio: 'inherit',
    });
  });

  it('should use yarn for yarn package manager', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'yarn',
    };

    await installDependencies(config, projectPath);

    expect(mockExecSync).toHaveBeenCalledWith('yarn', {
      cwd: projectPath,
      stdio: 'inherit',
    });
  });

  it('should use pnpm install for pnpm package manager', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'pnpm',
    };

    await installDependencies(config, projectPath);

    expect(mockExecSync).toHaveBeenCalledWith('pnpm install', {
      cwd: projectPath,
      stdio: 'inherit',
    });
  });

  it('should use stdio inherit for install commands', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await installDependencies(config, projectPath);

    expect(mockExecSync).toHaveBeenCalledWith(expect.any(String), {
      cwd: projectPath,
      stdio: 'inherit',
    });
  });

  it('should execute install command in project directory', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await installDependencies(config, projectPath);

    expect(mockExecSync).toHaveBeenCalledWith(expect.any(String), {
      cwd: projectPath,
      stdio: 'inherit',
    });
  });
});
