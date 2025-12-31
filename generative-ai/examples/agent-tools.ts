/**
 * Agent Tools Examples
 *
 * This file demonstrates:
 * - Define tools
 * - Tool execution
 * - Multi-step reasoning
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. DEFINE TOOLS
// ============================================================================

/**
 * Tool definition interface
 */
interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  execute: (params: Record<string, unknown>) => Promise<unknown> | unknown;
}

/**
 * Calculator tool
 */
const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic arithmetic operations.',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['add', 'subtract', 'multiply', 'divide', 'power', 'sqrt'],
        description: 'The mathematical operation to perform',
      },
      a: {
        type: 'number',
        description: 'First operand',
      },
      b: {
        type: 'number',
        description: 'Second operand (not required for sqrt)',
      },
    },
    required: ['operation', 'a'],
  },
  execute: (params) => {
    const { operation, a, b } = params as { operation: string; a: number; b?: number };

    switch (operation) {
      case 'add':
        return a + (b || 0);
      case 'subtract':
        return a - (b || 0);
      case 'multiply':
        return a * (b || 1);
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return a / (b || 1);
      case 'power':
        return Math.pow(a, b || 2);
      case 'sqrt':
        return Math.sqrt(a);
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
};

/**
 * Weather tool (mock implementation)
 */
const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather information for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'Temperature unit',
      },
    },
    required: ['location'],
  },
  execute: (params) => {
    const { location, unit = 'celsius' } = params as { location: string; unit?: string };

    // Mock weather data
    return {
      location,
      temperature: unit === 'celsius' ? 22 : 72,
      unit,
      condition: 'Partly cloudy',
      humidity: 65,
      wind_speed: 12,
    };
  },
};

/**
 * Database query tool (mock implementation)
 */
const databaseTool: ToolDefinition = {
  name: 'query_database',
  description: 'Query the database for information',
  parameters: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'Table name to query',
      },
      filters: {
        type: 'object',
        description: 'Filter conditions',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results',
      },
    },
    required: ['table'],
  },
  execute: (params) => {
    const { table, filters, limit = 10 } = params as {
      table: string;
      filters?: Record<string, unknown>;
      limit?: number;
    };

    // Mock database response
    const mockData: Record<string, unknown[]> = {
      users: [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
        { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'user' },
      ],
      products: [
        { id: 101, name: 'Laptop', price: 999, category: 'electronics' },
        { id: 102, name: 'Mouse', price: 25, category: 'electronics' },
        { id: 103, name: 'Desk', price: 299, category: 'furniture' },
      ],
    };

    let results = mockData[table] || [];

    // Apply filters
    if (filters) {
      results = results.filter(item => {
        return Object.entries(filters).every(([key, value]) => item[key] === value);
      });
    }

    return {
      table,
      count: results.length,
      results: results.slice(0, limit),
    };
  },
};

/**
 * Web search tool (mock implementation)
 */
const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query',
      },
      num_results: {
        type: 'number',
        description: 'Number of results to return',
      },
    },
    required: ['query'],
  },
  execute: (params) => {
    const { query, num_results = 5 } = params as { query: string; num_results?: number };

    // Mock search results
    return {
      query,
      results: Array.from({ length: num_results }, (_, i) => ({
        title: `Result ${i + 1} for "${query}"`,
        url: `https://example.com/result-${i + 1}`,
        snippet: `This is a mock search result about ${query}. It contains relevant information...`,
      })),
    };
  },
};

/**
 * File operations tool (mock implementation)
 */
