/**
 * Batch Pipeline Examples
 *
 * Demonstrates comprehensive batch processing patterns:
 * 1. Simple batch ETL pipeline
 * 2. Incremental batch processing
 * 3. Parallel batch processing
 * 4. Fault-tolerant batch pipeline
 * 5. Multi-stage batch pipeline
 * 6. Scheduled batch jobs
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface BatchConfig {
  batchSize: number;
  parallelism?: number;
  retryAttempts?: number;
  checkpointInterval?: number;
}

interface PipelineResult {
  success: boolean;
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  duration: number;
  stages: StageResult[];
  errors: string[];
}

interface StageResult {
  name: string;
  inputCount: number;
  outputCount: number;
  duration: number;
  errors: string[];
}

interface Checkpoint {
  lastProcessedId: number | string;
  processedCount: number;
  timestamp: Date;
}

type Record = Record<string, unknown>;

// ============================================================================
// Example 1: Simple Batch ETL Pipeline
// ============================================================================

class SimpleBatchPipeline {
  private stages: Array<{
    name: string;
    processor: (records: Record[]) => Promise<Record[]>;
  }> = [];

  constructor(private config: BatchConfig) {}

  addStage(
    name: string,
    processor: (records: Record[]) => Promise<Record[]>
  ): this {
    this.stages.push({ name, processor });
    return this;
  }

  async run(inputData: Record[]): Promise<PipelineResult> {
    const startTime = Date.now();
    const stageResults: StageResult[] = [];
    let currentData = inputData;
    const errors: string[] = [];

    console.log('='.repeat(80));
    console.log(`Starting Simple Batch Pipeline`);
    console.log(`Total records: ${inputData.length}, Batch size: ${this.config.batchSize}`);
    console.log('='.repeat(80));

    try {
      // Process each stage
      for (const stage of this.stages) {
        const stageStartTime = Date.now();
        const inputCount = currentData.length;

        console.log(`\nStage: ${stage.name}`);
        console.log(`  Input: ${inputCount} records`);

        // Process in batches
        const batches = this.createBatches(currentData, this.config.batchSize);
        const processedBatches: Record[][] = [];

        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          console.log(`  Processing batch ${i + 1}/${batches.length} (${batch.length} records)`);

          try {
            const result = await stage.processor(batch);
            processedBatches.push(result);
          } catch (error) {
            const errorMsg = `Stage ${stage.name}, Batch ${i + 1}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            console.error(`  ❌ ${errorMsg}`);
          }
        }

        currentData = processedBatches.flat();
        const stageDuration = Date.now() - stageStartTime;

        stageResults.push({
          name: stage.name,
          inputCount,
          outputCount: currentData.length,
          duration: stageDuration,
          errors: [],
        });

        console.log(`  Output: ${currentData.length} records`);
        console.log(`  Duration: ${stageDuration}ms`);
      }

      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(80));
      console.log('Pipeline Complete!');
      console.log(`Total duration: ${duration}ms`);
      console.log(`Final output: ${currentData.length} records`);
      console.log('='.repeat(80));

      return {
        success: errors.length === 0,
        totalRecords: inputData.length,
        processedRecords: currentData.length,
        failedRecords: inputData.length - currentData.length,
        duration,
        stages: stageResults,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        totalRecords: inputData.length,
        processedRecords: currentData.length,
        failedRecords: inputData.length - currentData.length,
        duration,
        stages: stageResults,
        errors: [...errors, error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private createBatches(data: Record[], batchSize: number): Record[][] {
    const batches: Record[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }
}

// ============================================================================
// Example 2: Incremental Batch Processing
// ============================================================================

class IncrementalBatchPipeline {
  private checkpointStore = new Map<string, Checkpoint>();

  constructor(
    private pipelineId: string,
    private config: BatchConfig
  ) {}

  async run(
    fetchData: (lastId: string | number) => Promise<Record[]>,
    processor: (records: Record[]) => Promise<void>
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    let processedCount = 0;
    const errors: string[] = [];

    console.log('='.repeat(80));
    console.log(`Starting Incremental Batch Pipeline: ${this.pipelineId}`);
    console.log('='.repeat(80));

    try {
      // Load checkpoint
      const checkpoint = this.loadCheckpoint();
      let lastId = checkpoint?.lastProcessedId ?? 0;

      console.log(`Resuming from checkpoint: ${lastId}`);

      let hasMore = true;
      let batchNumber = 0;

      while (hasMore) {
        batchNumber++;
        console.log(`\nFetching batch ${batchNumber}...`);

        // Fetch next batch
        const batch = await fetchData(lastId);

        if (batch.length === 0) {
          console.log('No more data to process');
          hasMore = false;
          break;
        }

        console.log(`Processing ${batch.length} records...`);

        try {
          // Process batch
          await processor(batch);
          processedCount += batch.length;

          // Update checkpoint
          if (batch.length > 0) {
            lastId = batch[batch.length - 1].id as string | number;
            this.saveCheckpoint({
              lastProcessedId: lastId,
              processedCount,
              timestamp: new Date(),
            });
          }

          console.log(`✓ Batch ${batchNumber} processed successfully`);
        } catch (error) {
          const errorMsg = `Batch ${batchNumber}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          throw error;
        }

        // Check if we should continue
        if (batch.length < this.config.batchSize) {
          hasMore = false;
        }
      }

      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(80));
      console.log('Incremental Pipeline Complete!');
      console.log(`Processed: ${processedCount} records`);
      console.log(`Duration: ${duration}ms`);
      console.log('='.repeat(80));

      return {
        success: true,
        totalRecords: processedCount,
        processedRecords: processedCount,
        failedRecords: 0,
        duration,
        stages: [],
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        totalRecords: processedCount,
        processedRecords: processedCount,
        failedRecords: 0,
        duration,
        stages: [],
        errors: [...errors, error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private loadCheckpoint(): Checkpoint | null {
    return this.checkpointStore.get(this.pipelineId) ?? null;
  }

  private saveCheckpoint(checkpoint: Checkpoint): void {
    this.checkpointStore.set(this.pipelineId, checkpoint);
    console.log(`Checkpoint saved: ID=${checkpoint.lastProcessedId}, Count=${checkpoint.processedCount}`);
  }
}

// ============================================================================
// Example 3: Parallel Batch Processing
// ============================================================================

class ParallelBatchPipeline {
  constructor(private config: BatchConfig) {
    this.config.parallelism = config.parallelism || 4;
  }

  async run(
    inputData: Record[],
    processor: (record: Record) => Promise<Record>
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const results: Record[] = [];
    const errors: string[] = [];

    console.log('='.repeat(80));
    console.log(`Starting Parallel Batch Pipeline`);
    console.log(`Total records: ${inputData.length}`);
    console.log(`Parallelism: ${this.config.parallelism}`);
    console.log('='.repeat(80));

    try {
      // Create batches for parallel processing
      const batches = this.createBatches(inputData, this.config.batchSize);

      // Process batches in parallel
      for (let i = 0; i < batches.length; i += this.config.parallelism!) {
        const parallelBatches = batches.slice(i, i + this.config.parallelism!);

        console.log(`\nProcessing batches ${i + 1}-${i + parallelBatches.length} in parallel...`);

        const batchPromises = parallelBatches.map(async (batch, batchIndex) => {
          const actualBatchNumber = i + batchIndex + 1;
          console.log(`  Batch ${actualBatchNumber}: Processing ${batch.length} records`);

          try {
            const processedRecords = await Promise.all(
              batch.map(record => processor(record))
            );
            console.log(`  ✓ Batch ${actualBatchNumber}: Complete`);
            return processedRecords;
          } catch (error) {
            const errorMsg = `Batch ${actualBatchNumber}: ${error instanceof Error ? error.message : String(error)}`;
            errors.push(errorMsg);
            console.error(`  ❌ ${errorMsg}`);
            return [];
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.flat());
      }

      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(80));
      console.log('Parallel Pipeline Complete!');
      console.log(`Processed: ${results.length} records`);
      console.log(`Duration: ${duration}ms`);
      console.log(`Throughput: ${Math.round(results.length / (duration / 1000))} records/sec`);
      console.log('='.repeat(80));

      return {
        success: errors.length === 0,
        totalRecords: inputData.length,
        processedRecords: results.length,
        failedRecords: inputData.length - results.length,
        duration,
        stages: [],
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        totalRecords: inputData.length,
        processedRecords: results.length,
        failedRecords: inputData.length - results.length,
        duration,
        stages: [],
        errors: [...errors, error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private createBatches(data: Record[], batchSize: number): Record[][] {
    const batches: Record[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }
}

// ============================================================================
// Example 4: Fault-Tolerant Batch Pipeline with Retry
// ============================================================================

class FaultTolerantBatchPipeline {
  constructor(private config: BatchConfig) {
    this.config.retryAttempts = config.retryAttempts || 3;
  }

  async run(
    inputData: Record[],
    processor: (records: Record[]) => Promise<Record[]>
  ): Promise<PipelineResult> {
    const startTime = Date.now();
    const results: Record[] = [];
    const errors: string[] = [];

    console.log('='.repeat(80));
    console.log(`Starting Fault-Tolerant Batch Pipeline`);
    console.log(`Total records: ${inputData.length}`);
    console.log(`Retry attempts: ${this.config.retryAttempts}`);
    console.log('='.repeat(80));

    try {
      const batches = this.createBatches(inputData, this.config.batchSize);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\nProcessing batch ${i + 1}/${batches.length} (${batch.length} records)`);

        let attempt = 0;
        let success = false;
        let lastError: Error | null = null;

        while (attempt < this.config.retryAttempts! && !success) {
          attempt++;

          try {
            if (attempt > 1) {
              console.log(`  Retry attempt ${attempt}/${this.config.retryAttempts}`);
              // Exponential backoff
              const delay = Math.pow(2, attempt - 1) * 1000;
              await this.delay(delay);
            }

            const result = await processor(batch);
            results.push(...result);
            success = true;
            console.log(`  ✓ Batch ${i + 1} processed successfully`);
          } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`  ❌ Attempt ${attempt} failed: ${lastError.message}`);
          }
        }

        if (!success) {
          const errorMsg = `Batch ${i + 1} failed after ${this.config.retryAttempts} attempts: ${lastError?.message}`;
          errors.push(errorMsg);
          console.error(`  ⚠️  ${errorMsg}`);
        }
      }

      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(80));
      console.log('Fault-Tolerant Pipeline Complete!');
      console.log(`Processed: ${results.length}/${inputData.length} records`);
      console.log(`Failed: ${inputData.length - results.length} records`);
      console.log(`Duration: ${duration}ms`);
      console.log('='.repeat(80));

      return {
        success: errors.length === 0,
        totalRecords: inputData.length,
        processedRecords: results.length,
        failedRecords: inputData.length - results.length,
        duration,
        stages: [],
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        totalRecords: inputData.length,
        processedRecords: results.length,
        failedRecords: inputData.length - results.length,
        duration,
        stages: [],
        errors: [...errors, error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private createBatches(data: Record[], batchSize: number): Record[][] {
    const batches: Record[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Example 5: Multi-Stage Batch Pipeline with Dependencies
// ============================================================================

class MultiStageBatchPipeline {
  private stages: Map<
    string,
    {
      name: string;
      processor: (records: Record[]) => Promise<Record[]>;
      dependencies: string[];
    }
  > = new Map();

  addStage(
    id: string,
    name: string,
    processor: (records: Record[]) => Promise<Record[]>,
    dependencies: string[] = []
  ): this {
    this.stages.set(id, { name, processor, dependencies });
    return this;
  }

  async run(inputData: Record[], batchSize: number): Promise<PipelineResult> {
    const startTime = Date.now();
    const stageResults: StageResult[] = [];
    const stageOutputs = new Map<string, Record[]>();
    const errors: string[] = [];

    console.log('='.repeat(80));
    console.log(`Starting Multi-Stage Batch Pipeline`);
    console.log(`Stages: ${this.stages.size}`);
    console.log('='.repeat(80));

    try {
      // Topological sort to determine execution order
      const executionOrder = this.topologicalSort();

      console.log(`\nExecution order: ${executionOrder.join(' → ')}`);

      // Execute stages in order
      for (const stageId of executionOrder) {
        const stage = this.stages.get(stageId)!;
        const stageStartTime = Date.now();

        console.log(`\n${'='.repeat(80)}`);
        console.log(`Stage: ${stage.name} (${stageId})`);

        // Get input data from dependencies or initial input
        let stageInput: Record[];
        if (stage.dependencies.length === 0) {
          stageInput = inputData;
        } else {
          // Merge outputs from all dependencies
          stageInput = stage.dependencies
            .flatMap(depId => stageOutputs.get(depId) || []);
        }

        console.log(`Input: ${stageInput.length} records`);

        try {
          // Process in batches
          const batches = this.createBatches(stageInput, batchSize);
          const processedBatches: Record[][] = [];

          for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            console.log(`  Processing batch ${i + 1}/${batches.length}`);
            const result = await stage.processor(batch);
            processedBatches.push(result);
          }

          const output = processedBatches.flat();
          stageOutputs.set(stageId, output);

          const stageDuration = Date.now() - stageStartTime;

          stageResults.push({
            name: stage.name,
            inputCount: stageInput.length,
            outputCount: output.length,
            duration: stageDuration,
            errors: [],
          });

          console.log(`Output: ${output.length} records`);
          console.log(`Duration: ${stageDuration}ms`);
        } catch (error) {
          const errorMsg = `Stage ${stage.name}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
          throw error;
        }
      }

      // Get final output from last stage
      const finalStageId = executionOrder[executionOrder.length - 1];
      const finalOutput = stageOutputs.get(finalStageId) || [];

      const duration = Date.now() - startTime;

      console.log('\n' + '='.repeat(80));
      console.log('Multi-Stage Pipeline Complete!');
      console.log(`Final output: ${finalOutput.length} records`);
      console.log(`Total duration: ${duration}ms`);
      console.log('='.repeat(80));

      return {
        success: true,
        totalRecords: inputData.length,
        processedRecords: finalOutput.length,
        failedRecords: 0,
        duration,
        stages: stageResults,
        errors,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        totalRecords: inputData.length,
        processedRecords: 0,
        failedRecords: inputData.length,
        duration,
        stages: stageResults,
        errors: [...errors, error instanceof Error ? error.message : String(error)],
      };
    }
  }

  private topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (id: string) => {
      if (temp.has(id)) {
        throw new Error(`Circular dependency detected at stage: ${id}`);
      }
      if (visited.has(id)) return;

      temp.add(id);

      const stage = this.stages.get(id)!;
      stage.dependencies.forEach(depId => visit(depId));

      temp.delete(id);
      visited.add(id);
      sorted.push(id);
    };

    this.stages.forEach((_, id) => visit(id));

    return sorted;
  }

  private createBatches(data: Record[], batchSize: number): Record[][] {
    const batches: Record[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateBatchPipelines() {
  console.log('BATCH PIPELINE EXAMPLES\n');

  // Sample data
  const sampleData = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    value: Math.random() * 100,
    category: ['A', 'B', 'C'][i % 3],
  }));

  // Example 1: Simple Batch Pipeline
  console.log('\n1. Simple Batch Pipeline:');
  const simplePipeline = new SimpleBatchPipeline({ batchSize: 100 })
    .addStage('filter', async (records) =>
      records.filter(r => (r.value as number) > 50)
    )
    .addStage('transform', async (records) =>
      records.map(r => ({ ...r, value: (r.value as number) * 2 }))
    );

  const result1 = await simplePipeline.run(sampleData);
  console.log(`Result: ${result1.success ? 'SUCCESS' : 'FAILED'}`);

  // Example 2: Parallel Batch Processing
  console.log('\n2. Parallel Batch Processing:');
  const parallelPipeline = new ParallelBatchPipeline({
    batchSize: 100,
    parallelism: 4,
  });

  const result2 = await parallelPipeline.run(
    sampleData.slice(0, 500),
    async (record) => {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 10));
      return { ...record, processed: true };
    }
  );
  console.log(`Result: ${result2.success ? 'SUCCESS' : 'FAILED'}`);

  // Example 3: Fault-Tolerant Pipeline
  console.log('\n3. Fault-Tolerant Batch Pipeline:');
  const faultTolerantPipeline = new FaultTolerantBatchPipeline({
    batchSize: 100,
    retryAttempts: 3,
  });

  let callCount = 0;
  const result3 = await faultTolerantPipeline.run(
    sampleData.slice(0, 300),
    async (records) => {
      callCount++;
      // Fail first attempt
      if (callCount === 1) {
        throw new Error('Simulated failure');
      }
      return records;
    }
  );
  console.log(`Result: ${result3.success ? 'SUCCESS' : 'FAILED'}`);
}

// Run examples
if (require.main === module) {
  demonstrateBatchPipelines().catch(console.error);
}

export {
  SimpleBatchPipeline,
  IncrementalBatchPipeline,
  ParallelBatchPipeline,
  FaultTolerantBatchPipeline,
  MultiStageBatchPipeline,
  type BatchConfig,
  type PipelineResult,
  type StageResult,
  type Checkpoint,
};
