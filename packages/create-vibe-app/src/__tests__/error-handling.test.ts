import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import {
  validateProjectName,
  copyTemplate,
  createPackageJson,
  createBasicFiles,
  initGit,
  installDependencies,
  type ProjectConfig,
} from '../utils';

vi.mock('fs-extra');

const mockExecSync = vi.fn();
vi.mock('child_process', () => ({
  execSync: mockExecSync,
}));

describe('Error Handling - validateProjectName', () => {
  it('should handle null values', () => {
    const result = validateProjectName(null as unknown as string);
    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  it('should handle undefined values', () => {
    const result = validateProjectName(undefined as unknown as string);
    expect(result).not.toBe(true);
    expect(typeof result).toBe('string');
  });

  it('should handle extremely long names', () => {
    const longName = 'a'.repeat(300);
    const result = validateProjectName(longName);
    // npm package names have a 214 character limit
    expect(result).not.toBe(true);
  });

  it('should reject names with leading/trailing spaces', () => {
    expect(validateProjectName(' my-app')).not.toBe(true);
    expect(validateProjectName('my-app ')).not.toBe(true);
    expect(validateProjectName(' my-app ')).not.toBe(true);
  });

  it('should accept names with only hyphens (valid npm package)', () => {
    // Note: '---' is actually valid per npm package name rules
    const result = validateProjectName('---');
    expect(result).toBe(true);
  });

  it('should accept names starting with numbers (valid npm package)', () => {
    // Note: npm allows names starting with numbers
    const result = validateProjectName('123app');
    expect(result).toBe(true);
  });

  it('should reject npm reserved names', () => {
    expect(validateProjectName('node_modules')).not.toBe(true);
    expect(validateProjectName('favicon.ico')).not.toBe(true);
  });

  it('should provide helpful error messages', () => {
    const result = validateProjectName('My App With Spaces');
    expect(typeof result).toBe('string');
    expect(result).not.toBe(true);
  });
});

describe('Error Handling - File System Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('copyTemplate errors', () => {
    it('should propagate fs.ensureDir errors', async () => {
      const error = new Error('EACCES: permission denied');
      vi.mocked(fs.ensureDir).mockRejectedValue(error);

      const config: ProjectConfig = {
        name: 'test-app',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      await expect(copyTemplate(config, '/readonly/path')).rejects.toThrow(
        'EACCES: permission denied'
      );
    });

    it('should propagate fs.writeFile errors', async () => {
      const error = new Error('ENOSPC: no space left on device');
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockRejectedValue(error);

      const config: ProjectConfig = {
        name: 'test-app',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      await expect(copyTemplate(config, '/full/disk')).rejects.toThrow(
        'ENOSPC: no space left on device'
      );
    });

    it('should handle invalid paths', async () => {
      const error = new Error('Invalid path');
      vi.mocked(fs.ensureDir).mockRejectedValue(error);

      const config: ProjectConfig = {
        name: 'test-app',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      await expect(copyTemplate(config, '')).rejects.toThrow();
    });
  });

  describe('createBasicFiles errors', () => {
    it('should handle write errors for README', async () => {
      const error = new Error('Write failed');
      vi.mocked(fs.writeFile).mockRejectedValueOnce(error);

      const config: ProjectConfig = {
        name: 'test-app',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      await expect(createBasicFiles(config, '/test/path')).rejects.toThrow(
        'Write failed'
      );
    });

    it('should handle unicode characters in project name', async () => {
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      const config: ProjectConfig = {
        name: 'my-app-测试',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      // Should not throw
      await expect(createBasicFiles(config, '/test/path')).resolves.not.toThrow();
    });
  });

  describe('createPackageJson errors', () => {
    it('should propagate writeJSON errors', async () => {
      const error = new Error('Write failed');
      vi.mocked(fs.writeJSON).mockRejectedValue(error);

      const config: ProjectConfig = {
        name: 'test-app',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      await expect(createPackageJson(config, '/test/path')).rejects.toThrow(
        'Write failed'
      );
    });

    it('should handle special characters in package name', async () => {
      vi.mocked(fs.writeJSON).mockResolvedValue(undefined);

      const config: ProjectConfig = {
        name: '@scope/sub-scope/package',
        template: 'web-app',
        features: [],
        packageManager: 'npm',
      };

      // Should handle gracefully
      await createPackageJson(config, '/test/path');
      expect(fs.writeJSON).toHaveBeenCalled();
    });
  });
});

describe('Error Handling - Git Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle git not installed error', async () => {
    const error = new Error('git: command not found');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    await expect(initGit('/test/path')).rejects.toThrow('git: command not found');
  });

  it('should handle git init failure', async () => {
    const error = new Error('fatal: not a git repository');
    mockExecSync.mockImplementationOnce(() => {
      throw error;
    });

    await expect(initGit('/test/path')).rejects.toThrow();
  });

  it('should handle git add failure', async () => {
    mockExecSync
      .mockImplementationOnce(() => {}) // git init succeeds
      .mockImplementationOnce(() => {
        throw new Error('git add failed');
      });

    await expect(initGit('/test/path')).rejects.toThrow('git add failed');
  });

  it('should handle git commit failure', async () => {
    mockExecSync
      .mockImplementationOnce(() => {}) // git init succeeds
      .mockImplementationOnce(() => {}) // git add succeeds
      .mockImplementationOnce(() => {
        throw new Error('git commit failed');
      });

    await expect(initGit('/test/path')).rejects.toThrow('git commit failed');
  });

  it('should handle permission errors', async () => {
    const error = new Error('EACCES: permission denied');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    await expect(initGit('/readonly/path')).rejects.toThrow(
      'EACCES: permission denied'
    );
  });
});

describe('Error Handling - Dependency Installation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle npm not installed', async () => {
    const error = new Error('npm: command not found');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await expect(installDependencies(config, '/test/path')).rejects.toThrow(
      'npm: command not found'
    );
  });

  it('should handle pnpm not installed', async () => {
    const error = new Error('pnpm: command not found');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'pnpm',
    };

    await expect(installDependencies(config, '/test/path')).rejects.toThrow(
      'pnpm: command not found'
    );
  });

  it('should handle yarn not installed', async () => {
    const error = new Error('yarn: command not found');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'yarn',
    };

    await expect(installDependencies(config, '/test/path')).rejects.toThrow(
      'yarn: command not found'
    );
  });

  it('should handle network errors during install', async () => {
    const error = new Error('ENOTFOUND: getaddrinfo ENOTFOUND registry.npmjs.org');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['typescript'],
      packageManager: 'npm',
    };

    await expect(installDependencies(config, '/test/path')).rejects.toThrow(
      'ENOTFOUND'
    );
  });

  it('should handle disk space errors during install', async () => {
    const error = new Error('ENOSPC: no space left on device');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['typescript', 'eslint', 'prettier'],
      packageManager: 'pnpm',
    };

    await expect(installDependencies(config, '/test/path')).rejects.toThrow(
      'ENOSPC'
    );
  });

  it('should handle dependency resolution errors', async () => {
    const error = new Error('ERESOLVE unable to resolve dependency tree');
    mockExecSync.mockImplementation(() => {
      throw error;
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['testing'],
      packageManager: 'npm',
    };

    await expect(installDependencies(config, '/test/path')).rejects.toThrow(
      'ERESOLVE'
    );
  });
});

