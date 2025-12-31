/**
 * Data Conversion Examples
 *
 * Demonstrates comprehensive data format conversion patterns including:
 * - JSON ↔ CSV ↔ XML ↔ YAML conversions
 * - Data transformation and mapping
 * - Schema validation and type conversion
 * - Binary and encoding conversions
 * - API response transformations
 */

import * as fs from 'fs/promises';
import { parse as parseCSV, stringify as stringifyCSV } from 'csv-parse/sync';
import * as yaml from 'js-yaml';
import * as xml2js from 'xml2js';
import { z } from 'zod';

// ============================================================================
// Example 1: JSON to CSV Conversion
// ============================================================================

interface CSVOptions {
  headers?: string[];
  delimiter?: string;
  includeHeaders?: boolean;
}

class JSONToCSVConverter {
  /**
   * Convert JSON array to CSV string
   */
  jsonToCSV(data: any[], options: CSVOptions = {}): string {
    if (data.length === 0) return '';

    const {
      headers = Object.keys(data[0]),
      delimiter = ',',
      includeHeaders = true,
    } = options;

    const rows: string[] = [];

    // Add headers
    if (includeHeaders) {
      rows.push(headers.join(delimiter));
    }

    // Add data rows
    for (const item of data) {
      const row = headers.map(header => {
        const value = item[header];

        // Handle different value types
        if (value === null || value === undefined) {
          return '';
        }

        // Escape values containing delimiter or quotes
        const stringValue = String(value);
        if (stringValue.includes(delimiter) || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      });

      rows.push(row.join(delimiter));
    }

    return rows.join('\n');
  }

  /**
   * Convert CSV string to JSON array
   */
  csvToJSON(csvString: string, options: { delimiter?: string } = {}): any[] {
    const { delimiter = ',' } = options;

    const records = parseCSV(csvString, {
      columns: true,
      skip_empty_lines: true,
      delimiter,
    });

    return records;
  }

  /**
   * Convert JSON to CSV file
   */
  async convertJSONFileToCSV(
    inputFile: string,
    outputFile: string,
    options: CSVOptions = {}
  ): Promise<void> {
    const jsonContent = await fs.readFile(inputFile, 'utf-8');
    const data = JSON.parse(jsonContent);
    const csv = this.jsonToCSV(Array.isArray(data) ? data : [data], options);
    await fs.writeFile(outputFile, csv);
  }

  /**
   * Convert CSV to JSON file
   */
  async convertCSVFileToJSON(
    inputFile: string,
    outputFile: string,
    options: { delimiter?: string; pretty?: boolean } = {}
  ): Promise<void> {
    const csvContent = await fs.readFile(inputFile, 'utf-8');
    const json = this.csvToJSON(csvContent, options);
    const jsonString = options.pretty
      ? JSON.stringify(json, null, 2)
      : JSON.stringify(json);
    await fs.writeFile(outputFile, jsonString);
  }
}

// ============================================================================
// Example 2: XML Conversion
// ============================================================================

class XMLConverter {
  private parser: xml2js.Parser;
  private builder: xml2js.Builder;

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
    });

    this.builder = new xml2js.Builder({
      headless: false,
      renderOpts: { pretty: true, indent: '  ' },
    });
  }

  /**
   * Convert XML to JSON
   */
  async xmlToJSON(xmlString: string): Promise<any> {
    return await this.parser.parseStringPromise(xmlString);
  }

  /**
   * Convert JSON to XML
   */
  jsonToXML(data: any, rootName: string = 'root'): string {
    const obj = { [rootName]: data };
    return this.builder.buildObject(obj);
  }

  /**
   * Convert XML file to JSON file
   */
  async convertXMLFileToJSON(
    inputFile: string,
    outputFile: string,
    options: { pretty?: boolean } = {}
  ): Promise<void> {
    const xmlContent = await fs.readFile(inputFile, 'utf-8');
    const json = await this.xmlToJSON(xmlContent);
    const jsonString = options.pretty
      ? JSON.stringify(json, null, 2)
      : JSON.stringify(json);
    await fs.writeFile(outputFile, jsonString);
  }

  /**
   * Convert JSON file to XML file
   */
  async convertJSONFileToXML(
    inputFile: string,
    outputFile: string,
    rootName: string = 'root'
  ): Promise<void> {
    const jsonContent = await fs.readFile(inputFile, 'utf-8');
    const data = JSON.parse(jsonContent);
    const xml = this.jsonToXML(data, rootName);
    await fs.writeFile(outputFile, xml);
  }
}

