# Simple Workflow Engine

A lightweight workflow automation engine inspired by n8n and similar platforms.

## Features

- **Trigger Nodes**: Webhook, manual, and scheduled triggers
- **Action Nodes**: HTTP requests, data transformation, conditions, delays
- **Variable Support**: Pass data between nodes with template syntax
- **Conditional Branching**: Route workflows based on conditions
- **Error Handling**: Define error handlers for nodes
- **Fluent Builder**: Easy-to-use workflow builder API

## Quick Start

### Installation

```bash
pnpm install
```

### Run Example

```bash
pnpm example
```

### Run Server

```bash
pnpm dev
```

## Node Types

### Triggers

| Type | Description |
|------|-------------|
| `trigger:webhook` | HTTP webhook trigger |
| `trigger:manual` | Manual execution |
| `trigger:schedule` | Cron-based schedule |

### Actions

| Type | Description |
|------|-------------|
| `action:http` | Make HTTP requests |
| `action:transform` | Transform data with expressions |
| `action:condition` | Conditional branching |
| `action:delay` | Wait for specified duration |
| `action:log` | Log messages |
| `action:set` | Set variables |

## Builder API

```typescript
import { WorkflowBuilder, WorkflowEngine } from '@vibe/simple-workflow';

const workflow = new WorkflowBuilder('my-workflow', 'My Workflow')
  .description('Process incoming orders')

  // Trigger
  .webhookTrigger('trigger', 'Order Webhook')

  // Actions
  .log('log-1', 'Log Order', 'Order received: {{trigger.orderId}}')
  .set('set-vars', 'Set Variables', {
    customerEmail: '{{trigger.email}}',
  })

  // Condition
  .condition(
    'check',
    'Check Amount',
    'data.amount > 100',
    'high-value',
    'standard'
  )

  .build();

// Execute
const engine = new WorkflowEngine();
engine.registerWorkflow(workflow);

const result = await engine.execute('my-workflow', {
  orderId: '123',
  email: 'test@example.com',
  amount: 150,
});
```

## Template Syntax

Access data using `{{path.to.value}}`:

- `{{trigger.fieldName}}` - Trigger input data
- `{{nodes.nodeId.field}}` - Output from specific node
- `{{vars.variableName}}` - Workflow variables

## API Usage

### Create Workflow

```bash
curl -X POST http://localhost:3000/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Workflow",
    "startNode": "trigger",
    "nodes": [
      {
        "id": "trigger",
        "type": "trigger:webhook",
        "name": "Webhook",
        "config": {},
        "next": "log"
      },
      {
        "id": "log",
        "type": "action:log",
        "name": "Log It",
        "config": { "message": "Received: {{trigger.data}}" }
      }
    ]
  }'
```

### Execute Workflow

```bash
curl -X POST http://localhost:3000/workflows/my-workflow/execute \
  -H "Content-Type: application/json" \
  -d '{ "data": "Hello World" }'
```

### Webhook Trigger

```bash
curl -X POST http://localhost:3000/webhook/my-workflow \
  -H "Content-Type: application/json" \
  -d '{ "event": "order.created", "orderId": "123" }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    WorkflowEngine                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  Workflow                        │    │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐       │    │
│  │  │ Trigger │──▶│ Action  │──▶│ Action  │       │    │
│  │  └─────────┘   └─────────┘   └────┬────┘       │    │
│  │                                    │            │    │
│  │                              ┌─────┴─────┐      │    │
│  │                              │ Condition │      │    │
│  │                              └─────┬─────┘      │    │
│  │                          ┌─────────┼─────────┐  │    │
│  │                          ▼         ▼         │  │    │
│  │                    [true]     [false]        │  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Extending

### Add Custom Node

```typescript
import { nodeHandlers } from './nodes/index.js';

nodeHandlers.push({
  type: 'action:custom',
  async execute(node, context) {
    // Your logic here
    return { result: 'done' };
  },
});
```

## Resources

- [n8n](https://n8n.io/) - Popular workflow automation
- [Temporal](https://temporal.io/) - Durable execution
- [Prefect](https://www.prefect.io/) - Python workflow orchestration

## License

MIT
