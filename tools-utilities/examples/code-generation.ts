/**
 * Code Generation Examples
 *
 * Demonstrates comprehensive code generation patterns including:
 * - Template-based code generation
 * - AST-based code generation
 * - API client generation
 * - Database model generation
 * - Test file generation
 * - Documentation generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';
import * as prettier from 'prettier';

// ============================================================================
// Example 1: Template-Based Code Generation
// ============================================================================

interface TemplateData {
  [key: string]: any;
}

class TemplateGenerator {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  /**
   * Register a template
   */
  registerTemplate(name: string, templateString: string): void {
    const template = Handlebars.compile(templateString);
    this.templates.set(name, template);
  }

  /**
   * Register template from file
   */
  async registerTemplateFromFile(name: string, filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    this.registerTemplate(name, content);
  }

  /**
   * Generate code from template
   */
  generate(templateName: string, data: TemplateData): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    return template(data);
  }

  /**
   * Generate and write to file
   */
  async generateToFile(
    templateName: string,
    data: TemplateData,
    outputPath: string,
    options: { format?: boolean } = {}
  ): Promise<void> {
    let code = this.generate(templateName, data);

    if (options.format) {
      code = await this.formatCode(code, outputPath);
    }

    await fs.writeFile(outputPath, code);
  }

  /**
   * Format generated code with Prettier
   */
  private async formatCode(code: string, filePath: string): Promise<string> {
    const parser = this.getParser(filePath);

    try {
      return await prettier.format(code, {
        parser,
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 2,
      });
    } catch (error) {
      console.warn('Failed to format code, returning unformatted');
      return code;
    }
  }

  private getParser(filePath: string): string {
    const ext = path.extname(filePath);
    const parserMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'babel',
      '.jsx': 'babel',
      '.json': 'json',
      '.css': 'css',
      '.scss': 'scss',
      '.html': 'html',
      '.md': 'markdown',
    };
    return parserMap[ext] || 'babel';
  }
}

// ============================================================================
// Example 2: React Component Generator
// ============================================================================

interface ComponentConfig {
  name: string;
  type: 'functional' | 'class';
  props?: {
    name: string;
    type: string;
    optional?: boolean;
    default?: string;
  }[];
  state?: {
    name: string;
    type: string;
    initialValue: string;
  }[];
  hooks?: string[];
  styled?: boolean;
}

class ReactComponentGenerator {
  private templateGenerator: TemplateGenerator;

  constructor() {
    this.templateGenerator = new TemplateGenerator();
    this.registerTemplates();
  }

  private registerTemplates(): void {
    // Functional component template
    const functionalTemplate = `
import React{{#if hooks}}, { {{#each hooks}}{{this}}{{#unless @last}}, {{/unless}}{{/each}} }{{/if}} from 'react';
{{#if styled}}
import styled from 'styled-components';
{{/if}}

interface {{name}}Props {
  {{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
  {{/each}}
}

{{#if styled}}
const Styled{{name}} = styled.div\`
  /* Add your styles here */
\`;
{{/if}}

export const {{name}}: React.FC<{{name}}Props> = ({
  {{#each props}}
  {{name}}{{#if default}} = {{default}}{{/if}},
  {{/each}}
}) => {
  {{#each state}}
  const [{{name}}, set{{capitalize name}}] = useState<{{type}}>({{initialValue}});
  {{/each}}

  return (
    {{#if styled}}
    <Styled{{name}}>
    {{else}}
    <div>
    {{/if}}
      <h1>{{name}} Component</h1>
      {/* Add your component content here */}
    {{#if styled}}
    </Styled{{name}}>
    {{else}}
    </div>
    {{/if}}
  );
};
    `.trim();

    // Class component template
    const classTemplate = `
import React, { Component } from 'react';
{{#if styled}}
import styled from 'styled-components';
{{/if}}

interface {{name}}Props {
  {{#each props}}
  {{name}}{{#if optional}}?{{/if}}: {{type}};
  {{/each}}
}

interface {{name}}State {
  {{#each state}}
  {{name}}: {{type}};
  {{/each}}
}

{{#if styled}}
const Styled{{name}} = styled.div\`
  /* Add your styles here */
\`;
{{/if}}

export class {{name}} extends Component<{{name}}Props, {{name}}State> {
  constructor(props: {{name}}Props) {
    super(props);
    this.state = {
      {{#each state}}
      {{name}}: {{initialValue}},
      {{/each}}
    };
  }

  render() {
    return (
      {{#if styled}}
      <Styled{{name}}>
      {{else}}
      <div>
      {{/if}}
        <h1>{{name}} Component</h1>
        {/* Add your component content here */}
      {{#if styled}}
      </Styled{{name}}>
      {{else}}
      </div>
      {{/if}}
    );
  }
}
    `.trim();

    // Register helpers
    Handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    this.templateGenerator.registerTemplate('functional', functionalTemplate);
    this.templateGenerator.registerTemplate('class', classTemplate);
  }

