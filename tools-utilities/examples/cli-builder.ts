/**
 * CLI Builder Examples
 *
 * Demonstrates how to build robust CLI tools with TypeScript
 * covering argument parsing, commands, interactive prompts, and more.
 */

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Example 1: Basic CLI with Commander.js
// ============================================================================

interface TodoItem {
  id: number;
  text: string;
  done: boolean;
  createdAt: Date;
}

class TodoCLI {
  private todos: TodoItem[] = [];
  private dataFile: string;

  constructor(dataFile: string = './todos.json') {
    this.dataFile = dataFile;
  }

  async init(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFile, 'utf-8');
      this.todos = JSON.parse(data);
    } catch (error) {
      this.todos = [];
    }
  }

  async save(): Promise<void> {
    await fs.writeFile(this.dataFile, JSON.stringify(this.todos, null, 2));
  }

  async add(text: string): Promise<void> {
    const todo: TodoItem = {
      id: Date.now(),
      text,
      done: false,
      createdAt: new Date(),
    };
    this.todos.push(todo);
    await this.save();
    console.log(chalk.green('✓'), `Added: ${text}`);
  }

  async list(): Promise<void> {
    if (this.todos.length === 0) {
      console.log(chalk.yellow('No todos found'));
      return;
    }

    console.log(chalk.bold('\nYour Todos:\n'));
    this.todos.forEach((todo, index) => {
      const status = todo.done ? chalk.green('✓') : chalk.red('✗');
      const text = todo.done ? chalk.strikethrough(todo.text) : todo.text;
      console.log(`${status} ${index + 1}. ${text}`);
    });
    console.log('');
  }

  async complete(id: number): Promise<void> {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) {
      console.log(chalk.red('Todo not found'));
      return;
    }
    todo.done = true;
    await this.save();
    console.log(chalk.green('✓'), `Completed: ${todo.text}`);
  }

  async remove(id: number): Promise<void> {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) {
      console.log(chalk.red('Todo not found'));
      return;
    }
    const removed = this.todos.splice(index, 1)[0];
    await this.save();
    console.log(chalk.yellow('✓'), `Removed: ${removed.text}`);
  }
}

// ============================================================================
// Example 2: Advanced CLI with Subcommands
// ============================================================================

class ProjectCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  private setupCommands(): void {
    this.program
      .name('project')
      .description('Project management CLI tool')
      .version('1.0.0');

    // Init command
    this.program
      .command('init')
      .description('Initialize a new project')
      .option('-t, --template <type>', 'Project template', 'basic')
      .option('-n, --name <name>', 'Project name')
      .action(this.initProject.bind(this));

    // Build command
    this.program
      .command('build')
      .description('Build the project')
      .option('-w, --watch', 'Watch mode')
      .option('-p, --production', 'Production build')
      .action(this.buildProject.bind(this));

    // Deploy command
    this.program
      .command('deploy')
      .description('Deploy the project')
      .argument('<environment>', 'Deployment environment')
      .option('-d, --dry-run', 'Dry run mode')
      .action(this.deployProject.bind(this));

    // Config command
    const configCmd = this.program
      .command('config')
      .description('Manage configuration');

    configCmd
      .command('get <key>')
      .description('Get a configuration value')
      .action(this.getConfig.bind(this));

