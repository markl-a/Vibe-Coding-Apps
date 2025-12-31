import { z } from 'zod';
import type { Transformer, TransformResult, Record } from './types.js';

export { Transformer };

export class MapTransformer implements Transformer {
  name: string;
  private mapFn: (record: Record) => Record;

  constructor(mapFn: (record: Record) => Record, name = 'MapTransformer') {
    this.mapFn = mapFn;
    this.name = name;
  }

  async transform(records: Record[]): Promise<TransformResult> {
    const errors: Array<{ record: Record; error: string }> = [];
    const outputRecords: Record[] = [];

    for (const record of records) {
      try {
        const transformed = this.mapFn(record);
        outputRecords.push(transformed);
      } catch (error) {
        errors.push({
          record,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      records: outputRecords,
      metadata: {
        inputCount: records.length,
        outputCount: outputRecords.length,
        droppedCount: errors.length,
        errors,
      },
    };
  }
}

export class FilterTransformer implements Transformer {
  name: string;
  private filterFn: (record: Record) => boolean;

  constructor(filterFn: (record: Record) => boolean, name = 'FilterTransformer') {
    this.filterFn = filterFn;
    this.name = name;
  }

  async transform(records: Record[]): Promise<TransformResult> {
    const outputRecords = records.filter(this.filterFn);

    return {
      records: outputRecords,
      metadata: {
        inputCount: records.length,
        outputCount: outputRecords.length,
        droppedCount: records.length - outputRecords.length,
        errors: [],
      },
    };
  }
}

export class ValidateTransformer implements Transformer {
  name: string;
  private schema: z.ZodSchema;
  private dropInvalid: boolean;

  constructor(
    schema: z.ZodSchema,
    options: { dropInvalid?: boolean } = {},
    name = 'ValidateTransformer'
  ) {
    this.schema = schema;
    this.dropInvalid = options.dropInvalid ?? true;
    this.name = name;
  }

  async transform(records: Record[]): Promise<TransformResult> {
    const errors: Array<{ record: Record; error: string }> = [];
    const outputRecords: Record[] = [];

    for (const record of records) {
      const result = this.schema.safeParse(record);

      if (result.success) {
        outputRecords.push(result.data as Record);
      } else {
        const errorMessage = result.error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');

        errors.push({ record, error: errorMessage });

        if (!this.dropInvalid) {
          outputRecords.push(record);
        }
      }
    }

    return {
      records: outputRecords,
      metadata: {
        inputCount: records.length,
        outputCount: outputRecords.length,
        droppedCount: errors.length,
        errors,
      },
    };
  }
}

export class AggregateTransformer implements Transformer {
  name: string;
  private groupBy: string;
  private aggregations: Array<{
    field: string;
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
    as: string;
  }>;

  constructor(
    groupBy: string,
    aggregations: Array<{
      field: string;
      operation: 'sum' | 'avg' | 'count' | 'min' | 'max';
      as: string;
    }>,
    name = 'AggregateTransformer'
  ) {
    this.groupBy = groupBy;
    this.aggregations = aggregations;
    this.name = name;
  }

  async transform(records: Record[]): Promise<TransformResult> {
    const groups = new Map<string, Record[]>();

    // Group records
    for (const record of records) {
      const key = String(record[this.groupBy] ?? 'null');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    // Aggregate
    const outputRecords: Record[] = [];

    for (const [key, groupRecords] of groups) {
      const result: Record = { [this.groupBy]: key };

      for (const agg of this.aggregations) {
        const values = groupRecords
          .map((r) => Number(r[agg.field]))
          .filter((v) => !isNaN(v));

        switch (agg.operation) {
          case 'sum':
            result[agg.as] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            result[agg.as] = values.length > 0
              ? values.reduce((a, b) => a + b, 0) / values.length
              : 0;
            break;
          case 'count':
            result[agg.as] = groupRecords.length;
            break;
          case 'min':
            result[agg.as] = Math.min(...values);
            break;
          case 'max':
            result[agg.as] = Math.max(...values);
            break;
        }
      }

      outputRecords.push(result);
    }

    return {
      records: outputRecords,
      metadata: {
        inputCount: records.length,
        outputCount: outputRecords.length,
        droppedCount: 0,
        errors: [],
      },
    };
  }
}
