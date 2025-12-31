/**
 * Simple Workflow Engine
 *
 * A lightweight workflow automation engine that supports:
 * - Trigger nodes (webhook, schedule, manual)
 * - Action nodes (HTTP, transform, condition, etc.)
 * - Data passing between nodes
 * - Error handling
 */

export { WorkflowEngine } from './engine.js';
export { WorkflowBuilder } from './builder.js';
export * from './nodes/index.js';
export type {
  Workflow,
  WorkflowNode,
  NodeType,
  ExecutionContext,
  ExecutionResult,
} from './types.js';