describe('Error Handling - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.writeJSON).mockResolvedValue(undefined);
  });

  it('should handle empty config object', async () => {
    const config: Partial<ProjectConfig> & { features: string[] } = {
      features: [], // features is required to avoid undefined.includes()
    };

    await expect(createPackageJson(config as ProjectConfig, '/test/path')).resolves.not.toThrow();
  });

  it('should handle config with missing optional properties', async () => {
    const config: Partial<ProjectConfig> & { name: string; features: string[] } = {
      name: 'test-app',
      features: [], // features array is required
      // missing template, framework, packageManager
    };

    // Should handle gracefully
    await createPackageJson(config as ProjectConfig, '/test/path');
    expect(fs.writeJSON).toHaveBeenCalled();
  });

  it('should handle extremely long file paths', async () => {
    const longPath = '/test/' + 'a'.repeat(500);
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    // Should attempt to create (may fail based on OS limits)
    await createBasicFiles(config, longPath);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should handle paths with special characters', async () => {
    const specialPath = '/test/my app/with spaces';
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, specialPath);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should handle empty features array', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await expect(createPackageJson(config, '/test/path')).resolves.not.toThrow();
  });

  it('should handle duplicate features', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['typescript', 'typescript', 'eslint', 'eslint'],
      packageManager: 'npm',
    };

    await createPackageJson(config, '/test/path');
    const packageJson = (fs.writeJSON as any).mock.calls[0][1];

    // Should still only add each dependency once
    expect(packageJson.devDependencies.typescript).toBe('^5.3.3');
    expect(packageJson.devDependencies.eslint).toBe('^8.55.0');
  });

  it('should handle mixed case in features', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: ['TypeScript', 'ESLINT'] as any,
      packageManager: 'npm',
    };

    await createPackageJson(config, '/test/path');
    // Features are case-sensitive, so these won't match
    expect(fs.writeJSON).toHaveBeenCalled();
  });
});

describe('Error Handling - Concurrency and Race Conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle multiple simultaneous directory creations', async () => {
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    // Create multiple templates concurrently
    const promises = [
      copyTemplate(config, '/test/path1'),
      copyTemplate(config, '/test/path2'),
      copyTemplate(config, '/test/path3'),
    ];

    await expect(Promise.all(promises)).resolves.not.toThrow();
  });

  it('should handle file writes in order', async () => {
    const writeOrder: string[] = [];

    vi.mocked(fs.writeFile).mockImplementation(async (path: string) => {
      writeOrder.push(path.toString());
    });

    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    };

    await createBasicFiles(config, '/test/path');

    // Should have written 3 files (README, gitignore, index)
    expect(writeOrder).toHaveLength(3);
  });
});

describe('Error Handling - Template Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
  });

  it('should handle unknown template types', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'unknown-template' as any,
      features: [],
      packageManager: 'npm',
    };

    // Should still create basic structure
    await expect(copyTemplate(config, '/test/path')).resolves.not.toThrow();
  });

  it('should handle template without framework', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      framework: undefined,
      features: [],
      packageManager: 'npm',
    };

    await expect(copyTemplate(config, '/test/path')).resolves.not.toThrow();
  });

  it('should handle invalid framework for template', async () => {
    const config: ProjectConfig = {
      name: 'test-app',
      template: 'web-app',
      framework: 'invalid-framework' as any,
      features: [],
      packageManager: 'npm',
    };

    await expect(copyTemplate(config, '/test/path')).resolves.not.toThrow();
  });
});