  /**
   * Generate React component
   */
  async generate(config: ComponentConfig, outputDir: string): Promise<string> {
    const templateName = config.type;
    const fileName = `${config.name}.tsx`;
    const outputPath = path.join(outputDir, fileName);

    await this.templateGenerator.generateToFile(
      templateName,
      config,
      outputPath,
      { format: true }
    );

    return outputPath;
  }
}

// ============================================================================
// Example 3: API Client Generator
// ============================================================================

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  name: string;
  description?: string;
  params?: { name: string; type: string; required: boolean }[];
  body?: { name: string; type: string }[];
  response?: string;
}

interface APISpec {
  baseUrl: string;
  name: string;
  endpoints: APIEndpoint[];
}

class APIClientGenerator {
  /**
   * Generate TypeScript API client from spec
   */
  generateClient(spec: APISpec): string {
    const endpoints = spec.endpoints.map(endpoint => {
      return this.generateEndpointMethod(endpoint);
    });

    return `
import axios, { AxiosInstance } from 'axios';

export class ${spec.name}Client {
  private client: AxiosInstance;

  constructor(baseURL: string = '${spec.baseUrl}') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
  }

${endpoints.join('\n\n')}
}
    `.trim();
  }

  private generateEndpointMethod(endpoint: APIEndpoint): string {
    const params = endpoint.params || [];
    const pathParams = params.filter(p => endpoint.path.includes(`:${p.name}`));
    const queryParams = params.filter(
      p => !endpoint.path.includes(`:${p.name}`)
    );

    const methodParams: string[] = [];
    const pathWithParams = endpoint.path.replace(/:(\w+)/g, '${$1}');

    // Add path parameters
    pathParams.forEach(param => {
      methodParams.push(`${param.name}: ${param.type}`);
    });

    // Add query parameters
    if (queryParams.length > 0) {
      const queryParamType = `{ ${queryParams
        .map(p => `${p.name}${p.required ? '' : '?'}: ${p.type}`)
        .join('; ')} }`;
      methodParams.push(`params${queryParams.every(p => !p.required) ? '?' : ''}: ${queryParamType}`);
    }

    // Add request body
    if (endpoint.body && endpoint.body.length > 0) {
      const bodyType = `{ ${endpoint.body
        .map(b => `${b.name}: ${b.type}`)
        .join('; ')} }`;
      methodParams.push(`data: ${bodyType}`);
    }

    const responseType = endpoint.response || 'any';

    let methodBody = '';
    if (endpoint.method === 'GET' || endpoint.method === 'DELETE') {
      methodBody = `
    return this.client.${endpoint.method.toLowerCase()}<${responseType}>(\`${pathWithParams}\`, ${
        queryParams.length > 0 ? '{ params }' : ''
      });
      `.trim();
    } else {
      methodBody = `
    return this.client.${endpoint.method.toLowerCase()}<${responseType}>(\`${pathWithParams}\`, data${
        queryParams.length > 0 ? ', { params }' : ''
      });
      `.trim();
    }

    return `
  /**
   * ${endpoint.description || endpoint.name}
   */
  async ${endpoint.name}(${methodParams.join(', ')}): Promise<${responseType}> {
    ${methodBody}
  }
    `.trim();
  }

