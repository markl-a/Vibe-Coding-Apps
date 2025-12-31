/**
 * RAG (Retrieval-Augmented Generation) Pipeline Examples
 *
 * This file demonstrates:
 * - Document loading
 * - Chunking strategies
 * - Retrieval augmentation
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. DOCUMENT LOADING
// ============================================================================

interface Document {
  id: string;
  content: string;
  metadata: {
    source: string;
    timestamp: number;
    [key: string]: unknown;
  };
}

/**
 * Load documents from text files
 */
function loadTextFiles(directory: string): Document[] {
  const documents: Document[] = [];

  try {
    const files = fs.readdirSync(directory);

    files.forEach((file, index) => {
      if (file.endsWith('.txt') || file.endsWith('.md')) {
        const filePath = path.join(directory, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        documents.push({
          id: `doc_${index}`,
          content,
          metadata: {
            source: file,
            timestamp: Date.now(),
            size: content.length,
          },
        });
      }
    });

    console.log(`Loaded ${documents.length} documents from ${directory}`);
    return documents;
  } catch (error) {
    console.error('Error loading text files:', error);
    throw error;
  }
}

/**
 * Load documents from various sources
 */
class DocumentLoader {
  /**
   * Load from string content
   */
  static fromText(content: string, metadata: Partial<Document['metadata']> = {}): Document {
    return {
      id: `text_${Date.now()}`,
      content,
      metadata: {
        source: 'text',
        timestamp: Date.now(),
        ...metadata,
      },
    };
  }

  /**
   * Load from JSON file
   */
  static fromJSON(filePath: string): Document[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);

    if (Array.isArray(data)) {
      return data.map((item, index) => ({
        id: `json_${index}`,
        content: JSON.stringify(item),
        metadata: {
          source: filePath,
          timestamp: Date.now(),
          index,
        },
      }));
    }

    return [{
      id: `json_0`,
      content: JSON.stringify(data),
      metadata: {
        source: filePath,
        timestamp: Date.now(),
      },
    }];
  }

  /**
   * Load from URL (simulated)
   */
  static async fromURL(url: string): Promise<Document> {
    // In a real implementation, this would fetch content from the URL
    const mockContent = `Content fetched from ${url}`;

    return {
      id: `url_${Date.now()}`,
      content: mockContent,
      metadata: {
        source: url,
        timestamp: Date.now(),
        type: 'web',
      },
    };
  }
}

// ============================================================================
// 2. CHUNKING STRATEGIES
// ============================================================================

interface Chunk {
  id: string;
  content: string;
  documentId: string;
  metadata: {
    chunkIndex: number;
    chunkSize: number;
    [key: string]: unknown;
  };
}

/**
 * Fixed-size chunking
 */
function chunkBySize(
  document: Document,
  chunkSize: number = 500,
  overlap: number = 50
): Chunk[] {
  const chunks: Chunk[] = [];
  const content = document.content;
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < content.length) {
    const endIndex = Math.min(startIndex + chunkSize, content.length);
    const chunkContent = content.substring(startIndex, endIndex);

    chunks.push({
      id: `${document.id}_chunk_${chunkIndex}`,
      content: chunkContent,
      documentId: document.id,
      metadata: {
        chunkIndex,
        chunkSize: chunkContent.length,
        startIndex,
        endIndex,
        ...document.metadata,
      },
    });

    chunkIndex++;
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Sentence-based chunking
 */
function chunkBySentence(
  document: Document,
  sentencesPerChunk: number = 5
): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by sentence boundaries
  const sentences = document.content.match(/[^.!?]+[.!?]+/g) || [document.content];

  let chunkIndex = 0;
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
    const chunkContent = chunkSentences.join(' ').trim();

    chunks.push({
      id: `${document.id}_chunk_${chunkIndex}`,
      content: chunkContent,
      documentId: document.id,
      metadata: {
        chunkIndex,
        chunkSize: chunkContent.length,
        sentenceCount: chunkSentences.length,
        ...document.metadata,
      },
    });

    chunkIndex++;
  }

  return chunks;
}

/**
 * Paragraph-based chunking
 */
function chunkByParagraph(document: Document): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by paragraph boundaries (double newlines)
  const paragraphs = document.content
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0);

  paragraphs.forEach((paragraph, index) => {
    chunks.push({
      id: `${document.id}_chunk_${index}`,
      content: paragraph.trim(),
      documentId: document.id,
      metadata: {
        chunkIndex: index,
        chunkSize: paragraph.length,
        type: 'paragraph',
        ...document.metadata,
      },
    });
  });

  return chunks;
}

/**
 * Semantic chunking (topic-based)
 */
