#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  type ProjectConfig,
  templates,
  features,
  validateProjectName,
  copyTemplate,
  createPackageJson,
  initGit,
  installDependencies,
} from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CLIOptions {
  template?: string;
  framework?: string;
  skipGit?: boolean;
  skipInstall?: boolean;
}

interface InquirerAnswers {
  name?: string;
  template?: string;
  framework?: string;
  features: string[];
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

const program = new Command();

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
  options?: CLIOptions
): Promise<ProjectConfig> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: projectName || 'my-vibe-app',
      when: !projectName,
      validate: validateProjectName,
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
      choices: (answers: InquirerAnswers) => {
        const template = answers.template || options?.template;
        return templates[template as keyof typeof templates]?.frameworks || [];
      },
      when: (answers: InquirerAnswers) => {
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

async function createProject(config: ProjectConfig, options: CLIOptions) {
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

program.parse();
