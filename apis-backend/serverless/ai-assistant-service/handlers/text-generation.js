/**
 * AI 文本生成 Handler
 * 用於內容創作、文章撰寫、社交媒體內容等
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 內容生成模板
const templates = {
  'blog-post': {
    system: '你是一位專業的部落格作家。請根據主題撰寫一篇引人入勝的部落格文章，包含吸引人的標題、前言、主要內容和結論。',
    maxTokens: 2000
  },
  'social-media': {
    system: '你是一位社交媒體專家。請創作吸引人的社交媒體貼文，簡短有力，包含適當的 hashtags 和 emojis。',
    maxTokens: 300
  },
  'product-description': {
    system: '你是一位產品文案專家。請撰寫吸引人的產品描述，突出產品特點、優勢和使用場景。',
    maxTokens: 500
  },
  'email': {
    system: '你是一位專業的商業溝通專家。請撰寫正式且友善的商業電子郵件。',
    maxTokens: 800
  },
  'creative-story': {
    system: '你是一位富有創意的故事作家。請根據主題創作一個有趣且引人入勝的故事。',
    maxTokens: 2000
  },
  'technical-document': {
    system: '你是一位技術文檔專家。請撰寫清晰、結構化的技術文檔，包含詳細的說明和範例。',
    maxTokens: 2000
  }
};

/**
 * 生成文本內容
 */
async function generateText(prompt, type = 'blog-post', options = {}) {
  try {
    const template = templates[type] || templates['blog-post'];
    const {
      temperature = 0.7,
      language = 'zh-TW',
      tone = 'professional',
      length = 'medium'
    } = options;

    // 根據長度調整 max_tokens
    const lengthMultiplier = {
      'short': 0.5,
      'medium': 1,
      'long': 1.5
    };
    const maxTokens = Math.floor(
      template.maxTokens * (lengthMultiplier[length] || 1)
    );

    // 構建增強的提示詞
    const enhancedPrompt = `
語言: ${language}
語氣: ${tone}
長度: ${length}

${prompt}
    `.trim();

    const completion = await openai.chat.completions.create({
      model: process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: template.system
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0.3,
      presence_penalty: 0.1
    });

    return {
      content: completion.choices[0].message.content,
      model: completion.model,
      tokensUsed: completion.usage.total_tokens,
      type,
      options
    };
  } catch (error) {
    console.error('Text Generation Error:', error);
    throw error;
  }
}

/**
 * Lambda Handler
 */
module.exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const {
      prompt,
      type = 'blog-post',
      options = {}
    } = body;

    // 驗證輸入
    if (!prompt || typeof prompt !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Prompt is required and must be a string'
        })
      };
    }

    if (prompt.length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Prompt is too short (minimum 10 characters)'
        })
      };
    }

    // 驗證類型
    const validTypes = Object.keys(templates);
    if (!validTypes.includes(type)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
          availableTypes: validTypes
        })
      };
    }

    console.log(`Text Generation Request - Type: ${type}, Prompt length: ${prompt.length}`);

    const result = await generateText(prompt, type, options);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Text Generation Handler Error:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.status === 401) {
      statusCode = 401;
      errorMessage = 'Invalid API key';
    } else if (error.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        details: process.env.STAGE === 'dev' ? error.message : undefined
      })
    };
  }
};
