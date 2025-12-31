export type Record = Record<string, unknown>;

export interface ExtractResult {
  records: Record[];
  metadata: {
    source: string;
    extractedAt: Date;
    count: number;
  };
}

export interface TransformResult {
  records: Record[];
  metadata: {
    inputCount: number;
    outputCount: number;
    droppedCount: number;
    errors: Array<{ record: Record; error: string }>;
  };
}

export interface LoadResult {
  success: boolean;
  destination: string;
  loadedCount: number;
  errors: string[];
}

export interface PipelineConfig {
  name: string;
  description?: string;
  continueOnError?: boolean;
  batchSize?: number;
}

export interface PipelineResult {
  name: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  extractedCount: number;
  transformedCount: number;
  loadedCount: number;
  errors: string[];
}

export interface Extractor {
  name: string;
  extract(): Promise<ExtractResult>;
}

export interface Transformer {
  name: string;
  transform(records: Record[]): Promise<TransformResult>;
}

export interface Loader {
  name: string;
  load(records: Record[]): Promise<LoadResult>;
}