  /**
   * Generate client from OpenAPI spec
   */
  async generateFromOpenAPI(
    openApiSpec: any,
    outputPath: string
  ): Promise<void> {
    // This is a simplified version
    // In production, use tools like openapi-typescript or swagger-codegen

    const endpoints: APIEndpoint[] = [];

    for (const [path, methods] of Object.entries(openApiSpec.paths)) {
      for (const [method, details] of Object.entries(methods as any)) {
        const endpoint: APIEndpoint = {
          method: method.toUpperCase() as any,
          path,
          name: details.operationId || this.generateMethodName(method, path),
          description: details.summary,
        };
        endpoints.push(endpoint);
      }
    }

    const spec: APISpec = {
      baseUrl: openApiSpec.servers?.[0]?.url || '',
      name: openApiSpec.info?.title?.replace(/\s+/g, '') || 'API',
      endpoints,
    };

    const code = this.generateClient(spec);
    const formatted = await prettier.format(code, {
      parser: 'typescript',
      singleQuote: true,
    });

    await fs.writeFile(outputPath, formatted);
  }

  private generateMethodName(method: string, path: string): string {
    const parts = path.split('/').filter(p => p && !p.startsWith(':'));
    return method.toLowerCase() + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  }
}

// ============================================================================
// Example 4: Database Model Generator
// ============================================================================

interface Field {
  name: string;
  type: string;
  nullable?: boolean;
  unique?: boolean;
  default?: any;
  relation?: {
    model: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  };
}

interface ModelSchema {
  name: string;
  table: string;
  fields: Field[];
  timestamps?: boolean;
}

class DatabaseModelGenerator {
  /**
   * Generate Prisma schema
   */
  generatePrismaModel(schema: ModelSchema): string {
    const fields = schema.fields.map(field => {
      let fieldDef = `  ${field.name} ${field.type}`;

      const attributes: string[] = [];

      if (field.unique) attributes.push('@unique');
      if (field.default !== undefined) {
        attributes.push(`@default(${JSON.stringify(field.default)})`);
      }

      if (attributes.length > 0) {
        fieldDef += ' ' + attributes.join(' ');
      }

      if (!field.nullable) {
        // Prisma uses optional (?) for nullable
      } else {
        fieldDef = `  ${field.name} ${field.type}?`;
      }

      return fieldDef;
    });

    if (schema.timestamps) {
      fields.push('  createdAt DateTime @default(now())');
      fields.push('  updatedAt DateTime @updatedAt');
    }

    return `
model ${schema.name} {
  id Int @id @default(autoincrement())
${fields.join('\n')}

  @@map("${schema.table}")
}
    `.trim();
  }

  /**
   * Generate TypeORM entity
   */
  generateTypeORMEntity(schema: ModelSchema): string {
    const fields = schema.fields.map(field => {
      const decorators: string[] = [];

      if (field.unique) {
        decorators.push('@Column({ unique: true })');
      } else {
        decorators.push('@Column()');
      }

      return `  ${decorators.join('\n  ')}\n  ${field.name}${field.nullable ? '?' : ''}: ${field.type};`;
    });

    return `
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${schema.table}')
export class ${schema.name} {
  @PrimaryGeneratedColumn()
  id: number;

${fields.join('\n\n')}

${
  schema.timestamps
    ? `  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;`
    : ''
}
}
    `.trim();
  }

