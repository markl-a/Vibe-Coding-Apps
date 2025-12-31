/**
 * Pipeline Orchestration Examples
 *
 * Demonstrates orchestration patterns for complex data pipelines:
 * 1. DAG-based pipeline orchestration
 * 2. Conditional pipeline execution
 * 3. Parallel task execution
 * 4. Pipeline scheduling and triggers
 * 5. Error handling and retry strategies
 * 6. Pipeline monitoring and observability
 */

import { EventEmitter } from 'events';

// ============================================================================
// Type Definitions
// ============================================================================

interface Task {
  id: string;
  name: string;
  execute: (context: TaskContext) => Promise<TaskResult>;
  dependencies: string[];
  retryConfig?: RetryConfig;
  timeout?: number;
}

interface TaskContext {
  taskId: string;
  inputs: Map<string, unknown>;
  metadata: Record<string, unknown>;
}

interface TaskResult {
  success: boolean;
  output?: unknown;
  error?: string;
  duration: number;
  retries: number;
}

interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier?: number;
}

interface PipelineExecutionResult {
  pipelineId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  taskResults: Map<string, TaskResult>;
  errors: string[];
}

enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

// ============================================================================
// Example 1: DAG-based Pipeline Orchestrator
// ============================================================================

class DAGOrchestrator extends EventEmitter {
  private tasks = new Map<string, Task>();
  private taskStatuses = new Map<string, TaskStatus>();
  private taskResults = new Map<string, TaskResult>();

  addTask(task: Task): this {
    this.tasks.set(task.id, task);
    this.taskStatuses.set(task.id, TaskStatus.PENDING);
    return this;
  }

  async execute(pipelineId: string): Promise<PipelineExecutionResult> {
    const startTime = new Date();

    console.log('='.repeat(80));
    console.log(`Executing Pipeline: ${pipelineId}`);
    console.log(`Tasks: ${this.tasks.size}`);
    console.log('='.repeat(80));

    try {
      // Validate DAG (no cycles)
      this.validateDAG();

      // Get execution order (topological sort)
      const executionOrder = this.topologicalSort();
      console.log(`\nExecution order: ${executionOrder.join(' → ')}\n`);

      // Execute tasks in order
      for (const taskId of executionOrder) {
        await this.executeTask(taskId);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Check overall success
      const hasFailures = Array.from(this.taskResults.values()).some(r => !r.success);

      console.log('\n' + '='.repeat(80));
      console.log('Pipeline Execution Complete!');
      console.log(`Duration: ${duration}ms`);
      console.log(`Status: ${hasFailures ? 'FAILED' : 'SUCCESS'}`);
      console.log('='.repeat(80));

      return {
        pipelineId,
        success: !hasFailures,
        startTime,
        endTime,
        duration,
        taskResults: this.taskResults,
        errors: this.collectErrors(),
      };
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        pipelineId,
        success: false,
        startTime,
        endTime,
        duration,
        taskResults: this.taskResults,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId)!;

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`Task: ${task.name} (${taskId})`);
    console.log(`Dependencies: ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'none'}`);

    // Check if dependencies succeeded
    const canExecute = this.checkDependencies(taskId);

    if (!canExecute) {
      console.log(`⏭️  Skipping task (dependencies failed)`);
      this.taskStatuses.set(taskId, TaskStatus.SKIPPED);
      this.taskResults.set(taskId, {
        success: false,
        error: 'Dependencies failed',
        duration: 0,
        retries: 0,
      });
      return;
    }

    // Prepare context
    const context = this.prepareContext(taskId);

    // Execute with retry logic
    this.taskStatuses.set(taskId, TaskStatus.RUNNING);
    const result = await this.executeWithRetry(task, context);

    this.taskResults.set(taskId, result);
    this.taskStatuses.set(taskId, result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED);

    console.log(`${result.success ? '✓' : '❌'} Task ${result.success ? 'completed' : 'failed'} in ${result.duration}ms`);
    if (!result.success) {
      console.log(`  Error: ${result.error}`);
    }

    this.emit('task-complete', { taskId, result });
  }

