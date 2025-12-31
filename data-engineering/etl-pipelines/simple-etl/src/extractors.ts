import { parse } from 'csv-parse/sync';
import * as fs from 'fs/promises';
import type { Extractor, ExtractResult, Record } from './types.js';

export { Extractor };

export class JsonExtractor implements Extractor {
  name: string;
  private source: string | Record[];

  constructor(source: string | Record[], name = 'JsonExtractor') {
    this.source = source;
    this.name = name;
  }

  async extract(): Promise<ExtractResult> {
    let records: Record[];

    if (typeof this.source === 'string') {
      // File path
      const content = await fs.readFile(this.source, 'utf-8');
      records = JSON.parse(content);
    } else {
      // In-memory array
      records = this.source;
    }

    if (!Array.isArray(records)) {
      records = [records];
    }

    return {
      records,
      metadata: {
        source: typeof this.source === 'string' ? this.source : 'memory',
        extractedAt: new Date(),
        count: records.length,
      },
    };
  }
}

export class CsvExtractor implements Extractor {
  name: string;
  private source: string;
  private options: { delimiter?: string; columns?: boolean | string[] };

  constructor(
    source: string,
    options: { delimiter?: string; columns?: boolean | string[] } = {},
    name = 'CsvExtractor'
  ) {
    this.source = source;
    this.options = { columns: true, ...options };
    this.name = name;
  }

  async extract(): Promise<ExtractResult> {
    const content = await fs.readFile(this.source, 'utf-8');

    const records = parse(content, {
      columns: this.options.columns,
      delimiter: this.options.delimiter ?? ',',
      skip_empty_lines: true,
      trim: true,
    }) as Record[];

    return {
      records,
      metadata: {
        source: this.source,
        extractedAt: new Date(),
        count: records.length,
      },
    };
  }
}

export class ApiExtractor implements Extractor {
  name: string;
  private url: string;
  private options: RequestInit;
  private dataPath?: string;

  constructor(
    url: string,
    options: RequestInit = {},
    dataPath?: string,
    name = 'ApiExtractor'
  ) {
    this.url = url;
    this.options = options;
    this.dataPath = dataPath;
    this.name = name;
  }

  async extract(): Promise<ExtractResult> {
    const response = await fetch(this.url, this.options);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    let data = await response.json();

    // Extract nested data if path specified
    if (this.dataPath) {
      const parts = this.dataPath.split('.');
      for (const part of parts) {
        data = data?.[part];
      }
    }

    const records = Array.isArray(data) ? data : [data];

    return {
      records,
      metadata: {
        source: this.url,
        extractedAt: new Date(),
        count: records.length,
      },
    };
  }
}

// Factory function for creating extractors
export function createExtractor(
  type: 'json' | 'csv' | 'api',
  source: string | Record[],
  options?: Record<string, unknown>
): Extractor {
  switch (type) {
    case 'json':
      return new JsonExtractor(source);
    case 'csv':
      return new CsvExtractor(source as string, options);
    case 'api':
      return new ApiExtractor(
        source as string,
        options?.requestInit as RequestInit,
        options?.dataPath as string
      );
    default:
      throw new Error(`Unknown extractor type: ${type}`);
  }
}
