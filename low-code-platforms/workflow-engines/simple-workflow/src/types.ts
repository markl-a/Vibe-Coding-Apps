export type NodeType =
  | 'trigger:webhook'
  | 'trigger:schedule'
  | 'trigger:manual'
  | 'action:http'
  | 'action:transform'
  | 'action:condition'
  | 'action:delay'
  | 'action:log'
  | 'action:set';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  config: Record<string, unknown>;
  next?: string | string[]; // Next node(s) to execute
  onError?: string; // Node to execute on error
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  startNode: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggerData: Record<string, unknown>;
  nodeData: Map<string, unknown>;
  variables: Record<string, unknown>;
  startTime: Date;
}

export interface NodeExecutionResult {
  nodeId: string;
  success: boolean;
  output: unknown;
  error?: string;
  duration: number;
}

export interface ExecutionResult {
  executionId: string;
  workflowId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  nodeResults: NodeExecutionResult[];
  finalOutput: unknown;
  error?: string;
}

export interface NodeHandler {
  type: NodeType;
  execute: (
    node: WorkflowNode,
    context: ExecutionContext
  ) => Promise<unknown>;
}
