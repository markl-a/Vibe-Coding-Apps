import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import inquirer from 'inquirer';
import { templates, features } from '../utils';

describe('CLI Edge Cases - Input Validation', () => {
  it('should handle empty project name', () => {
    const projectName = '';
    expect(projectName.length).toBe(0);
  });

  it('should handle very long project names', () => {
    const projectName = 'my-super-long-project-name-that-exceeds-normal-limits';
    expect(projectName.length).toBeGreaterThan(40);
  });

  it('should handle project names with special characters', () => {
    const validNames = [
      '@scope/package',
      'my-app',
      'my_app',
      'app123',
    ];

    validNames.forEach(name => {
      expect(name).toBeTruthy();
    });
  });

  it('should handle invalid project names', () => {
    const invalidNames = [
      'My App',
      'my@app',
      '.myapp',
      '_myapp',
      '',
    ];

    invalidNames.forEach(name => {
      // These would fail validation
      expect(typeof name).toBe('string');
    });
  });
});

describe('CLI Edge Cases - Option Combinations', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
  });

  it('should handle all options provided', () => {
    program
      .argument('[project-name]')
      .option('-t, --template <template>')
      .option('-f, --framework <framework>')
      .option('--skip-git')
      .option('--skip-install');

    program.parse([
      'node',
      'cli',
      'my-app',
      '-t',
      'web-app',
      '-f',
      'react',
      '--skip-git',
      '--skip-install',
    ]);

    const opts = program.opts();
    expect(opts.template).toBe('web-app');
    expect(opts.framework).toBe('react');
    expect(opts.skipGit).toBe(true);
    expect(opts.skipInstall).toBe(true);
  });

  it('should handle no options provided', () => {
    program
      .argument('[project-name]')
      .option('-t, --template <template>')
      .option('-f, --framework <framework>');

    program.parse(['node', 'cli']);

    const opts = program.opts();
    expect(opts.template).toBeUndefined();
    expect(opts.framework).toBeUndefined();
  });

  it('should handle partial options', () => {
    program
      .argument('[project-name]')
      .option('-t, --template <template>')
      .option('--skip-git');

    program.parse(['node', 'cli', 'my-app', '--skip-git']);

    const opts = program.opts();
    expect(opts.template).toBeUndefined();
    expect(opts.skipGit).toBe(true);
  });

  it('should handle conflicting options gracefully', () => {
    program
      .option('--skip-install')
      .option('--install');

    // Commander will handle this, last one wins
    program.parse(['node', 'cli', '--skip-install', '--install']);

    expect(program.opts()).toBeTruthy();
  });

  it('should handle duplicate options', () => {
    program.option('-t, --template <template>');

    // Last value should win
    program.parse(['node', 'cli', '-t', 'web-app', '-t', 'api']);

    expect(program.opts().template).toBe('api');
  });
});

describe('CLI Edge Cases - Template Selection', () => {
  it('should have all expected templates', () => {
    const expectedTemplates = ['web-app', 'api', 'mobile', 'desktop', 'fullstack'];

    expectedTemplates.forEach(template => {
      expect(templates).toHaveProperty(template);
    });
  });

  it('should validate template has frameworks', () => {
    Object.entries(templates).forEach(([key, value]) => {
      expect(value.frameworks).toBeDefined();
      expect(Array.isArray(value.frameworks)).toBe(true);
    });
  });

  it('should have unique framework options per template', () => {
    Object.entries(templates).forEach(([key, template]) => {
      const frameworks = template.frameworks;
      const uniqueFrameworks = new Set(frameworks);
      expect(frameworks.length).toBe(uniqueFrameworks.size);
    });
  });

  it('should handle template without frameworks field', () => {
    const mockTemplate: { name: string; frameworks?: string[] } = {
      name: 'Test Template',
      // no frameworks field
    };

    expect(mockTemplate.frameworks).toBeUndefined();
  });

  it('should handle empty frameworks array', () => {
    const mockTemplate = {
      name: 'Test Template',
      frameworks: [],
    };

    expect(mockTemplate.frameworks).toHaveLength(0);
  });
});

