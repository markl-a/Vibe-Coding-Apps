# Simple RAG Chatbot

A Retrieval-Augmented Generation (RAG) chatbot built with LangChain, OpenAI, and ChromaDB.

## Features

- **Document Ingestion**: Load and chunk documents for efficient retrieval
- **Vector Search**: Semantic search using OpenAI embeddings and ChromaDB
- **Context-Aware Responses**: LLM responses grounded in your documents
- **Source Attribution**: See which documents were used to generate answers
- **Streaming Support**: Real-time streaming responses via SSE

## Tech Stack

- **LangChain**: Orchestration framework for LLM applications
- **OpenAI**: GPT-4o-mini for generation, text-embedding-3-small for embeddings
- **ChromaDB**: Open-source vector database
- **Express**: HTTP API server
- **TypeScript**: Type-safe development

## Quick Start

### Prerequisites

- Node.js 18+
- OpenAI API key
- ChromaDB (optional, uses in-memory by default)

### Installation

```bash
pnpm install
```

### Configuration

Create a `.env` file:

```env
OPENAI_API_KEY=sk-your-api-key
PORT=3000
CHROMA_URL=http://localhost:8000  # Optional
```

### Running

```bash
# Development mode
pnpm dev

# Production
pnpm build && pnpm start
```

## API Usage

### Ingest Documents

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "content": "LangChain is a framework for developing applications powered by language models.",
        "metadata": { "source": "docs" }
      },
      {
        "content": "RAG combines retrieval with generation to provide accurate, grounded responses.",
        "metadata": { "source": "docs" }
      }
    ]
  }'
```

### Chat with Sources

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{ "question": "What is LangChain?" }'
```

Response:
```json
{
  "answer": "LangChain is a framework for developing applications powered by language models.",
  "sources": [
    {
      "content": "LangChain is a framework for developing...",
      "metadata": { "source": "docs" }
    }
  ]
}
```

### Streaming Response

```bash
curl -X POST http://localhost:3000/chat/stream \
  -H "Content-Type: application/json" \
  -d '{ "question": "What is RAG?" }'
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   User      │────▶│   Express    │────▶│  RAG Chain  │
│   Query     │     │   Server     │     │             │
└─────────────┘     └──────────────┘     └──────┬──────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
            ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
            │   Retriever   │          │    Prompt     │          │   OpenAI      │
            │   (ChromaDB)  │          │   Template    │          │   GPT-4o      │
            └───────────────┘          └───────────────┘          └───────────────┘
```

## Project Structure

```
src/
├── index.ts           # Main exports
├── server.ts          # Express API server
├── rag-chain.ts       # RAG chain implementation
├── document-loader.ts # Document loading and chunking
└── vector-store.ts    # Vector store management
```

## Extending

### Custom Document Sources

```typescript
import { DocumentLoader } from './document-loader';

const loader = new DocumentLoader({ chunkSize: 500 });

// Load from URL
const docs = await loader.loadFromUrl('https://example.com/docs.txt');

// Load multiple texts
const docs = await loader.loadTexts([
  { content: 'First document...', metadata: { id: 1 } },
  { content: 'Second document...', metadata: { id: 2 } },
]);
```

### Custom Prompts

Modify the `SYSTEM_TEMPLATE` in `rag-chain.ts` to customize the chatbot's behavior.

## Resources

- [LangChain Documentation](https://js.langchain.com/)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/)

## License

MIT
