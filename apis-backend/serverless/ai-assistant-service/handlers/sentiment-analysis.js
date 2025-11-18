/**
 * 情感分析 Handler
 * 使用 AWS Comprehend 和 OpenAI 進行文本情感分析
 */

const { ComprehendClient, DetectSentimentCommand, DetectEntitiesCommand, DetectKeyPhrasesCommand } = require('@aws-sdk/client-comprehend');
const OpenAI = require('openai');

const comprehend = new ComprehendClient({ region: process.env.AWS_REGION });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 語言代碼映射
 */
const languageMap = {
  'zh': 'zh',
  'zh-TW': 'zh-TW',
  'zh-CN': 'zh',
  'en': 'en',
  'es': 'es',
  'fr': 'fr',
  'de': 'de',
  'pt': 'pt',
  'it': 'it',
  'ja': 'ja',
  'ko': 'ko'
};

/**
 * 使用 AWS Comprehend 進行情感分析
 */
async function analyzeWithComprehend(text, language = 'en') {
  try {
    // AWS Comprehend 支援的語言
    const comprehendLanguage = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'zh-TW'].includes(language)
      ? language
      : 'en';

    // 檢測情感
    const sentimentCommand = new DetectSentimentCommand({
      Text: text,
      LanguageCode: comprehendLanguage
    });
    const sentimentResponse = await comprehend.send(sentimentCommand);

    // 檢測實體
    const entitiesCommand = new DetectEntitiesCommand({
      Text: text,
      LanguageCode: comprehendLanguage
    });
    const entitiesResponse = await comprehend.send(entitiesCommand);

    // 檢測關鍵詞
    const keyPhrasesCommand = new DetectKeyPhrasesCommand({
      Text: text,
      LanguageCode: comprehendLanguage
    });
    const keyPhrasesResponse = await comprehend.send(keyPhrasesCommand);

    return {
      sentiment: sentimentResponse.Sentiment.toLowerCase(),
      sentimentScores: {
        positive: Math.round(sentimentResponse.SentimentScore.Positive * 100) / 100,
        negative: Math.round(sentimentResponse.SentimentScore.Negative * 100) / 100,
        neutral: Math.round(sentimentResponse.SentimentScore.Neutral * 100) / 100,
        mixed: Math.round(sentimentResponse.SentimentScore.Mixed * 100) / 100
      },
      entities: entitiesResponse.Entities
        .filter(e => e.Score > 0.8)
        .slice(0, 10)
        .map(e => ({
          text: e.Text,
          type: e.Type,
          score: Math.round(e.Score * 100) / 100
        })),
      keyPhrases: keyPhrasesResponse.KeyPhrases
        .filter(k => k.Score > 0.8)
        .slice(0, 10)
        .map(k => ({
          text: k.Text,
          score: Math.round(k.Score * 100) / 100
        }))
    };
  } catch (error) {
    console.error('AWS Comprehend error:', error);
    throw error;
  }
}

/**
 * 使用 OpenAI 進行深度情感分析
 */
async function analyzeWithOpenAI(text, language = 'zh-TW') {
  try {
    const prompt = `請分析以下文本的情感和意圖，並以 JSON 格式返回結果：

文本：${text}

請提供：
1. sentiment: 情感（positive/negative/neutral/mixed）
2. score: 情感強度評分（0-1）
3. emotions: 具體情緒列表（如：joy, anger, sadness, fear, surprise）及其強度
4. intent: 文本意圖（如：詢問、抱怨、讚美、建議等）
5. topics: 主要話題
6. summary: 簡短摘要

請用繁體中文回答，JSON 格式。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位專業的文本分析專家，擅長情感分析和意圖識別。請用 JSON 格式返回分析結果。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return {
      ...analysis,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
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
      text,
      language = 'en',
      provider = 'comprehend',  // 'comprehend' or 'openai' or 'both'
      detailedAnalysis = false
    } = body;

    // 驗證輸入
    if (!text || typeof text !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Text is required and must be a string'
        })
      };
    }

    if (text.length < 3) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Text is too short (minimum 3 characters)'
        })
      };
    }

    if (text.length > 5000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Text is too long (maximum 5000 characters)'
        })
      };
    }

    console.log(`Sentiment Analysis Request - Language: ${language}, Provider: ${provider}, Length: ${text.length}`);

    const result = {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      language,
      provider
    };

    // 根據提供商選擇分析方法
    if (provider === 'both' || provider === 'comprehend') {
      try {
        const comprehendResult = await analyzeWithComprehend(text, language);
        result.comprehend = comprehendResult;
      } catch (error) {
        result.comprehend = { error: 'Comprehend analysis failed' };
      }
    }

    if (provider === 'both' || provider === 'openai' || detailedAnalysis) {
      try {
        const openaiResult = await analyzeWithOpenAI(text, language);
        result.openai = openaiResult;
      } catch (error) {
        result.openai = { error: 'OpenAI analysis failed' };
      }
    }

    // 如果兩者都失敗
    if (provider === 'comprehend' && result.comprehend?.error) {
      throw new Error('Sentiment analysis failed');
    }
    if (provider === 'openai' && result.openai?.error) {
      throw new Error('Sentiment analysis failed');
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
    console.error('Sentiment Analysis Handler Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: process.env.STAGE === 'dev' ? error.message : undefined
      })
    };
  }
};
