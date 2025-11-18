/**
 * 內容審核 Handler
 * 使用 OpenAI Moderation API 檢測不當內容
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 內容類別中文對照
 */
const categoryNames = {
  'sexual': '性相關內容',
  'hate': '仇恨言論',
  'harassment': '騷擾',
  'self-harm': '自我傷害',
  'sexual/minors': '未成年性內容',
  'hate/threatening': '威脅性仇恨言論',
  'violence/graphic': '暴力/血腥內容',
  'self-harm/intent': '自我傷害意圖',
  'self-harm/instructions': '自我傷害指導',
  'harassment/threatening': '威脅性騷擾',
  'violence': '暴力內容'
};

/**
 * 使用 OpenAI Moderation API 進行內容審核
 */
async function moderateContent(text) {
  try {
    const moderation = await openai.moderations.create({
      input: text
    });

    const result = moderation.results[0];

    // 整理分類結果
    const categories = Object.keys(result.categories)
      .filter(key => result.categories[key])
      .map(key => ({
        category: key,
        categoryName: categoryNames[key] || key,
        flagged: result.categories[key],
        score: Math.round(result.category_scores[key] * 100) / 100
      }))
      .sort((a, b) => b.score - a.score);

    // 所有分類的分數
    const allScores = Object.keys(result.category_scores).map(key => ({
      category: key,
      categoryName: categoryNames[key] || key,
      score: Math.round(result.category_scores[key] * 100) / 100
    })).sort((a, b) => b.score - a.score);

    return {
      flagged: result.flagged,
      categories: categories,
      allScores: allScores,
      safetyScore: calculateSafetyScore(allScores)
    };
  } catch (error) {
    console.error('Content moderation error:', error);
    throw error;
  }
}

/**
 * 計算安全分數（0-100，分數越高越安全）
 */
function calculateSafetyScore(scores) {
  if (scores.length === 0) return 100;

  // 取最高的幾個風險分數的平均值
  const topRisks = scores.slice(0, 3);
  const avgRisk = topRisks.reduce((sum, item) => sum + item.score, 0) / topRisks.length;

  // 轉換為安全分數
  const safetyScore = Math.round((1 - avgRisk) * 100);

  return safetyScore;
}

/**
 * 垃圾訊息檢測（使用 AI 判斷）
 */
async function detectSpam(text) {
  try {
    const prompt = `請分析以下文本是否為垃圾訊息（spam）：

"${text}"

請以 JSON 格式回應：
{
  "isSpam": true/false,
  "confidence": 0-1,
  "reasons": ["原因1", "原因2"],
  "spamType": "廣告/詐騙/釣魚/正常"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位垃圾訊息檢測專家。請準確判斷文本是否為垃圾訊息。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('Spam detection error:', error);
    throw error;
  }
}

/**
 * 敏感資訊檢測
 */
async function detectSensitiveInfo(text) {
  try {
    // 基本的正則表達式檢測
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      ipAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
    };

    const detected = {};
    let hasInfo = false;

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        detected[type] = {
          found: true,
          count: matches.length,
          examples: matches.slice(0, 2)  // 只顯示前兩個範例
        };
        hasInfo = true;
      }
    }

    return {
      hasSensitiveInfo: hasInfo,
      detected: detected
    };
  } catch (error) {
    console.error('Sensitive info detection error:', error);
    throw error;
  }
}

/**
 * 綜合內容審核
 */
async function comprehensiveModeration(text, options = {}) {
  try {
    const {
      checkSpam = true,
      checkSensitiveInfo = true
    } = options;

    const results = await Promise.all([
      moderateContent(text),
      checkSpam ? detectSpam(text).catch(e => ({ error: e.message })) : null,
      checkSensitiveInfo ? detectSensitiveInfo(text) : null
    ]);

    return {
      contentModeration: results[0],
      spamDetection: results[1],
      sensitiveInfo: results[2]
    };
  } catch (error) {
    console.error('Comprehensive moderation error:', error);
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
      mode = 'basic',  // 'basic', 'spam', 'sensitive', 'comprehensive'
      options = {}
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

    console.log(`Content Moderation Request - Mode: ${mode}, Length: ${text.length}`);

    let result;

    switch (mode) {
      case 'spam':
        result = await detectSpam(text);
        break;

      case 'sensitive':
        result = await detectSensitiveInfo(text);
        break;

      case 'comprehensive':
        result = await comprehensiveModeration(text, options);
        break;

      case 'basic':
      default:
        result = await moderateContent(text);
    }

    // 生成建議
    let recommendation = 'approved';
    if (mode === 'comprehensive') {
      const isFlagged = result.contentModeration?.flagged;
      const isSpam = result.spamDetection?.isSpam;
      const hasSensitive = result.sensitiveInfo?.hasSensitiveInfo;

      if (isFlagged || isSpam) {
        recommendation = 'rejected';
      } else if (hasSensitive) {
        recommendation = 'review';
      }
    } else if (mode === 'basic' && result.flagged) {
      recommendation = 'rejected';
    } else if (mode === 'spam' && result.isSpam) {
      recommendation = 'rejected';
    } else if (mode === 'sensitive' && result.hasSensitiveInfo) {
      recommendation = 'review';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        mode,
        recommendation,
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Content Moderation Handler Error:', error);

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
