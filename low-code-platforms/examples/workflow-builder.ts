/**
 * Visual Workflow Builder - Low-Code Workflow Automation
 *
 * This example demonstrates:
 * - Visual workflow design patterns
 * - Node-based execution engine
 * - Branching and conditional logic
 * - Parallel execution
 * - Error handling and retry logic
 * - Workflow templates
 */

// ===========================
// Type Definitions
// ===========================

export type NodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'loop'
  | 'parallel'
  | 'delay'
  | 'transform'
  | 'subworkflow';

export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'event';
export type ActionType = 'http' | 'email' | 'database' | 'script' | 'notification';

export interface Position {
  x: number;
  y: number;
}

export interface Connection {
  sourceNode: string;
  sourcePort: string;
  targetNode: string;
  targetPort: string;
  condition?: string;
}

export interface NodeConfig {
  id: string;
  type: NodeType;
  name: string;
  description?: string;
  position: Position;
  config: Record<string, unknown>;
  retryPolicy?: {
    maxRetries: number;
    delayMs: number;
    backoff?: 'linear' | 'exponential';
  };
  timeout?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: NodeConfig[];
  connections: Connection[];
  variables: Record<string, unknown>;
  triggers: TriggerConfig[];
  metadata?: Record<string, unknown>;
}

export interface TriggerConfig {
  type: TriggerType;
  config: Record<string, unknown>;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  variables: Map<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  startTime: Date;
  currentNode?: string;
}

export interface ExecutionResult {
  executionId: string;
  success: boolean;
  output: unknown;
  error?: string;
  duration: number;
  nodeExecutions: Map<string, NodeExecutionResult>;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output: unknown;
  error?: string;
  startTime: Date;
  endTime: Date;
  retries: number;
}

// ===========================
// Visual Workflow Builder
// ===========================

export class VisualWorkflowBuilder {
  private workflow: Partial<WorkflowDefinition>;
  private nodes: Map<string, NodeConfig> = new Map();
  private connections: Connection[] = [];
  private nextX = 100;
  private nextY = 100;

  constructor(id: string, name: string, version = '1.0.0') {
    this.workflow = {
      id,
      name,
      version,
      variables: {},
      triggers: [],
    };
  }

  description(desc: string): this {
    this.workflow.description = desc;
    return this;
  }

  variable(name: string, value: unknown): this {
    if (!this.workflow.variables) {
      this.workflow.variables = {};
    }
    this.workflow.variables[name] = value;
    return this;
  }

  // ===========================
  // Trigger Nodes
  // ===========================

  manualTrigger(id: string, name: string): this {
    return this.addNode({
      id,
      type: 'trigger',
      name,
      position: this.getNextPosition(),
      config: { triggerType: 'manual' },
    });
  }

  webhookTrigger(id: string, name: string, config: {
    path: string;
    method?: string;
    auth?: string;
  }): this {
    this.workflow.triggers?.push({
      type: 'webhook',
      config,
    });

    return this.addNode({
      id,
      type: 'trigger',
      name,
      position: this.getNextPosition(),
      config: { triggerType: 'webhook', ...config },
    });
  }

  scheduleTrigger(id: string, name: string, cron: string): this {
    this.workflow.triggers?.push({
      type: 'schedule',
      config: { cron },
    });

    return this.addNode({
      id,
      type: 'trigger',
      name,
      position: this.getNextPosition(),
      config: { triggerType: 'schedule', cron },
    });
  }

  // ===========================
  // Action Nodes
  // ===========================

