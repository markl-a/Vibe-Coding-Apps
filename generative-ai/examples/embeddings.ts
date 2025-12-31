/**
 * Embeddings Examples
 *
 * This file demonstrates:
 * - Generate embeddings
 * - Similarity search
 * - Vector storage
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// 1. GENERATE EMBEDDINGS
// ============================================================================

/**
 * Generate embedding for a single text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      encoding_format: 'float',
    });

    // Sort by index to maintain order
    return response.data
      .sort((a, b) => a.index - b.index)
      .map(item => item.embedding);
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw error;
  }
}

/**
 * Generate embeddings with different models
 */
async function compareEmbeddingModels(text: string): Promise<void> {
  try {
    const models = [
      'text-embedding-3-small',  // 1536 dimensions
      'text-embedding-3-large',  // 3072 dimensions
      'text-embedding-ada-002',  // 1536 dimensions (legacy)
    ];

    console.log(`Comparing embedding models for: "${text}"\n`);

    for (const model of models) {
      const startTime = Date.now();

      const response = await openai.embeddings.create({
        model,
        input: text,
      });

      const embedding = response.data[0].embedding;
      const duration = Date.now() - startTime;

      console.log(`Model: ${model}`);
      console.log(`  Dimensions: ${embedding.length}`);
      console.log(`  Time: ${duration}ms`);
      console.log(`  Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
      console.log(`  Token usage: ${response.usage.total_tokens}`);
      console.log('');
    }
  } catch (error) {
    console.error('Error comparing embedding models:', error);
    throw error;
  }
}

/**
 * Generate embeddings with dimension reduction
 */
async function generateReducedDimensionEmbedding(
  text: string,
  dimensions: number
): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions, // Can be reduced from default 1536
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating reduced dimension embedding:', error);
    throw error;
  }
}

// ============================================================================
// 2. SIMILARITY SEARCH
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

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
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Find most similar documents to a query
 */
async function findSimilarDocuments(
  query: string,
  documents: string[],
  topK: number = 3
): Promise<Array<{ document: string; similarity: number; rank: number }>> {
  try {
    console.log(`Finding ${topK} most similar documents to: "${query}"\n`);

    // Generate embeddings for query and all documents
    const allTexts = [query, ...documents];
    const embeddings = await generateBatchEmbeddings(allTexts);

    const queryEmbedding = embeddings[0];
    const documentEmbeddings = embeddings.slice(1);

    // Calculate similarities
    const similarities = documentEmbeddings.map((docEmbedding, index) => ({
      document: documents[index],
      similarity: cosineSimilarity(queryEmbedding, docEmbedding),
      rank: 0,
    }));

    // Sort by similarity (highest first)
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Assign ranks
    similarities.forEach((item, index) => {
      item.rank = index + 1;
    });

    // Return top K
    return similarities.slice(0, topK);
  } catch (error) {
    console.error('Error finding similar documents:', error);
    throw error;
  }
}

/**
 * Semantic search example
 */
async function semanticSearchExample(): Promise<void> {
  const documents = [
    'The quick brown fox jumps over the lazy dog',
    'A fast auburn canine leaps above an idle hound',
    'Python is a popular programming language',
    'Machine learning models require large datasets',
    'The weather today is sunny and warm',
    'Deep neural networks can solve complex problems',
    'JavaScript is commonly used for web development',
    'The restaurant serves delicious Italian cuisine',
  ];

  const queries = [
    'programming languages',
    'artificial intelligence',
    'animal behavior',
  ];

  for (const query of queries) {
    const results = await findSimilarDocuments(query, documents, 3);

    console.log(`Query: "${query}"`);
    console.log('Results:');
    results.forEach(result => {
      console.log(`  ${result.rank}. [${(result.similarity * 100).toFixed(1)}%] ${result.document}`);
    });
    console.log('');
  }
}

// ============================================================================
// 3. VECTOR STORAGE
// ============================================================================

interface VectorDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Simple in-memory vector store
 */
class InMemoryVectorStore {
  private documents: VectorDocument[] = [];

  /**
   * Add a document to the vector store
   */
  async addDocument(
    id: string,
    text: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const embedding = await generateEmbedding(text);

    this.documents.push({
      id,
      text,
      embedding,
      metadata,
    });
  }

  /**
   * Add multiple documents in batch
   */
  async addDocuments(
    documents: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>
  ): Promise<void> {
    const texts = documents.map(doc => doc.text);
    const embeddings = await generateBatchEmbeddings(texts);

    documents.forEach((doc, index) => {
      this.documents.push({
        id: doc.id,
        text: doc.text,
        embedding: embeddings[index],
        metadata: doc.metadata,
      });
    });
  }

  /**
   * Search for similar documents
   */
  async search(
    query: string,
    topK: number = 5,
    filter?: (doc: VectorDocument) => boolean
  ): Promise<Array<VectorDocument & { similarity: number }>> {
    const queryEmbedding = await generateEmbedding(query);

    let searchDocs = this.documents;
    if (filter) {
      searchDocs = this.documents.filter(filter);
    }

    const results = searchDocs.map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryEmbedding, doc.embedding),
    }));

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }

  /**
   * Get document by ID
   */
  getById(id: string): VectorDocument | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  /**
   * Delete document by ID
   */
  deleteById(id: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get total document count
   */
  count(): number {
    return this.documents.length;
  }

  /**
   * Save vector store to file
   */
  saveToFile(filePath: string): void {
    const data = JSON.stringify(this.documents, null, 2);
    fs.writeFileSync(filePath, data, 'utf-8');
  }

  /**
   * Load vector store from file
   */
  loadFromFile(filePath: string): void {
    const data = fs.readFileSync(filePath, 'utf-8');
    this.documents = JSON.parse(data);
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents = [];
  }
}

/**
 * Example using the vector store
 */
async function vectorStoreExample(): Promise<void> {
  const vectorStore = new InMemoryVectorStore();

  console.log('Building vector store...\n');

  // Add documents
  await vectorStore.addDocuments([
    {
      id: 'doc1',
      text: 'TypeScript is a typed superset of JavaScript',
      metadata: { category: 'programming', language: 'TypeScript' },
    },
    {
      id: 'doc2',
      text: 'React is a JavaScript library for building user interfaces',
      metadata: { category: 'programming', language: 'JavaScript' },
    },
    {
      id: 'doc3',
      text: 'Neural networks are inspired by biological brains',
      metadata: { category: 'AI', topic: 'neural-networks' },
    },
    {
      id: 'doc4',
      text: 'Docker containers package applications with their dependencies',
      metadata: { category: 'devops', tool: 'Docker' },
    },
    {
      id: 'doc5',
      text: 'MongoDB is a NoSQL database for modern applications',
      metadata: { category: 'database', type: 'NoSQL' },
    },
  ]);

  console.log(`Vector store contains ${vectorStore.count()} documents\n`);

  // Search examples
  const query1 = 'frontend development frameworks';
  console.log(`Search query: "${query1}"`);
  const results1 = await vectorStore.search(query1, 3);
  results1.forEach((result, index) => {
    console.log(`  ${index + 1}. [${(result.similarity * 100).toFixed(1)}%] ${result.text}`);
    console.log(`     Metadata:`, result.metadata);
  });
  console.log('');

  // Search with filter
  const query2 = 'typed programming';
  console.log(`Search query with filter: "${query2}" (category: programming)`);
  const results2 = await vectorStore.search(
    query2,
    3,
    doc => doc.metadata?.category === 'programming'
  );
  results2.forEach((result, index) => {
    console.log(`  ${index + 1}. [${(result.similarity * 100).toFixed(1)}%] ${result.text}`);
  });
  console.log('');

  // Save to file
  const tempFile = '/tmp/vector-store.json';
  vectorStore.saveToFile(tempFile);
  console.log(`Vector store saved to ${tempFile}`);

  // Load from file
  const newVectorStore = new InMemoryVectorStore();
  newVectorStore.loadFromFile(tempFile);
  console.log(`Loaded vector store with ${newVectorStore.count()} documents`);
}

// ============================================================================
// 4. ADVANCED EMBEDDING TECHNIQUES
// ============================================================================

/**
 * Clustering documents using embeddings
 */
async function clusterDocuments(
  documents: string[],
  numClusters: number = 3
): Promise<Map<number, string[]>> {
  try {
    console.log(`Clustering ${documents.length} documents into ${numClusters} clusters\n`);

    // Generate embeddings
    const embeddings = await generateBatchEmbeddings(documents);

    // Simple k-means clustering
    const clusters = new Map<number, string[]>();
    const centroids: number[][] = [];

    // Initialize centroids randomly
    for (let i = 0; i < numClusters; i++) {
      centroids.push(embeddings[Math.floor(Math.random() * embeddings.length)]);
      clusters.set(i, []);
    }

    // Assign documents to nearest centroid
    for (let i = 0; i < documents.length; i++) {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let j = 0; j < numClusters; j++) {
        const distance = euclideanDistance(embeddings[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = j;
        }
      }

      clusters.get(closestCluster)!.push(documents[i]);
    }

    // Display clusters
    clusters.forEach((docs, clusterIndex) => {
      console.log(`Cluster ${clusterIndex + 1} (${docs.length} documents):`);
      docs.forEach(doc => {
        console.log(`  - ${doc}`);
      });
      console.log('');
    });

    return clusters;
  } catch (error) {
    console.error('Error clustering documents:', error);
    throw error;
  }
}

/**
 * Anomaly detection using embeddings
 */
async function detectAnomalies(
  documents: string[],
  threshold: number = 0.5
): Promise<string[]> {
  try {
    console.log('Detecting anomalous documents...\n');

    const embeddings = await generateBatchEmbeddings(documents);

    // Calculate centroid (average embedding)
    const centroid = new Array(embeddings[0].length).fill(0);
    for (const embedding of embeddings) {
      for (let i = 0; i < embedding.length; i++) {
        centroid[i] += embedding[i];
      }
    }
    for (let i = 0; i < centroid.length; i++) {
      centroid[i] /= embeddings.length;
    }

    // Find documents far from centroid
    const anomalies: string[] = [];

    for (let i = 0; i < documents.length; i++) {
      const similarity = cosineSimilarity(embeddings[i], centroid);
      if (similarity < threshold) {
        anomalies.push(documents[i]);
        console.log(`Anomaly detected [similarity: ${(similarity * 100).toFixed(1)}%]: ${documents[i]}`);
      }
    }

    console.log(`\nFound ${anomalies.length} anomalies out of ${documents.length} documents`);
    return anomalies;
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  try {
    console.log('=== Embeddings Examples ===\n');

    console.log('\n1. Generate Single Embedding');
    console.log('-----------------------------');
    const sampleText = 'Artificial intelligence is transforming technology';
    const embedding = await generateEmbedding(sampleText);
    console.log(`Text: "${sampleText}"`);
    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`Sample values: [${embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`);

    console.log('\n\n2. Compare Embedding Models');
    console.log('----------------------------');
    await compareEmbeddingModels('Hello, world!');

    console.log('\n3. Semantic Search');
    console.log('-------------------');
    await semanticSearchExample();

    console.log('\n\n4. Vector Store Example');
    console.log('------------------------');
    await vectorStoreExample();

    console.log('\n\n5. Document Clustering');
    console.log('----------------------');
    const clusterDocs = [
      'JavaScript frameworks like React and Vue',
      'Python is great for data science',
      'Machine learning with TensorFlow',
      'Building web apps with Node.js',
      'Deep learning neural networks',
      'Frontend development with Angular',
    ];
    await clusterDocuments(clusterDocs, 2);

    console.log('\n6. Anomaly Detection');
    console.log('--------------------');
    const anomalyDocs = [
      'Machine learning algorithms',
      'Deep neural networks',
      'AI and data science',
      'Banana smoothie recipe', // Anomaly
      'Natural language processing',
      'Computer vision models',
    ];
    await detectAnomalies(anomalyDocs, 0.7);

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
  generateEmbedding,
  generateBatchEmbeddings,
  compareEmbeddingModels,
  generateReducedDimensionEmbedding,
  cosineSimilarity,
  euclideanDistance,
  findSimilarDocuments,
  semanticSearchExample,
  InMemoryVectorStore,
  vectorStoreExample,
  clusterDocuments,
  detectAnomalies,
};