    configCmd
      .command('set <key> <value>')
      .description('Set a configuration value')
      .action(this.setConfig.bind(this));
  }

  private async initProject(options: any): Promise<void> {
    const spinner = ora('Initializing project...').start();

    try {
      // Simulate project initialization
      await new Promise(resolve => setTimeout(resolve, 1500));

      const projectName = options.name || 'my-project';
      const template = options.template;

      spinner.succeed(`Project initialized: ${projectName} (${template})`);

      console.log(chalk.cyan('\nNext steps:'));
      console.log(`  cd ${projectName}`);
      console.log('  npm install');
      console.log('  npm start');
    } catch (error) {
      spinner.fail('Failed to initialize project');
      throw error;
    }
  }

  private async buildProject(options: any): Promise<void> {
    const mode = options.production ? 'production' : 'development';
    const watch = options.watch;

    console.log(chalk.blue(`Building in ${mode} mode...`));

    const spinner = ora('Compiling...').start();

    // Simulate build process
    await new Promise(resolve => setTimeout(resolve, 2000));

    spinner.succeed('Build completed');

    if (watch) {
      console.log(chalk.cyan('Watching for changes...'));
    }
  }

  private async deployProject(environment: string, options: any): Promise<void> {
    const dryRun = options.dryRun;

    console.log(chalk.blue(`Deploying to ${environment}...`));

    if (dryRun) {
      console.log(chalk.yellow('DRY RUN MODE - No actual deployment'));
    }

    const spinner = ora('Deploying...').start();

    try {
      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (dryRun) {
        spinner.info('Deployment preview completed');
      } else {
        spinner.succeed(`Deployed to ${environment}`);
      }
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  private async getConfig(key: string): Promise<void> {
    console.log(`Getting config: ${key}`);
    // Implementation here
  }

  private async setConfig(key: string, value: string): Promise<void> {
    console.log(`Setting config: ${key} = ${value}`);
    // Implementation here
  }

  run(args: string[]): void {
    this.program.parse(args);
  }
}

// ============================================================================
// Example 3: Interactive CLI with Inquirer
// ============================================================================

interface ProjectConfig {
  name: string;
  type: 'web' | 'cli' | 'library';
  language: 'typescript' | 'javascript';
  features: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

class InteractiveCLI {
  async createProject(): Promise<ProjectConfig> {
    console.log(chalk.blue.bold('\n🚀 Project Setup Wizard\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: 'my-awesome-project',
        validate: (input: string) => {
          if (input.length < 3) {
            return 'Project name must be at least 3 characters';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'type',
        message: 'Project type:',
        choices: [
          { name: 'Web Application', value: 'web' },
          { name: 'CLI Tool', value: 'cli' },
          { name: 'Library', value: 'library' },
        ],
      },
      {
        type: 'list',
        name: 'language',
        message: 'Language:',
        choices: ['typescript', 'javascript'],
        default: 'typescript',
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features:',
        choices: [
          { name: 'Testing (Jest)', value: 'jest' },
          { name: 'Linting (ESLint)', value: 'eslint' },
          { name: 'Formatting (Prettier)', value: 'prettier' },
          { name: 'Git Hooks (Husky)', value: 'husky' },
          { name: 'CI/CD (GitHub Actions)', value: 'ci' },
          { name: 'Docker', value: 'docker' },
        ],
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Package manager:',
        choices: ['npm', 'yarn', 'pnpm'],
        default: 'npm',
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Create project with these settings?',
        default: true,
      },
    ]);

    if (!answers.confirm) {
      console.log(chalk.yellow('\nProject creation cancelled'));
      process.exit(0);
    }

    return answers as ProjectConfig;
  }

  async generateProject(config: ProjectConfig): Promise<void> {
    const spinner = ora('Creating project structure...').start();

    try {
      // Create project directory
      await fs.mkdir(config.name, { recursive: true });

      // Create package.json
      const packageJson = {
        name: config.name,
        version: '1.0.0',
        description: `A ${config.type} project`,
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: config.features.includes('jest') ? 'jest' : 'echo "No tests"',
          lint: config.features.includes('eslint') ? 'eslint .' : 'echo "No linting"',
        },
      };

      await fs.writeFile(
        path.join(config.name, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      spinner.text = 'Installing dependencies...';
      await new Promise(resolve => setTimeout(resolve, 2000));

      spinner.succeed('Project created successfully!');

      console.log(chalk.green('\n✓ Project setup complete!\n'));
      console.log(chalk.cyan('Next steps:'));
      console.log(`  cd ${config.name}`);
      console.log(`  ${config.packageManager} install`);
      console.log(`  ${config.packageManager} start`);
    } catch (error) {
      spinner.fail('Failed to create project');
      throw error;
    }
  }
}

// ============================================================================
// Example 4: CLI with Progress Indicators
// ============================================================================

class BatchProcessorCLI {
  async processFiles(files: string[]): Promise<void> {
    console.log(chalk.blue(`\nProcessing ${files.length} files...\n`));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const spinner = ora(`Processing ${file} (${i + 1}/${files.length})`).start();

      try {
        // Simulate file processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        spinner.succeed(`Processed ${file}`);
      } catch (error) {
        spinner.fail(`Failed to process ${file}`);
      }
    }

    console.log(chalk.green('\n✓ All files processed!\n'));
  }

  async analyzeWithProgress(data: any[]): Promise<void> {
    const tasks = [
      'Validating data',
      'Cleaning records',
      'Calculating statistics',
      'Generating report',
      'Saving results',
    ];

    for (const task of tasks) {
      const spinner = ora(task).start();
      await new Promise(resolve => setTimeout(resolve, 1500));
      spinner.succeed(task);
    }

    console.log(chalk.green('\n✓ Analysis complete!\n'));
  }
}

// ============================================================================
// Example 5: Error Handling and Validation
// ============================================================================

class RobustCLI {
  async validateAndRun(options: any): Promise<void> {
    try {
      // Validate options
      this.validateOptions(options);

      // Run with error handling
      await this.runWithRetry(async () => {
        // Your operation here
        console.log('Running operation...');
      });
    } catch (error) {
      this.handleError(error);
      process.exit(1);
    }
  }

  private validateOptions(options: any): void {
    if (!options.input) {
      throw new Error('Input file is required');
    }

    if (!options.output) {
      throw new Error('Output file is required');
    }

    // Add more validation as needed
  }

  private async runWithRetry(
    fn: () => Promise<void>,
    maxRetries: number = 3
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await fn();
        return;
      } catch (error) {
        lastError = error as Error;
        console.log(chalk.yellow(`Attempt ${i + 1} failed, retrying...`));
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw lastError;
  }

  private handleError(error: any): void {
    if (error.code === 'ENOENT') {
      console.error(chalk.red('Error: File not found'));
    } else if (error.code === 'EACCES') {
      console.error(chalk.red('Error: Permission denied'));
    } else {
      console.error(chalk.red('Error:'), error.message);
    }

    if (process.env.DEBUG) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
  }
}

// ============================================================================
// Example 6: CLI with Configuration Management
// ============================================================================

interface Config {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  verbose?: boolean;
}

class ConfigurableCLI {
  private config: Config = {};
  private configPath: string;

  constructor(configPath: string = './config.json') {
    this.configPath = configPath;
  }

  async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(data);
    } catch (error) {
      // Use defaults
      this.config = {
        endpoint: 'https://api.example.com',
        timeout: 5000,
        verbose: false,
      };
    }
  }

  async saveConfig(): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  async configure(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'API Key:',
        default: this.config.apiKey,
      },
      {
        type: 'input',
        name: 'endpoint',
        message: 'API Endpoint:',
        default: this.config.endpoint,
      },
      {
        type: 'number',
        name: 'timeout',
        message: 'Timeout (ms):',
        default: this.config.timeout,
      },
      {
        type: 'confirm',
        name: 'verbose',
        message: 'Verbose output:',
        default: this.config.verbose,
      },
    ]);

    this.config = { ...this.config, ...answers };
    await this.saveConfig();

    console.log(chalk.green('\n✓ Configuration saved!\n'));
  }

  getConfig(): Config {
    return this.config;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function main() {
  // Example 1: Todo CLI
  const todoCLI = new TodoCLI();
  await todoCLI.init();
  await todoCLI.add('Write documentation');
  await todoCLI.add('Review pull requests');
  await todoCLI.list();

  // Example 2: Project CLI
  const projectCLI = new ProjectCLI();
  // projectCLI.run(process.argv);

  // Example 3: Interactive CLI
  const interactiveCLI = new InteractiveCLI();
  // const config = await interactiveCLI.createProject();
  // await interactiveCLI.generateProject(config);

  // Example 4: Batch Processor
  const batchCLI = new BatchProcessorCLI();
  // await batchCLI.processFiles(['file1.txt', 'file2.txt', 'file3.txt']);

  // Example 5: Configurable CLI
  const configurableCLI = new ConfigurableCLI();
  await configurableCLI.loadConfig();
  // await configurableCLI.configure();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export {
  TodoCLI,
  ProjectCLI,
  InteractiveCLI,
  BatchProcessorCLI,
  RobustCLI,
  ConfigurableCLI,
};