  httpAction(id: string, name: string, config: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
  }): this {
    return this.addNode({
      id,
      type: 'action',
      name,
      position: this.getNextPosition(),
      config: { actionType: 'http', ...config },
      timeout: config.timeout,
    });
  }

  emailAction(id: string, name: string, config: {
    to: string | string[];
    subject: string;
    body: string;
    from?: string;
    cc?: string[];
    attachments?: string[];
  }): this {
    return this.addNode({
      id,
      type: 'action',
      name,
      position: this.getNextPosition(),
      config: { actionType: 'email', ...config },
    });
  }

  databaseAction(id: string, name: string, config: {
    operation: 'query' | 'insert' | 'update' | 'delete';
    connection: string;
    query?: string;
    data?: Record<string, unknown>;
  }): this {
    return this.addNode({
      id,
      type: 'action',
      name,
      position: this.getNextPosition(),
      config: { actionType: 'database', ...config },
    });
  }

  scriptAction(id: string, name: string, script: string, language = 'javascript'): this {
    return this.addNode({
      id,
      type: 'action',
      name,
      position: this.getNextPosition(),
      config: { actionType: 'script', script, language },
    });
  }

  // ===========================
  // Control Flow Nodes
  // ===========================

  condition(id: string, name: string, expression: string): this {
    return this.addNode({
      id,
      type: 'condition',
      name,
      position: this.getNextPosition(),
      config: { expression },
    });
  }

  loop(id: string, name: string, config: {
    iterateOver: string;
    maxIterations?: number;
  }): this {
    return this.addNode({
      id,
      type: 'loop',
      name,
      position: this.getNextPosition(),
      config,
    });
  }

  parallel(id: string, name: string): this {
    return this.addNode({
      id,
      type: 'parallel',
      name,
      position: this.getNextPosition(),
      config: {},
    });
  }

  delay(id: string, name: string, durationMs: number): this {
    return this.addNode({
      id,
      type: 'delay',
      name,
      position: this.getNextPosition(),
      config: { duration: durationMs },
    });
  }

  transform(id: string, name: string, config: {
    input: string;
    output: string;
    transformation: string | Record<string, unknown>;
  }): this {
    return this.addNode({
      id,
      type: 'transform',
      name,
      position: this.getNextPosition(),
      config,
    });
  }

  subworkflow(id: string, name: string, workflowId: string, inputs?: Record<string, string>): this {
    return this.addNode({
      id,
      type: 'subworkflow',
      name,
      position: this.getNextPosition(),
      config: { workflowId, inputs },
    });
  }

  // ===========================
  // Connection Methods
  // ===========================

  connect(
    sourceNode: string,
    targetNode: string,
    config?: {
      sourcePort?: string;
      targetPort?: string;
      condition?: string;
    }
  ): this {
    this.connections.push({
      sourceNode,
      sourcePort: config?.sourcePort || 'out',
      targetNode,
      targetPort: config?.targetPort || 'in',
      condition: config?.condition,
    });
    return this;
  }

  connectConditional(
    conditionNode: string,
    trueNode: string,
    falseNode?: string
  ): this {
    this.connect(conditionNode, trueNode, {
      sourcePort: 'true',
      condition: 'true',
    });

    if (falseNode) {
      this.connect(conditionNode, falseNode, {
        sourcePort: 'false',
        condition: 'false',
      });
    }

    return this;
  }

  // ===========================
  // Advanced Configuration
  // ===========================

  retry(nodeId: string, config: {
    maxRetries: number;
    delayMs: number;
    backoff?: 'linear' | 'exponential';
  }): this {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.retryPolicy = config;
    }
    return this;
  }

  position(nodeId: string, x: number, y: number): this {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.position = { x, y };
    }
    return this;
  }

  // ===========================
  // Helper Methods
  // ===========================

  private addNode(node: NodeConfig): this {
    this.nodes.set(node.id, node);
    return this;
  }

  private getNextPosition(): Position {
    const pos = { x: this.nextX, y: this.nextY };
    this.nextY += 100;
    if (this.nextY > 500) {
      this.nextY = 100;
      this.nextX += 200;
    }
    return pos;
  }

  build(): WorkflowDefinition {
    if (this.nodes.size === 0) {
      throw new Error('Workflow must have at least one node');
    }

    return {
      ...this.workflow,
      nodes: Array.from(this.nodes.values()),
      connections: this.connections,
    } as WorkflowDefinition;
  }

  // Export to JSON
  toJSON(): string {
    return JSON.stringify(this.build(), null, 2);
  }

  // Import from JSON
  static fromJSON(json: string): VisualWorkflowBuilder {
    const workflow = JSON.parse(json) as WorkflowDefinition;
    const builder = new VisualWorkflowBuilder(
      workflow.id,
      workflow.name,
      workflow.version
    );

    if (workflow.description) {
      builder.description(workflow.description);
    }

    // Add variables
    Object.entries(workflow.variables).forEach(([key, value]) => {
      builder.variable(key, value);
    });

    // Add nodes
    workflow.nodes.forEach((node) => {
      builder.nodes.set(node.id, node);
    });

    // Add connections
    builder.connections = workflow.connections;

    return builder;
  }
}

