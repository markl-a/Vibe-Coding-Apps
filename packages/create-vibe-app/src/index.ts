#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import validateNpmPackageName from 'validate-npm-package-name';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

interface ProjectConfig {
  name: string;
  template: string;
  framework?: string;
  features: string[];
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

const templates = {
  'web-app': {
    name: 'Web Application',
    frameworks: ['react', 'vue', 'next', 'nuxt', 'svelte'],
  },
  'api': {
    name: 'API / Backend',
    frameworks: ['express', 'fastify', 'nestjs', 'fastapi', 'flask'],
  },
  'mobile': {
    name: 'Mobile App',
    frameworks: ['react-native', 'expo', 'flutter'],
  },
  'desktop': {
    name: 'Desktop App',
    frameworks: ['electron', 'tauri'],
  },
  'fullstack': {
    name: 'Full Stack Application',
    frameworks: ['nextjs-fullstack', 't3-stack', 'remix'],
  },
};

const features = [
  { name: 'TypeScript', value: 'typescript' },
  { name: 'ESLint', value: 'eslint' },
  { name: 'Prettier', value: 'prettier' },
  { name: 'Husky (Git Hooks)', value: 'husky' },
  { name: 'Testing (Vitest/Jest)', value: 'testing' },
  { name: 'Docker', value: 'docker' },
  { name: 'CI/CD (GitHub Actions)', value: 'cicd' },
  { name: 'Tailwind CSS', value: 'tailwind' },
];

program
  .name('create-vibe-app')
  .description('Create a new Vibe app with best practices')
  .version('1.0.0')
  .argument('[project-name]', 'name of the project')
  .option('-t, --template <template>', 'project template')
  .option('-f, --framework <framework>', 'framework to use')
  .option('--skip-git', 'skip git initialization')
  .option('--skip-install', 'skip package installation')
  .action(async (projectName, options) => {
    try {
      const config = await getProjectConfig(projectName, options);
      await createProject(config, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

async function getProjectConfig(
  projectName?: string,
  options?: any
): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: projectName || 'my-vibe-app',
      when: !projectName,
      validate: (input: string) => {
        const validation = validateNpmPackageName(input);
        if (validation.validForNewPackages) {
          return true;
        }
        return (
          validation.errors?.join(', ') ||
          'Invalid package name'
        );
      },
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: Object.entries(templates).map(([value, { name }]) => ({
        name,
        value,
      })),
      when: !options?.template,
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Select a framework:',
      choices: (answers: any) => {
        const template = answers.template || options?.template;
        return templates[template as keyof typeof templates]?.frameworks || [];
      },
      when: (answers: any) => {
        const template = answers.template || options?.template;
        return !options?.framework && template && templates[template as keyof typeof templates]?.frameworks;
      },
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features:',
      choices: features,
      default: ['typescript', 'eslint', 'prettier'],
    },
    {
      type: 'list',
      name: 'packageManager',
      message: 'Select package manager:',
      choices: ['pnpm', 'npm', 'yarn'],
      default: 'pnpm',
    },
  ]);

  return {
    name: projectName || answers.name,
    template: options?.template || answers.template,
    framework: options?.framework || answers.framework,
    features: answers.features,
    packageManager: answers.packageManager,
  };
}

async function createProject(config: ProjectConfig, options: any) {
  const spinner = ora();
  const projectPath = path.join(process.cwd(), config.name);

  try {
    // Check if directory exists
    if (await fs.pathExists(projectPath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${config.name} already exists. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        process.exit(0);
      }

      await fs.remove(projectPath);
    }

    // Create directory
    spinner.start('Creating project directory...');
    await fs.ensureDir(projectPath);
    spinner.succeed();

    // Copy template
    spinner.start('Setting up template...');
    await copyTemplate(config, projectPath);
    spinner.succeed();

    // Create package.json
    spinner.start('Creating package.json...');
    await createPackageJson(config, projectPath);
    spinner.succeed();

    // Initialize git
    if (!options.skipGit) {
      spinner.start('Initializing git repository...');
      await initGit(projectPath);
      spinner.succeed();
    }

    // Install dependencies
    if (!options.skipInstall) {
      spinner.start('Installing dependencies...');
      await installDependencies(config, projectPath);
      spinner.succeed();
    }

    // Success message
    console.log();
    console.log(chalk.green('✨ Project created successfully!'));
    console.log();
    console.log('Next steps:');
    console.log(chalk.cyan(`  cd ${config.name}`));
    if (options.skipInstall) {
      console.log(chalk.cyan(`  ${config.packageManager} install`));
    }
    console.log(chalk.cyan(`  ${config.packageManager} dev`));
    console.log();
  } catch (error) {
    spinner.fail('Failed to create project');
    throw error;
  }
}

async function copyTemplate(config: ProjectConfig, projectPath: string) {
  // Create basic structure
  const dirs = [
    'src',
    'public',
    'tests',
    '.github/workflows',
    'docs',
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Create basic files
  await createBasicFiles(config, projectPath);
}

async function createBasicFiles(config: ProjectConfig, projectPath: string) {
  // README.md
  const readme = `# ${config.name}

Generated with create-vibe-app

## Getting Started

\`\`\`bash
${config.packageManager} install
${config.packageManager} dev
\`\`\`

## Available Scripts

- \`dev\` - Start development server
- \`build\` - Build for production
- \`test\` - Run tests
- \`lint\` - Lint code
- \`format\` - Format code

## Documentation

See [docs](./docs) for more information.
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);

  // .gitignore
  const gitignore = `node_modules
dist
build
.next
out
.env*.local
.DS_Store
*.log
coverage
.turbo
`;

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

  // Create src/index file
  const ext = config.features.includes('typescript') ? 'ts' : 'js';
  const indexContent = `console.log('Hello from ${config.name}!');
`;

  await fs.writeFile(
    path.join(projectPath, `src/index.${ext}`),
    indexContent
  );
}

async function createPackageJson(config: ProjectConfig, projectPath: string) {
  const packageJson = {
    name: config.name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'echo "Add dev script for your framework"',
      build: 'echo "Add build script for your framework"',
      test: config.features.includes('testing') ? 'vitest' : 'echo "No tests"',
      lint: config.features.includes('eslint') ? 'eslint .' : 'echo "No linter"',
      format: config.features.includes('prettier')
        ? 'prettier --write .'
        : 'echo "No formatter"',
    },
    dependencies: {},
    devDependencies: {},
  };

  if (config.features.includes('typescript')) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      typescript: '^5.3.3',
      '@types/node': '^20.10.0',
    };
  }

  if (config.features.includes('eslint')) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      eslint: '^8.55.0',
    };
  }

  if (config.features.includes('prettier')) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      prettier: '^3.1.1',
    };
  }

  if (config.features.includes('testing')) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      vitest: '^1.0.4',
    };
  }

  await fs.writeJSON(path.join(projectPath, 'package.json'), packageJson, {
    spaces: 2,
  });
}

async function initGit(projectPath: string) {
  const { execSync } = await import('child_process');
  execSync('git init', { cwd: projectPath, stdio: 'ignore' });
  execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
  execSync('git commit -m "Initial commit from create-vibe-app"', {
    cwd: projectPath,
    stdio: 'ignore',
  });
}

async function installDependencies(config: ProjectConfig, projectPath: string) {
  const { execSync } = await import('child_process');
  const cmd =
    config.packageManager === 'npm'
      ? 'npm install'
      : config.packageManager === 'yarn'
      ? 'yarn'
      : 'pnpm install';

  execSync(cmd, { cwd: projectPath, stdio: 'inherit' });
}

program.parse();
