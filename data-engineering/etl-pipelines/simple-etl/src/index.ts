/**
 * Simple ETL Pipeline
 *
 * A lightweight ETL framework that supports:
 * - Multiple data sources (CSV, JSON, API)
 * - Transformation pipelines
 * - Multiple destinations
 * - Validation with Zod
 * - Error handling
 */

export { Pipeline, PipelineBuilder } from './pipeline.js';
export { Extractor, JsonExtractor, CsvExtractor, ApiExtractor } from './extractors.js';
export { Transformer, MapTransformer, FilterTransformer, ValidateTransformer } from './transformers.js';
export { Loader, JsonLoader, CsvLoader, ConsoleLoader } from './loaders.js';
export type { PipelineConfig, PipelineResult, Record } from './types.js';
