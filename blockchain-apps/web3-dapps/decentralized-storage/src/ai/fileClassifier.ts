/**
 * AI 文件分類模組
 * 自動識別文件類型和內容
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface FileAnalysis {
  category: string;
  type: string;
  confidence: number;
  tags: string[];
  description: string;
  suggestedName?: string;
}

/**
 * 分析文件並分類
 */
export async function classifyFile(file: File): Promise<FileAnalysis> {
  try {
    // 基於文件類型的初步判斷
    const fileType = file.type;
    const fileName = file.name;
    const fileSize = file.size;

    // 讀取文件內容（如果是文本）
    let content = '';
    if (fileType.startsWith('text/') || fileName.endsWith('.txt')) {
      content = await file.text();
      content = content.substring(0, 2000); // 限制長度
    }

    // 構建提示
    const prompt = `分析以下文件並分類：
文件名: ${fileName}
文件類型: ${fileType}
文件大小: ${fileSize} bytes
${content ? `內容預覽: ${content}` : ''}

請以 JSON 格式返回：
{
  "category": "文檔/圖片/影片/音頻/程式碼/其他",
  "type": "具體類型",
  "confidence": 0-100,
  "tags": ["標籤1", "標籤2", "標籤3"],
  "description": "文件描述",
  "suggestedName": "建議的文件名"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '你是一個專業的文件分類助手。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const result = response.choices[0].message.content || '{}';
    const jsonMatch = result.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return fallbackClassification(file);
  } catch (error) {
    console.error('File classification error:', error);
    return fallbackClassification(file);
  }
}

/**
 * 降級分類（基於 MIME 類型）
 */
function fallbackClassification(file: File): FileAnalysis {
  const type = file.type;
  let category = 'other';
  let specificType = 'unknown';

  if (type.startsWith('image/')) {
    category = 'image';
    specificType = type.split('/')[1];
  } else if (type.startsWith('video/')) {
    category = 'video';
    specificType = type.split('/')[1];
  } else if (type.startsWith('audio/')) {
    category = 'audio';
    specificType = type.split('/')[1];
  } else if (
    type.includes('pdf') ||
    type.includes('document') ||
    type.includes('text')
  ) {
    category = 'document';
    specificType = type.split('/')[1];
  } else if (
    type.includes('javascript') ||
    type.includes('json') ||
    file.name.match(/\.(js|ts|py|java|cpp|c|go|rs|sol)$/)
  ) {
    category = 'code';
    specificType = file.name.split('.').pop() || 'unknown';
  }

  return {
    category,
    type: specificType,
    confidence: 70,
    tags: [category, specificType],
    description: `${category} file`,
  };
}

/**
 * 分析圖片內容（使用 GPT-4 Vision）
 */
export async function analyzeImage(file: File): Promise<FileAnalysis> {
  try {
    // 將文件轉換為 base64
    const base64 = await fileToBase64(file);

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `分析這張圖片並以 JSON 格式返回：
{
  "category": "photo/screenshot/diagram/artwork/其他",
  "description": "圖片描述",
  "tags": ["標籤1", "標籤2", "標籤3"],
  "objects": ["識別的物體1", "物體2"],
  "colors": ["主要顏色1", "顏色2"]
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: base64,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const result = response.choices[0].message.content || '{}';
    const jsonMatch = result.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return {
        category: 'image',
        type: file.type.split('/')[1],
        confidence: 90,
        tags: analysis.tags || [],
        description: analysis.description || '',
      };
    }

    return fallbackClassification(file);
  } catch (error) {
    console.error('Image analysis error:', error);
    return fallbackClassification(file);
  }
}

/**
 * 文件轉 base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 智能文件重命名
 */
export async function suggestFileName(file: File): Promise<string> {
  try {
    const analysis = await classifyFile(file);

    if (analysis.suggestedName) {
      const extension = file.name.split('.').pop();
      return `${analysis.suggestedName}.${extension}`;
    }

    // 基於分類生成名稱
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = file.name.split('.').pop();
    return `${analysis.category}_${timestamp}.${extension}`;
  } catch (error) {
    return file.name;
  }
}

/**
 * 批量分類
 */
export async function classifyFilesBatch(files: File[]): Promise<FileAnalysis[]> {
  const results = await Promise.all(files.map((file) => classifyFile(file)));
  return results;
}

/**
 * 文件相似度比較
 */
export async function compareFiles(
  file1: FileAnalysis,
  file2: FileAnalysis
): Promise<number> {
  // 簡單的相似度計算
  let similarity = 0;

  // 類別相同
  if (file1.category === file2.category) similarity += 0.3;

  // 類型相同
  if (file1.type === file2.type) similarity += 0.2;

  // 標籤重疊
  const commonTags = file1.tags.filter((tag) => file2.tags.includes(tag));
  similarity += (commonTags.length / Math.max(file1.tags.length, file2.tags.length)) * 0.5;

  return Math.min(similarity, 1.0);
}