// ============================================================================
// Example 3: YAML Conversion
// ============================================================================

class YAMLConverter {
  /**
   * Convert YAML to JSON
   */
  yamlToJSON(yamlString: string): any {
    return yaml.load(yamlString);
  }

  /**
   * Convert JSON to YAML
   */
  jsonToYAML(data: any, options: { indent?: number } = {}): string {
    return yaml.dump(data, {
      indent: options.indent || 2,
      lineWidth: -1,
    });
  }

  /**
   * Convert YAML file to JSON file
   */
  async convertYAMLFileToJSON(
    inputFile: string,
    outputFile: string,
    options: { pretty?: boolean } = {}
  ): Promise<void> {
    const yamlContent = await fs.readFile(inputFile, 'utf-8');
    const json = this.yamlToJSON(yamlContent);
    const jsonString = options.pretty
      ? JSON.stringify(json, null, 2)
      : JSON.stringify(json);
    await fs.writeFile(outputFile, jsonString);
  }

  /**
   * Convert JSON file to YAML file
   */
  async convertJSONFileToYAML(
    inputFile: string,
    outputFile: string,
    options: { indent?: number } = {}
  ): Promise<void> {
    const jsonContent = await fs.readFile(inputFile, 'utf-8');
    const data = JSON.parse(jsonContent);
    const yaml = this.jsonToYAML(data, options);
    await fs.writeFile(outputFile, yaml);
  }
}

// ============================================================================
// Example 4: Data Transformation and Mapping
// ============================================================================

type TransformFunction<T, R> = (item: T) => R;
type AsyncTransformFunction<T, R> = (item: T) => Promise<R>;

class DataTransformer {
  /**
   * Transform array of objects with field mapping
   */
  transform<T, R>(
    data: T[],
    mapping: Record<string, string | TransformFunction<T, any>>
  ): R[] {
    return data.map(item => {
      const transformed: any = {};

      for (const [targetKey, source] of Object.entries(mapping)) {
        if (typeof source === 'function') {
          transformed[targetKey] = source(item);
        } else {
          // Handle nested properties with dot notation
          const value = this.getNestedValue(item, source);
          transformed[targetKey] = value;
        }
      }

      return transformed as R;
    });
  }

  /**
   * Transform with async functions
   */
  async transformAsync<T, R>(
    data: T[],
    mapping: Record<string, string | AsyncTransformFunction<T, any>>
  ): Promise<R[]> {
    const results: R[] = [];

    for (const item of data) {
      const transformed: any = {};

      for (const [targetKey, source] of Object.entries(mapping)) {
        if (typeof source === 'function') {
          transformed[targetKey] = await source(item);
        } else {
          transformed[targetKey] = this.getNestedValue(item, source);
        }
      }

      results.push(transformed as R);
    }

    return results;
  }

  /**
   * Flatten nested objects
   */
  flatten(data: any, prefix: string = ''): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flatten(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  /**
   * Unflatten dot-notation object
   */
  unflatten(data: Record<string, any>): any {
    const result: any = {};

    for (const [key, value] of Object.entries(data)) {
      const keys = key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]] = value;
    }

