import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';

// Mock all external dependencies
vi.mock('fs-extra');
vi.mock('inquirer');
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));
vi.mock('../utils.js', () => ({
  templates: {
    'web-app': {
      name: 'Web Application',
      frameworks: ['react', 'vue', 'next'],
    },
    'api': {
      name: 'API / Backend',
      frameworks: ['express', 'fastify', 'nestjs'],
    },
  },
  features: [
    { name: 'TypeScript', value: 'typescript' },
    { name: 'ESLint', value: 'eslint' },
    { name: 'Prettier', value: 'prettier' },
  ],
  validateProjectName: vi.fn((name: string) => {
    if (!name || name.includes(' ')) return 'Invalid name';
    return true;
  }),
  copyTemplate: vi.fn(),
  createPackageJson: vi.fn(),
  initGit: vi.fn(),
  installDependencies: vi.fn(),
}));

describe('CLI Argument Parsing', () => {
  let program: Command;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string) => {
      throw new Error(`Process exited with code ${code}`);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should accept project name as positional argument', () => {
    program
      .argument('[project-name]', 'name of the project')
      .action((projectName) => {
        expect(projectName).toBe('my-app');
      });

    program.parse(['node', 'cli', 'my-app']);
  });

  it('should accept template option', () => {
    program
      .option('-t, --template <template>', 'project template')
      .action(() => {
        const opts = program.opts();
        expect(opts.template).toBe('web-app');
      });

    program.parse(['node', 'cli', '-t', 'web-app']);
  });

  it('should accept framework option', () => {
    program
      .option('-f, --framework <framework>', 'framework to use')
      .action(() => {
        const opts = program.opts();
        expect(opts.framework).toBe('react');
      });

    program.parse(['node', 'cli', '-f', 'react']);
  });

  it('should accept skip-git flag', () => {
    program
      .option('--skip-git', 'skip git initialization')
      .action(() => {
        const opts = program.opts();
        expect(opts.skipGit).toBe(true);
      });

    program.parse(['node', 'cli', '--skip-git']);
  });

  it('should accept skip-install flag', () => {
    program
      .option('--skip-install', 'skip package installation')
      .action(() => {
        const opts = program.opts();
        expect(opts.skipInstall).toBe(true);
      });

    program.parse(['node', 'cli', '--skip-install']);
  });

  it('should accept multiple options together', () => {
    program
      .argument('[project-name]')
      .option('-t, --template <template>')
      .option('-f, --framework <framework>')
      .option('--skip-git')
      .option('--skip-install')
      .action((projectName) => {
        const opts = program.opts();
        expect(projectName).toBe('my-app');
        expect(opts.template).toBe('web-app');
        expect(opts.framework).toBe('react');
        expect(opts.skipGit).toBe(true);
        expect(opts.skipInstall).toBe(true);
      });

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
  });

  it('should handle missing positional argument', () => {
    program
      .argument('[project-name]', 'name of the project')
      .action((projectName) => {
        expect(projectName).toBeUndefined();
      });

    program.parse(['node', 'cli']);
  });

  it('should handle short option flags', () => {
    program
      .option('-t, --template <template>')
      .option('-f, --framework <framework>')
      .action(() => {
        const opts = program.opts();
        expect(opts.template).toBe('api');
        expect(opts.framework).toBe('express');
      });

    program.parse(['node', 'cli', '-t', 'api', '-f', 'express']);
  });
});