function chunkByTopic(
  document: Document,
  maxChunkSize: number = 1000
): Chunk[] {
  const chunks: Chunk[] = [];

  // Split by common section headers or topic indicators
  const sections = document.content.split(/\n(?=#+ |## |### )/);

  sections.forEach((section, index) => {
    let content = section.trim();

    // If section is too large, split it further
    if (content.length > maxChunkSize) {
      const subChunks = chunkBySize(
        { ...document, content },
        maxChunkSize,
        100
      );
      subChunks.forEach((subChunk, subIndex) => {
        chunks.push({
          ...subChunk,
          id: `${document.id}_topic_${index}_${subIndex}`,
          metadata: {
            ...subChunk.metadata,
            topicIndex: index,
          },
        });
      });
    } else {
      chunks.push({
        id: `${document.id}_topic_${index}`,
        content,
        documentId: document.id,
        metadata: {
          chunkIndex: index,
          chunkSize: content.length,
          type: 'topic',
          ...document.metadata,
        },
      });
    }
  });

  return chunks;
}

/**
 * Smart chunking with context preservation
 */
function chunkWithContext(
  document: Document,
  targetSize: number = 500,
  contextSize: number = 100
): Chunk[] {
  const chunks: Chunk[] = [];
  const sentences = document.content.match(/[^.!?]+[.!?]+/g) || [document.content];

  let currentChunk = '';
  let chunkIndex = 0;
  let previousContext = '';

  for (const sentence of sentences) {
    // Add previous context to new chunk
    if (currentChunk.length === 0 && previousContext) {
      currentChunk = `[Context: ${previousContext}] `;
    }

    // Check if adding sentence would exceed target size
    if (currentChunk.length + sentence.length > targetSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        id: `${document.id}_ctx_chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        documentId: document.id,
        metadata: {
          chunkIndex,
          chunkSize: currentChunk.length,
          hasContext: previousContext.length > 0,
          ...document.metadata,
        },
      });

      // Save last part as context for next chunk
      previousContext = currentChunk.substring(Math.max(0, currentChunk.length - contextSize));
      currentChunk = '';
      chunkIndex++;
    }

    currentChunk += sentence;
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      id: `${document.id}_ctx_chunk_${chunkIndex}`,
      content: currentChunk.trim(),
      documentId: document.id,
      metadata: {
        chunkIndex,
        chunkSize: currentChunk.length,
        hasContext: previousContext.length > 0,
        ...document.metadata,
      },
    });
  }

  return chunks;
}

// ============================================================================
// 3. RETRIEVAL AUGMENTATION
// ============================================================================

interface RAGConfig {
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  model: string;
  temperature: number;
}

/**
 * RAG Pipeline for question answering
 */
class RAGPipeline {
  private chunks: Chunk[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private config: RAGConfig;

  constructor(config: Partial<RAGConfig> = {}) {
    this.config = {
      chunkSize: 500,
      chunkOverlap: 50,
      topK: 3,
      model: 'gpt-4',
      temperature: 0.3,
      ...config,
    };
  }

  /**
   * Add documents to the pipeline
   */
  async addDocuments(documents: Document[]): Promise<void> {
    console.log(`Processing ${documents.length} documents...`);

    // Chunk all documents
    for (const doc of documents) {
      const docChunks = chunkBySize(doc, this.config.chunkSize, this.config.chunkOverlap);
      this.chunks.push(...docChunks);
    }

    console.log(`Created ${this.chunks.length} chunks`);

    // Generate embeddings for all chunks
    await this.generateEmbeddings();
  }

  /**
   * Generate embeddings for all chunks
   */
  private async generateEmbeddings(): Promise<void> {
    console.log('Generating embeddings...');

    const batchSize = 100;
    for (let i = 0; i < this.chunks.length; i += batchSize) {
      const batch = this.chunks.slice(i, i + batchSize);
      const texts = batch.map(chunk => chunk.content);

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      batch.forEach((chunk, index) => {
        this.embeddings.set(chunk.id, response.data[index].embedding);
      });

      console.log(`  Processed ${Math.min(i + batchSize, this.chunks.length)}/${this.chunks.length} chunks`);
    }

    console.log('Embeddings generated successfully');
  }

  /**
   * Retrieve relevant chunks for a query
   */
  private async retrieveRelevantChunks(query: string): Promise<Chunk[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateQueryEmbedding(query);

    // Calculate similarities
    const similarities: Array<{ chunk: Chunk; similarity: number }> = [];

    for (const chunk of this.chunks) {
      const chunkEmbedding = this.embeddings.get(chunk.id);
      if (chunkEmbedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
        similarities.push({ chunk, similarity });
      }
    }

    // Sort by similarity and return top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, this.config.topK).map(s => s.chunk);
  }

  /**
   * Generate embedding for query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    return response.data[0].embedding;
  }

  /**
   * Calculate cosine similarity
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Query the RAG system
   */
  async query(question: string, options: {
    includeContext?: boolean;
    maxTokens?: number;
  } = {}): Promise<{
    answer: string;
    sources: Chunk[];
    tokens: number;
  }> {
    const { includeContext = true, maxTokens = 500 } = options;

    console.log(`\nQuery: "${question}"`);
    console.log('Retrieving relevant documents...');

    // Retrieve relevant chunks
    const relevantChunks = await this.retrieveRelevantChunks(question);

    console.log(`Found ${relevantChunks.length} relevant chunks`);

    // Build context from retrieved chunks
    const context = relevantChunks
      .map((chunk, index) => `[Source ${index + 1}]: ${chunk.content}`)
      .join('\n\n');

    // Create prompt with context
    const systemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer the question.
If the context doesn't contain enough information, say so clearly.`;

    const userPrompt = `Context:
${context}

Question: ${question}

Please provide a detailed answer based on the context above.`;

    // Generate response
    const response = await openai.chat.completions.create({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: this.config.temperature,
      max_tokens: maxTokens,
    });

    const answer = response.choices[0].message.content || '';

    return {
      answer,
      sources: relevantChunks,
      tokens: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.chunks = [];
    this.embeddings.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalChunks: number;
    totalEmbeddings: number;
    avgChunkSize: number;
  } {
    const totalSize = this.chunks.reduce((sum, chunk) => sum + chunk.content.length, 0);

    return {
      totalChunks: this.chunks.length,
      totalEmbeddings: this.embeddings.size,
      avgChunkSize: this.chunks.length > 0 ? totalSize / this.chunks.length : 0,
    };
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Build and query a RAG system
 */
async function ragExample(): Promise<void> {
  // Sample documents
  const documents: Document[] = [
    DocumentLoader.fromText(
      `TypeScript is a strongly typed programming language that builds on JavaScript.
      It adds optional static typing to JavaScript, which helps catch errors early in development.
      TypeScript compiles to plain JavaScript and can run anywhere JavaScript runs.
      Major companies like Microsoft, Google, and Airbnb use TypeScript in production.`,
      { topic: 'TypeScript', category: 'Programming' }
    ),
    DocumentLoader.fromText(
      `React is a JavaScript library for building user interfaces.
      It was developed by Facebook and is maintained by Meta and a community of developers.
      React uses a component-based architecture and virtual DOM for efficient rendering.
      It's one of the most popular frontend frameworks, along with Vue and Angular.`,
      { topic: 'React', category: 'Frontend' }
    ),
    DocumentLoader.fromText(
      `Machine learning is a subset of artificial intelligence that enables computers to learn from data.
      Deep learning uses neural networks with multiple layers to process complex patterns.
      Popular frameworks include TensorFlow, PyTorch, and scikit-learn.
      Applications range from image recognition to natural language processing.`,
      { topic: 'Machine Learning', category: 'AI' }
    ),
  ];

  // Create RAG pipeline
  const rag = new RAGPipeline({
    chunkSize: 200,
    chunkOverlap: 30,
    topK: 2,
    temperature: 0.3,
  });

  // Add documents
  await rag.addDocuments(documents);

  // Display statistics
  const stats = rag.getStats();
  console.log('\nRAG Pipeline Statistics:');
  console.log(`  Total chunks: ${stats.totalChunks}`);
  console.log(`  Total embeddings: ${stats.totalEmbeddings}`);
  console.log(`  Average chunk size: ${stats.avgChunkSize.toFixed(0)} chars`);

  // Query examples
  const questions = [
    'What is TypeScript and why is it useful?',
    'Which companies use React?',
    'What are popular machine learning frameworks?',
    'How does TypeScript relate to frontend development?', // Cross-topic query
  ];

  for (const question of questions) {
    const result = await rag.query(question);

    console.log('\n' + '='.repeat(80));
    console.log(`Q: ${question}`);
    console.log(`A: ${result.answer}`);
    console.log(`\nSources used: ${result.sources.length}`);
    result.sources.forEach((source, index) => {
      console.log(`  ${index + 1}. ${source.metadata.topic || 'Unknown'}: "${source.content.substring(0, 100)}..."`);
    });
    console.log(`Tokens used: ${result.tokens}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== RAG Pipeline Examples ===\n');

    console.log('1. Testing Chunking Strategies');
    console.log('-------------------------------');
    const sampleDoc = DocumentLoader.fromText(
      `This is the first paragraph. It contains important information. We want to preserve this context.

      This is the second paragraph. It discusses a different topic. The content continues here.

      This is the third paragraph. It provides additional details. The discussion concludes here.`,
      { test: 'chunking' }
    );

    console.log('\nFixed-size chunks:');
    const fixedChunks = chunkBySize(sampleDoc, 100, 20);
    console.log(`  Created ${fixedChunks.length} chunks`);

    console.log('\nSentence-based chunks:');
    const sentenceChunks = chunkBySentence(sampleDoc, 2);
    console.log(`  Created ${sentenceChunks.length} chunks`);

    console.log('\nParagraph-based chunks:');
    const paragraphChunks = chunkByParagraph(sampleDoc);
    console.log(`  Created ${paragraphChunks.length} chunks`);

    console.log('\n\n2. RAG Pipeline Example');
    console.log('------------------------');
    await ragExample();

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export {
  Document,
  Chunk,
  DocumentLoader,
  chunkBySize,
  chunkBySentence,
  chunkByParagraph,
  chunkByTopic,
  chunkWithContext,
  RAGPipeline,
  ragExample,
};
