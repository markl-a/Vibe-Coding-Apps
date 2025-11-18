/**
 * AI 配置文件示例
 * 複製此文件為 ai-config.js 並填入你的 API Key
 */

module.exports = {
  // OpenAI API Key
  // 獲取方式：https://platform.openai.com/api-keys
  OPENAI_API_KEY: 'your-api-key-here',

  // API 基礎 URL（可選，用於代理或其他服務）
  BASE_URL: 'https://api.openai.com/v1',

  // 預設模型
  DEFAULT_MODEL: 'gpt-4o-mini',

  // 預設設定
  DEFAULT_SETTINGS: {
    temperature: 0.7,
    max_tokens: 1000
  },

  // 功能開關
  FEATURES: {
    ocr: true,              // OCR 文字識別
    imageDescription: true, // 圖片描述
    textSummary: true,      // 文字摘要
    translation: true,      // 翻譯
    codeAssist: true,       // 程式碼輔助
    smartSuggest: true      // 智能建議
  },

  // 快取設定
  CACHE: {
    enabled: true,
    ttl: 3600  // 快取時間（秒）
  }
};
