# Simple ETL Pipeline

A lightweight Extract-Transform-Load (ETL) pipeline framework in TypeScript.

## Features

- **Multiple Extractors**: JSON, CSV, API sources
- **Transformation Pipeline**: Map, filter, validate, aggregate
- **Multiple Loaders**: JSON, CSV, console, memory
- **Schema Validation**: Zod integration
- **Fluent Builder API**: Easy pipeline construction
- **Error Handling**: Continue on error option

## Quick Start

```bash
pnpm install
pnpm example
```

## Basic Usage

```typescript
import { z } from 'zod';
import {
  PipelineBuilder,
  JsonExtractor,
  MapTransformer,
  FilterTransformer,
  ValidateTransformer,
  JsonLoader,
} from '@vibe/simple-etl';

const schema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.number(),
});

const result = await new PipelineBuilder('my-pipeline', 'Process data')
  .extract(new JsonExtractor('input.json'))
  .transform(new ValidateTransformer(schema))
  .transform(new FilterTransformer((r) => r.value > 100))
  .transform(new MapTransformer((r) => ({ ...r, processed: true })))
  .load(new JsonLoader('output.json'))
  .run();

console.log(`Processed ${result.transformedCount} records`);
```

## Components

### Extractors

| Extractor | Description |
|-----------|-------------|
| `JsonExtractor` | Load from JSON file or array |
| `CsvExtractor` | Parse CSV files |
| `ApiExtractor` | Fetch from REST APIs |

### Transformers

| Transformer | Description |
|-------------|-------------|
| `MapTransformer` | Transform each record |
| `FilterTransformer` | Filter records by condition |
| `ValidateTransformer` | Validate with Zod schema |
| `AggregateTransformer` | Group and aggregate |

### Loaders

| Loader | Description |
|--------|-------------|
| `JsonLoader` | Write to JSON file |
| `CsvLoader` | Write to CSV file |
| `ConsoleLoader` | Print to console |
| `MemoryLoader` | Store in memory |

## Examples

### CSV to JSON

```typescript
await new PipelineBuilder('csv-to-json')
  .extract(new CsvExtractor('data.csv'))
  .transform(new MapTransformer((r) => ({
    id: parseInt(r.id),
    name: r.name,
  })))
  .load(new JsonLoader('output.json'))
  .run();
```

### API to CSV

```typescript
await new PipelineBuilder('api-to-csv')
  .extract(new ApiExtractor(
    'https://api.example.com/users',
    { headers: { 'Authorization': 'Bearer token' } },
    'data.users' // Path to array in response
  ))
  .transform(new FilterTransformer((r) => r.active))
  .load(new CsvLoader('users.csv'))
  .run();
```

### Aggregation

```typescript
import { AggregateTransformer } from './transformers.js';

await new PipelineBuilder('sales-summary')
  .extract(new JsonExtractor(salesData))
  .transform(new AggregateTransformer('product', [
    { field: 'quantity', operation: 'sum', as: 'totalQuantity' },
    { field: 'revenue', operation: 'sum', as: 'totalRevenue' },
    { field: 'id', operation: 'count', as: 'orderCount' },
  ]))
  .load(new ConsoleLoader())
  .run();
```

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Pipeline                           │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌──────────┐         │
│  │ Extract  │──▶│  Transform   │──▶│   Load   │         │
│  └──────────┘   └──────────────┘   └──────────┘         │
│       │               │                  │               │
│       ▼               ▼                  ▼               │
│  ┌─────────┐   ┌────────────┐     ┌─────────┐           │
│  │  JSON   │   │   Map      │     │  JSON   │           │
│  │  CSV    │   │  Filter    │     │  CSV    │           │
│  │  API    │   │  Validate  │     │ Console │           │
│  └─────────┘   │  Aggregate │     └─────────┘           │
│                └────────────┘                            │
└─────────────────────────────────────────────────────────┘
```

## Error Handling

```typescript
const result = await new PipelineBuilder('resilient-pipeline')
  .continueOnError(true) // Don't stop on errors
  .extract(new JsonExtractor(data))
  .transform(new ValidateTransformer(schema, {
    dropInvalid: true // Drop invalid records
  }))
  .load(new JsonLoader('output.json'))
  .run();

if (!result.success) {
  console.error('Errors:', result.errors);
}
```

## Resources

- [Apache Airflow](https://airflow.apache.org/) - Workflow orchestration
- [dbt](https://www.getdbt.com/) - Data transformation
- [Prefect](https://www.prefect.io/) - Python data orchestration

## License

MIT