  private async executeWithRetry(task: Task, context: TaskContext): Promise<TaskResult> {
    const retryConfig = task.retryConfig || { maxAttempts: 1, backoffMs: 1000 };
    let attempt = 0;
    let lastError: string = '';

    while (attempt < retryConfig.maxAttempts) {
      attempt++;

      if (attempt > 1) {
        const backoff = retryConfig.backoffMs * Math.pow(retryConfig.backoffMultiplier || 2, attempt - 2);
        console.log(`  Retry attempt ${attempt}/${retryConfig.maxAttempts} (waiting ${backoff}ms)`);
        await this.delay(backoff);
      }

      const startTime = Date.now();

      try {
        // Execute with timeout if configured
        const resultPromise = task.execute(context);
        const timeoutPromise = task.timeout
          ? this.timeout(task.timeout)
          : new Promise(() => { }); // Never resolves

        const result = await Promise.race([resultPromise, timeoutPromise]) as TaskResult;

        return {
          ...result,
          duration: Date.now() - startTime,
          retries: attempt - 1,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ Attempt ${attempt} failed: ${lastError}`);
      }
    }

    return {
      success: false,
      error: `Failed after ${attempt} attempts: ${lastError}`,
      duration: 0,
      retries: attempt - 1,
    };
  }

  private checkDependencies(taskId: string): boolean {
    const task = this.tasks.get(taskId)!;

    return task.dependencies.every(depId => {
      const result = this.taskResults.get(depId);
      return result?.success === true;
    });
  }

  private prepareContext(taskId: string): TaskContext {
    const task = this.tasks.get(taskId)!;
    const inputs = new Map<string, unknown>();

    // Collect outputs from dependencies
    task.dependencies.forEach(depId => {
      const result = this.taskResults.get(depId);
      if (result?.output) {
        inputs.set(depId, result.output);
      }
    });

    return {
      taskId,
      inputs,
      metadata: {},
    };
  }

  private validateDAG(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (taskId: string): boolean => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = this.tasks.get(taskId)!;

      for (const depId of task.dependencies) {
        if (!visited.has(depId)) {
          if (hasCycle(depId)) return true;
        } else if (recursionStack.has(depId)) {
          return true;
        }
      }

      recursionStack.delete(taskId);
      return false;
    };

    for (const taskId of this.tasks.keys()) {
      if (!visited.has(taskId)) {
        if (hasCycle(taskId)) {
          throw new Error('Cycle detected in task dependencies');
        }
      }
    }
  }

  private topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;

      visited.add(taskId);

      const task = this.tasks.get(taskId)!;
      task.dependencies.forEach(depId => visit(depId));

      sorted.push(taskId);
    };

    this.tasks.forEach((_, taskId) => visit(taskId));

    return sorted;
  }

  private collectErrors(): string[] {
    const errors: string[] = [];

    this.taskResults.forEach((result, taskId) => {
      if (!result.success && result.error) {
        errors.push(`${taskId}: ${result.error}`);
      }
    });

    return errors;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Task timeout after ${ms}ms`)), ms)
    );
  }
}

// ============================================================================
// Example 2: Conditional Pipeline Executor
// ============================================================================

interface ConditionalTask extends Task {
  condition?: (context: TaskContext) => boolean;
}

class ConditionalPipelineExecutor extends DAGOrchestrator {
  private conditionalTasks = new Map<string, ConditionalTask>();

  addConditionalTask(task: ConditionalTask): this {
    this.conditionalTasks.set(task.id, task);
    return this.addTask(task);
  }

  protected async executeTask(taskId: string): Promise<void> {
    const conditionalTask = this.conditionalTasks.get(taskId);

    if (conditionalTask?.condition) {
      const context = this.prepareContext(taskId);
      const shouldExecute = conditionalTask.condition(context);

      if (!shouldExecute) {
        console.log(`⏭️  Skipping task (condition not met)`);
        this.taskStatuses.set(taskId, TaskStatus.SKIPPED);
        this.taskResults.set(taskId, {
          success: true,
          output: null,
          duration: 0,
          retries: 0,
        });
        return;
      }
    }

    await super['executeTask'](taskId);
  }

  private prepareContext(taskId: string): TaskContext {
    return super['prepareContext'](taskId);
  }

