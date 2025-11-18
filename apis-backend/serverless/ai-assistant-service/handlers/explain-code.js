/**
 * 代碼解釋 Handler
 * 使用 AI 分析和解釋程式碼
 */

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * 解釋代碼功能
 */
async function explainCode(code, language, options = {}) {
  try {
    const {
      detailLevel = 'medium',  // 'brief', 'medium', 'detailed'
      includeComments = true,
      includeSuggestions = true
    } = options;

    let prompt = `請分析以下 ${language} 程式碼：

\`\`\`${language}
${code}
\`\`\`

請提供：
1. 程式碼功能說明`;

    if (detailLevel === 'detailed') {
      prompt += `
2. 逐行解釋
3. 使用的演算法或設計模式
4. 時間和空間複雜度分析`;
    } else if (detailLevel === 'medium') {
      prompt += `
2. 主要邏輯說明
3. 關鍵概念解釋`;
    }

    if (includeSuggestions) {
      prompt += `
${detailLevel === 'detailed' ? '5' : detailLevel === 'medium' ? '4' : '2'}. 優化建議
${detailLevel === 'detailed' ? '6' : detailLevel === 'medium' ? '5' : '3'}. 潛在問題或錯誤`;
    }

    prompt += '\n\n請用繁體中文回答，格式清晰。';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一位資深的程式設計專家和教育者，擅長解釋程式碼並提供優化建議。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: detailLevel === 'detailed' ? 2000 : detailLevel === 'medium' ? 1000 : 500
    });

    return {
      explanation: completion.choices[0].message.content,
      language,
      detailLevel,
      model: completion.model,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('Code explanation error:', error);
    throw error;
  }
}

/**
 * 代碼重構建議
 */
async function suggestRefactoring(code, language) {
  try {
    const prompt = `請分析以下 ${language} 程式碼，並提供重構建議：

\`\`\`${language}
${code}
\`\`\`

請提供：
1. 可以改進的地方
2. 重構後的程式碼範例
3. 改進的理由（可讀性、效能、可維護性等）

請用繁體中文回答。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一位程式碼重構專家，擅長提升代碼質量和可維護性。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return {
      refactoringSuggestions: completion.choices[0].message.content,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('Refactoring suggestion error:', error);
    throw error;
  }
}

/**
 * 代碼轉換（語言轉換）
 */
async function convertCode(code, fromLanguage, toLanguage) {
  try {
    const prompt = `請將以下 ${fromLanguage} 程式碼轉換為 ${toLanguage}：

\`\`\`${fromLanguage}
${code}
\`\`\`

請確保：
1. 保持相同的功能和邏輯
2. 遵循 ${toLanguage} 的最佳實踐
3. 添加必要的註解說明

請只返回轉換後的程式碼，用 \`\`\`${toLanguage} 包裹。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一位精通多種程式語言的專家，擅長在不同語言之間轉換程式碼。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000
    });

    return {
      convertedCode: completion.choices[0].message.content,
      fromLanguage,
      toLanguage,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('Code conversion error:', error);
    throw error;
  }
}

/**
 * 生成單元測試
 */
async function generateTests(code, language, framework = 'jest') {
  try {
    const prompt = `請為以下 ${language} 程式碼生成單元測試（使用 ${framework}）：

\`\`\`${language}
${code}
\`\`\`

請提供：
1. 完整的測試程式碼
2. 涵蓋主要功能和邊界情況
3. 清晰的測試案例說明

請用繁體中文註解。`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '你是一位測試驅動開發（TDD）專家，擅長撰寫完整且有效的單元測試。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    return {
      testCode: completion.choices[0].message.content,
      framework,
      tokensUsed: completion.usage.total_tokens
    };
  } catch (error) {
    console.error('Test generation error:', error);
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
      code,
      language,
      action = 'explain',  // 'explain', 'refactor', 'convert', 'test'
      options = {}
    } = body;

    // 驗證輸入
    if (!code || typeof code !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Code is required and must be a string'
        })
      };
    }

    if (!language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Programming language is required'
        })
      };
    }

    if (code.length > 5000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Code is too long (maximum 5000 characters)'
        })
      };
    }

    console.log(`Code Analysis Request - Language: ${language}, Action: ${action}, Length: ${code.length}`);

    let result;

    switch (action) {
      case 'refactor':
        result = await suggestRefactoring(code, language);
        break;

      case 'convert':
        if (!options.toLanguage) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'toLanguage is required for code conversion'
            })
          };
        }
        result = await convertCode(code, language, options.toLanguage);
        break;

      case 'test':
        result = await generateTests(code, language, options.framework);
        break;

      case 'explain':
      default:
        result = await explainCode(code, language, options);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        action,
        ...result,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Code Explanation Handler Error:', error);

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
