/**
 * ETL Pipeline Example
 *
 * This example demonstrates:
 * 1. Extracting data from JSON
 * 2. Transforming with validation
 * 3. Filtering and mapping
 * 4. Loading to console
 */

import { z } from 'zod';
import {
  PipelineBuilder,
  JsonExtractor,
  MapTransformer,
  FilterTransformer,
  ValidateTransformer,
  ConsoleLoader,
} from './index.js';

// Sample data
const sampleOrders = [
  { id: 1, customer: 'John', product: 'Widget', quantity: 5, price: 10.99, status: 'completed' },
  { id: 2, customer: 'Jane', product: 'Gadget', quantity: 2, price: 25.50, status: 'pending' },
  { id: 3, customer: 'Bob', product: 'Widget', quantity: 10, price: 10.99, status: 'completed' },
  { id: 4, customer: 'Alice', product: 'Gizmo', quantity: 1, price: 99.99, status: 'completed' },
  { id: 5, customer: 'John', product: 'Gadget', quantity: 3, price: 25.50, status: 'cancelled' },
  { id: 6, customer: '', product: 'Widget', quantity: -1, price: 10.99, status: 'completed' }, // Invalid
];

// Validation schema
const orderSchema = z.object({
  id: z.number().positive(),
  customer: z.string().min(1),
  product: z.string(),
  quantity: z.number().positive(),
  price: z.number().positive(),
  status: z.enum(['pending', 'completed', 'cancelled']),
});

async function main() {
  console.log('='.repeat(60));
  console.log('ETL Pipeline Example: Order Processing');
  console.log('='.repeat(60));

  // Build and run pipeline
  const result = await new PipelineBuilder('order-processing', 'Process and analyze order data')
    .continueOnError(true)

    // Extract from JSON array
    .extract(new JsonExtractor(sampleOrders, 'Orders Source'))

    // Validate records
    .transform(new ValidateTransformer(orderSchema, { dropInvalid: true }, 'Validate Orders'))

    // Filter completed orders only
    .transform(new FilterTransformer(
      (record) => record.status === 'completed',
      'Filter Completed'
    ))

    // Calculate total per order
    .transform(new MapTransformer(
      (record) => ({
        ...record,
        total: (record.quantity as number) * (record.price as number),
        processedAt: new Date().toISOString(),
      }),
      'Calculate Total'
    ))

    // Output to console
    .load(new ConsoleLoader({ format: 'table' }, 'Console Output'))

    .run();

  console.log('\n📊 Pipeline Result:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
