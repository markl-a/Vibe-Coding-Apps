# Contributing to Vibe-Coding-Apps

Thank you for your interest in contributing to Vibe-Coding-Apps! This guide will help you get started with contributing to our AI-driven and AI-native applications collection.

## Table of Contents

- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Conventions](#commit-message-conventions)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Testing Requirements](#testing-requirements)
- [Getting Help](#getting-help)

## How to Contribute

We welcome all types of contributions, including:

- Bug reports and fixes
- Feature requests and implementations
- Documentation improvements
- Code refactoring and optimization
- New project additions

### Fork and Branch Workflow

1. **Fork the repository** to your GitHub account

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Vibe-Coding-Apps.git
   cd Vibe-Coding-Apps
   ```

3. **Create a feature branch** from the main branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

4. **Make your changes** and commit them following our conventions

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub against the main branch

## Development Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **Git**: >= 2.30

### Installation

1. **Install pnpm** (if not already installed):
   ```bash
   npm install -g pnpm
   ```

2. **Install project dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up Git hooks** (for commit linting and pre-commit checks):
   ```bash
   pnpm prepare
   ```

### Development Commands

```bash
# Run development server (with hot reload)
pnpm dev

# Run tests
pnpm test

# Run tests for a specific project
pnpm test --filter=project-name

# Run linter
pnpm lint

# Check code formatting
pnpm format:check

# Auto-fix formatting issues
pnpm format

# Type checking
pnpm type-check

# Build all projects
pnpm build

# Run end-to-end tests
pnpm test:e2e
```

## Code Style Guidelines

### TypeScript Strict Mode

This project uses **TypeScript strict mode** with the following compiler options enabled:

- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`

### No `any` Types

**Never use `any` types.** Instead:

- Use `unknown` for truly unknown types and apply type guards
- Define proper interfaces or types
- Use generics when appropriate

```typescript
// ❌ Bad - using any
function processData(data: any) {
  return data.value;
}

// ✅ Good - using unknown with type guards
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data format');
}

// ✅ Better - using proper types
interface DataObject {
  value: string;
}

function processData(data: DataObject): string {
  return data.value;
}
```

### Error Handling

Use the shared `getErrorMessage()` utility for safe error handling:

```typescript
import { getErrorMessage } from '@vibe-coding/shared-utils/errors';

// ✅ Good - proper error handling
try {
  await someAsyncOperation();
} catch (error: unknown) {
  const errorMessage = getErrorMessage(error);
  console.error(errorMessage);
  res.status(400).json({ error: errorMessage });
}

// ❌ Bad - assuming error type
try {
  await someAsyncOperation();
} catch (error) {
  console.error(error.message); // TypeScript error if strict
}
```

Available error utilities from `@vibe-coding/shared-utils/errors`:

- `getErrorMessage(error: unknown, fallback?: string): string` - Extract error message safely
- `getErrorInfo(error: unknown)` - Get detailed error information
- `AppError`, `ValidationError`, `AuthenticationError`, etc. - Structured error classes
- `asyncHandler()` - Express async error wrapper
- `errorHandler()` - Express error middleware

### Follow Existing Patterns

When contributing to an existing project:

- Review the existing code structure and patterns
- Match the naming conventions used in that project
- Follow the established architecture (e.g., MVC, clean architecture)
- Reuse shared utilities and components where possible

### General Best Practices

- Write self-documenting code with clear variable and function names
- Add comments for complex logic, but prefer readable code over comments
- Keep functions small and focused on a single responsibility
- Use TypeScript features: interfaces, types, enums, generics
- Prefer functional programming patterns where appropriate
- Use modern JavaScript/TypeScript features (async/await, optional chaining, nullish coalescing)

## Commit Message Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring (neither fixes a bug nor adds a feature)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Changes to build system or dependencies
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files
- `revert`: Revert a previous commit

### Examples

```bash
# Simple feature
git commit -m "feat(auth): add OAuth2 login support"

# Bug fix with scope
git commit -m "fix(payroll): correct overtime calculation formula"

# Breaking change
git commit -m "feat(api)!: change response format to include metadata

BREAKING CHANGE: API responses now include metadata object"

# With body and footer
git commit -m "feat(leave): add leave balance tracking

- Implement balance calculation logic
- Add balance display in UI
- Update leave request validation

Closes #123"
```

### Commit Guidelines

- Use the imperative mood ("add feature" not "added feature")
- Keep the subject line under 72 characters
- Capitalize the subject line
- Don't end the subject line with a period
- Reference issues and pull requests in the footer

## Pull Request Guidelines

### Before Creating a PR

Ensure your PR meets these requirements:

- [ ] Code follows the project's style guidelines
- [ ] All tests pass locally (`pnpm test`)
- [ ] No linting errors (`pnpm lint`)
- [ ] No type errors (`pnpm type-check`)
- [ ] Code is properly formatted (`pnpm format:check`)
- [ ] Tests are added for new features or bug fixes
- [ ] Documentation is updated if necessary
- [ ] Commit messages follow conventions
- [ ] Branch is up to date with the main branch
- [ ] No merge conflicts

### PR Title Format

Use the same format as commit messages:

```
<type>(<scope>): <description>
```

Examples:
- `feat(auth): add two-factor authentication`
- `fix(ui): resolve mobile responsive issues`
- `docs: update installation instructions`

### PR Description Template

Provide a clear description of your changes:

```markdown
## Summary

Brief description of what this PR does and why.

## Related Issues

Closes #issue_number
Related to #issue_number

## Changes Made

- List key changes
- Include any breaking changes
- Mention new dependencies

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests pass

## Screenshots/Demo

(If applicable, include screenshots or demo links)

## Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented if present)
- [ ] Reviewed my own code
```

### Review Process

- At least one approval is required before merging
- Address all review comments or explain why changes weren't made
- Keep the PR focused on a single feature or fix
- Respond to feedback in a timely manner
- Be open to suggestions and constructive criticism

## Testing Requirements

### Write Tests for New Features

All new features must include tests. Test coverage helps ensure code quality and prevents regressions.

### Test Coverage Goals

- **Minimum**: 60% overall coverage
- **Recommended**: 80%+ coverage
- **Critical paths**: 90%+ coverage

### Types of Tests

1. **Unit Tests**: Test individual functions and components
   ```typescript
   // Example: packages/project/src/utils/calculator.test.ts
   import { calculateTotal } from './calculator';

   describe('calculateTotal', () => {
     it('should sum array of numbers correctly', () => {
       expect(calculateTotal([1, 2, 3])).toBe(6);
     });
   });
   ```

2. **Integration Tests**: Test module interactions
   ```typescript
   // Example: Test API endpoints with database
   describe('Leave API', () => {
     it('should create leave request and update balance', async () => {
       const response = await request(app)
         .post('/api/leave/request')
         .send(leaveData);
       expect(response.status).toBe(201);
     });
   });
   ```

3. **End-to-End Tests**: Test complete user workflows using Playwright
   ```typescript
   // Example: e2e/tests/login.spec.ts
   test('user can log in successfully', async ({ page }) => {
     await page.goto('/login');
     await page.fill('[name="email"]', 'user@example.com');
     await page.fill('[name="password"]', 'password');
     await page.click('button[type="submit"]');
     await expect(page).toHaveURL('/dashboard');
   });
   ```

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage

# Run tests for specific project
pnpm test --filter=project-name

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Test Best Practices

- Write descriptive test names that explain what is being tested
- Follow AAA pattern: Arrange, Act, Assert
- Test edge cases and error conditions
- Keep tests isolated and independent
- Mock external dependencies appropriately
- Don't test implementation details, test behavior

## Getting Help

If you have questions or need assistance:

### Questions and Discussions

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Existing Issues**: Search existing issues before creating new ones

### Useful Resources

- [Project README](/README.md) - Overview and quick start
- [Architecture Documentation](/docs/ARCHITECTURE.md) - System architecture
- [Code of Conduct](/CODE_OF_CONDUCT.md) - Community guidelines
- [Security Policy](/SECURITY.md) - Security reporting

### Communication Guidelines

- Be respectful and constructive
- Provide context and details when asking questions
- Include error messages, logs, and reproduction steps
- Search for existing answers before asking
- Help others when you can

## License

By contributing to Vibe-Coding-Apps, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Vibe-Coding-Apps! Your contributions help make this project better for everyone.

**Happy Coding!**
