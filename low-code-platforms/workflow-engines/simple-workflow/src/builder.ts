import type { Workflow, WorkflowNode, NodeType } from './types.js';

export class WorkflowBuilder {
  private workflow: Partial<Workflow>;
  private nodes: WorkflowNode[] = [];
  private lastNodeId?: string;

  constructor(id: string, name: string) {
    this.workflow = {
      id,
      name,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  description(desc: string): this {
    this.workflow.description = desc;
    return this;
  }

  // Trigger nodes
  webhookTrigger(id: string, name: string, config: Record<string, unknown> = {}): this {
    return this.addNode(id, 'trigger:webhook', name, config);
  }

  manualTrigger(id: string, name: string, config: Record<string, unknown> = {}): this {
    return this.addNode(id, 'trigger:manual', name, config);
  }

  scheduleTrigger(id: string, name: string, cron: string): this {
    return this.addNode(id, 'trigger:schedule', name, { cron });
  }

  // Action nodes
  http(id: string, name: string, config: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  }): this {
    return this.addNode(id, 'action:http', name, config);
  }

  transform(id: string, name: string, expression: string): this {
    return this.addNode(id, 'action:transform', name, { expression });
  }

  condition(
    id: string,
    name: string,
    condition: string,
    trueBranch: string,
    falseBranch?: string
  ): this {
    const node = this.addNode(id, 'action:condition', name, { condition });
    const currentNode = this.nodes.find((n) => n.id === id);
    if (currentNode) {
      currentNode.next = falseBranch ? [trueBranch, falseBranch] : trueBranch;
    }
    return node;
  }

  delay(id: string, name: string, durationMs: number): this {
    return this.addNode(id, 'action:delay', name, { duration: durationMs });
  }

  log(id: string, name: string, message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): this {
    return this.addNode(id, 'action:log', name, { message, level });
  }

  set(id: string, name: string, variables: Record<string, unknown>): this {
    return this.addNode(id, 'action:set', name, { variables });
  }

  // Flow control
  then(nodeId: string): this {
    if (this.lastNodeId) {
      const lastNode = this.nodes.find((n) => n.id === this.lastNodeId);
      if (lastNode && lastNode.type !== 'action:condition') {
        lastNode.next = nodeId;
      }
    }
    return this;
  }

  onError(nodeId: string): this {
    if (this.lastNodeId) {
      const lastNode = this.nodes.find((n) => n.id === this.lastNodeId);
      if (lastNode) {
        lastNode.onError = nodeId;
      }
    }
    return this;
  }

  private addNode(
    id: string,
    type: NodeType,
    name: string,
    config: Record<string, unknown>
  ): this {
    // Link from previous node
    if (this.lastNodeId) {
      const lastNode = this.nodes.find((n) => n.id === this.lastNodeId);
      if (lastNode && !lastNode.next && lastNode.type !== 'action:condition') {
        lastNode.next = id;
      }
    }

    this.nodes.push({ id, type, name, config });

    // Set start node
    if (!this.workflow.startNode) {
      this.workflow.startNode = id;
    }

    this.lastNodeId = id;
    return this;
  }

  build(): Workflow {
    if (!this.workflow.startNode) {
      throw new Error('Workflow must have at least one node');
    }

    return {
      ...this.workflow,
      nodes: this.nodes,
    } as Workflow;
  }
}