    return result;
  }

  /**
   * Group data by key
   */
  groupBy<T>(data: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return data.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  /**
   * Aggregate data
   */
  aggregate<T>(
    data: T[],
    groupKey: (item: T) => string,
    aggregations: Record<string, (items: T[]) => any>
  ): any[] {
    const grouped = this.groupBy(data, groupKey);

    return Object.entries(grouped).map(([key, items]) => {
      const result: any = { [groupKey.name]: key };

      for (const [aggName, aggFn] of Object.entries(aggregations)) {
        result[aggName] = aggFn(items);
      }

      return result;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// ============================================================================
// Example 5: Schema Validation and Type Conversion
// ============================================================================

class DataValidator {
  /**
   * Validate and transform data with Zod schema
   */
  validateAndTransform<T>(data: any, schema: z.ZodType<T>): T {
    return schema.parse(data);
  }

  /**
   * Validate array with schema
   */
  validateArray<T>(data: any[], schema: z.ZodType<T>): T[] {
    return data.map(item => schema.parse(item));
  }

  /**
   * Safe parse with error handling
   */
  safeParse<T>(data: any, schema: z.ZodType<T>): {
    success: boolean;
    data?: T;
    errors?: string[];
  } {
    const result = schema.safeParse(data);

    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    };
  }

  /**
   * Convert string values to appropriate types
   */
  autoConvertTypes(data: Record<string, string>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Try to convert to number
      if (/^-?\d+\.?\d*$/.test(value)) {
        result[key] = parseFloat(value);
        continue;
      }

      // Try to convert to boolean
      if (value.toLowerCase() === 'true') {
        result[key] = true;
        continue;
      }
      if (value.toLowerCase() === 'false') {
        result[key] = false;
        continue;
      }

      // Try to convert to null
      if (value.toLowerCase() === 'null') {
        result[key] = null;
        continue;
      }

      // Try to parse as JSON
      try {
        result[key] = JSON.parse(value);
      } catch {
        result[key] = value;
      }
    }

    return result;
  }
}

// ============================================================================
// Example 6: Encoding Conversions
// ============================================================================

class EncodingConverter {
  /**
   * Convert between different encodings
   */
  async convertEncoding(
    inputFile: string,
    outputFile: string,
    fromEncoding: BufferEncoding,
    toEncoding: BufferEncoding
  ): Promise<void> {
    const content = await fs.readFile(inputFile, fromEncoding);
    await fs.writeFile(outputFile, content, toEncoding);
  }

  /**
   * Base64 encode/decode
   */
  base64Encode(data: string): string {
    return Buffer.from(data).toString('base64');
  }

  base64Decode(encoded: string): string {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  }

  /**
   * Hex encode/decode
   */
  hexEncode(data: string): string {
    return Buffer.from(data).toString('hex');
  }

  hexDecode(encoded: string): string {
    return Buffer.from(encoded, 'hex').toString('utf-8');
  }

  /**
   * URL encode/decode
   */
  urlEncode(data: string): string {
    return encodeURIComponent(data);
  }

  urlDecode(encoded: string): string {
    return decodeURIComponent(encoded);
  }

  /**
   * Convert binary file to Base64
   */
  async fileToBase64(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
  }

  /**
   * Convert Base64 to binary file
   */
  async base64ToFile(base64: string, outputPath: string): Promise<void> {
    const buffer = Buffer.from(base64, 'base64');
    await fs.writeFile(outputPath, buffer);
  }
}

// ============================================================================
// Example 7: Universal Format Converter
// ============================================================================

type SupportedFormat = 'json' | 'csv' | 'xml' | 'yaml';

class UniversalConverter {
  private jsonCsvConverter = new JSONToCSVConverter();
  private xmlConverter = new XMLConverter();
  private yamlConverter = new YAMLConverter();

  /**
   * Convert from any format to any format
   */
  async convert(
    inputFile: string,
    outputFile: string,
    fromFormat: SupportedFormat,
    toFormat: SupportedFormat,
    options: any = {}
  ): Promise<void> {
    // Read and parse input
    const data = await this.readFormat(inputFile, fromFormat);

    // Convert to output format
    await this.writeFormat(outputFile, data, toFormat, options);
  }

  /**
   * Read and parse file based on format
   */
  private async readFormat(
    filePath: string,
    format: SupportedFormat
  ): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');

    switch (format) {
      case 'json':
        return JSON.parse(content);

      case 'csv':
        return this.jsonCsvConverter.csvToJSON(content);

      case 'xml':
        return await this.xmlConverter.xmlToJSON(content);

      case 'yaml':
        return this.yamlConverter.yamlToJSON(content);

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Write data to file in specified format
   */
  private async writeFormat(
    filePath: string,
    data: any,
    format: SupportedFormat,
    options: any = {}
  ): Promise<void> {
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, options.pretty ? 2 : 0);
        break;

      case 'csv':
        content = this.jsonCsvConverter.jsonToCSV(
          Array.isArray(data) ? data : [data],
          options
        );
        break;

      case 'xml':
        content = this.xmlConverter.jsonToXML(data, options.rootName);
        break;

      case 'yaml':
        content = this.yamlConverter.jsonToYAML(data, options);
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await fs.writeFile(filePath, content);
  }

  /**
   * Auto-detect format from file extension
   */
  detectFormat(filePath: string): SupportedFormat {
    const ext = filePath.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'json':
        return 'json';
      case 'csv':
        return 'csv';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        throw new Error(`Cannot detect format from extension: ${ext}`);
    }
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function demonstrateDataConversion() {
  console.log('=== Data Conversion Examples ===\n');

  // Example 1: JSON to CSV
  const jsonCsvConverter = new JSONToCSVConverter();
  const users = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 30 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 25 },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', age: 35 },
  ];

  const csv = jsonCsvConverter.jsonToCSV(users);
  console.log('JSON to CSV:');
  console.log(csv);
  console.log('');

  // Example 2: Data transformation
  const transformer = new DataTransformer();
  const transformed = transformer.transform(users, {
    userId: 'id',
    fullName: 'name',
    contact: 'email',
    isAdult: (user: any) => user.age >= 18,
  });

  console.log('Transformed data:');
  console.log(JSON.stringify(transformed, null, 2));
  console.log('');

  // Example 3: Flatten/Unflatten
  const nested = {
    user: {
      profile: {
        name: 'John',
        age: 30,
      },
      settings: {
        theme: 'dark',
      },
    },
  };

  const flattened = transformer.flatten(nested);
  console.log('Flattened:');
  console.log(flattened);
  console.log('');

  const unflattened = transformer.unflatten(flattened);
  console.log('Unflattened:');
  console.log(JSON.stringify(unflattened, null, 2));
  console.log('');

  // Example 4: Schema validation
  const validator = new DataValidator();
  const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(0),
  });

  const validationResult = validator.safeParse(users[0], UserSchema);
  console.log('Validation result:');
  console.log(validationResult);
  console.log('');

  // Example 5: Grouping and aggregation
  const sales = [
    { product: 'A', category: 'Electronics', amount: 100 },
    { product: 'B', category: 'Electronics', amount: 200 },
    { product: 'C', category: 'Clothing', amount: 50 },
    { product: 'D', category: 'Clothing', amount: 75 },
  ];

  const aggregated = transformer.aggregate(
    sales,
    item => item.category,
    {
      totalAmount: items => items.reduce((sum, item) => sum + item.amount, 0),
      count: items => items.length,
      avgAmount: items =>
        items.reduce((sum, item) => sum + item.amount, 0) / items.length,
    }
  );

  console.log('Aggregated sales:');
  console.log(JSON.stringify(aggregated, null, 2));
  console.log('');

  // Example 6: Encoding conversions
  const encodingConverter = new EncodingConverter();
  const encoded = encodingConverter.base64Encode('Hello, World!');
  console.log('Base64 encoded:', encoded);

  const decoded = encodingConverter.base64Decode(encoded);
  console.log('Base64 decoded:', decoded);
  console.log('');

  // Example 7: Universal conversion
  const universalConverter = new UniversalConverter();
  // await universalConverter.convert('input.json', 'output.csv', 'json', 'csv');
}

// Run if executed directly
if (require.main === module) {
  demonstrateDataConversion().catch(console.error);
}

export {
  JSONToCSVConverter,
  XMLConverter,
  YAMLConverter,
  DataTransformer,
  DataValidator,
  EncodingConverter,
  UniversalConverter,
};
