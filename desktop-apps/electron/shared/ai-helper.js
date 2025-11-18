/**
 * AI Helper Module - 共享的 AI 輔助功能模組
 * 提供各種 AI 功能給 Electron 應用使用
 */

class AIHelper {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-4o-mini'; // 使用經濟實惠的模型
  }

  /**
   * 通用 AI 請求方法
   */
  async makeRequest(messages, options = {}) {
    const {
      temperature = 0.7,
      max_tokens = 1000,
      stream = false
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens,
          stream
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'AI 請求失敗');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('AI Helper Error:', error);
      throw error;
    }
  }

  /**
   * OCR 文字識別 - 使用 GPT-4 Vision
   */
  async recognizeText(imageBase64) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '請識別圖片中的所有文字內容，以 Markdown 格式輸出。如果有表格，請轉換為 Markdown 表格格式。'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                }
              ]
            }
          ],
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('OCR 識別失敗');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OCR Error:', error);
      throw error;
    }
  }

  /**
   * 圖片描述生成
   */
  async describeImage(imageBase64) {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: '請詳細描述這張圖片的內容，包括主要元素、顏色、場景等。用繁體中文回答。'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64
                  }
                }
              ]
            }
          ],
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error('圖片描述生成失敗');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Image Description Error:', error);
      throw error;
    }
  }

  /**
   * 文字摘要生成
   */
  async summarizeText(text, maxLength = 200) {
    const messages = [
      {
        role: 'system',
        content: '你是一個專業的文字摘要助手。請用繁體中文生成簡潔準確的摘要。'
      },
      {
        role: 'user',
        content: `請將以下文字摘要為 ${maxLength} 字以內的內容：\n\n${text}`
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 300 });
  }

  /**
   * 文字分類
   */
  async classifyText(text, categories = ['工作', '個人', '學習', '其他']) {
    const messages = [
      {
        role: 'system',
        content: `你是一個文字分類助手。請將文字分類到以下類別之一：${categories.join('、')}。只回答類別名稱，不要其他說明。`
      },
      {
        role: 'user',
        content: text
      }
    ];

    return await this.makeRequest(messages, {
      max_tokens: 50,
      temperature: 0.3
    });
  }

  /**
   * 內容改進建議
   */
  async improveSuggestions(text, type = 'general') {
    const systemPrompts = {
      general: '你是一個寫作助手。請分析文字並提供改進建議，包括語法、結構、清晰度等方面。',
      technical: '你是一個技術寫作專家。請分析技術文檔並提供改進建議。',
      creative: '你是一個創意寫作顧問。請提供創意和風格上的改進建議。'
    };

    const messages = [
      {
        role: 'system',
        content: systemPrompts[type] || systemPrompts.general
      },
      {
        role: 'user',
        content: `請分析以下文字並提供改進建議：\n\n${text}`
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 800 });
  }

  /**
   * 自動完成文字
   */
  async autocomplete(text, context = '') {
    const messages = [
      {
        role: 'system',
        content: '你是一個智能寫作助手。請根據上下文自然地完成文字。用繁體中文。'
      },
      {
        role: 'user',
        content: context ? `上下文：${context}\n\n請續寫：${text}` : `請續寫：${text}`
      }
    ];

    return await this.makeRequest(messages, {
      max_tokens: 500,
      temperature: 0.8
    });
  }

  /**
   * 文字翻譯
   */
  async translate(text, targetLang = 'en') {
    const langMap = {
      'en': 'English',
      'zh': '繁體中文',
      'ja': '日本語',
      'ko': '한국어',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };

    const messages = [
      {
        role: 'system',
        content: `你是一個專業翻譯。請將文字翻譯成${langMap[targetLang] || targetLang}。`
      },
      {
        role: 'user',
        content: text
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 1000 });
  }

  /**
   * 程式碼解釋
   */
  async explainCode(code, language = '') {
    const messages = [
      {
        role: 'system',
        content: '你是一個程式碼解釋專家。請用繁體中文清楚地解釋程式碼的功能和邏輯。'
      },
      {
        role: 'user',
        content: language
          ? `請解釋以下 ${language} 程式碼：\n\n${code}`
          : `請解釋以下程式碼：\n\n${code}`
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 1000 });
  }

  /**
   * 程式碼優化建議
   */
  async optimizeCode(code, language = '') {
    const messages = [
      {
        role: 'system',
        content: '你是一個程式碼優化專家。請提供優化建議和改進後的程式碼。'
      },
      {
        role: 'user',
        content: language
          ? `請優化以下 ${language} 程式碼並說明改進點：\n\n${code}`
          : `請優化以下程式碼並說明改進點：\n\n${code}`
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 1500 });
  }

  /**
   * 程式碼生成
   */
  async generateCode(description, language = 'javascript') {
    const messages = [
      {
        role: 'system',
        content: `你是一個 ${language} 程式設計專家。請根據需求生成高品質的程式碼。`
      },
      {
        role: 'user',
        content: `請用 ${language} 實現以下功能：\n\n${description}`
      }
    ];

    return await this.makeRequest(messages, {
      max_tokens: 2000,
      temperature: 0.5
    });
  }

  /**
   * 任務優先級分析
   */
  async analyzePriority(tasks) {
    const taskList = Array.isArray(tasks) ? tasks.join('\n') : tasks;

    const messages = [
      {
        role: 'system',
        content: '你是一個時間管理專家。請分析任務的優先級並提供建議。使用艾森豪威爾矩陣（緊急/重要）進行分類。'
      },
      {
        role: 'user',
        content: `請分析以下任務的優先級：\n\n${taskList}`
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 800 });
  }

  /**
   * 智能任務建議
   */
  async suggestTasks(context) {
    const messages = [
      {
        role: 'system',
        content: '你是一個生產力助手。請根據上下文提供合理的任務建議。'
      },
      {
        role: 'user',
        content: `基於以下情境，請建議 3-5 個具體的任務：\n\n${context}`
      }
    ];

    return await this.makeRequest(messages, { max_tokens: 500 });
  }

  /**
   * 生成文件名建議
   */
  async suggestFileName(content, extension = '') {
    const messages = [
      {
        role: 'system',
        content: '你是一個文件命名助手。請根據內容生成簡潔、描述性的文件名。只回答文件名，不要其他說明。'
      },
      {
        role: 'user',
        content: `請為以下內容建議一個文件名（${extension ? extension + '格式' : ''}）：\n\n${content.substring(0, 500)}`
      }
    ];

    return await this.makeRequest(messages, {
      max_tokens: 50,
      temperature: 0.5
    });
  }

  /**
   * 關鍵字提取
   */
  async extractKeywords(text, count = 5) {
    const messages = [
      {
        role: 'system',
        content: '你是一個關鍵字提取專家。請提取最重要的關鍵字，用逗號分隔。'
      },
      {
        role: 'user',
        content: `請從以下文字中提取 ${count} 個最重要的關鍵字：\n\n${text}`
      }
    ];

    const result = await this.makeRequest(messages, {
      max_tokens: 100,
      temperature: 0.3
    });

    return result.split(/[,，]/).map(k => k.trim()).filter(k => k);
  }

  /**
   * 情感分析
   */
  async analyzeSentiment(text) {
    const messages = [
      {
        role: 'system',
        content: '你是一個情感分析專家。請分析文字的情感傾向，回答：正面、負面或中性，並給出簡短說明。'
      },
      {
        role: 'user',
        content: text
      }
    ];

    return await this.makeRequest(messages, {
      max_tokens: 100,
      temperature: 0.3
    });
  }
}

// 導出模組
module.exports = AIHelper;
