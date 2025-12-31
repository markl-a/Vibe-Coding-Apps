# Tools & Utilities Examples

Comprehensive TypeScript examples demonstrating utility patterns and best practices for building robust tools and automation scripts.

## 📁 Example Files

### 1. cli-builder.ts
**Build powerful CLI tools with TypeScript**

Demonstrates:
- Basic CLI with Commander.js
- Advanced CLI with subcommands
- Interactive prompts with Inquirer
- Progress indicators and spinners
- Error handling and validation
- Configuration management

**Key Classes:**
- `TodoCLI` - Simple todo list CLI
- `ProjectCLI` - Multi-command project management tool
- `InteractiveCLI` - Interactive project setup wizard
- `BatchProcessorCLI` - CLI with progress indicators
- `ConfigurableCLI` - CLI with configuration management

**Usage:**
```typescript
import { TodoCLI, ProjectCLI } from './cli-builder';

// Simple todo CLI
const todoCLI = new TodoCLI();
await todoCLI.init();
await todoCLI.add('Write documentation');
await todoCLI.list();

// Project CLI with commands
const projectCLI = new ProjectCLI();
projectCLI.run(process.argv);
```

### 2. file-processing.ts
**Process files efficiently in batch and streams**

Demonstrates:
- Batch file processing with concurrency control
- Stream processing for large files
- File splitting and merging
- Directory operations (copy, cleanup, search)
- File watching and monitoring
- Backup and restore operations
- Transformation pipelines

**Key Classes:**
- `BatchFileProcessor` - Process multiple files in parallel
- `StreamFileProcessor` - Handle large files efficiently
- `FileSystemHelper` - Common file system operations
- `FileWatcher` - Monitor file system changes
- `BackupManager` - Backup and restore files
- `FileTransformPipeline` - Chain file transformations

**Usage:**
```typescript
import { BatchFileProcessor, StreamFileProcessor } from './file-processing';

// Batch processing
const processor = new BatchFileProcessor();
await processor.processFiles(
  ['file1.txt', 'file2.txt'],
  async (file) => {
    // Your processing logic
  },
  { concurrency: 5 }
);

// Stream processing for large files
const streamProcessor = new StreamFileProcessor();
await streamProcessor.processLargeFile(
  'large-file.txt',
  'output.txt',
  line => line.toUpperCase()
);
```

### 3. data-conversion.ts
**Convert between data formats seamlessly**

Demonstrates:
- JSON ↔ CSV conversion
- JSON ↔ XML conversion
- JSON ↔ YAML conversion
- Data transformation and mapping
- Schema validation with Zod
- Encoding conversions (Base64, Hex, URL)
- Universal format converter

**Key Classes:**
- `JSONToCSVConverter` - JSON/CSV conversion
- `XMLConverter` - XML/JSON conversion
- `YAMLConverter` - YAML/JSON conversion
- `DataTransformer` - Transform and map data structures
- `DataValidator` - Validate with schemas
- `EncodingConverter` - Various encoding conversions
- `UniversalConverter` - Convert between any supported format

**Usage:**
```typescript
import { JSONToCSVConverter, DataTransformer } from './data-conversion';

// Convert JSON to CSV
const converter = new JSONToCSVConverter();
const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
const csv = converter.jsonToCSV(users);

// Transform data
const transformer = new DataTransformer();
const transformed = transformer.transform(users, {
  userId: 'id',
  fullName: 'name',
  isActive: (user) => true,
});
```

### 4. code-generation.ts
**Generate code from templates and specifications**

Demonstrates:
- Template-based code generation with Handlebars
- React component generation
- API client generation from specs
- Database model generation (Prisma, TypeORM, Mongoose)
- Test file generation
- CRUD operations generation

**Key Classes:**
- `TemplateGenerator` - Generate code from templates
- `ReactComponentGenerator` - Generate React components
- `APIClientGenerator` - Generate API clients
- `DatabaseModelGenerator` - Generate database models
- `TestGenerator` - Generate test files
- `CRUDGenerator` - Generate CRUD operations

**Usage:**
```typescript
import { ReactComponentGenerator, APIClientGenerator } from './code-generation';

// Generate React component
const generator = new ReactComponentGenerator();
await generator.generate({
  name: 'UserProfile',
  type: 'functional',
  props: [{ name: 'userId', type: 'string' }],
  hooks: ['useState', 'useEffect'],
}, './output');

// Generate API client
const apiGen = new APIClientGenerator();
const client = apiGen.generateClient({
  baseUrl: 'https://api.example.com',
  name: 'User',
  endpoints: [
    { method: 'GET', path: '/users', name: 'getUsers' }
  ],
});
```

### 5. automation-scripts.ts
**Automate repetitive tasks and workflows**

Demonstrates:
- Task scheduling with cron
- Workflow automation with retries
- File system automation (cleanup, organize, rename)
- Git automation (commit, push, sync)
- Deployment automation
- Database backup automation

**Key Classes:**
- `TaskScheduler` - Schedule tasks with cron
- `WorkflowAutomation` - Execute multi-step workflows
- `FileSystemAutomation` - Automate file operations
- `GitAutomation` - Automate Git operations
- `DeploymentAutomation` - Automate deployments
- `DatabaseBackupAutomation` - Automate database backups

