# @vibe/ai-assistant

Unified AI Development Assistant Platform for Vibe-Coding-Apps.

## Features

- 🔍 **Code Analysis**: Deep code analysis across multiple languages
- ⚡ **Optimization**: AI-powered performance and code optimization suggestions
- 🎨 **Generation**: Smart code generation from specifications
- 👀 **Review**: Automated code review with actionable feedback
- 📊 **Project Health**: Comprehensive project health monitoring

## Installation

```bash
pnpm add @vibe/ai-assistant
```

## CLI Usage

```bash
# Analyze a file
vibe-ai analyze src/index.ts

# Get optimization suggestions
vibe-ai optimize src/heavy-computation.ts

# Review code
vibe-ai review src/components/Form.tsx

# Get project health report
vibe-ai health ./my-project
```

## Programmatic Usage

```typescript
import { AIAssistant } from '@vibe/ai-assistant';

const assistant = new AIAssistant();

// Analyze code
const analysis = await assistant.analyze('src/index.ts');
console.log(analysis.metrics);

// Get optimizations
const optimizations = await assistant.optimize('src/heavy.ts');
console.log(optimizations);

// Review code
const review = await assistant.review('src/components/Form.tsx');
console.log(review);

// Project health
const health = await assistant.getProjectHealth('./my-project');
console.log(`Project Score: ${health.score}/100`);
```

## Components

### Code Analyzer

```typescript
import { CodeAnalyzer } from '@vibe/ai-assistant';

const analyzer = new CodeAnalyzer();
const result = await analyzer.analyzeFile('src/index.ts');

console.log(result.metrics.complexity);
console.log(result.issues);
console.log(result.suggestions);
```

### Code Optimizer

```typescript
import { CodeOptimizer } from '@vibe/ai-assistant';

const optimizer = new CodeOptimizer();
const suggestions = await optimizer.optimizeFile('src/heavy.ts');

// Generate report
const report = await optimizer.generateOptimizationReport(suggestions);
```

### Code Generator

```typescript
import { CodeGenerator } from '@vibe/ai-assistant';

const generator = new CodeGenerator();

// Generate component
const component = await generator.generateComponent(
  'UserProfile',
  'component',
  {
    language: 'typescript',
    framework: 'react',
    includeTests: true,
    includeDocs: true,
  }
);

console.log(component.code);
console.log(component.tests);
```

### Code Reviewer

```typescript
import { CodeReviewer } from '@vibe/ai-assistant';

const reviewer = new CodeReviewer();

// Review file
const comments = await reviewer.reviewFile('src/index.ts');

// Review PR
const prReview = await reviewer.reviewPullRequest('main', 'feature/new');
console.log(prReview.summary);

// Generate report
const report = await reviewer.generateReviewReport(comments);
```

## Configuration

Create a `.vibeai.json` in your project root:

```json
{
  "analyzer": {
    "languages": ["typescript", "python", "rust"],
    "strictMode": true
  },
  "optimizer": {
    "performanceThreshold": "high",
    "suggestRefactoring": true
  },
  "reviewer": {
    "autoFix": false,
    "severity": "all"
  }
}
```

## Integration with Existing Tools

The AI Assistant integrates with:

- **Firmware Development**: Code analysis for embedded systems
- **DevOps Tools**: Integration with build pipelines
- **Testing Frameworks**: Test generation and coverage analysis
- **CI/CD**: Automated code review in PR workflows

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Lint
pnpm lint
```

## License

MIT
