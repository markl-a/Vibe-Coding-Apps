/**
 * Data Extraction Examples
 *
 * Demonstrates various data extraction patterns from different sources:
 * 1. JSON file extraction with schema validation
 * 2. CSV extraction with custom delimiters
 * 3. REST API extraction with pagination
 * 4. Database extraction simulation
 * 5. Multi-source extraction with merging
 */

import { z } from 'zod';

// ============================================================================
// Type Definitions
// ============================================================================

interface ExtractResult<T = unknown> {
  data: T[];
  metadata: {
    source: string;
    extractedAt: Date;
    recordCount: number;
    duration: number;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================================================
// Example 1: JSON File Extraction with Schema Validation
// ============================================================================

const CustomerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0).max(150),
  country: z.string(),
  registeredAt: z.string().datetime(),
});

type Customer = z.infer<typeof CustomerSchema>;

class JsonExtractor<T> {
  constructor(
    private schema: z.ZodSchema<T>,
    private filePath: string
  ) {}

  async extract(): Promise<ExtractResult<T>> {
    const startTime = Date.now();

    try {
      // Simulate file reading
      const rawData = await this.readJsonFile(this.filePath);

      // Validate and parse data
      const validatedData: T[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < rawData.length; i++) {
        const result = this.schema.safeParse(rawData[i]);
        if (result.success) {
          validatedData.push(result.data);
        } else {
          errors.push({
            index: i,
            error: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          });
        }
      }

      if (errors.length > 0) {
        console.warn(`Validation warnings: ${errors.length} invalid records found`);
        errors.slice(0, 5).forEach(e => console.warn(`  Record ${e.index}: ${e.error}`));
      }

      return {
        data: validatedData,
        metadata: {
          source: this.filePath,
          extractedAt: new Date(),
          recordCount: validatedData.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`JSON extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async readJsonFile(path: string): Promise<unknown[]> {
    // Simulation of file reading
    console.log(`Reading JSON from: ${path}`);
    // In real implementation: fs.readFile() + JSON.parse()
    return [];
  }
}

// ============================================================================
// Example 2: CSV Extraction with Custom Delimiters and Headers
// ============================================================================

interface CsvOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
  encoding?: BufferEncoding;
}

class CsvExtractor {
  constructor(
    private filePath: string,
    private options: CsvOptions = {}
  ) {
    this.options = {
      delimiter: ',',
      hasHeader: true,
      skipEmptyLines: true,
      encoding: 'utf-8',
      ...options,
    };
  }

  async extract(): Promise<ExtractResult<Record<string, string>>> {
    const startTime = Date.now();

    try {
      const content = await this.readCsvFile(this.filePath);
      const lines = content.split('\n').filter(line =>
        this.options.skipEmptyLines ? line.trim() : true
      );

      const delimiter = this.options.delimiter!;
      let headers: string[] = [];
      let dataStartIndex = 0;

      if (this.options.hasHeader) {
        headers = lines[0].split(delimiter).map(h => h.trim());
        dataStartIndex = 1;
      } else {
        // Generate default headers
        const firstLine = lines[0].split(delimiter);
        headers = firstLine.map((_, i) => `column_${i}`);
      }

      const data: Record<string, string>[] = [];

      for (let i = dataStartIndex; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim());
        const record: Record<string, string> = {};

        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });

        data.push(record);
      }

      return {
        data,
        metadata: {
          source: this.filePath,
          extractedAt: new Date(),
          recordCount: data.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`CSV extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async readCsvFile(path: string): Promise<string> {
    console.log(`Reading CSV from: ${path}`);
    // In real implementation: fs.readFile()
    return 'id,name,email\n1,John,john@example.com\n2,Jane,jane@example.com';
  }
}

// ============================================================================
// Example 3: REST API Extraction with Pagination
// ============================================================================

class ApiExtractor<T> {
  constructor(
    private baseUrl: string,
    private endpoint: string,
    private options: {
      headers?: Record<string, string>;
      queryParams?: Record<string, string>;
      maxPages?: number;
      pageSize?: number;
    } = {}
  ) {}

  async extract(): Promise<ExtractResult<T>> {
    const startTime = Date.now();
    const allData: T[] = [];
    let currentPage = 1;
    let hasMore = true;

    const maxPages = this.options.maxPages || Infinity;

    try {
      while (hasMore && currentPage <= maxPages) {
        console.log(`Fetching page ${currentPage}...`);

        const response = await this.fetchPage(currentPage);
        allData.push(...response.data);

        hasMore = response.pagination.hasMore;
        currentPage++;

        // Rate limiting
        if (hasMore) {
          await this.delay(100);
        }
      }

      return {
        data: allData,
        metadata: {
          source: `${this.baseUrl}${this.endpoint}`,
          extractedAt: new Date(),
          recordCount: allData.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`API extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async fetchPage(page: number): Promise<PaginatedResponse<T>> {
    const url = new URL(this.endpoint, this.baseUrl);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('pageSize', (this.options.pageSize || 100).toString());

    // Add custom query params
    if (this.options.queryParams) {
      Object.entries(this.options.queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log(`GET ${url.toString()}`);

    // Simulation of API call
    // In real implementation: fetch() or axios
    return {
      data: [] as T[],
      pagination: {
        page,
        totalPages: 5,
        hasMore: page < 5,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Example 4: Database Extraction Simulation
// ============================================================================

interface QueryOptions {
  table: string;
  columns?: string[];
  where?: Record<string, unknown>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

class DatabaseExtractor<T> {
  constructor(
    private connectionString: string,
    private queryOptions: QueryOptions
  ) {}

  async extract(): Promise<ExtractResult<T>> {
    const startTime = Date.now();

    try {
      // Build SQL query
      const query = this.buildQuery();
      console.log(`Executing query: ${query}`);

      // Simulate database query
      const data = await this.executeQuery<T>(query);

      return {
        data,
        metadata: {
          source: `${this.connectionString}/${this.queryOptions.table}`,
          extractedAt: new Date(),
          recordCount: data.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`Database extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private buildQuery(): string {
    const { table, columns, where, orderBy, limit, offset } = this.queryOptions;

    let query = `SELECT ${columns?.join(', ') || '*'} FROM ${table}`;

    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(' AND ');
      query += ` WHERE ${conditions}`;
    }

    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    return query;
  }

  private async executeQuery<R>(query: string): Promise<R[]> {
    // Simulation of database query execution
    // In real implementation: pg, mysql2, etc.
    console.log(`Connected to: ${this.connectionString}`);
    return [];
  }
}

// ============================================================================
// Example 5: Multi-Source Extraction with Merging
// ============================================================================

interface MergeStrategy {
  keyField: string;
  conflictResolution?: 'source1' | 'source2' | 'merge';
}

class MultiSourceExtractor<T extends Record<string, unknown>> {
  private extractors: Array<{ name: string; extractor: { extract(): Promise<ExtractResult<T>> } }> = [];

  addSource(name: string, extractor: { extract(): Promise<ExtractResult<T>> }) {
    this.extractors.push({ name, extractor });
    return this;
  }

  async extractAndMerge(strategy: MergeStrategy): Promise<ExtractResult<T>> {
    const startTime = Date.now();

    try {
      // Extract from all sources in parallel
      console.log(`Extracting from ${this.extractors.length} sources...`);

      const results = await Promise.all(
        this.extractors.map(async ({ name, extractor }) => {
          console.log(`  - Extracting from ${name}...`);
          return { name, result: await extractor.extract() };
        })
      );

      // Merge data
      const mergedData = this.mergeData(results.map(r => r.result.data), strategy);

      const totalRecords = results.reduce((sum, r) => sum + r.result.metadata.recordCount, 0);

      console.log(`Merged ${totalRecords} records from ${this.extractors.length} sources into ${mergedData.length} unique records`);

      return {
        data: mergedData,
        metadata: {
          source: results.map(r => r.name).join(', '),
          extractedAt: new Date(),
          recordCount: mergedData.length,
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw new Error(`Multi-source extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mergeData(dataSets: T[][], strategy: MergeStrategy): T[] {
    const { keyField, conflictResolution = 'merge' } = strategy;
    const mergedMap = new Map<string, T>();

    dataSets.forEach((dataSet, sourceIndex) => {
      dataSet.forEach(record => {
        const key = String(record[keyField]);

        if (!mergedMap.has(key)) {
          mergedMap.set(key, record);
        } else {
          const existing = mergedMap.get(key)!;

          switch (conflictResolution) {
            case 'source1':
              // Keep existing (first source wins)
              break;
            case 'source2':
              // Overwrite with new (last source wins)
              mergedMap.set(key, record);
              break;
            case 'merge':
              // Merge objects (last value wins for conflicts)
              mergedMap.set(key, { ...existing, ...record });
              break;
          }
        }
      });
    });

    return Array.from(mergedMap.values());
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateExtractions() {
  console.log('='.repeat(80));
  console.log('DATA EXTRACTION EXAMPLES');
  console.log('='.repeat(80));

  // Example 1: JSON Extraction
  console.log('\n1. JSON File Extraction with Validation:');
  console.log('-'.repeat(80));
  const jsonExtractor = new JsonExtractor(CustomerSchema, '/data/customers.json');
  try {
    const jsonResult = await jsonExtractor.extract();
    console.log(`Extracted ${jsonResult.metadata.recordCount} customers in ${jsonResult.metadata.duration}ms`);
  } catch (error) {
    console.error('JSON extraction error:', error);
  }

  // Example 2: CSV Extraction
  console.log('\n2. CSV File Extraction:');
  console.log('-'.repeat(80));
  const csvExtractor = new CsvExtractor('/data/sales.csv', {
    delimiter: ',',
    hasHeader: true,
  });
  const csvResult = await csvExtractor.extract();
  console.log(`Extracted ${csvResult.metadata.recordCount} records in ${csvResult.metadata.duration}ms`);

  // Example 3: API Extraction with Pagination
  console.log('\n3. REST API Extraction with Pagination:');
  console.log('-'.repeat(80));
  const apiExtractor = new ApiExtractor<Customer>(
    'https://api.example.com',
    '/v1/customers',
    {
      headers: { 'Authorization': 'Bearer token123' },
      queryParams: { status: 'active' },
      maxPages: 5,
      pageSize: 100,
    }
  );
  const apiResult = await apiExtractor.extract();
  console.log(`Extracted ${apiResult.metadata.recordCount} records in ${apiResult.metadata.duration}ms`);

  // Example 4: Database Extraction
  console.log('\n4. Database Extraction:');
  console.log('-'.repeat(80));
  const dbExtractor = new DatabaseExtractor<Customer>(
    'postgresql://localhost:5432/mydb',
    {
      table: 'customers',
      columns: ['id', 'name', 'email', 'country'],
      where: { country: 'USA' },
      orderBy: 'id DESC',
      limit: 1000,
    }
  );
  const dbResult = await dbExtractor.extract();
  console.log(`Extracted ${dbResult.metadata.recordCount} records in ${dbResult.metadata.duration}ms`);

  // Example 5: Multi-Source Extraction
  console.log('\n5. Multi-Source Extraction and Merging:');
  console.log('-'.repeat(80));
  const multiExtractor = new MultiSourceExtractor<Customer>()
    .addSource('CRM Database', dbExtractor)
    .addSource('API Service', apiExtractor);

  const mergedResult = await multiExtractor.extractAndMerge({
    keyField: 'id',
    conflictResolution: 'merge',
  });
  console.log(`Merged result: ${mergedResult.metadata.recordCount} unique records`);

  console.log('\n' + '='.repeat(80));
  console.log('EXTRACTION COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateExtractions().catch(console.error);
}

export {
  JsonExtractor,
  CsvExtractor,
  ApiExtractor,
  DatabaseExtractor,
  MultiSourceExtractor,
  type ExtractResult,
  type PaginatedResponse,
  type QueryOptions,
  type MergeStrategy,
};