const fileOperationsTool: ToolDefinition = {
  name: 'file_operations',
  description: 'Perform file system operations like read, write, list',
  parameters: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['read', 'write', 'list', 'delete'],
        description: 'File operation to perform',
      },
      path: {
        type: 'string',
        description: 'File or directory path',
      },
      content: {
        type: 'string',
        description: 'Content to write (for write operation)',
      },
    },
    required: ['operation', 'path'],
  },
  execute: (params) => {
    const { operation, path, content } = params as {
      operation: string;
      path: string;
      content?: string;
    };

    // Mock file operations
    switch (operation) {
      case 'read':
        return { path, content: `Mock content of ${path}` };
      case 'write':
        return { path, success: true, bytes_written: content?.length || 0 };
      case 'list':
        return {
          path,
          files: ['file1.txt', 'file2.txt', 'directory1/'],
        };
      case 'delete':
        return { path, success: true };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
};

// ============================================================================
// 2. TOOL EXECUTION
// ============================================================================

/**
 * Tool registry for managing available tools
 */
class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a tool
   */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all tools as OpenAI function definitions
   */
  getOpenAITools(): OpenAI.Chat.ChatCompletionTool[] {
    return Array.from(this.tools.values()).map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Execute a tool
   */
  async execute(name: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      throw error;
    }
  }

  /**
   * Get list of all tool names
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

/**
 * Simple agent executor
 */
class AgentExecutor {
  private registry: ToolRegistry;
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private maxIterations: number;

  constructor(registry: ToolRegistry, maxIterations: number = 10) {
    this.registry = registry;
    this.maxIterations = maxIterations;
  }

  /**
   * Execute agent with tools
   */
  async execute(
    userInput: string,
    systemPrompt?: string
  ): Promise<{
    response: string;
    toolCalls: Array<{ tool: string; params: unknown; result: unknown }>;
    iterations: number;
  }> {
    this.conversationHistory = [];

    if (systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    this.conversationHistory.push({
      role: 'user',
      content: userInput,
    });

    const toolCalls: Array<{ tool: string; params: unknown; result: unknown }> = [];
    let iterations = 0;

    while (iterations < this.maxIterations) {
      iterations++;
      console.log(`\nIteration ${iterations}`);

      // Call OpenAI with available tools
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: this.conversationHistory,
        tools: this.registry.getOpenAITools(),
        tool_choice: 'auto',
      });

      const message = response.choices[0].message;
      this.conversationHistory.push(message);

      // Check if model wants to use tools
      if (!message.tool_calls || message.tool_calls.length === 0) {
        // No more tool calls, return final response
        return {
          response: message.content || '',
          toolCalls,
          iterations,
        };
      }

      // Execute tool calls
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolParams = JSON.parse(toolCall.function.arguments);

        console.log(`  Calling tool: ${toolName}`);
        console.log(`  Parameters:`, toolParams);

        const result = await this.registry.execute(toolName, toolParams);
        console.log(`  Result:`, result);

        toolCalls.push({
          tool: toolName,
          params: toolParams,
          result,
        });

        // Add tool result to conversation
        this.conversationHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
    }

    throw new Error(`Max iterations (${this.maxIterations}) reached`);
  }

  /**
   * Get conversation history
   */
  getHistory(): OpenAI.Chat.ChatCompletionMessageParam[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}

// ============================================================================
// 3. MULTI-STEP REASONING
// ============================================================================

/**
 * Example: Multi-step problem solving
 */
async function multiStepReasoningExample(): Promise<void> {
  const registry = new ToolRegistry();

  // Register tools
  registry.register(calculatorTool);
  registry.register(weatherTool);
  registry.register(databaseTool);

  const agent = new AgentExecutor(registry, 15);

  const systemPrompt = `You are a helpful assistant with access to various tools.
Think step by step and use tools as needed to answer questions accurately.
Always explain your reasoning.`;

  const query = `What is the average price of electronics in our product database?
Then calculate what the total would be if we had 10 of each item.`;

  console.log('User Query:', query);
  console.log('='.repeat(80));

  const result = await agent.execute(query, systemPrompt);

  console.log('\n' + '='.repeat(80));
  console.log('Final Response:');
  console.log(result.response);
  console.log(`\nCompleted in ${result.iterations} iterations`);
  console.log(`Used ${result.toolCalls.length} tool calls`);
}

/**
 * Example: Planning and execution
 */
async function planningExample(): Promise<void> {
  const registry = new ToolRegistry();

  registry.register(calculatorTool);
  registry.register(weatherTool);
  registry.register(webSearchTool);

  const agent = new AgentExecutor(registry);

  const systemPrompt = `You are a planning assistant. Break down complex tasks into steps.
First, create a plan, then execute it using available tools.`;

  const query = `I need to plan a trip. First check the weather in Paris,
then search for information about top attractions, and calculate a budget
assuming $100 per day for 5 days plus a $500 flight.`;

  console.log('Planning Query:', query);
  console.log('='.repeat(80));

  const result = await agent.execute(query, systemPrompt);

  console.log('\n' + '='.repeat(80));
  console.log('Plan and Results:');
  console.log(result.response);
}

/**
 * Example: Chain of thought reasoning
 */
async function chainOfThoughtExample(): Promise<void> {
  const registry = new ToolRegistry();
  registry.register(calculatorTool);

  const agent = new AgentExecutor(registry);

  const systemPrompt = `You are a math tutor. Solve problems step by step,
explaining your reasoning clearly. Use the calculator tool for computations.`;

  const query = `If a train travels at 60 mph for 2.5 hours, then increases
speed to 80 mph for another 1.5 hours, what is the total distance traveled?`;

  console.log('Math Problem:', query);
  console.log('='.repeat(80));

  const result = await agent.execute(query, systemPrompt);

  console.log('\n' + '='.repeat(80));
  console.log('Solution:');
  console.log(result.response);
}

/**
 * Example: Autonomous agent
 */
async function autonomousAgentExample(): Promise<void> {
  const registry = new ToolRegistry();

  // Register all available tools
  registry.register(calculatorTool);
  registry.register(weatherTool);
  registry.register(databaseTool);
  registry.register(webSearchTool);
  registry.register(fileOperationsTool);

  const agent = new AgentExecutor(registry, 20);

  const systemPrompt = `You are an autonomous AI agent capable of complex reasoning.
You have access to multiple tools for different tasks.

Your capabilities:
- Perform calculations
- Check weather
- Query databases
- Search the web
- Manage files

Approach tasks systematically:
1. Understand the request
2. Plan your approach
3. Use tools as needed
4. Verify results
5. Provide clear explanations`;

  const query = `Analyze our user database to find admin users,
check if there are more than 2, and if so, calculate what percentage
of total users they represent.`;

  console.log('Complex Query:', query);
  console.log('='.repeat(80));

  const result = await agent.execute(query, systemPrompt);

  console.log('\n' + '='.repeat(80));
  console.log('Agent Response:');
  console.log(result.response);
  console.log('\nTool Usage Summary:');
  result.toolCalls.forEach((call, index) => {
    console.log(`${index + 1}. ${call.tool}: ${JSON.stringify(call.params)}`);
  });
}

/**
 * Example: Error handling and recovery
 */
async function errorHandlingExample(): Promise<void> {
  const registry = new ToolRegistry();

  // Add error-prone calculator
  const errorProneCalculator: ToolDefinition = {
    ...calculatorTool,
    execute: (params) => {
      const { operation, a, b } = params as { operation: string; a: number; b?: number };

      if (operation === 'divide' && b === 0) {
        throw new Error('Cannot divide by zero');
      }

      return calculatorTool.execute(params);
    },
  };

  registry.register(errorProneCalculator);

  const agent = new AgentExecutor(registry);

  const systemPrompt = `You are a helpful assistant. If a tool fails,
acknowledge the error and try an alternative approach.`;

  const query = `Calculate 100 divided by 0, and if that doesn't work,
explain why and suggest what the mathematical limit would be.`;

  console.log('Error Handling Query:', query);
  console.log('='.repeat(80));

  try {
    const result = await agent.execute(query, systemPrompt);

    console.log('\n' + '='.repeat(80));
    console.log('Response:');
    console.log(result.response);
  } catch (error) {
    console.error('Agent execution failed:', error);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== Agent Tools Examples ===\n');

    console.log('\n1. Multi-Step Reasoning');
    console.log('------------------------');
    await multiStepReasoningExample();

    console.log('\n\n2. Planning and Execution');
    console.log('--------------------------');
    await planningExample();

    console.log('\n\n3. Chain of Thought Reasoning');
    console.log('------------------------------');
    await chainOfThoughtExample();

    console.log('\n\n4. Autonomous Agent');
    console.log('--------------------');
    await autonomousAgentExample();

    console.log('\n\n5. Error Handling and Recovery');
    console.log('-------------------------------');
    await errorHandlingExample();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  ToolDefinition,
  ToolRegistry,
  AgentExecutor,
  calculatorTool,
  weatherTool,
  databaseTool,
  webSearchTool,
  fileOperationsTool,
  multiStepReasoningExample,
  planningExample,
  chainOfThoughtExample,
  autonomousAgentExample,
};
