/**
 * AI 聊天助手 Handler
 * 支援多種 AI 模型（OpenAI GPT, Anthropic Claude）
 */

const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// 初始化 AI 客戶端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// 對話歷史記憶（實際應用中應使用 Redis 或 DynamoDB）
const conversationMemory = new Map();

/**
 * 使用 OpenAI GPT 模型
 */
async function chatWithGPT(message, conversationId, model = 'gpt-3.5-turbo') {
  try {
    // 獲取對話歷史
    const history = conversationMemory.get(conversationId) || [];

    // 構建訊息陣列
    const messages = [
      {
        role: 'system',
        content: '你是一個有幫助、友善且知識淵博的 AI 助手。請用繁體中文回答問題，並提供詳細且準確的資訊。'
      },
      ...history,
      {
        role: 'user',
        content: message
      }
    ];

    // 調用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: parseInt(process.env.MAX_TOKENS || '1000'),
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    const response = completion.choices[0].message.content;

    // 更新對話歷史
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );

    // 限制歷史記錄長度（保留最近 10 輪對話）
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    conversationMemory.set(conversationId, history);

    return {
      response,
      model: completion.model,
      tokensUsed: completion.usage.total_tokens,
      conversationId
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

/**
 * 使用 Anthropic Claude 模型
 */
async function chatWithClaude(message, conversationId, model = 'claude-3-sonnet-20240229') {
  try {
    // 獲取對話歷史
    const history = conversationMemory.get(conversationId) || [];

    // 構建訊息陣列
    const messages = [
      ...history,
      {
        role: 'user',
        content: message
      }
    ];

    // 調用 Claude API
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: parseInt(process.env.MAX_TOKENS || '1000'),
      system: '你是一個有幫助、友善且知識淵博的 AI 助手。請用繁體中文回答問題，並提供詳細且準確的資訊。',
      messages: messages
    });

    const assistantMessage = response.content[0].text;

    // 更新對話歷史
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    );

    // 限制歷史記錄長度
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    conversationMemory.set(conversationId, history);

    return {
      response: assistantMessage,
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      conversationId
    };
  } catch (error) {
    console.error('Claude API Error:', error);
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

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 解析請求
    const body = JSON.parse(event.body || '{}');
    const {
      message,
      conversationId = `conv-${Date.now()}`,
      model = process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
      provider = 'openai'  // 'openai' or 'anthropic'
    } = body;

    // 驗證輸入
    if (!message || typeof message !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Message is required and must be a string'
        })
      };
    }

    if (message.length > 4000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Message is too long (max 4000 characters)'
        })
      };
    }

    console.log(`AI Chat Request - Provider: ${provider}, Model: ${model}, ConversationId: ${conversationId}`);

    // 根據提供商選擇 AI 服務
    let result;
    if (provider === 'anthropic') {
      result = await chatWithClaude(message, conversationId, model);
    } else {
      result = await chatWithGPT(message, conversationId, model);
    }

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
    console.error('AI Chat Error:', error);

    // 處理特定錯誤
    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.status === 401) {
      statusCode = 401;
      errorMessage = 'Invalid API key';
    } else if (error.status === 429) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded';
    } else if (error.code === 'insufficient_quota') {
      statusCode = 402;
      errorMessage = 'API quota exceeded';
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