  /**
   * Generate Mongoose schema
   */
  generateMongooseSchema(schema: ModelSchema): string {
    const fields = schema.fields.map(field => {
      const fieldConfig: string[] = [];
      fieldConfig.push(`type: ${field.type}`);

      if (field.nullable === false) {
        fieldConfig.push('required: true');
      }

      if (field.unique) {
        fieldConfig.push('unique: true');
      }

      if (field.default !== undefined) {
        fieldConfig.push(`default: ${JSON.stringify(field.default)}`);
      }

      return `  ${field.name}: { ${fieldConfig.join(', ')} }`;
    });

    return `
import { Schema, model } from 'mongoose';

const ${schema.name}Schema = new Schema({
${fields.join(',\n')}
}${schema.timestamps ? ', { timestamps: true }' : ''});

export const ${schema.name} = model('${schema.name}', ${schema.name}Schema);
    `.trim();
  }
}

// ============================================================================
// Example 5: Test Generator
// ============================================================================

interface TestConfig {
  fileName: string;
  description: string;
  testCases: {
    name: string;
    description: string;
    arrange?: string[];
    act?: string[];
    assert?: string[];
  }[];
}

class TestGenerator {
  /**
   * Generate Jest test file
   */
  generateJestTest(config: TestConfig): string {
    const testCases = config.testCases
      .map(
        testCase => `
  it('${testCase.description}', () => {
    // Arrange
${(testCase.arrange || []).map(line => `    ${line}`).join('\n')}

    // Act
${(testCase.act || []).map(line => `    ${line}`).join('\n')}

    // Assert
${(testCase.assert || []).map(line => `    ${line}`).join('\n')}
  });
    `.trim()
      )
      .join('\n\n');

    return `
import { ${config.fileName} } from './${config.fileName}';

describe('${config.description}', () => {
${testCases}
});
    `.trim();
  }

  /**
   * Generate unit tests for a class
   */
  generateClassTests(
    className: string,
    methods: { name: string; description: string }[]
  ): string {
    const tests = methods
      .map(
        method => `
  describe('${method.name}', () => {
    it('${method.description}', () => {
      // Arrange
      const instance = new ${className}();

      // Act
      const result = instance.${method.name}();

      // Assert
      expect(result).toBeDefined();
    });
  });
    `.trim()
      )
      .join('\n\n');

    return `
import { ${className} } from './${className}';

describe('${className}', () => {
${tests}
});
    `.trim();
  }
}

// ============================================================================
// Example 6: CRUD Generator
// ============================================================================

interface CRUDConfig {
  model: string;
  fields: Field[];
  includeAuth?: boolean;
  framework: 'express' | 'fastify' | 'koa';
}

