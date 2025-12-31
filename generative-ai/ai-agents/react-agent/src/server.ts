import express from 'express';
import { createAgent } from './agent.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize agent
let agent: Awaited<ReturnType<typeof createAgent>>;

async function initAgent() {
  agent = await createAgent({
    openaiApiKey: OPENAI_API_KEY,
    verbose: true,
  });
  console.log('✅ Agent initialized with tools:', agent.getTools().map((t) => t.name));
}

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', initialized: !!agent });
});

// List available tools
app.get('/tools', (_, res) => {
  if (!agent) {
    return res.status(503).json({ error: 'Agent not initialized' });
  }
  res.json({ tools: agent.getTools() });
});

// Run agent
app.post('/run', async (req, res) => {
  try {
    if (!agent) {
      return res.status(503).json({ error: 'Agent not initialized' });
    }

    const { input } = req.body as { input: string };

    if (!input) {
      return res.status(400).json({ error: 'input is required' });
    }

    console.log(`\n🤔 Processing: "${input}"`);
    const result = await agent.run(input);

    console.log(`✅ Output: ${result.output}`);
    res.json(result);
  } catch (error: unknown) {
    console.error('Agent error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Stream response
app.post('/stream', async (req, res) => {
  try {
    if (!agent) {
      return res.status(503).json({ error: 'Agent not initialized' });
    }

    const { input } = req.body as { input: string };

    if (!input) {
      return res.status(400).json({ error: 'input is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of agent.stream(input)) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: unknown) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to stream response' });
  }
});

// Start server
initAgent().then(() => {
  app.listen(PORT, () => {
    console.log(`🤖 ReAct Agent server running at http://localhost:${PORT}`);
    console.log('');
    console.log('Endpoints:');
    console.log('  GET  /health  - Health check');
    console.log('  GET  /tools   - List available tools');
    console.log('  POST /run     - Run agent with input');
    console.log('  POST /stream  - Stream agent response');
  });
});
