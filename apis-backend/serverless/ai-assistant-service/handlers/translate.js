/**
 * AI 翻譯服務 Handler
 * 使用 AWS Translate 和 OpenAI 進行多語言翻譯
 */

const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');
const OpenAI = require('openai');

const translate = new TranslateClient({ region: process.env.AWS_REGION });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 支援的語言列表
 */
const supportedLanguages = {
  'zh': '中文（簡體）',
  'zh-TW': '中文（繁體）',
  'en': '英文',
  'ja': '日文',
  'ko': '韓文',
  'es': '西班牙文',
  'fr': '法文',
  'de': '德文',
  'it': '義大利文',
  'pt': '葡萄牙文',
  'ru': '俄文',
  'ar': '阿拉伯文',
  'hi': '印地文',
  'th': '泰文',
  'vi': '越南文',
  'id': '印尼文'
};

/**
 * 使用 AWS Translate 進行翻譯
 */
async function translateWithAWS(text, sourceLang, targetLang) {
  try {
    // AWS Translate 語言代碼轉換
    const awsSourceLang = sourceLang === 'zh-TW' ? 'zh-TW' : sourceLang;
    const awsTargetLang = targetLang === 'zh-TW' ? 'zh-TW' : targetLang;

    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: awsSourceLang,
      TargetLanguageCode: awsTargetLang
    });

    const response = await translate.send(command);

    return {
      translatedText: response.TranslatedText,
      sourceLanguage: response.SourceLanguageCode,
      targetLanguage: response.TargetLanguageCode,
      provider: 'aws-translate'
    };
  } catch (error) {
    console.error('AWS Translate error:', error);
    throw error;
  }
}

/**
 * 使用 OpenAI 進行翻譯（更自然、考慮上下文）
 */
async function translateWithOpenAI(text, sourceLang, targetLang, options = {}) {
  try {
    const {
      preserveFormatting = true,
      tone = 'neutral',  // 'neutral', 'formal', 'casual'
      context = null
    } = options;

    const sourceLangName = supportedLanguages[sourceLang] || sourceLang;
    const targetLangName = supportedLanguages[targetLang] || targetLang;

    let systemPrompt = `你是一位專業的翻譯專家。請將文本從${sourceLangName}翻譯成${targetLangName}。`;

    if (preserveFormatting) {
      systemPrompt += ' 請保留原文的格式、換行和標點符號。';
    }

    switch (tone) {
      case 'formal':
        systemPrompt += ' 使用正式的語氣。';
        break;
      case 'casual':
        systemPrompt += ' 使用輕鬆、口語化的語氣。';
        break;
    }

    let userPrompt = text;
    if (context) {
      userPrompt = `上下文：${context}\n\n要翻譯的文本：${text}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: Math.min(text.length * 3, 2000)
    });

    return {
      translatedText: completion.choices[0].message.content,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      provider: 'openai',
      tokensUsed: completion.usage.total_tokens,
      options
    };
  } catch (error) {
    console.error('OpenAI translation error:', error);
    throw error;
  }
}

/**
 * 批次翻譯
 */
async function batchTranslate(texts, sourceLang, targetLang, provider = 'aws') {
  try {
    const translations = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const result = provider === 'openai'
            ? await translateWithOpenAI(text, sourceLang, targetLang)
            : await translateWithAWS(text, sourceLang, targetLang);

          return {
            index,
            original: text,
            translated: result.translatedText,
            success: true
          };
        } catch (error) {
          return {
            index,
            original: text,
            error: error.message,
            success: false
          };
        }
      })
    );

    return translations;
  } catch (error) {
    console.error('Batch translation error:', error);
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
      texts,  // 批次翻譯
      from = 'auto',  // 'auto' 表示自動檢測
      to,
      provider = 'aws',  // 'aws' or 'openai'
      options = {}
    } = body;

    // 驗證輸入
    if (!to) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Target language (to) is required'
        })
      };
    }

    if (!text && !texts) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Either text or texts array is required'
        })
      };
    }

    // 驗證語言代碼
    if (to !== 'auto' && !supportedLanguages[to]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: `Unsupported target language: ${to}`,
          supportedLanguages
        })
      };
    }

    console.log(`Translation Request - From: ${from}, To: ${to}, Provider: ${provider}`);

    let result;

    // 批次翻譯
    if (texts && Array.isArray(texts)) {
      if (texts.length > 100) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Maximum 100 texts per batch'
          })
        };
      }

      const translations = await batchTranslate(texts, from, to, provider);

      result = {
        mode: 'batch',
        total: texts.length,
        successful: translations.filter(t => t.success).length,
        failed: translations.filter(t => !t.success).length,
        translations
      };
    }
    // 單次翻譯
    else {
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

      if (from === 'auto' && provider === 'aws') {
        // AWS Translate 不支援自動檢測，使用 OpenAI
        result = await translateWithOpenAI(text, from, to, options);
      } else if (provider === 'openai') {
        result = await translateWithOpenAI(text, from, to, options);
      } else {
        result = await translateWithAWS(text, from, to);
      }

      result.mode = 'single';
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
    console.error('Translation Handler Error:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.name === 'UnsupportedLanguagePairException') {
      statusCode = 400;
      errorMessage = 'Unsupported language pair';
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