  private taskStatuses = new Map<string, TaskStatus>();
  private taskResults = new Map<string, TaskResult>();
}

// ============================================================================
// Example 3: Parallel Pipeline Executor
// ============================================================================

class ParallelPipelineExecutor extends DAGOrchestrator {
  constructor(private maxParallelism: number = 5) {
    super();
  }

  async execute(pipelineId: string): Promise<PipelineExecutionResult> {
    const startTime = new Date();

    console.log('='.repeat(80));
    console.log(`Executing Parallel Pipeline: ${pipelineId}`);
    console.log(`Max Parallelism: ${this.maxParallelism}`);
    console.log('='.repeat(80));

    try {
      this.validateDAG();

      // Group tasks by level (tasks at same level can run in parallel)
      const levels = this.groupByLevel();

      console.log(`\nTask levels: ${levels.length}\n`);

      // Execute each level
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        console.log(`\nLevel ${i + 1}: ${level.length} task(s)`);

        // Execute tasks in parallel (respecting max parallelism)
        await this.executeLevel(level);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      const hasFailures = Array.from(this.taskResults.values()).some(r => !r.success);

      console.log('\n' + '='.repeat(80));
      console.log('Parallel Pipeline Complete!');
      console.log(`Duration: ${duration}ms`);
      console.log('='.repeat(80));

      return {
        pipelineId,
        success: !hasFailures,
        startTime,
        endTime,
        duration,
        taskResults: this.taskResults,
        errors: this.collectErrors(),
      };
    } catch (error) {
      const endTime = new Date();
      return {
        pipelineId,
        success: false,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        taskResults: this.taskResults,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private groupByLevel(): string[][] {
    const levels: string[][] = [];
    const taskLevels = new Map<string, number>();

    const calculateLevel = (taskId: string): number => {
      if (taskLevels.has(taskId)) {
        return taskLevels.get(taskId)!;
      }

      const task = this.tasks.get(taskId)!;

      if (task.dependencies.length === 0) {
        taskLevels.set(taskId, 0);
        return 0;
      }

      const maxDepLevel = Math.max(
        ...task.dependencies.map(depId => calculateLevel(depId))
      );

      const level = maxDepLevel + 1;
      taskLevels.set(taskId, level);
      return level;
    };

    // Calculate levels for all tasks
    this.tasks.forEach((_, taskId) => calculateLevel(taskId));

    // Group by level
    const maxLevel = Math.max(...taskLevels.values());

    for (let i = 0; i <= maxLevel; i++) {
      const tasksAtLevel = Array.from(taskLevels.entries())
        .filter(([_, level]) => level === i)
        .map(([taskId]) => taskId);

      levels.push(tasksAtLevel);
    }

    return levels;
  }

  private async executeLevel(taskIds: string[]): Promise<void> {
    // Execute in batches respecting max parallelism
    for (let i = 0; i < taskIds.length; i += this.maxParallelism) {
      const batch = taskIds.slice(i, i + this.maxParallelism);

      await Promise.all(
        batch.map(taskId => this.executeTask(taskId))
      );
    }
  }

  private tasks = new Map<string, Task>();
  private taskResults = new Map<string, TaskResult>();

  protected async executeTask(taskId: string): Promise<void> {
    // Delegate to parent implementation
    return super['executeTask'](taskId);
  }

  protected validateDAG(): void {
    return super['validateDAG']();
  }

  protected collectErrors(): string[] {
    return super['collectErrors']();
  }
}

// ============================================================================
// Example 4: Scheduled Pipeline Orchestrator
// ============================================================================

interface Schedule {
  cron?: string;
  interval?: number; // milliseconds
  startTime?: Date;
  endTime?: Date;
}

class ScheduledPipelineOrchestrator extends DAGOrchestrator {
  private schedules = new Map<string, Schedule>();
  private timers = new Map<string, NodeJS.Timeout>();

  schedule(pipelineId: string, schedule: Schedule): void {
    this.schedules.set(pipelineId, schedule);

    if (schedule.interval) {
      console.log(`Scheduling pipeline ${pipelineId} with interval ${schedule.interval}ms`);

      const timer = setInterval(() => {
        this.executeScheduled(pipelineId);
      }, schedule.interval);

      this.timers.set(pipelineId, timer);
    }
  }

  unschedule(pipelineId: string): void {
    const timer = this.timers.get(pipelineId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(pipelineId);
      this.schedules.delete(pipelineId);
      console.log(`Unscheduled pipeline ${pipelineId}`);
    }
  }

  private async executeScheduled(pipelineId: string): Promise<void> {
    const schedule = this.schedules.get(pipelineId);

    if (!schedule) return;

    // Check time window
    const now = new Date();

    if (schedule.startTime && now < schedule.startTime) {
      console.log(`Pipeline ${pipelineId} not yet started (start time: ${schedule.startTime})`);
      return;
    }

    if (schedule.endTime && now > schedule.endTime) {
      console.log(`Pipeline ${pipelineId} schedule ended (end time: ${schedule.endTime})`);
      this.unschedule(pipelineId);
      return;
    }

    console.log(`\n🕐 Executing scheduled pipeline: ${pipelineId} at ${now.toISOString()}`);

    try {
      const result = await this.execute(pipelineId);
      this.emit('scheduled-execution', { pipelineId, result });
    } catch (error) {
      console.error(`Scheduled execution failed:`, error);
      this.emit('scheduled-execution-error', { pipelineId, error });
    }
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateOrchestration() {
  console.log('PIPELINE ORCHESTRATION EXAMPLES\n');

  // Example 1: DAG-based Orchestration
  console.log('\n1. DAG-based Pipeline Orchestration:');
  console.log('-'.repeat(80));

  const dagOrchestrator = new DAGOrchestrator()
    .addTask({
      id: 'extract',
      name: 'Extract Data',
      execute: async (context) => {
        console.log('  Extracting data...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, output: { records: 100 }, duration: 0, retries: 0 };
      },
      dependencies: [],
    })
    .addTask({
      id: 'transform',
      name: 'Transform Data',
      execute: async (context) => {
        console.log('  Transforming data...');
        const input = context.inputs.get('extract') as { records: number };
        await new Promise(resolve => setTimeout(resolve, 150));
        return { success: true, output: { records: input.records * 2 }, duration: 0, retries: 0 };
      },
      dependencies: ['extract'],
    })
    .addTask({
      id: 'load',
      name: 'Load Data',
      execute: async (context) => {
        console.log('  Loading data...');
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, duration: 0, retries: 0 };
      },
      dependencies: ['transform'],
    });

  const result1 = await dagOrchestrator.execute('etl-pipeline');
  console.log(`\nResult: ${result1.success ? 'SUCCESS' : 'FAILED'}`);

  // Example 2: Parallel Execution
  console.log('\n\n2. Parallel Pipeline Execution:');
  console.log('-'.repeat(80));

  const parallelOrchestrator = new ParallelPipelineExecutor(3)
    .addTask({
      id: 'source1',
      name: 'Extract from Source 1',
      execute: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, output: { data: 'source1' }, duration: 0, retries: 0 };
      },
      dependencies: [],
    })
    .addTask({
      id: 'source2',
      name: 'Extract from Source 2',
      execute: async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, output: { data: 'source2' }, duration: 0, retries: 0 };
      },
      dependencies: [],
    })
    .addTask({
      id: 'merge',
      name: 'Merge Data',
      execute: async (context) => {
        console.log('  Merging data from both sources...');
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true, output: { merged: true }, duration: 0, retries: 0 };
      },
      dependencies: ['source1', 'source2'],
    });

  const result2 = await parallelOrchestrator.execute('parallel-pipeline');
  console.log(`\nResult: ${result2.success ? 'SUCCESS' : 'FAILED'}`);

  console.log('\n' + '='.repeat(80));
  console.log('ORCHESTRATION COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateOrchestration().catch(console.error);
}

export {
  DAGOrchestrator,
  ConditionalPipelineExecutor,
  ParallelPipelineExecutor,
  ScheduledPipelineOrchestrator,
  type Task,
  type TaskContext,
  type TaskResult,
  type RetryConfig,
  type PipelineExecutionResult,
  type Schedule,
  TaskStatus,
};
