module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': [
    // Check for console.log statements (禁止提交包含console.log的代碼)
    (files) => {
      const filesWithConsole = files.filter((file) => {
        const fs = require('fs');
        const content = fs.readFileSync(file, 'utf-8');
        // Check for console.log but allow console.warn and console.error
        return /console\.log\(/.test(content);
      });

      if (filesWithConsole.length > 0) {
        throw new Error(
          `❌ Console.log detected in:\n${filesWithConsole.join('\n')}\n\n` +
          '⚠️  Please remove console.log statements before committing.\n' +
          '✅ Use console.warn() or console.error() for logging if needed.'
        );
      }

      return [];
    },
    // TypeScript type checking
    () => 'pnpm type-check',
    // ESLint auto-fix
    'eslint --fix --max-warnings=0',
    // Prettier formatting
    'prettier --write',
  ],

  // JSON, Markdown, YAML files
  '*.{json,md,yml,yaml}': [
    'prettier --write',
  ],

  // Python files
  '*.py': [
    'black',
    'ruff check --fix',
  ],

  // Shell scripts
  '*.sh': [
    'shellcheck',
  ],
};