class CRUDGenerator {
  /**
   * Generate complete CRUD operations
   */
  generateExpressCRUD(config: CRUDConfig): {
    controller: string;
    routes: string;
    service: string;
  } {
    const modelLower = config.model.toLowerCase();
    const modelPlural = modelLower + 's';

    const controller = `
import { Request, Response } from 'express';
import { ${config.model}Service } from '../services/${modelLower}.service';

export class ${config.model}Controller {
  private service: ${config.model}Service;

  constructor() {
    this.service = new ${config.model}Service();
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const items = await this.service.findAll();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const item = await this.service.findById(parseInt(req.params.id));
      if (!item) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const item = await this.service.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const item = await this.service.update(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.service.delete(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}
    `.trim();

    const routes = `
import { Router } from 'express';
import { ${config.model}Controller } from '../controllers/${modelLower}.controller';
${config.includeAuth ? "import { authMiddleware } from '../middleware/auth';" : ''}

const router = Router();
const controller = new ${config.model}Controller();

router.get('/${modelPlural}', ${config.includeAuth ? 'authMiddleware, ' : ''}controller.getAll.bind(controller));
router.get('/${modelPlural}/:id', ${config.includeAuth ? 'authMiddleware, ' : ''}controller.getById.bind(controller));
router.post('/${modelPlural}', ${config.includeAuth ? 'authMiddleware, ' : ''}controller.create.bind(controller));
router.put('/${modelPlural}/:id', ${config.includeAuth ? 'authMiddleware, ' : ''}controller.update.bind(controller));
router.delete('/${modelPlural}/:id', ${config.includeAuth ? 'authMiddleware, ' : ''}controller.delete.bind(controller));

export default router;
    `.trim();

    const service = `
import { ${config.model} } from '../models/${modelLower}.model';

export class ${config.model}Service {
  async findAll(): Promise<${config.model}[]> {
    // Implement database query
    return [];
  }

  async findById(id: number): Promise<${config.model} | null> {
    // Implement database query
    return null;
  }

  async create(data: Partial<${config.model}>): Promise<${config.model}> {
    // Implement database insert
    return {} as ${config.model};
  }

  async update(id: number, data: Partial<${config.model}>): Promise<${config.model}> {
    // Implement database update
    return {} as ${config.model};
  }

  async delete(id: number): Promise<void> {
    // Implement database delete
  }
}
    `.trim();

    return { controller, routes, service };
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateCodeGeneration() {
  console.log('=== Code Generation Examples ===\n');

  // Example 1: Generate React component
  const reactGenerator = new ReactComponentGenerator();
  const componentConfig: ComponentConfig = {
    name: 'UserProfile',
    type: 'functional',
    props: [
      { name: 'userId', type: 'string', optional: false },
      { name: 'showDetails', type: 'boolean', optional: true, default: 'true' },
    ],
    state: [
      { name: 'loading', type: 'boolean', initialValue: 'false' },
      { name: 'user', type: 'User | null', initialValue: 'null' },
    ],
    hooks: ['useState', 'useEffect'],
    styled: true,
  };

  // await reactGenerator.generate(componentConfig, './output');

  // Example 2: Generate API client
  const apiGenerator = new APIClientGenerator();
  const apiSpec: APISpec = {
    baseUrl: 'https://api.example.com',
    name: 'User',
    endpoints: [
      {
        method: 'GET',
        path: '/users',
        name: 'getUsers',
        description: 'Get all users',
        response: 'User[]',
      },
      {
        method: 'GET',
        path: '/users/:id',
        name: 'getUserById',
        description: 'Get user by ID',
        params: [{ name: 'id', type: 'string', required: true }],
        response: 'User',
      },
      {
        method: 'POST',
        path: '/users',
        name: 'createUser',
        description: 'Create a new user',
        body: [
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' },
        ],
        response: 'User',
      },
    ],
  };

  const apiClient = apiGenerator.generateClient(apiSpec);
  console.log('Generated API Client:\n');
  console.log(apiClient);
  console.log('\n');

  // Example 3: Generate database model
  const dbGenerator = new DatabaseModelGenerator();
  const modelSchema: ModelSchema = {
    name: 'User',
    table: 'users',
    fields: [
      { name: 'name', type: 'String', nullable: false },
      { name: 'email', type: 'String', nullable: false, unique: true },
      { name: 'age', type: 'Int', nullable: true },
    ],
    timestamps: true,
  };

  const prismaModel = dbGenerator.generatePrismaModel(modelSchema);
  console.log('Generated Prisma Model:\n');
  console.log(prismaModel);
  console.log('\n');

  // Example 4: Generate CRUD
  const crudGenerator = new CRUDGenerator();
  const crudConfig: CRUDConfig = {
    model: 'Product',
    fields: [
      { name: 'name', type: 'string' },
      { name: 'price', type: 'number' },
    ],
    includeAuth: true,
    framework: 'express',
  };

  const crud = crudGenerator.generateExpressCRUD(crudConfig);
  console.log('Generated CRUD Controller:\n');
  console.log(crud.controller.substring(0, 500) + '...');
  console.log('\n');
}

// Run if executed directly
if (require.main === module) {
  demonstrateCodeGeneration().catch(console.error);
}

export {
  TemplateGenerator,
  ReactComponentGenerator,
  APIClientGenerator,
  DatabaseModelGenerator,
  TestGenerator,
  CRUDGenerator,
};
