import type {
  PipelineConfig,
  PipelineResult,
  Extractor,
  Transformer,
  Loader,
  Record,
} from './types.js';

export class Pipeline {
  private config: PipelineConfig;
  private extractors: Extractor[] = [];
  private transformers: Transformer[] = [];
  private loaders: Loader[] = [];

  constructor(config: PipelineConfig) {
    this.config = config;
  }

  addExtractor(extractor: Extractor): this {
    this.extractors.push(extractor);
    return this;
  }

  addTransformer(transformer: Transformer): this {
    this.transformers.push(transformer);
    return this;
  }

  addLoader(loader: Loader): this {
    this.loaders.push(loader);
    return this;
  }

  async run(): Promise<PipelineResult> {
    const startTime = new Date();
    const errors: string[] = [];
    let records: Record[] = [];

    console.log(`\n🚀 Starting pipeline: ${this.config.name}`);
    console.log(`   ${this.config.description ?? ''}\n`);

    // Extract
    console.log('📥 EXTRACT');
    for (const extractor of this.extractors) {
      try {
        console.log(`   ▶ ${extractor.name}`);
        const result = await extractor.extract();
        records.push(...result.records);
        console.log(`     ✓ Extracted ${result.metadata.count} records`);
      } catch (error) {
        const msg = `Extract error (${extractor.name}): ${error}`;
        errors.push(msg);
        console.error(`     ✗ ${msg}`);
        if (!this.config.continueOnError) throw error;
      }
    }

    const extractedCount = records.length;

    // Transform
    console.log('\n🔄 TRANSFORM');
    for (const transformer of this.transformers) {
      try {
        console.log(`   ▶ ${transformer.name}`);
        const result = await transformer.transform(records);
        records = result.records;
        console.log(
          `     ✓ ${result.metadata.inputCount} → ${result.metadata.outputCount} records`
        );
        if (result.metadata.errors.length > 0) {
          console.log(`     ⚠ ${result.metadata.errors.length} errors`);
        }
      } catch (error) {
        const msg = `Transform error (${transformer.name}): ${error}`;
        errors.push(msg);
        console.error(`     ✗ ${msg}`);
        if (!this.config.continueOnError) throw error;
      }
    }

    const transformedCount = records.length;

    // Load
    console.log('\n📤 LOAD');
    let loadedCount = 0;
    for (const loader of this.loaders) {
      try {
        console.log(`   ▶ ${loader.name}`);
        const result = await loader.load(records);
        if (result.success) {
          loadedCount += result.loadedCount;
          console.log(`     ✓ Loaded ${result.loadedCount} records to ${result.destination}`);
        } else {
          errors.push(...result.errors);
          console.error(`     ✗ Load failed: ${result.errors.join(', ')}`);
        }
      } catch (error) {
        const msg = `Load error (${loader.name}): ${error}`;
        errors.push(msg);
        console.error(`     ✗ ${msg}`);
        if (!this.config.continueOnError) throw error;
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`\n✅ Pipeline completed in ${duration}ms`);
    console.log(`   Extracted: ${extractedCount}, Transformed: ${transformedCount}, Loaded: ${loadedCount}`);

    return {
      name: this.config.name,
      success: errors.length === 0,
      startTime,
      endTime,
      duration,
      extractedCount,
      transformedCount,
      loadedCount,
      errors,
    };
  }
}

// Fluent builder for pipelines
export class PipelineBuilder {
  private pipeline: Pipeline;

  constructor(name: string, description?: string) {
    this.pipeline = new Pipeline({
      name,
      description,
      continueOnError: false,
    });
  }

  continueOnError(value = true): this {
    (this.pipeline as any).config.continueOnError = value;
    return this;
  }

  extract(extractor: Extractor): this {
    this.pipeline.addExtractor(extractor);
    return this;
  }

  transform(transformer: Transformer): this {
    this.pipeline.addTransformer(transformer);
    return this;
  }

  load(loader: Loader): this {
    this.pipeline.addLoader(loader);
    return this;
  }

  build(): Pipeline {
    return this.pipeline;
  }

  async run(): Promise<PipelineResult> {
    return this.pipeline.run();
  }
}
