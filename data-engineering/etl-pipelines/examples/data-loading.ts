/**
 * Data Loading Examples
 *
 * Demonstrates various data loading patterns to different destinations:
 * 1. File-based loading (JSON, CSV, Parquet)
 * 2. Database loading (batch and incremental)
 * 3. API/Webhook loading
 * 4. Cloud storage loading (S3, GCS, Azure Blob)
 * 5. Data warehouse loading
 * 6. Stream/Queue loading (Kafka, SQS, Pub/Sub)
 */

// ============================================================================
// Type Definitions
// ============================================================================

interface LoadResult {
  success: boolean;
  destination: string;
  loadedCount: number;
  failedCount: number;
  errors: string[];
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
  };
}

interface LoadOptions {
  batchSize?: number;
  retryAttempts?: number;
  retryDelay?: number;
  continueOnError?: boolean;
}

type Record = Record<string, unknown>;

// ============================================================================
// Example 1: File-based Loaders
// ============================================================================

class JsonFileLoader {
  constructor(
    private filePath: string,
    private options: {
      pretty?: boolean;
      append?: boolean;
      createBackup?: boolean;
    } = {}
  ) {}

  async load(data: Record[]): Promise<LoadResult> {
    const startTime = new Date();

    try {
      console.log(`Loading ${data.length} records to JSON file: ${this.filePath}`);

      // Create backup if requested
      if (this.options.createBackup) {
        await this.createBackup();
      }

      // Handle append mode
      let finalData = data;
      if (this.options.append) {
        const existing = await this.readExistingData();
        finalData = [...existing, ...data];
      }

      // Write data
      const content = this.options.pretty
        ? JSON.stringify(finalData, null, 2)
        : JSON.stringify(finalData);

      await this.writeFile(content);

      const endTime = new Date();

      return {
        success: true,
        destination: this.filePath,
        loadedCount: data.length,
        failedCount: 0,
        errors: [],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        destination: this.filePath,
        loadedCount: 0,
        failedCount: data.length,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  private async createBackup(): Promise<void> {
    const backupPath = `${this.filePath}.backup`;
    console.log(`Creating backup: ${backupPath}`);
    // In real implementation: fs.copyFile()
  }

  private async readExistingData(): Promise<Record[]> {
    // In real implementation: fs.readFile() + JSON.parse()
    return [];
  }

  private async writeFile(content: string): Promise<void> {
    console.log(`Writing ${content.length} bytes to file`);
    // In real implementation: fs.writeFile()
  }
}

class CsvFileLoader {
  constructor(
    private filePath: string,
    private options: {
      delimiter?: string;
      includeHeader?: boolean;
      append?: boolean;
    } = {}
  ) {
    this.options = {
      delimiter: ',',
      includeHeader: true,
      ...options,
    };
  }

  async load(data: Record[]): Promise<LoadResult> {
    const startTime = new Date();

    try {
      if (data.length === 0) {
        throw new Error('No data to load');
      }

      console.log(`Loading ${data.length} records to CSV file: ${this.filePath}`);

      // Generate CSV content
      const lines: string[] = [];

      // Add header
      if (this.options.includeHeader && !this.options.append) {
        const headers = Object.keys(data[0]);
        lines.push(headers.join(this.options.delimiter));
      }

      // Add data rows
      data.forEach(record => {
        const values = Object.values(record).map(v => this.escapeCsvValue(v));
        lines.push(values.join(this.options.delimiter));
      });

      const content = lines.join('\n');
      await this.writeFile(content, this.options.append || false);

      const endTime = new Date();

      return {
        success: true,
        destination: this.filePath,
        loadedCount: data.length,
        failedCount: 0,
        errors: [],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        destination: this.filePath,
        loadedCount: 0,
        failedCount: data.length,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  private escapeCsvValue(value: unknown): string {
    const str = String(value ?? '');

    if (str.includes(this.options.delimiter!) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  private async writeFile(content: string, append: boolean): Promise<void> {
    const mode = append ? 'append' : 'write';
    console.log(`${mode} ${content.length} bytes to CSV file`);
    // In real implementation: fs.writeFile() or fs.appendFile()
  }
}

// ============================================================================
// Example 2: Database Loaders
// ============================================================================

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

class BatchDatabaseLoader {
  constructor(
    private config: DatabaseConfig,
    private table: string,
    private options: LoadOptions = {}
  ) {
    this.options = {
      batchSize: 1000,
      retryAttempts: 3,
      retryDelay: 1000,
      continueOnError: false,
      ...options,
    };
  }

  async load(data: Record[]): Promise<LoadResult> {
    const startTime = new Date();
    let loadedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      console.log(`Loading ${data.length} records to database table: ${this.table}`);
      console.log(`Batch size: ${this.options.batchSize}`);

      // Connect to database
      await this.connect();

      // Process in batches
      const batchSize = this.options.batchSize!;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`);

        try {
          await this.insertBatch(batch);
          loadedCount += batch.length;
        } catch (error) {
          failedCount += batch.length;
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${errorMsg}`);

          if (!this.options.continueOnError) {
            throw error;
          }
        }
      }

      // Disconnect
      await this.disconnect();

      const endTime = new Date();

      return {
        success: failedCount === 0,
        destination: `${this.config.database}.${this.table}`,
        loadedCount,
        failedCount,
        errors,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        destination: `${this.config.database}.${this.table}`,
        loadedCount,
        failedCount: data.length - loadedCount,
        errors: [...errors, error instanceof Error ? error.message : String(error)],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  private async connect(): Promise<void> {
    console.log(`Connecting to ${this.config.host}:${this.config.port}/${this.config.database}`);
    // In real implementation: pg.Pool.connect(), mysql.createConnection(), etc.
  }

  private async disconnect(): Promise<void> {
    console.log('Disconnecting from database');
    // In real implementation: connection.end()
  }

  private async insertBatch(batch: Record[]): Promise<void> {
    if (batch.length === 0) return;

    // Build INSERT statement
    const columns = Object.keys(batch[0]);
    const values = batch.map(record =>
      `(${columns.map(col => this.formatValue(record[col])).join(', ')})`
    ).join(', ');

    const query = `INSERT INTO ${this.table} (${columns.join(', ')}) VALUES ${values}`;

    console.log(`Executing: ${query.substring(0, 100)}...`);
    // In real implementation: connection.query(query)
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return `'${String(value).replace(/'/g, "''")}'`;
  }
}

class UpsertDatabaseLoader extends BatchDatabaseLoader {
  constructor(
    config: DatabaseConfig,
    table: string,
    private uniqueKeys: string[],
    options: LoadOptions = {}
  ) {
    super(config, table, options);
  }

  protected async insertBatch(batch: Record[]): Promise<void> {
    if (batch.length === 0) return;

    const columns = Object.keys(batch[0]);
    const updateColumns = columns.filter(col => !this.uniqueKeys.includes(col));

    // Build UPSERT (ON CONFLICT DO UPDATE) statement for PostgreSQL
    const values = batch.map(record =>
      `(${columns.map(col => this.formatValue(record[col])).join(', ')})`
    ).join(', ');

    const updateClause = updateColumns
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(', ');

    const query = `
      INSERT INTO ${this.table} (${columns.join(', ')})
      VALUES ${values}
      ON CONFLICT (${this.uniqueKeys.join(', ')})
      DO UPDATE SET ${updateClause}
    `.trim();

    console.log(`Executing UPSERT: ${query.substring(0, 100)}...`);
    // In real implementation: connection.query(query)
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return `'${String(value).replace(/'/g, "''")}'`;
  }
}

// ============================================================================
// Example 3: API/Webhook Loader
// ============================================================================

class ApiLoader {
  constructor(
    private endpoint: string,
    private options: {
      method?: 'POST' | 'PUT' | 'PATCH';
      headers?: Record<string, string>;
      batchSize?: number;
      rateLimit?: number; // requests per second
    } = {}
  ) {
    this.options = {
      method: 'POST',
      batchSize: 100,
      rateLimit: 10,
      ...options,
    };
  }

  async load(data: Record[]): Promise<LoadResult> {
    const startTime = new Date();
    let loadedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    try {
      console.log(`Loading ${data.length} records to API: ${this.endpoint}`);

      const batchSize = this.options.batchSize!;
      const delayBetweenRequests = this.options.rateLimit
        ? 1000 / this.options.rateLimit
        : 0;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));

        try {
          await this.sendBatch(batch);
          loadedCount += batch.length;

          // Rate limiting
          if (delayBetweenRequests > 0 && i + batchSize < data.length) {
            await this.delay(delayBetweenRequests);
          }
        } catch (error) {
          failedCount += batch.length;
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const endTime = new Date();

      return {
        success: failedCount === 0,
        destination: this.endpoint,
        loadedCount,
        failedCount,
        errors,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        destination: this.endpoint,
        loadedCount,
        failedCount: data.length - loadedCount,
        errors: [...errors, error instanceof Error ? error.message : String(error)],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  private async sendBatch(batch: Record[]): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: this.options.method,
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Successfully sent ${batch.length} records to API`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Example 4: Cloud Storage Loaders
// ============================================================================

class S3Loader {
  constructor(
    private bucket: string,
    private keyPrefix: string,
    private options: {
      region?: string;
      format?: 'json' | 'csv' | 'parquet';
      compression?: 'gzip' | 'none';
      partitionBy?: string[];
    } = {}
  ) {
    this.options = {
      region: 'us-east-1',
      format: 'json',
      compression: 'gzip',
      ...options,
    };
  }

  async load(data: Record[]): Promise<LoadResult> {
    const startTime = new Date();

    try {
      console.log(`Loading ${data.length} records to S3: s3://${this.bucket}/${this.keyPrefix}`);

      // Partition data if requested
      const partitions = this.partitionData(data);

      let loadedCount = 0;
      const errors: string[] = [];

      for (const [partitionKey, partitionData] of partitions) {
        try {
          await this.uploadPartition(partitionKey, partitionData);
          loadedCount += partitionData.length;
        } catch (error) {
          errors.push(`Partition ${partitionKey}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      const endTime = new Date();

      return {
        success: errors.length === 0,
        destination: `s3://${this.bucket}/${this.keyPrefix}`,
        loadedCount,
        failedCount: data.length - loadedCount,
        errors,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        destination: `s3://${this.bucket}/${this.keyPrefix}`,
        loadedCount: 0,
        failedCount: data.length,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  private partitionData(data: Record[]): Map<string, Record[]> {
    if (!this.options.partitionBy || this.options.partitionBy.length === 0) {
      return new Map([['default', data]]);
    }

    const partitions = new Map<string, Record[]>();

    data.forEach(record => {
      const partitionKey = this.options.partitionBy!
        .map(field => `${field}=${record[field] ?? 'null'}`)
        .join('/');

      if (!partitions.has(partitionKey)) {
        partitions.set(partitionKey, []);
      }
      partitions.get(partitionKey)!.push(record);
    });

    return partitions;
  }

  private async uploadPartition(partitionKey: string, data: Record[]): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `${this.keyPrefix}/${partitionKey}/data-${timestamp}.${this.options.format}${this.options.compression === 'gzip' ? '.gz' : ''}`;

    console.log(`Uploading to s3://${this.bucket}/${key} (${data.length} records)`);

    // Format data
    let content: string;
    switch (this.options.format) {
      case 'json':
        content = JSON.stringify(data);
        break;
      case 'csv':
        content = this.formatAsCsv(data);
        break;
      default:
        throw new Error(`Unsupported format: ${this.options.format}`);
    }

    // Compress if needed
    if (this.options.compression === 'gzip') {
      content = await this.compress(content);
    }

    // Upload to S3
    // In real implementation: s3.putObject()
    console.log(`Uploaded ${content.length} bytes to S3`);
  }

  private formatAsCsv(data: Record[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = [
      headers.join(','),
      ...data.map(record => Object.values(record).join(',')),
    ];

    return rows.join('\n');
  }

  private async compress(content: string): Promise<string> {
    // In real implementation: zlib.gzip()
    console.log('Compressing data with gzip');
    return content;
  }
}

// ============================================================================
// Example 5: Stream/Queue Loaders
// ============================================================================

class KafkaLoader {
  constructor(
    private brokers: string[],
    private topic: string,
    private options: {
      partitionKey?: string;
      compression?: 'gzip' | 'snappy' | 'none';
      batchSize?: number;
    } = {}
  ) {
    this.options = {
      compression: 'gzip',
      batchSize: 100,
      ...options,
    };
  }

  async load(data: Record[]): Promise<LoadResult> {
    const startTime = new Date();

    try {
      console.log(`Loading ${data.length} records to Kafka topic: ${this.topic}`);

      // Connect to Kafka
      await this.connect();

      // Send messages
      let loadedCount = 0;
      const errors: string[] = [];

      const batchSize = this.options.batchSize!;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, Math.min(i + batchSize, data.length));

        try {
          await this.sendBatch(batch);
          loadedCount += batch.length;
        } catch (error) {
          errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Disconnect
      await this.disconnect();

      const endTime = new Date();

      return {
        success: errors.length === 0,
        destination: `kafka://${this.brokers.join(',')}/${this.topic}`,
        loadedCount,
        failedCount: data.length - loadedCount,
        errors,
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    } catch (error) {
      const endTime = new Date();
      return {
        success: false,
        destination: `kafka://${this.brokers.join(',')}/${this.topic}`,
        loadedCount: 0,
        failedCount: data.length,
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: {
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        },
      };
    }
  }

  private async connect(): Promise<void> {
    console.log(`Connecting to Kafka brokers: ${this.brokers.join(', ')}`);
    // In real implementation: new Kafka().producer()
  }

  private async disconnect(): Promise<void> {
    console.log('Disconnecting from Kafka');
    // In real implementation: producer.disconnect()
  }

  private async sendBatch(batch: Record[]): Promise<void> {
    const messages = batch.map(record => ({
      key: this.options.partitionKey ? String(record[this.options.partitionKey]) : undefined,
      value: JSON.stringify(record),
    }));

    console.log(`Sending ${messages.length} messages to topic ${this.topic}`);
    // In real implementation: producer.send({ topic, messages })
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

async function demonstrateLoading() {
  console.log('='.repeat(80));
  console.log('DATA LOADING EXAMPLES');
  console.log('='.repeat(80));

  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 30 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 25 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  // Example 1: JSON File Loading
  console.log('\n1. JSON File Loading:');
  console.log('-'.repeat(80));
  const jsonLoader = new JsonFileLoader('/output/data.json', { pretty: true });
  const jsonResult = await jsonLoader.load(sampleData);
  console.log(`Result: ${jsonResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Loaded: ${jsonResult.loadedCount} records in ${jsonResult.metadata.duration}ms`);

  // Example 2: CSV File Loading
  console.log('\n2. CSV File Loading:');
  console.log('-'.repeat(80));
  const csvLoader = new CsvFileLoader('/output/data.csv');
  const csvResult = await csvLoader.load(sampleData);
  console.log(`Result: ${csvResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Loaded: ${csvResult.loadedCount} records in ${csvResult.metadata.duration}ms`);

  // Example 3: Database Loading
  console.log('\n3. Database Batch Loading:');
  console.log('-'.repeat(80));
  const dbLoader = new BatchDatabaseLoader(
    { host: 'localhost', port: 5432, database: 'mydb', user: 'user', password: 'pass' },
    'users',
    { batchSize: 1000 }
  );
  const dbResult = await dbLoader.load(sampleData);
  console.log(`Result: ${dbResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Loaded: ${dbResult.loadedCount} records in ${dbResult.metadata.duration}ms`);

  // Example 4: API Loading
  console.log('\n4. API Loading:');
  console.log('-'.repeat(80));
  const apiLoader = new ApiLoader('https://api.example.com/users', {
    method: 'POST',
    batchSize: 50,
    rateLimit: 5,
  });
  const apiResult = await apiLoader.load(sampleData);
  console.log(`Result: ${apiResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Loaded: ${apiResult.loadedCount} records in ${apiResult.metadata.duration}ms`);

  // Example 5: S3 Loading
  console.log('\n5. S3 Cloud Storage Loading:');
  console.log('-'.repeat(80));
  const s3Loader = new S3Loader('my-data-bucket', 'users', {
    format: 'json',
    compression: 'gzip',
    partitionBy: ['age'],
  });
  const s3Result = await s3Loader.load(sampleData);
  console.log(`Result: ${s3Result.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Loaded: ${s3Result.loadedCount} records in ${s3Result.metadata.duration}ms`);

  // Example 6: Kafka Stream Loading
  console.log('\n6. Kafka Stream Loading:');
  console.log('-'.repeat(80));
  const kafkaLoader = new KafkaLoader(
    ['localhost:9092'],
    'user-events',
    { partitionKey: 'id', batchSize: 100 }
  );
  const kafkaResult = await kafkaLoader.load(sampleData);
  console.log(`Result: ${kafkaResult.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Loaded: ${kafkaResult.loadedCount} records in ${kafkaResult.metadata.duration}ms`);

  console.log('\n' + '='.repeat(80));
  console.log('LOADING COMPLETE');
  console.log('='.repeat(80));
}

// Run examples
if (require.main === module) {
  demonstrateLoading().catch(console.error);
}

export {
  JsonFileLoader,
  CsvFileLoader,
  BatchDatabaseLoader,
  UpsertDatabaseLoader,
  ApiLoader,
  S3Loader,
  KafkaLoader,
  type LoadResult,
  type LoadOptions,
};
