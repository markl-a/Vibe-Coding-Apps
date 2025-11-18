/**
 * 文本摘要 Handler
 * 使用 AI 生成文本摘要
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 生成文本摘要
 */
async function generateSummary(text, options = {}) {
  try {
    const {
      maxLength = 150,
      format = 'paragraph',  // 'paragraph', 'bullet-points', 'one-sentence'
      language = 'zh-TW',
      focus = null  // 可選：聚焦特定方面
    } = options;

    // 根據格式構建提示詞
    let formatInstruction = '';
    switch (format) {
      case 'bullet-points':
        formatInstruction = '請用條列式（bullet points）呈現摘要。';
        break;
      case 'one-sentence':
        formatInstruction = '請用一句話總結。';
        break;
      case 'paragraph':
      default:
        formatInstruction = '請用段落形式呈現摘要。';
    }

    let prompt = `請為以下文本生成摘要。${formatInstruction}`;

    if (focus) {
      prompt += `\n特別關注：${focus}`;
    }

    if (maxLength) {
      const wordCount = format === 'one-sentence' ? '一句話' : `約 ${maxLength} 字`;
      prompt += `\n長度：${wordCount}`;
    }

    prompt += `\n\n文本：\n${text}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `你是一位專業的文本摘要專家。你能夠快速理解文本的核心內容，並生成簡潔、準確的摘要。請用${language}回答。`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: format === 'one-sentence' ? 100 : Math.min(maxLength * 2, 1000)
    });

    const summary = completion.choices[0].message.content;

    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      compressionRatio: Math.round((summary.length / text.length) * 100) / 100,
      model: completion.model,
      tokensUsed: completion.usage.total_tokens,
      format,
      language
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    throw error;
  }
}

/**
 * 生成多層級摘要
 */
async function generateTieredSummary(text) {
  try {
    // 一句話摘要
    const oneSentence = await generateSummary(text, {
      format: 'one-sentence',
      maxLength: 50
    });

    // 簡短摘要
    const short = await generateSummary(text, {
      format: 'paragraph',
      maxLength: 100
    });

    // 詳細摘要
    const detailed = await generateSummary(text, {
      format: 'bullet-points',
      maxLength: 300
    });

    return {
      oneSentence: oneSentence.summary,
      short: short.summary,
      detailed: detailed.summary,
      totalTokensUsed: oneSentence.tokensUsed + short.tokensUsed + detailed.tokensUsed
    };
  } catch (error) {
    console.error('Tiered summary error:', error);
    throw error;
  }
}

/**
 * 提取關鍵要點
 */
async function extractKeyPoints(text, count = 5) {
  try {
    const prompt = `請從以下文本中提取 ${count} 個最重要的關鍵要點，每個要點用一句話說明：

${text}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '你是一位專業的內容分析師，擅長提取文本的核心要點。請用條列式呈現。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return {
      keyPoints: completion.choices[0].message.content,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('Key points extraction error:', error);
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
      maxLength = 150,
      format = 'paragraph',
      language = 'zh-TW',
      focus = null,
      mode = 'single',  // 'single', 'tiered', 'key-points'
      keyPointsCount = 5
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

    if (text.length < 100) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Text is too short for summarization (minimum 100 characters)'
        })
      };
    }

    if (text.length > 10000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Text is too long (maximum 10000 characters)'
        })
      };
    }

    console.log(`Summarization Request - Mode: ${mode}, Format: ${format}, Length: ${text.length}`);

    let result;

    switch (mode) {
      case 'tiered':
        result = await generateTieredSummary(text);
        break;

      case 'key-points':
        result = await extractKeyPoints(text, keyPointsCount);
        break;

      case 'single':
      default:
        result = await generateSummary(text, {
          maxLength,
          format,
          language,
          focus
        });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        mode,
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Summarization Handler Error:', error);

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
