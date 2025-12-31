import type {
  Workflow,
  WorkflowNode,
  ExecutionContext,
  ExecutionResult,
  NodeExecutionResult,
} from './types.js';
import { getNodeHandler } from './nodes/index.js';

export class WorkflowEngine {
  private workflows = new Map<string, Workflow>();

  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow);
    console.log(`✅ Registered workflow: ${workflow.name} (${workflow.id})`);
  }

  unregisterWorkflow(workflowId: string): boolean {
    return this.workflows.delete(workflowId);
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  async execute(
    workflowId: string,
    triggerData: Record<string, unknown> = {}
  ): Promise<ExecutionResult> {
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    if (!workflow.enabled) {
      throw new Error(`Workflow is disabled: ${workflowId}`);
    }

    const executionId = crypto.randomUUID();
    const startTime = new Date();

    const context: ExecutionContext = {
      workflowId,
      executionId,
      triggerData,
      nodeData: new Map(),
      variables: {},
      startTime,
    };

    const nodeResults: NodeExecutionResult[] = [];
    let currentNodeId: string | undefined = workflow.startNode;
    let finalOutput: unknown;
    let success = true;
    let errorMessage: string | undefined;

    console.log(`\n🚀 Starting workflow: ${workflow.name}`);
    console.log(`   Execution ID: ${executionId}`);

    try {
      while (currentNodeId) {
        const node = workflow.nodes.find((n) => n.id === currentNodeId);

        if (!node) {
          throw new Error(`Node not found: ${currentNodeId}`);
        }

        const nodeStartTime = Date.now();

        try {
          console.log(`   ▶ Executing: ${node.name} (${node.type})`);

          const handler = getNodeHandler(node.type);
          if (!handler) {
            throw new Error(`Unknown node type: ${node.type}`);
          }

          const output = await handler.execute(node, context);
          context.nodeData.set(node.id, output);
          finalOutput = output;

          nodeResults.push({
            nodeId: node.id,
            success: true,
            output,
            duration: Date.now() - nodeStartTime,
          });

          // Handle condition branching
          if (node.type === 'action:condition') {
            const conditionResult = output as { result: boolean; branch: string };
            const nextNodes = node.next as string[] | undefined;

            if (Array.isArray(nextNodes) && nextNodes.length === 2) {
              currentNodeId = conditionResult.result ? nextNodes[0] : nextNodes[1];
            } else {
              currentNodeId = conditionResult.result
                ? (node.next as string)
                : undefined;
            }
          } else {
            currentNodeId = Array.isArray(node.next) ? node.next[0] : node.next;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);

          nodeResults.push({
            nodeId: node.id,
            success: false,
            output: null,
            error: errorMsg,
            duration: Date.now() - nodeStartTime,
          });

          console.error(`   ❌ Error in ${node.name}: ${errorMsg}`);

          // Handle error node
          if (node.onError) {
            currentNodeId = node.onError;
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : String(error);
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`${success ? '✅' : '❌'} Workflow completed in ${duration}ms\n`);

    return {
      executionId,
      workflowId,
      success,
      startTime,
      endTime,
      duration,
      nodeResults,
      finalOutput,
      error: errorMessage,
    };
  }
}
