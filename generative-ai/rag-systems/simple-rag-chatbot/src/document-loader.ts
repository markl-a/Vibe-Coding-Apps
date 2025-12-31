import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { Document } from '@langchain/core/documents';

export interface LoaderOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

export class DocumentLoader {
  private splitter: RecursiveCharacterTextSplitter;

  constructor(options: LoaderOptions = {}) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: options.chunkSize ?? 1000,
      chunkOverlap: options.chunkOverlap ?? 200,
      separators: ['\n\n', '\n', '. ', ' ', ''],
    });
  }

  async loadText(text: string, metadata: Record<string, unknown> = {}): Promise<Document[]> {
    const docs = await this.splitter.createDocuments([text], [metadata]);
    return docs;
  }

  async loadTexts(
    texts: Array<{ content: string; metadata?: Record<string, unknown> }>
  ): Promise<Document[]> {
    const allDocs: Document[] = [];

    for (const { content, metadata = {} } of texts) {
      const docs = await this.loadText(content, metadata);
      allDocs.push(...docs);
    }

    return allDocs;
  }

  async loadFromUrl(url: string): Promise<Document[]> {
    const response = await fetch(url);
    const text = await response.text();
    return this.loadText(text, { source: url });
  }
}
