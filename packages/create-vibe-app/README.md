# create-vibe-app

Scaffolding tool to create new Vibe apps with best practices built-in.

## Usage

```bash
# Using npx
npx create-vibe-app my-app

# Using pnpm
pnpm create vibe-app my-app

# Using yarn
yarn create vibe-app my-app
```

## Interactive Mode

If you don't provide a project name, the CLI will guide you through an interactive setup:

```bash
npx create-vibe-app
```

You'll be prompted for:
1. **Project name** - Name of your project
2. **Template** - Type of application (web, api, mobile, desktop, fullstack)
3. **Framework** - Specific framework to use
4. **Features** - Additional features to include
5. **Package manager** - npm, pnpm, or yarn

## Templates

### Web Application
- React
- Vue
- Next.js
- Nuxt
- Svelte

### API / Backend
- Express
- Fastify
- NestJS
- FastAPI (Python)
- Flask (Python)

### Mobile App
- React Native
- Expo
- Flutter

### Desktop App
- Electron
- Tauri

### Full Stack
- Next.js Full Stack
- T3 Stack
- Remix

## Features

- ✅ TypeScript
- ✅ ESLint
- ✅ Prettier
- ✅ Husky (Git Hooks)
- ✅ Testing (Vitest/Jest)
- ✅ Docker
- ✅ CI/CD (GitHub Actions)
- ✅ Tailwind CSS

## CLI Options

```bash
create-vibe-app [project-name] [options]

Options:
  -t, --template <template>     Project template
  -f, --framework <framework>   Framework to use
  --skip-git                   Skip git initialization
  --skip-install               Skip package installation
  -V, --version                Display version
  -h, --help                   Display help
```

## Examples

### Create a Next.js app with TypeScript and Tailwind

```bash
npx create-vibe-app my-app -t web-app -f next
```

### Create an API with NestJS

```bash
npx create-vibe-app my-api -t api -f nestjs
```

### Create without installing dependencies

```bash
npx create-vibe-app my-app --skip-install
```

## What's Included

Every generated project includes:

- 📦 **package.json** - Configured with scripts and dependencies
- 📝 **README.md** - Project documentation
- 🗂️ **Project structure** - Organized directories (src, tests, docs)
- ⚙️ **.gitignore** - Common ignore patterns
- 🔧 **Configuration files** - For selected features (tsconfig, eslint, etc.)
- 🚀 **Git repository** - Initialized with initial commit

## Project Structure

```
my-app/
├── src/
│   └── index.ts
├── tests/
├── public/
├── docs/
├── .github/
│   └── workflows/
├── package.json
├── README.md
├── .gitignore
└── tsconfig.json (if TypeScript is selected)
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Test
pnpm test

# Lint
pnpm lint
```

## License

MIT
