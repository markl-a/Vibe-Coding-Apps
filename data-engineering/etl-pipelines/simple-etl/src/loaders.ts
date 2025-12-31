import { stringify } from 'csv-stringify/sync';
import * as fs from 'fs/promises';
import type { Loader, LoadResult, Record } from './types.js';

export { Loader };

export class JsonLoader implements Loader {
  name: string;
  private destination: string;
  private options: { pretty?: boolean; append?: boolean };

  constructor(
    destination: string,
    options: { pretty?: boolean; append?: boolean } = {},
    name = 'JsonLoader'
  ) {
    this.destination = destination;
    this.options = { pretty: true, ...options };
    this.name = name;
  }

  async load(records: Record[]): Promise<LoadResult> {
    try {
      let data = records;

      if (this.options.append) {
        try {
          const existing = await fs.readFile(this.destination, 'utf-8');
          const existingData = JSON.parse(existing);
          data = [...(Array.isArray(existingData) ? existingData : [existingData]), ...records];
        } catch {
          // File doesn't exist, start fresh
        }
      }

      const content = this.options.pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      await fs.writeFile(this.destination, content, 'utf-8');

      return {
        success: true,
        destination: this.destination,
        loadedCount: records.length,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        destination: this.destination,
        loadedCount: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

export class CsvLoader implements Loader {
  name: string;
  private destination: string;
  private options: { delimiter?: string; header?: boolean };

  constructor(
    destination: string,
    options: { delimiter?: string; header?: boolean } = {},
    name = 'CsvLoader'
  ) {
    this.destination = destination;
    this.options = { header: true, ...options };
    this.name = name;
  }

  async load(records: Record[]): Promise<LoadResult> {
    try {
      if (records.length === 0) {
        return {
          success: true,
          destination: this.destination,
          loadedCount: 0,
          errors: [],
        };
      }

      const content = stringify(records, {
        header: this.options.header,
        delimiter: this.options.delimiter ?? ',',
      });

      await fs.writeFile(this.destination, content, 'utf-8');

      return {
        success: true,
        destination: this.destination,
        loadedCount: records.length,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        destination: this.destination,
        loadedCount: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

export class ConsoleLoader implements Loader {
  name: string;
  private options: { format?: 'json' | 'table' };

  constructor(options: { format?: 'json' | 'table' } = {}, name = 'ConsoleLoader') {
    this.options = { format: 'table', ...options };
    this.name = name;
  }

  async load(records: Record[]): Promise<LoadResult> {
    try {
      console.log(`\n📊 Output (${records.length} records):`);

      if (this.options.format === 'table') {
        console.table(records);
      } else {
        console.log(JSON.stringify(records, null, 2));
      }

      return {
        success: true,
        destination: 'console',
        loadedCount: records.length,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        destination: 'console',
        loadedCount: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}

export class MemoryLoader implements Loader {
  name: string;
  private storage: Record[] = [];

  constructor(name = 'MemoryLoader') {
    this.name = name;
  }

  async load(records: Record[]): Promise<LoadResult> {
    this.storage.push(...records);
    return {
      success: true,
      destination: 'memory',
      loadedCount: records.length,
      errors: [],
    };
  }

  getRecords(): Record[] {
    return this.storage;
  }

  clear(): void {
    this.storage = [];
  }
}