**Usage:**
```typescript
import { TaskScheduler, WorkflowAutomation } from './automation-scripts';

// Schedule a task
const scheduler = new TaskScheduler();
scheduler.addTask({
  id: 'daily-backup',
  name: 'Daily Backup',
  schedule: '0 2 * * *', // Every day at 2 AM
  enabled: true,
  task: async () => {
    console.log('Performing backup...');
  },
});

// Execute workflow
const workflow = new WorkflowAutomation();
await workflow.executeWorkflow({
  name: 'Build and Deploy',
  steps: [
    { name: 'Build', execute: async () => { /* build */ } },
    { name: 'Test', execute: async () => { /* test */ } },
    { name: 'Deploy', execute: async () => { /* deploy */ } },
  ],
});
```

### 6. logging-utilities.ts
**Implement comprehensive logging strategies**

Demonstrates:
- Structured logging with log levels
- Colored console output
- File logging with rotation
- Multi-transport logging
- Performance logging
- Request/response logging
- Error tracking

**Key Classes:**
- `Logger` - Basic logger with log levels
- `ColoredLogger` - Console logger with colors
- `FileLogger` - Log to files with rotation
- `MultiTransportLogger` - Log to multiple destinations
- `StructuredLogger` - JSON structured logging
- `PerformanceLogger` - Measure and log performance
- `RequestLogger` - HTTP request/response logging
- `ErrorTracker` - Track and analyze errors

**Usage:**
```typescript
import { ColoredLogger, PerformanceLogger, LogLevel } from './logging-utilities';

// Basic logging
const logger = new ColoredLogger(LogLevel.DEBUG);
logger.info('Application started');
logger.error('Error occurred', new Error('Something went wrong'));

// Performance logging
const perfLogger = new PerformanceLogger(logger);
await perfLogger.measure('database-query', async () => {
  // Your operation
  return result;
});
```

## 🚀 Getting Started

### Prerequisites

Install required dependencies:

```bash
npm install commander inquirer chalk ora handlebars prettier \
  csv-parse js-yaml xml2js zod node-cron axios nodemailer \
  @types/node @types/inquirer @types/node-cron
```

### Running Examples

Each example file can be run directly:

```bash
# Run CLI builder examples
npx ts-node examples/cli-builder.ts

# Run file processing examples
npx ts-node examples/file-processing.ts

# Run data conversion examples
npx ts-node examples/data-conversion.ts

# Run code generation examples
npx ts-node examples/code-generation.ts

# Run automation examples
npx ts-node examples/automation-scripts.ts

# Run logging examples
npx ts-node examples/logging-utilities.ts
```

### Importing in Your Projects

```typescript
// Import specific utilities
import { TodoCLI, ProjectCLI } from './examples/cli-builder';
import { BatchFileProcessor } from './examples/file-processing';
import { JSONToCSVConverter } from './examples/data-conversion';
import { TemplateGenerator } from './examples/code-generation';
import { TaskScheduler } from './examples/automation-scripts';
import { ColoredLogger, LogLevel } from './examples/logging-utilities';

// Use in your code
const logger = new ColoredLogger(LogLevel.INFO);
const processor = new BatchFileProcessor();
const converter = new JSONToCSVConverter();
```

## 💡 Use Cases

### CLI Tools
- Build command-line applications
- Create interactive setup wizards
- Process files from command line
- System administration tools

### File Processing
- Batch process documents
- Convert file formats
- Clean up old files
- Monitor directories for changes

### Data Conversion
- Import/export data between systems
- Transform API responses
- Validate data against schemas
- Convert configuration files

### Code Generation
- Generate boilerplate code
- Create API clients from specs
- Generate database models
- Scaffold new projects

### Automation
- Schedule maintenance tasks
- Automate deployments
- Backup databases
- Sync repositories

### Logging
- Application monitoring
- Performance tracking
- Error analysis
- Audit trails

## 🛠️ Best Practices

### Error Handling
- Always wrap async operations in try-catch
- Use meaningful error messages
- Log errors with context
- Implement retry logic where appropriate

### Performance
- Use streaming for large files
- Implement concurrency control
- Add timeouts to prevent hanging
- Monitor and log performance metrics

### Security
- Validate all inputs
- Sanitize file paths
- Use environment variables for secrets
- Implement proper authentication

### Testing
- Write unit tests for utilities
- Test error scenarios
- Mock external dependencies
- Use integration tests for workflows

### Maintainability
- Use TypeScript for type safety
- Write clear documentation
- Follow consistent coding style
- Keep functions small and focused

## 📚 Additional Resources

### Related Tools
- **Commander.js** - CLI framework
- **Inquirer** - Interactive prompts
- **Chalk** - Terminal colors
- **Prettier** - Code formatting
- **Zod** - Schema validation
- **node-cron** - Task scheduling

### Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js API](https://nodejs.org/api/)
- [Commander.js Guide](https://github.com/tj/commander.js)
- [Inquirer.js Guide](https://github.com/SBoudrias/Inquirer.js)

## 🤝 Contributing

Feel free to extend these examples with additional patterns and use cases. Each example is designed to be:
- Self-contained and runnable
- Well-documented
- Type-safe with TypeScript
- Production-ready

## 📄 License

These examples are provided as educational resources and can be freely used and modified for your projects.