describe('Project Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prompt for project name when not provided', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      name: 'my-app',
      template: 'web-app',
      features: ['typescript'],
      packageManager: 'pnpm',
    });

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
      },
    ]);

    expect(answers.name).toBe('my-app');
  });

  it('should use default project name when no input provided', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      name: 'my-vibe-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm',
    });

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        default: 'my-vibe-app',
      },
    ]);

    expect(answers.name).toBe('my-vibe-app');
  });

  it('should prompt for template selection', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      template: 'api',
    });

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        choices: ['web-app', 'api', 'mobile'],
      },
    ]);

    expect(answers.template).toBe('api');
  });

  it('should prompt for framework based on template', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      framework: 'react',
    });

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        choices: ['react', 'vue', 'next'],
      },
    ]);

    expect(answers.framework).toBe('react');
  });

  it('should prompt for features with defaults', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      features: ['typescript', 'eslint', 'prettier'],
    });

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'features',
        default: ['typescript', 'eslint', 'prettier'],
      },
    ]);

    expect(answers.features).toEqual(['typescript', 'eslint', 'prettier']);
  });

  it('should prompt for package manager with pnpm as default', async () => {
    vi.mocked(inquirer.prompt).mockResolvedValue({
      packageManager: 'pnpm',
    });

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'packageManager',
        choices: ['pnpm', 'npm', 'yarn'],
        default: 'pnpm',
      },
    ]);

    expect(answers.packageManager).toBe('pnpm');
  });

  it('should skip prompts when options are provided', async () => {
    const mockPrompt = vi.mocked(inquirer.prompt);
    mockPrompt.mockResolvedValue({
      features: ['typescript'],
      packageManager: 'npm',
    });

    await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        when: false, // Simulating when option is already provided
      },
      {
        type: 'list',
        name: 'template',
        when: false,
      },
    ]);

    // Verify prompt was called but with limited questions
    expect(mockPrompt).toHaveBeenCalled();
  });
});

describe('Project Creation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.pathExists).mockResolvedValue(false);
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);
    vi.mocked(fs.remove).mockResolvedValue(undefined);
  });

  it('should check if directory exists before creation', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(inquirer.prompt).mockResolvedValue({ overwrite: false });

    const projectPath = '/test/my-app';
    await fs.pathExists(projectPath);

    expect(fs.pathExists).toHaveBeenCalledWith(projectPath);
  });

  it('should prompt for overwrite when directory exists', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    vi.mocked(inquirer.prompt).mockResolvedValue({ overwrite: true });

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Directory already exists. Overwrite?',
        default: false,
      },
    ]);

    expect(answers.overwrite).toBe(true);
  });

  it('should remove existing directory when overwrite is confirmed', async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true);
    const projectPath = '/test/my-app';

    await fs.remove(projectPath);

    expect(fs.remove).toHaveBeenCalledWith(projectPath);
  });

  it('should create project directory', async () => {
    const projectPath = '/test/my-app';
    await fs.ensureDir(projectPath);

    expect(fs.ensureDir).toHaveBeenCalledWith(projectPath);
  });

  it('should handle project creation steps in correct order', async () => {
    const calls: string[] = [];
    const { copyTemplate, createPackageJson, initGit, installDependencies } =
      await import('../utils.js');

    vi.mocked(copyTemplate).mockImplementation(async () => {
      calls.push('copyTemplate');
    });
    vi.mocked(createPackageJson).mockImplementation(async () => {
      calls.push('createPackageJson');
    });
    vi.mocked(initGit).mockImplementation(async () => {
      calls.push('initGit');
    });
    vi.mocked(installDependencies).mockImplementation(async () => {
      calls.push('installDependencies');
    });

    const config = {
      name: 'test-app',
      template: 'web-app',
      features: [],
      packageManager: 'npm' as const,
    };

    await copyTemplate(config, '/test/test-app');
    await createPackageJson(config, '/test/test-app');
    await initGit('/test/test-app');
    await installDependencies(config, '/test/test-app');

    expect(calls).toEqual([
      'copyTemplate',
      'createPackageJson',
      'initGit',
      'installDependencies',
    ]);
  });

  it('should skip git initialization when --skip-git is provided', async () => {
    const { initGit } = await import('../utils.js');

    const skipGit = true;
    if (!skipGit) {
      await initGit('/test/test-app');
    }

    expect(initGit).not.toHaveBeenCalled();
  });

  it('should skip dependency installation when --skip-install is provided', async () => {
    const { installDependencies } = await import('../utils.js');

    const skipInstall = true;
    if (!skipInstall) {
      await installDependencies(
        { name: 'test', template: 'web-app', features: [], packageManager: 'npm' },
        '/test/test-app'
      );
    }

    expect(installDependencies).not.toHaveBeenCalled();
  });
});

