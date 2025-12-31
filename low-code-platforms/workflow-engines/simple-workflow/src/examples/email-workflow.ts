/**
 * Example: Email Notification Workflow
 *
 * This workflow demonstrates:
 * 1. Webhook trigger
 * 2. Data transformation
 * 3. Conditional logic
 * 4. HTTP requests
 * 5. Logging
 */

import { WorkflowEngine, WorkflowBuilder } from '../index.js';

async function main() {
  const engine = new WorkflowEngine();

  // Build workflow using fluent API
  const workflow = new WorkflowBuilder('email-workflow', 'Email Notification Workflow')
    .description('Sends email notifications based on order status')

    // Start with webhook trigger
    .webhookTrigger('trigger', 'Order Webhook')

    // Log incoming data
    .log('log-start', 'Log Order', 'Received order: {{trigger.orderId}}')

    // Set variables
    .set('set-vars', 'Set Variables', {
      customerName: '{{trigger.customerName}}',
      orderTotal: '{{trigger.total}}',
    })

    // Check order value
    .condition(
      'check-value',
      'Check Order Value',
      'data.total > 100',
      'high-value',
      'standard'
    )

    .build();

  // Add high-value order handling nodes
  workflow.nodes.push({
    id: 'high-value',
    type: 'action:log',
    name: 'High Value Order',
    config: { message: 'Processing high-value order: ${{vars.orderTotal}}', level: 'info' },
    next: 'send-notification',
  });

  // Add standard order handling nodes
  workflow.nodes.push({
    id: 'standard',
    type: 'action:log',
    name: 'Standard Order',
    config: { message: 'Processing standard order: ${{vars.orderTotal}}', level: 'info' },
    next: 'send-notification',
  });

  // Add notification node
  workflow.nodes.push({
    id: 'send-notification',
    type: 'action:log',
    name: 'Send Notification',
    config: {
      message: 'Notification sent to {{vars.customerName}} for order {{trigger.orderId}}',
      level: 'info',
    },
  });

  // Register and execute
  engine.registerWorkflow(workflow);

  // Simulate webhook trigger with test data
  console.log('\n--- Test 1: High-value order ---');
  await engine.execute('email-workflow', {
    orderId: 'ORD-001',
    customerName: 'John Doe',
    total: 250,
    items: ['Product A', 'Product B'],
  });

  console.log('\n--- Test 2: Standard order ---');
  await engine.execute('email-workflow', {
    orderId: 'ORD-002',
    customerName: 'Jane Smith',
    total: 50,
    items: ['Product C'],
  });
}

main().catch(console.error);
