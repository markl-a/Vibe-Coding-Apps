/**
 * AI 語義搜索模組
 * 基於內容理解的智能搜索
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface FileDocument {
  id: string;
  name: string;
  description: string;
  tags: string[];
  content?: string;
  embedding?: number[];
}

export interface SearchResult {
  file: FileDocument;
  score: number;
  relevance: string;
}

/**
 * 生成文本嵌入向量
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Embedding generation error:', error);
    return [];
  }
}

/**
 * 為文件生成嵌入
 */
export async function generateFileEmbedding(
  file: FileDocument
): Promise<FileDocument> {
  const text = `${file.name} ${file.description} ${file.tags.join(' ')} ${
    file.content || ''
  }`;

  const embedding = await generateEmbedding(text);

  return {
    ...file,
    embedding,
  };
}

/**
 * 計算餘弦相似度
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 語義搜索
 */
export async function semanticSearch(
  query: string,
  files: FileDocument[],
  limit: number = 10
): Promise<SearchResult[]> {
  try {
    // 生成查詢的嵌入向量
    const queryEmbedding = await generateEmbedding(query);

    // 計算每個文件的相似度
    const results: SearchResult[] = [];

    for (const file of files) {
      // 如果文件沒有嵌入，生成一個
      if (!file.embedding) {
        file = await generateFileEmbedding(file);
      }

      const similarity = cosineSimilarity(queryEmbedding, file.embedding || []);

      if (similarity > 0.1) {
        // 過濾掉太低的相似度
        results.push({
          file,
          score: similarity,
          relevance: getRelevanceLabel(similarity),
        });
      }
    }

    // 排序並返回
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Semantic search error:', error);
    return fallbackSearch(query, files, limit);
  }
}

/**
 * 獲取相關性標籤
 */
function getRelevanceLabel(score: number): string {
  if (score > 0.8) return 'highly_relevant';
  if (score > 0.6) return 'relevant';
  if (score > 0.4) return 'somewhat_relevant';
  return 'marginally_relevant';
}

/**
 * 降級搜索（關鍵詞匹配）
 */
function fallbackSearch(
  query: string,
  files: FileDocument[],
  limit: number
): SearchResult[] {
  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const file of files) {
    let score = 0;

    // 名稱匹配
    if (file.name.toLowerCase().includes(lowerQuery)) {
      score += 0.5;
    }

    // 描述匹配
    if (file.description.toLowerCase().includes(lowerQuery)) {
      score += 0.3;
    }

    // 標籤匹配
    for (const tag of file.tags) {
      if (tag.toLowerCase().includes(lowerQuery)) {
        score += 0.2;
        break;
      }
    }

    // 內容匹配
    if (file.content && file.content.toLowerCase().includes(lowerQuery)) {
      score += 0.4;
    }

    if (score > 0) {
      results.push({
        file,
        score,
        relevance: getRelevanceLabel(score),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 智能查詢擴展
 * 理解用戶意圖並擴展查詢
 */
export async function expandQuery(query: string): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一個搜索助手。根據用戶查詢生成相關的擴展查詢詞。',
        },
        {
          role: 'user',
          content: `查詢: "${query}"
請生成 5 個相關的擴展查詢詞，以 JSON 數組格式返回。
例如：["查詢詞1", "查詢詞2", "查詢詞3", "查詢詞4", "查詢詞5"]`,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const result = response.choices[0].message.content || '[]';
    const jsonMatch = result.match(/\[[\s\S]*?\]/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [query];
  } catch (error) {
    console.error('Query expansion error:', error);
    return [query];
  }
}

/**
 * 多模態搜索
 * 同時搜索文本和圖片
 */
export async function multimodalSearch(
  query: string,
  textFiles: FileDocument[],
  imageFiles: FileDocument[],
  limit: number = 10
): Promise<SearchResult[]> {
  const [textResults, imageResults] = await Promise.all([
    semanticSearch(query, textFiles, limit),
    semanticSearch(query, imageFiles, limit),
  ]);

  // 合併結果
  const combined = [...textResults, ...imageResults];

  // 重新排序
  return combined.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 相似文件推薦
 */
export async function findSimilarFiles(
  targetFile: FileDocument,
  allFiles: FileDocument[],
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    // 確保目標文件有嵌入
    if (!targetFile.embedding) {
      targetFile = await generateFileEmbedding(targetFile);
    }

    const results: SearchResult[] = [];

    for (const file of allFiles) {
      if (file.id === targetFile.id) continue; // 跳過自己

      // 確保文件有嵌入
      if (!file.embedding) {
        file = await generateFileEmbedding(file);
      }

      const similarity = cosineSimilarity(
        targetFile.embedding || [],
        file.embedding || []
      );

      if (similarity > 0.2) {
        results.push({
          file,
          score: similarity,
          relevance: getRelevanceLabel(similarity),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error('Similar files error:', error);
    return [];
  }
}

/**
 * 智能文件夾建議
 * 根據文件內容建議分類
 */
export async function suggestFolders(files: FileDocument[]): Promise<{
  folders: Array<{ name: string; files: string[] }>;
}> {
  try {
    // 為所有文件生成嵌入
    const filesWithEmbeddings = await Promise.all(
      files.map((file) => generateFileEmbedding(file))
    );

    // 使用 AI 建議分組
    const filesInfo = filesWithEmbeddings
      .map((f) => `${f.id}: ${f.name} - ${f.description}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一個文件管理助手。根據文件內容建議合理的分類。',
        },
        {
          role: 'user',
          content: `文件列表：
${filesInfo}

請建議如何將這些文件分組到不同的文件夾中。以 JSON 格式返回：
{
  "folders": [
    { "name": "文件夾名", "files": ["文件ID1", "文件ID2"] }
  ]
}`,
        },
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const result = response.choices[0].message.content || '{}';
    const jsonMatch = result.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { folders: [] };
  } catch (error) {
    console.error('Folder suggestion error:', error);
    return { folders: [] };
  }
}

/**
 * 搜索建議（自動完成）
 */
export async function getSearchSuggestions(
  partialQuery: string,
  recentSearches: string[]
): Promise<string[]> {
  // 從最近搜索中過濾
  const filtered = recentSearches.filter((s) =>
    s.toLowerCase().includes(partialQuery.toLowerCase())
  );

  // 如果有足夠的建議，直接返回
  if (filtered.length >= 5) {
    return filtered.slice(0, 5);
  }

  // 否則使用 AI 生成建議
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: `基於部分查詢 "${partialQuery}"，生成 5 個搜索建議。以數組返回：["建議1", "建議2", ...]`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const result = response.choices[0].message.content || '[]';
    const jsonMatch = result.match(/\[[\s\S]*?\]/);

    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      return [...filtered, ...suggestions].slice(0, 5);
    }
  } catch (error) {
    console.error('Search suggestions error:', error);
  }

  return filtered;
}