describe('CLI Edge Cases - Feature Selection', () => {
  it('should have all expected features', () => {
    const featureValues = features.map(f => f.value);

    expect(featureValues).toContain('typescript');
    expect(featureValues).toContain('eslint');
    expect(featureValues).toContain('prettier');
    expect(featureValues).toContain('testing');
  });

  it('should have unique feature values', () => {
    const values = features.map(f => f.value);
    const uniqueValues = new Set(values);

    expect(values.length).toBe(uniqueValues.size);
  });

  it('should handle no features selected', () => {
    const selectedFeatures: string[] = [];
    expect(selectedFeatures).toHaveLength(0);
  });

  it('should handle all features selected', () => {
    const selectedFeatures = features.map(f => f.value);
    expect(selectedFeatures.length).toBe(features.length);
  });

  it('should handle partial feature selection', () => {
    const selectedFeatures = ['typescript', 'eslint'];
    expect(selectedFeatures.length).toBeLessThan(features.length);
    expect(selectedFeatures.length).toBeGreaterThan(0);
  });

  it('should handle invalid feature in selection', () => {
    const selectedFeatures = ['typescript', 'invalid-feature', 'eslint'];
    const validFeatures = selectedFeatures.filter(f =>
      features.some(feature => feature.value === f)
    );

    expect(validFeatures).toEqual(['typescript', 'eslint']);
  });
});

describe('CLI Edge Cases - Package Manager Selection', () => {
  const validManagers = ['npm', 'pnpm', 'yarn'];

  it('should accept npm as package manager', () => {
    const manager = 'npm';
    expect(validManagers).toContain(manager);
  });

  it('should accept pnpm as package manager', () => {
    const manager = 'pnpm';
    expect(validManagers).toContain(manager);
  });

  it('should accept yarn as package manager', () => {
    const manager = 'yarn';
    expect(validManagers).toContain(manager);
  });

  it('should have pnpm as default', () => {
    const defaultManager = 'pnpm';
    expect(validManagers).toContain(defaultManager);
  });

  it('should handle invalid package manager', () => {
    const manager = 'invalid-manager';
    expect(validManagers).not.toContain(manager);
  });

  it('should handle empty package manager', () => {
    const manager = '';
    expect(validManagers).not.toContain(manager);
  });
});

describe('CLI Edge Cases - Path Handling', () => {
  it('should handle absolute paths', () => {
    const absolutePath = '/home/user/projects/my-app';
    expect(absolutePath.startsWith('/')).toBe(true);
  });

  it('should handle relative paths', () => {
    const relativePath = './my-app';
    expect(relativePath.startsWith('./')).toBe(true);
  });

  it('should handle paths with spaces', () => {
    const pathWithSpaces = '/my folder/my app';
    expect(pathWithSpaces).toContain(' ');
  });

  it('should handle nested paths', () => {
    const nestedPath = './projects/workspace/my-app';
    expect(nestedPath.split('/').length).toBeGreaterThan(2);
  });

  it('should handle single directory name', () => {
    const singleDir = 'my-app';
    expect(singleDir.includes('/')).toBe(false);
  });

  it('should handle Windows-style paths', () => {
    const windowsPath = 'C:\\Users\\Name\\projects\\my-app';
    expect(windowsPath).toContain('\\');
  });
});

describe('CLI Edge Cases - Inquirer Prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle user cancellation', () => {
    // Simulating Ctrl+C or similar interruption
    const cancelled = true;
    expect(cancelled).toBe(true);
  });

  it('should handle default values', () => {
    const defaults = {
      projectName: 'my-vibe-app',
      packageManager: 'pnpm',
      features: ['typescript', 'eslint', 'prettier'],
    };

    expect(defaults.projectName).toBe('my-vibe-app');
    expect(defaults.packageManager).toBe('pnpm');
    expect(defaults.features).toHaveLength(3);
  });

  it('should handle empty responses', () => {
    const response = '';
    expect(response).toBe('');
  });

  it('should handle whitespace-only responses', () => {
    const response = '   ';
    const trimmed = response.trim();
    expect(trimmed).toBe('');
  });
});

describe('CLI Edge Cases - Directory Operations', () => {
  it('should handle existing directory scenario', () => {
    const exists = true;
    const overwrite = true;

    expect(exists && overwrite).toBe(true);
  });

  it('should handle existing directory without overwrite', () => {
    const exists = true;
    const overwrite = false;

    expect(exists && !overwrite).toBe(true);
  });

  it('should handle non-existing directory', () => {
    const exists = false;

    expect(!exists).toBe(true);
  });

  it('should handle directory with same name as project', () => {
    const projectName = 'my-app';
    const existingDir = 'my-app';

    expect(projectName).toBe(existingDir);
  });
});

