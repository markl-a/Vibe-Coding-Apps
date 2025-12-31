import type { NodeHandler, WorkflowNode, ExecutionContext } from '../types.js';

// HTTP Request Node
const httpNode: NodeHandler = {
  type: 'action:http',
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const { url, method = 'GET', headers = {}, body } = node.config as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
    };

    // Replace variables in URL
    const resolvedUrl = resolveTemplate(url, context);

    const response = await fetch(resolvedUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => response.text());

    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    };
  },
};

// Transform Node
const transformNode: NodeHandler = {
  type: 'action:transform',
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const { expression } = node.config as { expression: string };

    // Get previous node data
    const previousNodeId = [...context.nodeData.keys()].pop();
    const previousData = previousNodeId
      ? context.nodeData.get(previousNodeId)
      : context.triggerData;

    // Simple expression evaluation (in production, use a safer approach)
    const func = new Function('data', 'context', `return ${expression}`);
    return func(previousData, {
      trigger: context.triggerData,
      nodes: Object.fromEntries(context.nodeData),
      vars: context.variables,
    });
  },
};

// Condition Node
const conditionNode: NodeHandler = {
  type: 'action:condition',
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const { condition } = node.config as { condition: string };

    const previousNodeId = [...context.nodeData.keys()].pop();
    const previousData = previousNodeId
      ? context.nodeData.get(previousNodeId)
      : context.triggerData;

    const func = new Function('data', 'context', `return ${condition}`);
    const result = func(previousData, {
      trigger: context.triggerData,
      nodes: Object.fromEntries(context.nodeData),
      vars: context.variables,
    });

    return { result: Boolean(result), branch: result ? 'true' : 'false' };
  },
};

// Delay Node
const delayNode: NodeHandler = {
  type: 'action:delay',
  async execute(node: WorkflowNode) {
    const { duration = 1000 } = node.config as { duration?: number };
    await new Promise((resolve) => setTimeout(resolve, duration));
    return { delayed: true, duration };
  },
};

// Log Node
const logNode: NodeHandler = {
  type: 'action:log',
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const { message, level = 'info' } = node.config as {
      message: string;
      level?: 'debug' | 'info' | 'warn' | 'error';
    };

    const resolvedMessage = resolveTemplate(message, context);
    console[level](`[Workflow ${context.workflowId}] ${resolvedMessage}`);

    return { logged: true, message: resolvedMessage, level };
  },
};

// Set Variable Node
const setNode: NodeHandler = {
  type: 'action:set',
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const { variables } = node.config as {
      variables: Record<string, unknown>;
    };

    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'string') {
        context.variables[key] = resolveTemplate(value, context);
      } else {
        context.variables[key] = value;
      }
    }

    return { set: Object.keys(variables) };
  },
};

// Trigger nodes (mostly pass-through)
const webhookTrigger: NodeHandler = {
  type: 'trigger:webhook',
  async execute(_node: WorkflowNode, context: ExecutionContext) {
    return context.triggerData;
  },
};

const manualTrigger: NodeHandler = {
  type: 'trigger:manual',
  async execute(_node: WorkflowNode, context: ExecutionContext) {
    return context.triggerData;
  },
};

const scheduleTrigger: NodeHandler = {
  type: 'trigger:schedule',
  async execute(_node: WorkflowNode, context: ExecutionContext) {
    return { ...context.triggerData, triggeredAt: new Date().toISOString() };
  },
};

// Helper function to resolve template strings
function resolveTemplate(template: string, context: ExecutionContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    const parts = path.trim().split('.');
    let value: unknown = {
      trigger: context.triggerData,
      nodes: Object.fromEntries(context.nodeData),
      vars: context.variables,
    };

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        return '';
      }
    }

    return String(value ?? '');
  });
}

// Export all handlers
export const nodeHandlers: NodeHandler[] = [
  httpNode,
  transformNode,
  conditionNode,
  delayNode,
  logNode,
  setNode,
  webhookTrigger,
  manualTrigger,
  scheduleTrigger,
];

export function getNodeHandler(type: string): NodeHandler | undefined {
  return nodeHandlers.find((h) => h.type === type);
}
