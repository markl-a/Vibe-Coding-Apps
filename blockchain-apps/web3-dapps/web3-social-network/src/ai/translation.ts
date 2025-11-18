/**
 * AI 多語言翻譯模組
 * 支持實時翻譯和語言檢測
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const SUPPORTED_LANGUAGES = {
  en: 'English',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * 檢測文本語言
 */
export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `檢測以下文本的語言，只返回語言代碼，例如：en, zh-TW, zh-CN, ja, ko, es, fr 等。
只返回語言代碼，不要其他內容。`,
        },
        {
          role: 'user',
          content: text.substring(0, 200), // 只取前200字符
        },
      ],
      max_tokens: 10,
      temperature: 0.3,
    });

    const detected = response.choices[0].message.content?.trim().toLowerCase() || 'en';

    // 標準化語言代碼
    if (detected.includes('zh')) {
      if (detected.includes('cn') || detected.includes('hans')) return 'zh-CN';
      return 'zh-TW';
    }

    return (detected as SupportedLanguage) || 'en';
  } catch (error) {
    console.error('Language detection error:', error);
    return 'en';
  }
}

/**
 * 翻譯文本
 * @param text 要翻譯的文本
 * @param targetLang 目標語言
 * @param sourceLang 源語言（可選，自動檢測）
 */
export async function translateText(
  text: string,
  targetLang: SupportedLanguage,
  sourceLang?: SupportedLanguage
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  try {
    // 如果未指定源語言，先檢測
    if (!sourceLang) {
      sourceLang = await detectLanguage(text);
    }

    // 如果源語言和目標語言相同，直接返回
    if (sourceLang === targetLang) {
      return text;
    }

    const targetLangName = SUPPORTED_LANGUAGES[targetLang];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `你是一個專業的翻譯助手。請將以下文本翻譯成${targetLangName}。
要求：
1. 保持原文的語氣和風格
2. 使用自然流暢的表達
3. 對於專業術語，保留原文並在括號中註明
4. 只返回翻譯結果，不要其他說明`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      max_tokens: text.length * 3,
      temperature: 0.3,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

/**
 * 批量翻譯
 */
export async function translateBatch(
  texts: string[],
  targetLang: SupportedLanguage
): Promise<string[]> {
  const results = await Promise.all(
    texts.map((text) => translateText(text, targetLang))
  );
  return results;
}

/**
 * 實時翻譯（用於聊天等場景）
 */
export class RealtimeTranslator {
  private cache: Map<string, string> = new Map();
  private pending: Map<string, Promise<string>> = new Map();

  async translate(
    text: string,
    targetLang: SupportedLanguage
  ): Promise<string> {
    const cacheKey = `${text}:${targetLang}`;

    // 檢查緩存
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 檢查是否正在翻譯
    if (this.pending.has(cacheKey)) {
      return this.pending.get(cacheKey)!;
    }

    // 開始翻譯
    const translationPromise = translateText(text, targetLang);
    this.pending.set(cacheKey, translationPromise);

    try {
      const result = await translationPromise;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pending.delete(cacheKey);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheSize() {
    return this.cache.size;
  }
}

/**
 * 多語言內容生成
 * 生成多個語言版本的內容
 */
export async function generateMultilingualContent(
  content: string,
  languages: SupportedLanguage[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  const translations = await Promise.all(
    languages.map((lang) => translateText(content, lang))
  );

  languages.forEach((lang, index) => {
    results[lang] = translations[index];
  });

  return results;
}

/**
 * 智能語言切換
 * 根據用戶瀏覽器語言自動切換
 */
export function getPreferredLanguage(): SupportedLanguage {
  const browserLang = navigator.language.toLowerCase();

  // 精確匹配
  if (browserLang in SUPPORTED_LANGUAGES) {
    return browserLang as SupportedLanguage;
  }

  // 部分匹配
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('cn') || browserLang.includes('hans')) {
      return 'zh-CN';
    }
    return 'zh-TW';
  }

  // 主要語言代碼匹配
  const mainLang = browserLang.split('-')[0];
  const found = Object.keys(SUPPORTED_LANGUAGES).find((lang) =>
    lang.startsWith(mainLang)
  );

  return (found as SupportedLanguage) || 'en';
}

/**
 * 翻譯質量評估
 */
export interface TranslationQuality {
  score: number; // 0-100
  fluency: number;
  accuracy: number;
  suggestions: string[];
}

export async function assessTranslationQuality(
  originalText: string,
  translatedText: string,
  targetLang: SupportedLanguage
): Promise<TranslationQuality> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `評估翻譯質量，以 JSON 格式返回：
{
  "score": 0-100,
  "fluency": 0-100,
  "accuracy": 0-100,
  "suggestions": ["建議1", "建議2"]
}`,
        },
        {
          role: 'user',
          content: `原文：${originalText}
譯文：${translatedText}
目標語言：${SUPPORTED_LANGUAGES[targetLang]}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const result = response.choices[0].message.content || '{}';
    const jsonMatch = result.match(/\{[\s\S]*?\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      score: 80,
      fluency: 80,
      accuracy: 80,
      suggestions: [],
    };
  } catch (error) {
    console.error('Quality assessment error:', error);
    return {
      score: 75,
      fluency: 75,
      accuracy: 75,
      suggestions: [],
    };
  }
}

/**
 * 語言學習助手
 * 提供翻譯的同時給出學習建議
 */
export interface LanguageLearningHint {
  translation: string;
  vocabulary: Array<{
    word: string;
    meaning: string;
    example: string;
  }>;
  grammar: string[];
  culturalNotes: string[];
}

export async function translateWithLearning(
  text: string,
  targetLang: SupportedLanguage
): Promise<LanguageLearningHint> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `翻譯文本並提供學習建議，以 JSON 格式返回：
{
  "translation": "翻譯結果",
  "vocabulary": [
    {"word": "單詞", "meaning": "含義", "example": "例句"}
  ],
  "grammar": ["語法點1", "語法點2"],
  "culturalNotes": ["文化註釋1"]
}`,
        },
        {
          role: 'user',
          content: `請將以下文本翻譯成${SUPPORTED_LANGUAGES[targetLang]}：\n${text}`,
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

    return {
      translation: await translateText(text, targetLang),
      vocabulary: [],
      grammar: [],
      culturalNotes: [],
    };
  } catch (error) {
    console.error('Translation with learning error:', error);
    return {
      translation: await translateText(text, targetLang),
      vocabulary: [],
      grammar: [],
      culturalNotes: [],
    };
  }
}
