// AI Service for Clipboard Manager
// Uses browser's built-in AI capabilities and OpenAI API

class AIService {
  constructor() {
    this.apiKey = null;
    this.useLocalAI = true; // Prefer local AI when available
  }

  async setApiKey(key) {
    this.apiKey = key;
    await chrome.storage.local.set({ openaiApiKey: key });
  }

  async getApiKey() {
    if (!this.apiKey) {
      const data = await chrome.storage.local.get(['openaiApiKey']);
      this.apiKey = data.openaiApiKey || null;
    }
    return this.apiKey;
  }

  /**
   * Detect content type using pattern matching and AI
   */
  async detectContentType(text) {
    // Quick pattern-based detection
    const patterns = {
      url: /^https?:\/\/[^\s]+$/i,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      code: /^(function|const|let|var|class|import|export|def|public|private|void|int|string)/m,
      json: /^\s*[\{\[]/,
      hex_color: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      ip_address: /^(\d{1,3}\.){3}\d{1,3}$/,
      credit_card: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
      date: /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return type;
      }
    }

    // For longer text, use AI to classify
    if (text.length > 50 && text.length < 1000) {
      return await this.classifyContentWithAI(text);
    }

    return 'text';
  }

  /**
   * Classify content using AI
   */
  async classifyContentWithAI(text) {
    try {
      const key = await this.getApiKey();
      if (!key) return 'text';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Classify the content type. Reply with ONE word only: code, email, note, article, address, name, password, api_key, or text.'
            },
            {
              role: 'user',
              content: text.substring(0, 500)
            }
          ],
          temperature: 0.3,
          max_tokens: 10
        })
      });

      if (!response.ok) return 'text';

      const data = await response.json();
      return data.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('AI classification error:', error);
      return 'text';
    }
  }

  /**
   * Auto-categorize clipboard items
   */
  async categorizeItems(items) {
    const categories = {
      work: [],
      personal: [],
      code: [],
      links: [],
      sensitive: [],
      other: []
    };

    for (const item of items) {
      const category = await this.detectCategory(item.text, item.type);
      categories[category].push(item);
    }

    return categories;
  }

  /**
   * Detect which category an item belongs to
   */
  async detectCategory(text, type) {
    if (type === 'code' || type === 'json') return 'code';
    if (type === 'url') return 'links';
    if (type === 'password' || type === 'api_key' || type === 'credit_card') return 'sensitive';

    // Simple keyword-based categorization
    const workKeywords = ['meeting', 'deadline', 'project', 'client', 'invoice', 'report'];
    const personalKeywords = ['home', 'family', 'friend', 'vacation', 'recipe'];

    const lowerText = text.toLowerCase();

    if (workKeywords.some(kw => lowerText.includes(kw))) return 'work';
    if (personalKeywords.some(kw => lowerText.includes(kw))) return 'personal';

    return 'other';
  }

  /**
   * Detect sensitive information
   */
  detectSensitiveInfo(text) {
    const sensitivePatterns = {
      credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/,
      api_key: /\b[A-Za-z0-9]{32,}\b/,
      password: /password[\s:=]+[^\s]+/i,
      jwt_token: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/
    };

    const findings = [];
    for (const [type, pattern] of Object.entries(sensitivePatterns)) {
      if (pattern.test(text)) {
        findings.push(type);
      }
    }

    return {
      hasSensitiveInfo: findings.length > 0,
      types: findings
    };
  }

  /**
   * Generate smart tags for content
   */
  async generateTags(text) {
    const tags = new Set();

    // Add type-based tags
    const type = await this.detectContentType(text);
    tags.add(type);

    // Add content-based tags
    if (text.includes('http')) tags.add('link');
    if (text.includes('@')) tags.add('mention');
    if (text.match(/\d{4}-\d{2}-\d{2}/)) tags.add('date');
    if (text.match(/\$\d+|\d+元/)) tags.add('money');

    // Language detection
    if (/[\u4e00-\u9fa5]/.test(text)) tags.add('中文');
    if (/[a-zA-Z]/.test(text)) tags.add('english');

    return Array.from(tags);
  }

  /**
   * Translate text
   */
  async translateText(text, targetLang = 'zh-TW') {
    try {
      const key = await this.getApiKey();
      if (!key) {
        throw new Error('No API key configured');
      }

      const sourceLang = /[\u4e00-\u9fa5]/.test(text) ? 'zh-TW' : 'en';
      if (sourceLang === targetLang) {
        targetLang = sourceLang === 'zh-TW' ? 'en' : 'zh-TW';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Translate the following text to ${targetLang}. Only return the translation, no explanations.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  /**
   * Improve text formatting
   */
  async improveFormatting(text) {
    try {
      const key = await this.getApiKey();
      if (!key) return text;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Fix grammar, spelling, and improve formatting. Keep the original meaning. Return only the improved text.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) return text;

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Formatting error:', error);
      return text;
    }
  }

  /**
   * Generate summary for long text
   */
  async summarize(text, maxLength = 100) {
    if (text.length <= maxLength) return text;

    try {
      const key = await this.getApiKey();
      if (!key) return text.substring(0, maxLength) + '...';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Summarize the text in ${maxLength} characters or less. Be concise.`
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3,
          max_tokens: 100
        })
      });

      if (!response.ok) return text.substring(0, maxLength) + '...';

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Summary error:', error);
      return text.substring(0, maxLength) + '...';
    }
  }

  /**
   * Find similar items in history
   */
  findSimilarItems(targetText, history, threshold = 0.7) {
    const similar = [];

    for (const item of history) {
      if (item.text === targetText) continue;

      const similarity = this.calculateSimilarity(targetText, item.text);
      if (similarity >= threshold) {
        similar.push({ item, similarity });
      }
    }

    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Calculate text similarity (simple Jaccard similarity)
   */
  calculateSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Suggest templates based on content
   */
  async suggestTemplates(text) {
    const templates = {
      email: {
        pattern: /^(hi|hello|dear|subject:)/i,
        suggestions: [
          'Professional Email',
          'Casual Email',
          'Thank You Email',
          'Follow-up Email'
        ]
      },
      code: {
        pattern: /^(function|class|const|let|var|import)/,
        suggestions: [
          'JavaScript Function',
          'React Component',
          'API Endpoint',
          'Test Case'
        ]
      },
      note: {
        pattern: /.{50,}/,
        suggestions: [
          'Meeting Notes',
          'Todo List',
          'Brainstorm',
          'Summary'
        ]
      }
    };

    for (const [type, config] of Object.entries(templates)) {
      if (config.pattern.test(text)) {
        return {
          type,
          suggestions: config.suggestions
        };
      }
    }

    return null;
  }
}

// Export singleton instance
const aiService = new AIService();
