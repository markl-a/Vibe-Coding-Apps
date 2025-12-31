import { Chroma } from '@langchain/community/vectorstores/chroma';
import { OpenAIEmbeddings } from '@langchain/openai';
import type { Document } from '@langchain/core/documents';

export interface VectorStoreConfig {
  openaiApiKey: string;
  collectionName?: string;
  chromaUrl?: string;
}

export class VectorStoreManager {
  private embeddings: OpenAIEmbeddings;
  private collectionName: string;
  private chromaUrl?: string;
  private vectorStore?: Chroma;

  constructor(config: VectorStoreConfig) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.openaiApiKey,
      modelName: 'text-embedding-3-small',
    });
    this.collectionName = config.collectionName ?? 'rag-documents';
    this.chromaUrl = config.chromaUrl;
  }

  async initialize(): Promise<void> {
    this.vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
      collectionName: this.collectionName,
      url: this.chromaUrl,
    });
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.vectorStore) {
      this.vectorStore = await Chroma.fromDocuments(documents, this.embeddings, {
        collectionName: this.collectionName,
        url: this.chromaUrl,
      });
    } else {
      await this.vectorStore.addDocuments(documents);
    }
  }

  async createFromDocuments(documents: Document[]): Promise<Chroma> {
    this.vectorStore = await Chroma.fromDocuments(documents, this.embeddings, {
      collectionName: this.collectionName,
      url: this.chromaUrl,
    });
    return this.vectorStore;
  }

  getRetriever(k: number = 4) {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Call initialize() or addDocuments() first.');
    }
    return this.vectorStore.asRetriever({ k });
  }

  async similaritySearch(query: string, k: number = 4): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized.');
    }
    return this.vectorStore.similaritySearch(query, k);
  }
}
