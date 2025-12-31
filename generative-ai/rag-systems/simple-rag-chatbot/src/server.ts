import express from 'express';
import { createRagChain } from './rag-chain.js';
import { DocumentLoader } from './document-loader.js';
import { VectorStoreManager } from './vector-store.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize components
const loader = new DocumentLoader({ chunkSize: 1000, chunkOverlap: 200 });
const vectorStore = new VectorStoreManager({
  openaiApiKey: OPENAI_API_KEY,
  collectionName: 'rag-demo',
});

let ragChain: ReturnType<typeof createRagChain> | null = null;

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', initialized: ragChain !== null });
});

// Ingest documents
app.post('/ingest', async (req, res) => {
  try {
    const { documents } = req.body as {
      documents: Array<{ content: string; metadata?: Record<string, unknown> }>
    };

    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'documents array is required' });
    }

    const docs = await loader.loadTexts(documents);
    await vectorStore.createFromDocuments(docs);

    ragChain = createRagChain(vectorStore.getRetriever(4), {
      openaiApiKey: OPENAI_API_KEY,
    });

    res.json({
      success: true,
      message: `Ingested ${docs.length} chunks from ${documents.length} documents`
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ error: 'Failed to ingest documents' });
  }
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    if (!ragChain) {
      return res.status(400).json({
        error: 'No documents ingested. POST to /ingest first.'
      });
    }

    const { question } = req.body as { question: string };

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const result = await ragChain.invokeWithSources(question);
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

// Stream chat endpoint
app.post('/chat/stream', async (req, res) => {
  try {
    if (!ragChain) {
      return res.status(400).json({
        error: 'No documents ingested. POST to /ingest first.'
      });
    }

    const { question } = req.body as { question: string };

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ragChain.stream(question);

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to stream response' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 RAG Chatbot server running at http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET  /health     - Health check');
  console.log('  POST /ingest     - Ingest documents');
  console.log('  POST /chat       - Chat with sources');
  console.log('  POST /chat/stream - Stream chat response');
});
