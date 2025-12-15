import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import validateNpmPackageName from 'validate-npm-package-name';

export interface ProjectConfig {
  name: string;
  template: string;
  framework?: string;
  features: string[];
  packageManager: 'npm' | 'pnpm' | 'yarn';
}

export const templates = {
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

export const features = [
  { name: 'TypeScript', value: 'typescript' },
  { name: 'ESLint', value: 'eslint' },
  { name: 'Prettier', value: 'prettier' },
  { name: 'Husky (Git Hooks)', value: 'husky' },
  { name: 'Testing (Vitest/Jest)', value: 'testing' },
  { name: 'Docker', value: 'docker' },
  { name: 'CI/CD (GitHub Actions)', value: 'cicd' },
  { name: 'Tailwind CSS', value: 'tailwind' },
];

interface PackageJson {
  name: string;
  version: string;
  private: boolean;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export function validateProjectName(name: string): boolean | string {
  const validation = validateNpmPackageName(name);
  if (validation.validForNewPackages) {
    return true;
  }
  return validation.errors?.join(', ') || 'Invalid package name';
}

export async function copyTemplate(config: ProjectConfig, projectPath: string): Promise<void> {
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

export async function createBasicFiles(config: ProjectConfig, projectPath: string): Promise<void> {
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

export async function createPackageJson(config: ProjectConfig, projectPath: string): Promise<void> {
  const packageJson: PackageJson = {
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

export async function initGit(projectPath: string): Promise<void> {
  const { execSync } = await import('child_process');
  execSync('git init', { cwd: projectPath, stdio: 'ignore' });
  execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
  execSync('git commit -m "Initial commit from create-vibe-app"', {
    cwd: projectPath,
    stdio: 'ignore',
  });
}

export async function installDependencies(config: ProjectConfig, projectPath: string): Promise<void> {
  const { execSync } = await import('child_process');
  const cmd =
    config.packageManager === 'npm'
      ? 'npm install'
      : config.packageManager === 'yarn'
      ? 'yarn'
      : 'pnpm install';

  execSync(cmd, { cwd: projectPath, stdio: 'inherit' });
}

export function generatePackageJsonDependencies(features: string[]): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const devDependencies: Record<string, string> = {};

  if (features.includes('typescript')) {
    devDependencies.typescript = '^5.3.3';
    devDependencies['@types/node'] = '^20.10.0';
  }

  if (features.includes('eslint')) {
    devDependencies.eslint = '^8.55.0';
  }

  if (features.includes('prettier')) {
    devDependencies.prettier = '^3.1.1';
  }

  if (features.includes('testing')) {
    devDependencies.vitest = '^1.0.4';
  }

  return {
    dependencies: {},
    devDependencies,
  };
}
