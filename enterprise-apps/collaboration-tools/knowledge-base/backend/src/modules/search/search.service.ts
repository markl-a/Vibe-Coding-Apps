import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  highlights: string[];
  score: number;
  metadata: {
    author: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

interface SemanticSearchOptions {
  query: string;
  limit?: number;
  filter?: {
    tags?: string[];
    category?: string;
    author?: string;
  };
}

@Injectable()
export class SearchService {
  private openai: OpenAI;

  constructor(
    private elasticsearchService: ElasticsearchService,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async indexPage(page: any): Promise<void> {
    await this.elasticsearchService.index({
      index: 'wiki_pages',
      id: page.id,
      document: {
        title: page.title,
        content: page.content,
        tags: page.tags,
        category: page.category,
        author: page.author,
        path: page.path,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
    });
  }

  async search(
    query: string,
    options?: {
      limit?: number;
      offset?: number;
      filters?: any;
    },
  ): Promise<SearchResult[]> {
    const { limit = 10, offset = 0, filters = {} } = options || {};

    const searchQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['title^3', 'content', 'tags^2'],
              fuzziness: 'AUTO',
            },
          },
        ],
        filter: [],
      },
    };

    // 添加過濾條件
    if (filters.tags && filters.tags.length > 0) {
      searchQuery.bool.filter.push({
        terms: { tags: filters.tags },
      });
    }

    if (filters.category) {
      searchQuery.bool.filter.push({
        term: { category: filters.category },
      });
    }

    if (filters.author) {
      searchQuery.bool.filter.push({
        term: { author: filters.author },
      });
    }

    const result = await this.elasticsearchService.search({
      index: 'wiki_pages',
      body: {
        query: searchQuery,
        highlight: {
          fields: {
            content: {
              fragment_size: 150,
              number_of_fragments: 3,
            },
            title: {},
          },
        },
        from: offset,
        size: limit,
      },
    });

    return result.hits.hits.map(hit => ({
      id: hit._id,
      title: hit._source['title'],
      content: hit._source['content'],
      highlights: hit.highlight?.content || [],
      score: hit._score,
      metadata: {
        author: hit._source['author'],
        tags: hit._source['tags'],
        createdAt: new Date(hit._source['createdAt']),
        updatedAt: new Date(hit._source['updatedAt']),
      },
    }));
  }

  async suggest(query: string, limit: number = 5): Promise<string[]> {
    const result = await this.elasticsearchService.search({
      index: 'wiki_pages',
      body: {
        suggest: {
          'title-suggest': {
            prefix: query,
            completion: {
              field: 'title.suggest',
              size: limit,
              skip_duplicates: true,
            },
          },
        },
      },
    });

    const suggestions = result.suggest?.['title-suggest']?.[0]?.options || [];
    return suggestions.map(option => option.text);
  }

  async semanticSearch(options: SemanticSearchOptions): Promise<SearchResult[]> {
    const { query, limit = 5, filter } = options;

    try {
      // 1. 生成查詢向量
      const embedding = await this.generateEmbedding(query);

      // 2. 向量搜索 (使用 Elasticsearch kNN)
      const searchQuery: any = {
        bool: {
          must: [
            {
              script_score: {
                query: { match_all: {} },
                script: {
                  source: "cosineSimilarity(params.query_vector, 'content_vector') + 1.0",
                  params: {
                    query_vector: embedding,
                  },
                },
              },
            },
          ],
          filter: [],
        },
      };

      // 添加過濾條件
      if (filter?.tags && filter.tags.length > 0) {
        searchQuery.bool.filter.push({
          terms: { tags: filter.tags },
        });
      }

      if (filter?.category) {
        searchQuery.bool.filter.push({
          term: { category: filter.category },
        });
      }

      const result = await this.elasticsearchService.search({
        index: 'wiki_pages',
        body: {
          query: searchQuery,
          size: limit,
        },
      });

      return result.hits.hits.map(hit => ({
        id: hit._id,
        title: hit._source['title'],
        content: hit._source['content'],
        highlights: [],
        score: hit._score,
        metadata: {
          author: hit._source['author'],
          tags: hit._source['tags'],
          createdAt: new Date(hit._source['createdAt']),
          updatedAt: new Date(hit._source['updatedAt']),
        },
      }));
    } catch (error) {
      console.error('Semantic search error:', error);
      // 降級到普通搜索
      return this.search(query, { limit });
    }
  }

  async answerQuestion(question: string): Promise<{
    answer: string;
    sources: SearchResult[];
  }> {
    // 1. 搜索相關文檔
    const relevantDocs = await this.semanticSearch({
      query: question,
      limit: 5,
    });

    if (relevantDocs.length === 0) {
      return {
        answer: '抱歉，我在知識庫中找不到相關信息來回答這個問題。',
        sources: [],
      };
    }

    // 2. 構建上下文
    const context = relevantDocs
      .map((doc, index) => `[文檔 ${index + 1}]\n標題：${doc.title}\n內容：${doc.content.substring(0, 500)}...`)
      .join('\n\n');

    // 3. 使用 GPT 生成答案
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '你是一個專業的知識庫助手。請基於提供的文檔內容準確回答用戶的問題。如果文檔中沒有相關信息，請明確告知。',
          },
          {
            role: 'user',
            content: `基於以下知識庫文檔：\n\n${context}\n\n請回答問題：${question}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return {
        answer: completion.choices[0].message.content,
        sources: relevantDocs,
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        answer: '抱歉，生成答案時出現錯誤。請稍後再試。',
        sources: relevantDocs,
      };
    }
  }

  async generateSummary(content: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一個專業的文檔摘要助手。請生成簡潔且有價值的摘要。',
          },
          {
            role: 'user',
            content: `請為以下文檔生成摘要（150字以內）：\n\n${content}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Summary generation error:', error);
      return '';
    }
  }

  async classifyContent(content: string): Promise<{
    category: string;
    tags: string[];
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              '你是一個文檔分類助手。請分析文檔內容並返回合適的分類和標籤。返回格式：{"category": "分類名稱", "tags": ["標籤1", "標籤2", "標籤3"]}',
          },
          {
            role: 'user',
            content: `請分類以下文檔：\n\n${content.substring(0, 1000)}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('Classification error:', error);
      return {
        category: 'uncategorized',
        tags: [],
      };
    }
  }

  async recommendRelatedPages(pageId: string, limit: number = 5): Promise<SearchResult[]> {
    // TODO: 實現基於內容相似度的頁面推薦
    // 可以使用向量相似度搜索
    return [];
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  async deletePage(pageId: string): Promise<void> {
    await this.elasticsearchService.delete({
      index: 'wiki_pages',
      id: pageId,
    });
  }

  async updatePage(page: any): Promise<void> {
    await this.indexPage(page);
  }
}