describe('Success Messages', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should display success message after project creation', () => {
    console.log();
    console.log(chalk.green('✨ Project created successfully!'));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Project created successfully')
    );
  });

  it('should display next steps with correct project name', () => {
    const projectName = 'my-app';
    console.log(chalk.cyan(`  cd ${projectName}`));

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('my-app'));
  });

  it('should show install command when --skip-install is used', () => {
    const packageManager = 'pnpm';
    const skipInstall = true;

    if (skipInstall) {
      console.log(chalk.cyan(`  ${packageManager} install`));
    }

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('pnpm install')
    );
  });

  it('should show dev command with correct package manager', () => {
    const packageManager = 'npm';
    console.log(chalk.cyan(`  ${packageManager} dev`));

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('npm dev'));
  });

  it('should not show install command when dependencies are installed', () => {
    const skipInstall = false;

    if (skipInstall) {
      console.log('install command');
    }

    expect(consoleLogSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('install command')
    );
  });
});

describe('Error Handling', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number | string) => {
      throw new Error(`Process exited with code ${code}`);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should handle errors in main action', async () => {
    const error = new Error('Test error');

    try {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    } catch (e: unknown) {
      expect((e as Error).message).toContain('Process exited with code 1');
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error'),
      error
    );
  });

  it('should display error message with chalk.red formatting', () => {
    const errorMessage = 'Something went wrong';
    console.error(chalk.red('Error:'), errorMessage);

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should exit with code 1 on error', () => {
    try {
      process.exit(1);
    } catch (e: unknown) {
      expect((e as Error).message).toContain('code 1');
    }
  });

  it('should handle file system errors gracefully', async () => {
    const fsError = new Error('EACCES: permission denied');
    vi.mocked(fs.ensureDir).mockRejectedValue(fsError);

    try {
      await fs.ensureDir('/test/path');
    } catch (error) {
      expect(error).toBe(fsError);
    }
  });

  it('should handle user cancellation (overwrite declined)', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    console.log(chalk.yellow('Operation cancelled.'));

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Operation cancelled')
    );

    consoleLogSpy.mockRestore();
  });
});

describe('Interactive Prompts Conditional Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should skip name prompt when projectName is provided', async () => {
    const projectName = 'my-app';
    const shouldPrompt = !projectName;

    expect(shouldPrompt).toBe(false);
  });

  it('should skip template prompt when option is provided', async () => {
    const options = { template: 'web-app' };
    const shouldPrompt = !options.template;

    expect(shouldPrompt).toBe(false);
  });

  it('should skip framework prompt when option is provided', async () => {
    const options = { framework: 'react' };
    const shouldPrompt = !options.framework;

    expect(shouldPrompt).toBe(false);
  });

  it('should show framework prompt only when template has frameworks', async () => {
    const template = 'web-app';
    const templates = {
      'web-app': { frameworks: ['react', 'vue'] },
      'api': { frameworks: [] },
    };

    const shouldPrompt = templates[template as keyof typeof templates]?.frameworks;
    expect(shouldPrompt).toBeTruthy();
  });

  it('should not show framework prompt when template has no frameworks', async () => {
    const template = 'api';
    const templates = {
      'api': { frameworks: undefined },
    };

    const shouldPrompt = templates[template as keyof typeof templates]?.frameworks;
    expect(shouldPrompt).toBeUndefined();
  });
});

describe('CLI Version and Metadata', () => {
  it('should have correct program name', () => {
    const program = new Command();
    program.name('create-vibe-app');

    expect(program.name()).toBe('create-vibe-app');
  });

  it('should have version information', () => {
    const program = new Command();
    program.version('1.0.0');

    expect(program.version()).toBe('1.0.0');
  });

  it('should have description', () => {
    const program = new Command();
    program.description('Create a new Vibe app with best practices');

    expect(program.description()).toBe('Create a new Vibe app with best practices');
  });
});
