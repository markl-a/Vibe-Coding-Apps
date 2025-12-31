import express from 'express';
import { WorkflowEngine, WorkflowBuilder } from './index.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;
const engine = new WorkflowEngine();

// Create a sample workflow
const sampleWorkflow = new WorkflowBuilder('sample', 'Sample Workflow')
  .description('A sample workflow for testing')
  .manualTrigger('trigger', 'Manual Trigger')
  .log('log-1', 'Log Input', 'Received: {{trigger.message}}')
  .set('set-1', 'Set Response', { response: 'Processed: {{trigger.message}}' })
  .log('log-2', 'Log Output', 'Response: {{vars.response}}')
  .build();

engine.registerWorkflow(sampleWorkflow);

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// List workflows
app.get('/workflows', (_, res) => {
  const workflows = engine.listWorkflows().map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    enabled: w.enabled,
    nodeCount: w.nodes.length,
  }));
  res.json({ workflows });
});

// Get workflow details
app.get('/workflows/:id', (req, res) => {
  const workflow = engine.getWorkflow(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json(workflow);
});

// Create workflow
app.post('/workflows', (req, res) => {
  try {
    const workflow = req.body;
    workflow.id = workflow.id || crypto.randomUUID();
    workflow.createdAt = new Date();
    workflow.updatedAt = new Date();
    workflow.enabled = workflow.enabled ?? true;

    engine.registerWorkflow(workflow);
    res.status(201).json({ id: workflow.id, message: 'Workflow created' });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// Execute workflow
app.post('/workflows/:id/execute', async (req, res) => {
  try {
    const result = await engine.execute(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

// Webhook trigger endpoint
app.post('/webhook/:workflowId', async (req, res) => {
  try {
    const result = await engine.execute(req.params.workflowId, {
      ...req.body,
      headers: req.headers,
      query: req.query,
    });
    res.json({ executionId: result.executionId, success: result.success });
  } catch (error) {
    res.status(400).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`⚙️ Workflow Engine running at http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /workflows              - List all workflows');
  console.log('  GET  /workflows/:id          - Get workflow details');
  console.log('  POST /workflows              - Create workflow');
  console.log('  POST /workflows/:id/execute  - Execute workflow');
  console.log('  POST /webhook/:workflowId    - Trigger via webhook');
});
