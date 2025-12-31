/**
 * Data Transformation Examples
 *
 * Demonstrates various data transformation patterns:
 * 1. Field mapping and renaming
 * 2. Data type conversion and parsing
 * 3. Data cleansing and normalization
 * 4. Data enrichment and augmentation
 * 5. Aggregation and grouping
 * 6. Filtering and deduplication
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

interface TransformResult<T = unknown> {
  data: T[];
  metadata: {
    inputCount: number;
    outputCount: number;
    droppedCount: number;
    errors: Array<{ index: number; error: string }>;
    duration: number;
  };
}

type Record = Record<string, unknown>;

// ============================================================================
// Example 1: Field Mapping and Renaming Transformer
// ============================================================================

interface FieldMapping {
  from: string;
  to: string;
  transform?: (value: unknown) => unknown;
}

class FieldMappingTransformer {
  constructor(private mappings: FieldMapping[]) {}

  transform<T extends Record, R extends Record>(data: T[]): TransformResult<R> {
    const startTime = Date.now();
    const transformed: R[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    data.forEach((record, index) => {
      try {
        const newRecord: Record = {};

        this.mappings.forEach(({ from, to, transform }) => {
          const value = record[from];

          if (transform) {
            try {
              newRecord[to] = transform(value);
            } catch (error) {
              throw new Error(`Transform error for field '${from}': ${error instanceof Error ? error.message : String(error)}`);
            }
          } else {
            newRecord[to] = value;
          }
        });

        transformed.push(newRecord as R);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return {
      data: transformed,
      metadata: {
        inputCount: data.length,
        outputCount: transformed.length,
        droppedCount: errors.length,
        errors,
        duration: Date.now() - startTime,
      },
    };
  }
}

// ============================================================================
// Example 2: Data Type Conversion Transformer
// ============================================================================

class TypeConversionTransformer {
  constructor(
    private conversions: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'json'>
  ) {}

  transform<T extends Record>(data: T[]): TransformResult<T> {
    const startTime = Date.now();
    const transformed: T[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    data.forEach((record, index) => {
      try {
        const convertedRecord = { ...record };

        Object.entries(this.conversions).forEach(([field, targetType]) => {
          const value = convertedRecord[field];

          try {
            convertedRecord[field] = this.convertType(value, targetType) as T[Extract<keyof T, string>];
          } catch (error) {
            throw new Error(`Type conversion error for field '${field}': ${error instanceof Error ? error.message : String(error)}`);
          }
        });

        transformed.push(convertedRecord);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return {
      data: transformed,
      metadata: {
        inputCount: data.length,
        outputCount: transformed.length,
        droppedCount: errors.length,
        errors,
        duration: Date.now() - startTime,
      },
    };
  }

  private convertType(value: unknown, targetType: string): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    switch (targetType) {
      case 'string':
        return String(value);

      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`Cannot convert '${value}' to number`);
        }
        return num;
      }

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === '1' || lower === 'yes') return true;
          if (lower === 'false' || lower === '0' || lower === 'no') return false;
        }
        return Boolean(value);

      case 'date': {
        const date = new Date(value as string | number | Date);
        if (isNaN(date.getTime())) {
          throw new Error(`Cannot convert '${value}' to date`);
        }
        return date;
      }

      case 'json':
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return value;

      default:
        return value;
    }
  }
}

// ============================================================================
// Example 3: Data Cleansing and Normalization Transformer
// ============================================================================

interface CleansingRules {
  trimStrings?: boolean;
  removeNulls?: boolean;
  normalizeCase?: 'upper' | 'lower' | 'title';
  removeSpecialChars?: boolean;
  standardizePhones?: boolean;
  standardizeEmails?: boolean;
}

class DataCleansingTransformer {
  constructor(
    private rules: CleansingRules = {},
    private fieldsToClean?: string[]
  ) {}

  transform<T extends Record>(data: T[]): TransformResult<T> {
    const startTime = Date.now();
    const transformed: T[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    data.forEach((record, index) => {
      try {
        const cleanedRecord = { ...record };

        const fieldsToProcess = this.fieldsToClean || Object.keys(cleanedRecord);

        fieldsToProcess.forEach(field => {
          let value = cleanedRecord[field];

          if (typeof value === 'string') {
            // Trim strings
            if (this.rules.trimStrings) {
              value = value.trim();
            }

            // Normalize case
            if (this.rules.normalizeCase) {
              switch (this.rules.normalizeCase) {
                case 'upper':
                  value = value.toUpperCase();
                  break;
                case 'lower':
                  value = value.toLowerCase();
                  break;
                case 'title':
                  value = this.toTitleCase(value);
                  break;
              }
            }

            // Remove special characters
            if (this.rules.removeSpecialChars) {
              value = value.replace(/[^a-zA-Z0-9\s]/g, '');
            }

            // Standardize phone numbers
            if (this.rules.standardizePhones && field.toLowerCase().includes('phone')) {
              value = this.standardizePhone(value);
            }

            // Standardize emails
            if (this.rules.standardizeEmails && field.toLowerCase().includes('email')) {
              value = value.toLowerCase().trim();
            }

            cleanedRecord[field] = value as T[Extract<keyof T, string>];
          }

          // Remove null/undefined values
          if (this.rules.removeNulls && (value === null || value === undefined || value === '')) {
            delete cleanedRecord[field];
          }
        });

        transformed.push(cleanedRecord);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return {
      data: transformed,
      metadata: {
        inputCount: data.length,
        outputCount: transformed.length,
        droppedCount: errors.length,
        errors,
        duration: Date.now() - startTime,
      },
    };
  }

  private toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  private standardizePhone(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for 10-digit US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
  }
}

// ============================================================================
// Example 4: Data Enrichment Transformer
// ============================================================================

interface EnrichmentSource<T = unknown> {
  lookup(key: unknown): Promise<T | null>;
}

class DataEnrichmentTransformer<T extends Record> {
  private enrichments: Array<{
    lookupField: string;
    enrichmentSource: EnrichmentSource;
    targetFields: string[];
  }> = [];

  addEnrichment(
    lookupField: string,
    enrichmentSource: EnrichmentSource,
    targetFields: string[]
  ) {
    this.enrichments.push({ lookupField, enrichmentSource, targetFields });
    return this;
  }

  async transform(data: T[]): Promise<TransformResult<T>> {
    const startTime = Date.now();
    const transformed: T[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let index = 0; index < data.length; index++) {
      const record = data[index];

      try {
        const enrichedRecord = { ...record };

        // Apply all enrichments
        for (const { lookupField, enrichmentSource, targetFields } of this.enrichments) {
          const lookupValue = record[lookupField];

          if (lookupValue !== null && lookupValue !== undefined) {
            const enrichmentData = await enrichmentSource.lookup(lookupValue);

            if (enrichmentData) {
              targetFields.forEach(field => {
                enrichedRecord[field] = (enrichmentData as Record)[field] as T[Extract<keyof T, string>];
              });
            }
          }
        }

        transformed.push(enrichedRecord);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return {
      data: transformed,
      metadata: {
        inputCount: data.length,
        outputCount: transformed.length,
        droppedCount: errors.length,
        errors,
        duration: Date.now() - startTime,
      },
    };
  }
}

// Mock enrichment source
class GeolocationEnrichment implements EnrichmentSource {
  private cache = new Map<string, unknown>();

  async lookup(zipCode: unknown): Promise<Record | null> {
    const key = String(zipCode);

    if (this.cache.has(key)) {
      return this.cache.get(key) as Record;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 10));

    const data = {
      city: 'Example City',
      state: 'EX',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060,
    };

    this.cache.set(key, data);
    return data;
  }
}

// ============================================================================
// Example 5: Aggregation and Grouping Transformer
// ============================================================================

interface AggregationConfig {
  groupBy: string[];
  aggregations: Array<{
    field: string;
    operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
    as: string;
  }>;
}

class AggregationTransformer {
  constructor(private config: AggregationConfig) {}

  transform<T extends Record>(data: T[]): TransformResult<Record> {
    const startTime = Date.now();
    const groups = new Map<string, T[]>();

    // Group data
    data.forEach(record => {
      const key = this.config.groupBy
        .map(field => String(record[field] ?? 'null'))
        .join('|');

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    });

    // Aggregate
    const aggregated: Record[] = [];

    groups.forEach((groupRecords, key) => {
      const result: Record = {};

      // Add group by fields
      const keyParts = key.split('|');
      this.config.groupBy.forEach((field, index) => {
        result[field] = groupRecords[0][field] ?? keyParts[index];
      });

      // Perform aggregations
      this.config.aggregations.forEach(({ field, operation, as }) => {
        const values = groupRecords
          .map(r => r[field])
          .filter(v => v !== null && v !== undefined);

        switch (operation) {
          case 'sum':
            result[as] = values.reduce((acc, val) => acc + Number(val), 0);
            break;

          case 'avg':
            const sum = values.reduce((acc, val) => acc + Number(val), 0);
            result[as] = values.length > 0 ? sum / values.length : 0;
            break;

          case 'count':
            result[as] = groupRecords.length;
            break;

          case 'min':
            result[as] = Math.min(...values.map(Number));
            break;

          case 'max':
            result[as] = Math.max(...values.map(Number));
            break;

          case 'first':
            result[as] = groupRecords[0][field];
            break;

          case 'last':
            result[as] = groupRecords[groupRecords.length - 1][field];
            break;
        }
      });

      aggregated.push(result);
    });

    return {
      data: aggregated,
      metadata: {
        inputCount: data.length,
        outputCount: aggregated.length,
        droppedCount: 0,
        errors: [],
        duration: Date.now() - startTime,
      },
    };
  }
}

// ============================================================================
// Example 6: Filtering and Deduplication Transformer
// ============================================================================

type FilterPredicate<T> = (record: T, index: number) => boolean;

class FilterTransformer<T extends Record> {
  constructor(private predicate: FilterPredicate<T>) {}

  transform(data: T[]): TransformResult<T> {
    const startTime = Date.now();
    const filtered = data.filter((record, index) => {
      try {
        return this.predicate(record, index);
      } catch {
        return false;
      }
    });

    return {
      data: filtered,
      metadata: {
        inputCount: data.length,
        outputCount: filtered.length,
        droppedCount: data.length - filtered.length,
        errors: [],
        duration: Date.now() - startTime,
      },
    };
  }
}

class DeduplicationTransformer<T extends Record> {
  constructor(
    private uniqueFields: string[],
    private keepStrategy: 'first' | 'last' = 'first'
  ) {}

  transform(data: T[]): TransformResult<T> {
    const startTime = Date.now();
    const seen = new Map<string, T>();

    data.forEach(record => {
      const key = this.uniqueFields
        .map(field => String(record[field] ?? 'null'))
        .join('|');

      if (!seen.has(key)) {
        seen.set(key, record);
      } else if (this.keepStrategy === 'last') {
        seen.set(key, record);
      }
    });

    const deduplicated = Array.from(seen.values());

    return {
      data: deduplicated,
      metadata: {
        inputCount: data.length,
        outputCount: deduplicated.length,
        droppedCount: data.length - deduplicated.length,
        errors: [],
        duration: Date.now() - startTime,
      },
    };
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateTransformations() {
  console.log('='.repeat(80));
  console.log('DATA TRANSFORMATION EXAMPLES');
  console.log('='.repeat(80));

  // Sample data
  const rawData = [
    { first_name: '  JOHN  ', last_name: 'DOE', age: '25', phone: '5551234567', zip: '10001' },
    { first_name: 'jane', last_name: 'smith', age: '30', phone: '(555) 234-5678', zip: '10002' },
    { first_name: 'Bob', last_name: 'JONES', age: '35', phone: '555.345.6789', zip: '10001' },
    { first_name: 'alice', last_name: 'williams', age: '28', phone: '5554567890', zip: '10002' },
  ];

  // Example 1: Field Mapping
  console.log('\n1. Field Mapping and Renaming:');
  console.log('-'.repeat(80));
  const fieldMapper = new FieldMappingTransformer([
    { from: 'first_name', to: 'firstName' },
    { from: 'last_name', to: 'lastName' },
    { from: 'age', to: 'age', transform: (v) => Number(v) },
  ]);
  const mappedResult = fieldMapper.transform(rawData);
  console.log(`Mapped ${mappedResult.metadata.outputCount} records`);
  console.log('Sample:', mappedResult.data[0]);

  // Example 2: Type Conversion
  console.log('\n2. Data Type Conversion:');
  console.log('-'.repeat(80));
  const typeConverter = new TypeConversionTransformer({
    age: 'number',
  });
  const convertedResult = typeConverter.transform(rawData);
  console.log(`Converted ${convertedResult.metadata.outputCount} records`);
  console.log('Sample:', convertedResult.data[0]);

  // Example 3: Data Cleansing
  console.log('\n3. Data Cleansing and Normalization:');
  console.log('-'.repeat(80));
  const cleanser = new DataCleansingTransformer({
    trimStrings: true,
    normalizeCase: 'title',
    standardizePhones: true,
  });
  const cleansedResult = cleanser.transform(rawData);
  console.log(`Cleansed ${cleansedResult.metadata.outputCount} records`);
  console.log('Sample:', cleansedResult.data[0]);

  // Example 4: Data Enrichment
  console.log('\n4. Data Enrichment:');
  console.log('-'.repeat(80));
  const enricher = new DataEnrichmentTransformer()
    .addEnrichment('zip', new GeolocationEnrichment(), ['city', 'state', 'country']);
  const enrichedResult = await enricher.transform(cleansedResult.data);
  console.log(`Enriched ${enrichedResult.metadata.outputCount} records in ${enrichedResult.metadata.duration}ms`);
  console.log('Sample:', enrichedResult.data[0]);

  // Example 5: Aggregation
  console.log('\n5. Aggregation and Grouping:');
  console.log('-'.repeat(80));
  const aggregator = new AggregationTransformer({
    groupBy: ['city'],
    aggregations: [
      { field: 'age', operation: 'avg', as: 'avgAge' },
      { field: 'age', operation: 'count', as: 'count' },
    ],
  });
  const aggregatedResult = aggregator.transform(enrichedResult.data as Record[]);
  console.log(`Aggregated into ${aggregatedResult.metadata.outputCount} groups`);
  console.table(aggregatedResult.data);

  // Example 6: Filtering and Deduplication
  console.log('\n6. Filtering and Deduplication:');
  console.log('-'.repeat(80));
  const filter = new FilterTransformer<Record>(record => Number(record.age) >= 28);
  const filteredResult = filter.transform(enrichedResult.data as Record[]);
  console.log(`Filtered to ${filteredResult.metadata.outputCount} records (dropped ${filteredResult.metadata.droppedCount})`);

  const deduplicator = new DeduplicationTransformer(['zip'], 'first');
  const dedupedResult = deduplicator.transform(enrichedResult.data as Record[]);
  console.log(`Deduplicated to ${dedupedResult.metadata.outputCount} unique records (removed ${dedupedResult.metadata.droppedCount})`);

  console.log('\n' + '='.repeat(80));
  console.log('TRANSFORMATION COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateTransformations().catch(console.error);
}

export {
  FieldMappingTransformer,
  TypeConversionTransformer,
  DataCleansingTransformer,
  DataEnrichmentTransformer,
  AggregationTransformer,
  FilterTransformer,
  DeduplicationTransformer,
  type TransformResult,
  type FieldMapping,
  type CleansingRules,
  type AggregationConfig,
  type FilterPredicate,
};