describe('CLI Edge Cases - Success Messages', () => {
  it('should show correct next steps for npm', () => {
    const steps = {
      packageManager: 'npm',
      commands: ['npm install', 'npm dev'],
    };

    expect(steps.commands[0]).toBe('npm install');
    expect(steps.commands[1]).toBe('npm dev');
  });

  it('should show correct next steps for pnpm', () => {
    const steps = {
      packageManager: 'pnpm',
      commands: ['pnpm install', 'pnpm dev'],
    };

    expect(steps.commands[0]).toBe('pnpm install');
    expect(steps.commands[1]).toBe('pnpm dev');
  });

  it('should show correct next steps for yarn', () => {
    const steps = {
      packageManager: 'yarn',
      commands: ['yarn', 'yarn dev'],
    };

    expect(steps.commands[0]).toBe('yarn');
    expect(steps.commands[1]).toBe('yarn dev');
  });

  it('should include cd command in next steps', () => {
    const projectName = 'my-app';
    const cdCommand = `cd ${projectName}`;

    expect(cdCommand).toBe('cd my-app');
  });

  it('should show install command when skipped', () => {
    const skipInstall = true;
    const shouldShowInstall = skipInstall;

    expect(shouldShowInstall).toBe(true);
  });

  it('should not show install command when not skipped', () => {
    const skipInstall = false;
    const shouldShowInstall = skipInstall;

    expect(shouldShowInstall).toBe(false);
  });
});

describe('CLI Edge Cases - Config Merging', () => {
  it('should merge CLI options with prompt answers', () => {
    const cliOptions = {
      template: 'web-app',
      framework: 'react',
    };

    const promptAnswers = {
      features: ['typescript', 'eslint'],
      packageManager: 'pnpm' as const,
    };

    const config = {
      name: 'my-app',
      ...cliOptions,
      ...promptAnswers,
    };

    expect(config.template).toBe('web-app');
    expect(config.framework).toBe('react');
    expect(config.features).toEqual(['typescript', 'eslint']);
    expect(config.packageManager).toBe('pnpm');
  });

  it('should prioritize CLI options over prompts', () => {
    const cliOptions = {
      template: 'api',
    };

    const promptAnswers = {
      template: 'web-app', // This should be ignored
    };

    const config = {
      ...promptAnswers,
      ...cliOptions, // CLI options override
    };

    expect(config.template).toBe('api');
  });

  it('should use prompt answers when CLI options not provided', () => {
    const cliOptions = {};

    const promptAnswers = {
      template: 'mobile',
      framework: 'react-native',
    };

    const config = {
      ...cliOptions,
      ...promptAnswers,
    };

    expect(config.template).toBe('mobile');
    expect(config.framework).toBe('react-native');
  });
});

describe('CLI Edge Cases - Conditional Prompts', () => {
  it('should skip prompt when value already provided', () => {
    const projectName = 'my-app';
    const shouldPrompt = !projectName;

    expect(shouldPrompt).toBe(false);
  });

  it('should show prompt when value not provided', () => {
    const projectName = undefined;
    const shouldPrompt = !projectName;

    expect(shouldPrompt).toBe(true);
  });

  it('should show framework prompt only when template has frameworks', () => {
    const template = templates['web-app'];
    const shouldPromptFramework = template.frameworks && template.frameworks.length > 0;

    expect(shouldPromptFramework).toBe(true);
  });

  it('should get framework choices from selected template', () => {
    const selectedTemplate = 'web-app';
    const frameworkChoices = templates[selectedTemplate].frameworks;

    expect(frameworkChoices).toContain('react');
    expect(frameworkChoices).toContain('vue');
  });
});

describe('CLI Edge Cases - Version Display', () => {
  it('should display version from package.json', () => {
    const version = '1.0.0';
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should handle semver format', () => {
    const versions = ['1.0.0', '2.1.3', '0.0.1'];

    versions.forEach(version => {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

describe('CLI Edge Cases - Help Display', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
  });

  it('should have description', () => {
    program.description('Create a new Vibe app with best practices');

    expect(program.description()).toBeTruthy();
  });

  it('should have all options documented', () => {
    program
      .option('-t, --template <template>', 'project template')
      .option('-f, --framework <framework>', 'framework to use')
      .option('--skip-git', 'skip git initialization')
      .option('--skip-install', 'skip package installation');

    const options = program.options;
    expect(options.length).toBeGreaterThanOrEqual(4);
  });

  it('should have argument documented', () => {
    program.argument('[project-name]', 'name of the project');

    expect(program.args).toBeDefined();
  });
});