// ===========================
// Workflow Execution Engine
// ===========================

export class WorkflowExecutionEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, ExecutionContext> = new Map();

  registerWorkflow(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  async execute(
    workflowId: string,
    input: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const context: ExecutionContext = {
      workflowId,
      executionId,
      variables: new Map(Object.entries({ ...workflow.variables, ...input })),
      nodeOutputs: new Map(),
      startTime: new Date(),
    };

    this.executions.set(executionId, context);

    try {
      // Find trigger node
      const triggerNode = workflow.nodes.find((n) => n.type === 'trigger');
      if (!triggerNode) {
        throw new Error('No trigger node found');
      }

      // Execute workflow
      const nodeExecutions = await this.executeNode(
        triggerNode,
        workflow,
        context
      );

      const endTime = new Date();
      const duration = endTime.getTime() - context.startTime.getTime();

      return {
        executionId,
        success: true,
        output: context.nodeOutputs.get('final') || null,
        duration,
        nodeExecutions,
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - context.startTime.getTime();

      return {
        executionId,
        success: false,
        output: null,
        error: error instanceof Error ? error.message : String(error),
        duration,
        nodeExecutions: new Map(),
      };
    } finally {
      this.executions.delete(executionId);
    }
  }

  private async executeNode(
    node: NodeConfig,
    workflow: WorkflowDefinition,
    context: ExecutionContext,
    nodeExecutions: Map<string, NodeExecutionResult> = new Map()
  ): Promise<Map<string, NodeExecutionResult>> {
    const startTime = new Date();
    context.currentNode = node.id;

    let retries = 0;
    let lastError: Error | undefined;

    while (retries <= (node.retryPolicy?.maxRetries || 0)) {
      try {
        // Execute node based on type
        const output = await this.executeNodeLogic(node, context);

        // Store output
        context.nodeOutputs.set(node.id, output);

        // Record execution
        const endTime = new Date();
        nodeExecutions.set(node.id, {
          nodeId: node.id,
          success: true,
          output,
          startTime,
          endTime,
          retries,
        });

        // Find and execute next nodes
        const nextNodes = this.getNextNodes(node.id, workflow, context);
        for (const nextNode of nextNodes) {
          await this.executeNode(nextNode, workflow, context, nodeExecutions);
        }

        return nodeExecutions;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;

        if (retries <= (node.retryPolicy?.maxRetries || 0)) {
          const delay = this.calculateRetryDelay(
            retries,
            node.retryPolicy?.delayMs || 1000,
            node.retryPolicy?.backoff || 'linear'
          );
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted
    const endTime = new Date();
    nodeExecutions.set(node.id, {
      nodeId: node.id,
      success: false,
      output: null,
      error: lastError?.message,
      startTime,
      endTime,
      retries: retries - 1,
    });

    throw lastError;
  }

  private async executeNodeLogic(
    node: NodeConfig,
    context: ExecutionContext
  ): Promise<unknown> {
    console.log(`Executing node: ${node.name} (${node.type})`);

    switch (node.type) {
      case 'trigger':
        return { triggered: true, timestamp: new Date() };

      case 'action':
        return this.executeAction(node, context);

      case 'condition':
        return this.evaluateCondition(node, context);

      case 'transform':
        return this.executeTransform(node, context);

      case 'delay':
        await this.sleep(Number(node.config.duration) || 1000);
        return { delayed: true };

      case 'parallel':
        return this.executeParallel(node, context);

      case 'loop':
        return this.executeLoop(node, context);

      default:
        return null;
    }
  }

  private async executeAction(
    node: NodeConfig,
    context: ExecutionContext
  ): Promise<unknown> {
    const actionType = node.config.actionType as ActionType;

    switch (actionType) {
      case 'http':
        console.log(`HTTP Request: ${node.config.method} ${node.config.url}`);
        return { status: 200, body: { success: true } };

      case 'email':
        console.log(`Email sent to: ${node.config.to}`);
        return { sent: true, messageId: this.generateExecutionId() };

      case 'database':
        console.log(`Database ${node.config.operation}: ${node.config.query}`);
        return { affected: 1 };

      case 'script':
        console.log(`Executing ${node.config.language} script`);
        return { result: 'Script executed' };

      default:
        return null;
    }
  }

  private evaluateCondition(
    node: NodeConfig,
    context: ExecutionContext
  ): boolean {
    const expression = String(node.config.expression);
    console.log(`Evaluating condition: ${expression}`);
    // Simplified evaluation - in production, use a proper expression parser
    return Math.random() > 0.5;
  }

  private executeTransform(
    node: NodeConfig,
    context: ExecutionContext
  ): unknown {
    console.log(`Transforming data: ${node.config.input} -> ${node.config.output}`);
    const inputData = context.nodeOutputs.get(String(node.config.input));
    return { transformed: true, data: inputData };
  }

  private async executeParallel(
    node: NodeConfig,
    context: ExecutionContext
  ): Promise<unknown> {
    console.log('Executing parallel branches');
    return { parallel: true, branches: [] };
  }

  private async executeLoop(
    node: NodeConfig,
    context: ExecutionContext
  ): Promise<unknown> {
    const items = context.variables.get(String(node.config.iterateOver)) as unknown[] || [];
    const maxIterations = Number(node.config.maxIterations) || items.length;
    const results = [];

    for (let i = 0; i < Math.min(items.length, maxIterations); i++) {
      console.log(`Loop iteration ${i + 1}`);
      results.push({ iteration: i, item: items[i] });
    }

    return { iterations: results.length, results };
  }

  private getNextNodes(
    nodeId: string,
    workflow: WorkflowDefinition,
    context: ExecutionContext
  ): NodeConfig[] {
    const connections = workflow.connections.filter((c) => c.sourceNode === nodeId);
    const nextNodes: NodeConfig[] = [];

    for (const connection of connections) {
      // Check condition if present
      if (connection.condition) {
        const conditionResult = context.nodeOutputs.get(nodeId);
        if (
          (connection.condition === 'true' && conditionResult) ||
          (connection.condition === 'false' && !conditionResult)
        ) {
          const nextNode = workflow.nodes.find((n) => n.id === connection.targetNode);
          if (nextNode) nextNodes.push(nextNode);
        }
      } else {
        const nextNode = workflow.nodes.find((n) => n.id === connection.targetNode);
        if (nextNode) nextNodes.push(nextNode);
      }
    }

    return nextNodes;
  }

  private calculateRetryDelay(
    attempt: number,
    baseDelay: number,
    backoff: 'linear' | 'exponential'
  ): number {
    if (backoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt - 1);
    }
    return baseDelay * attempt;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ===========================
// Usage Examples
// ===========================

export async function example1_OrderProcessingWorkflow() {
  console.log('\n=== Example 1: Order Processing Workflow ===\n');

  const builder = new VisualWorkflowBuilder(
    'order-processing',
    'Order Processing Workflow',
    '1.0.0'
  )
    .description('Automated order processing with email notifications')
    .variable('maxOrderValue', 1000)
    .variable('adminEmail', 'admin@example.com');

  // Build workflow
  builder
    .webhookTrigger('trigger', 'Order Received', {
      path: '/orders',
      method: 'POST',
    })
    .transform('extract-data', 'Extract Order Data', {
      input: 'trigger',
      output: 'orderData',
      transformation: '{ orderId, customer, items, total }',
    })
    .condition('check-value', 'Check Order Value', 'orderData.total > 1000')
    .emailAction('notify-admin', 'Notify Admin', {
      to: '{{adminEmail}}',
      subject: 'High Value Order',
      body: 'Order {{orderData.orderId}} received for ${{orderData.total}}',
    })
    .emailAction('notify-customer', 'Notify Customer', {
      to: '{{orderData.customer.email}}',
      subject: 'Order Confirmation',
      body: 'Thank you for your order {{orderData.orderId}}',
    })
    .databaseAction('save-order', 'Save to Database', {
      operation: 'insert',
      connection: 'orders-db',
      data: { orderId: '{{orderData.orderId}}', status: 'pending' },
    });

  // Connect nodes
  builder
    .connect('trigger', 'extract-data')
    .connect('extract-data', 'check-value')
    .connectConditional('check-value', 'notify-admin', 'notify-customer')
    .connect('notify-admin', 'save-order')
    .connect('notify-customer', 'save-order');

  // Configure retries for critical nodes
  builder.retry('save-order', {
    maxRetries: 3,
    delayMs: 1000,
    backoff: 'exponential',
  });

  const workflow = builder.build();
  console.log('Workflow created with', workflow.nodes.length, 'nodes');
  console.log('Connections:', workflow.connections.length);

  // Execute workflow
  const engine = new WorkflowExecutionEngine();
  engine.registerWorkflow(workflow);

  const result = await engine.execute('order-processing', {
    orderId: 'ORD-12345',
    customer: { email: 'customer@example.com', name: 'John Doe' },
    items: [{ id: 1, name: 'Product A', price: 500 }],
    total: 1500,
  });

  console.log('\nExecution Result:');
  console.log('  Success:', result.success);
  console.log('  Duration:', result.duration, 'ms');
  console.log('  Nodes executed:', result.nodeExecutions.size);
}

export async function example2_DataPipelineWorkflow() {
  console.log('\n=== Example 2: Data Pipeline Workflow ===\n');

  const builder = new VisualWorkflowBuilder(
    'data-pipeline',
    'Data Processing Pipeline'
  )
    .description('Extract, transform, and load data')
    .scheduleTrigger('schedule', 'Daily at 2 AM', '0 2 * * *')
    .httpAction('fetch-data', 'Fetch Data from API', {
      url: 'https://api.example.com/data',
      method: 'GET',
      timeout: 30000,
    })
    .transform('clean-data', 'Clean and Validate', {
      input: 'fetch-data',
      output: 'cleanData',
      transformation: 'removeNulls(data) | validate(schema)',
    })
    .loop('process-batch', 'Process Each Batch', {
      iterateOver: 'cleanData',
      maxIterations: 100,
    })
    .databaseAction('load-data', 'Load into Database', {
      operation: 'insert',
      connection: 'warehouse',
      query: 'INSERT INTO processed_data VALUES (?)',
    })
    .emailAction('report', 'Send Completion Report', {
      to: 'team@example.com',
      subject: 'Data Pipeline Completed',
      body: 'Processed {{cleanData.length}} records',
    });

  builder
    .connect('schedule', 'fetch-data')
    .connect('fetch-data', 'clean-data')
    .connect('clean-data', 'process-batch')
    .connect('process-batch', 'load-data')
    .connect('load-data', 'report');

  const workflow = builder.build();
  console.log('Data pipeline workflow created');
  console.log('Export:', builder.toJSON().substring(0, 200), '...');
}

export async function example3_ApprovalWorkflow() {
  console.log('\n=== Example 3: Approval Workflow ===\n');

  const builder = new VisualWorkflowBuilder(
    'approval-workflow',
    'Document Approval Workflow'
  )
    .manualTrigger('start', 'Start Approval')
    .emailAction('request-approval', 'Request Approval', {
      to: 'approver@example.com',
      subject: 'Approval Required',
      body: 'Please review and approve document {{documentId}}',
    })
    .delay('wait', 'Wait for Response', 24 * 60 * 60 * 1000) // 24 hours
    .condition('check-response', 'Check Approval Status', 'approved === true')
    .emailAction('approved', 'Send Approval Notification', {
      to: 'submitter@example.com',
      subject: 'Document Approved',
      body: 'Your document has been approved',
    })
    .emailAction('rejected', 'Send Rejection Notification', {
      to: 'submitter@example.com',
      subject: 'Document Rejected',
      body: 'Your document requires changes',
    });

  builder
    .connect('start', 'request-approval')
    .connect('request-approval', 'wait')
    .connect('wait', 'check-response')
    .connectConditional('check-response', 'approved', 'rejected');

  const workflow = builder.build();

  // Execute workflow
  const engine = new WorkflowExecutionEngine();
  engine.registerWorkflow(workflow);

  const result = await engine.execute('approval-workflow', {
    documentId: 'DOC-789',
    approved: true,
  });

  console.log('Approval workflow executed:', result.success);
}

// Run examples
if (require.main === module) {
  (async () => {
    await example1_OrderProcessingWorkflow();
    await example2_DataPipelineWorkflow();
    await example3_ApprovalWorkflow();
  })().catch(console.error);
}
