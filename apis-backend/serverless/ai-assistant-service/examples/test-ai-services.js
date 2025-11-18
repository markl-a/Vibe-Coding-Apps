/**
 * AI 助手服務測試腳本
 * 測試所有 AI 功能 API
 */

const axios = require('axios');

// API 基礎 URL（根據部署環境修改）
const BASE_URL = process.env.API_URL || 'http://localhost:3001';

// 測試結果記錄
const results = [];

/**
 * 記錄測試結果
 */
function logResult(testName, success, data = null, error = null) {
  const result = {
    test: testName,
    success,
    timestamp: new Date().toISOString()
  };

  if (data) result.data = data;
  if (error) result.error = error;

  results.push(result);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`測試: ${testName}`);
  console.log(`結果: ${success ? '✅ 成功' : '❌ 失敗'}`);
  if (data) {
    console.log('數據:');
    console.log(JSON.stringify(data, null, 2));
  }
  if (error) {
    console.log('錯誤:', error);
  }
  console.log('='.repeat(60));
}

/**
 * 測試 AI 聊天助手
 */
async function testAIChat() {
  try {
    const response = await axios.post(`${BASE_URL}/ai-chat`, {
      message: '請用一句話解釋什麼是機器學習',
      conversationId: 'test-conv-1',
      model: 'gpt-3.5-turbo',
      provider: 'openai'
    });

    logResult('AI 聊天助手', response.data.success, {
      response: response.data.response,
      tokensUsed: response.data.tokensUsed
    });
  } catch (error) {
    logResult('AI 聊天助手', false, null, error.message);
  }
}

/**
 * 測試文本生成
 */
async function testTextGeneration() {
  try {
    const response = await axios.post(`${BASE_URL}/text-generation`, {
      prompt: '撰寫一篇關於人工智慧未來發展的短文',
      type: 'blog-post',
      options: {
        language: 'zh-TW',
        tone: 'professional',
        length: 'short'
      }
    });

    logResult('文本生成', response.data.success, {
      contentPreview: response.data.content?.substring(0, 200) + '...',
      tokensUsed: response.data.tokensUsed
    });
  } catch (error) {
    logResult('文本生成', false, null, error.message);
  }
}

/**
 * 測試圖片識別
 */
async function testImageRecognition() {
  try {
    // 使用公開的測試圖片
    const testImageUrl = 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131';

    const response = await axios.post(`${BASE_URL}/image-recognition`, {
      imageUrl: testImageUrl,
      features: ['objects', 'description']
    });

    logResult('圖片識別', response.data.success, {
      objects: response.data.features?.objects?.slice(0, 5),
      description: response.data.features?.description
    });
  } catch (error) {
    logResult('圖片識別', false, null, error.message);
  }
}

/**
 * 測試情感分析
 */
async function testSentimentAnalysis() {
  try {
    const response = await axios.post(`${BASE_URL}/sentiment-analysis`, {
      text: '這個產品真的太棒了！我非常滿意，強烈推薦給大家！',
      language: 'zh-TW',
      provider: 'openai'
    });

    logResult('情感分析', response.data.success, {
      sentiment: response.data.openai?.sentiment,
      score: response.data.openai?.score
    });
  } catch (error) {
    logResult('情感分析', false, null, error.message);
  }
}

/**
 * 測試文本摘要
 */
async function testSummarization() {
  try {
    const longText = `
人工智慧（Artificial Intelligence, AI）是電腦科學的一個分支，致力於創建能夠執行通常需要人類智慧的任務的系統。
這些任務包括視覺感知、語音識別、決策制定和語言翻譯等。AI 技術已經在許多領域得到應用，包括醫療保健、金融、
製造業和交通運輸。機器學習是 AI 的一個子領域，專注於開發能夠從數據中學習和改進的算法。深度學習則是機器學習的
一個更專業的領域，使用人工神經網絡來處理和分析大量數據。隨著計算能力的提升和數據的增加，AI 技術正在快速發展，
為各個行業帶來革命性的變化。
    `.trim();

    const response = await axios.post(`${BASE_URL}/summarize`, {
      text: longText,
      maxLength: 50,
      format: 'one-sentence',
      language: 'zh-TW'
    });

    logResult('文本摘要', response.data.success, {
      summary: response.data.summary,
      compressionRatio: response.data.compressionRatio
    });
  } catch (error) {
    logResult('文本摘要', false, null, error.message);
  }
}

/**
 * 測試翻譯服務
 */
async function testTranslation() {
  try {
    const response = await axios.post(`${BASE_URL}/translate`, {
      text: 'Hello, how are you today?',
      from: 'en',
      to: 'zh-TW',
      provider: 'openai'
    });

    logResult('翻譯服務', response.data.success, {
      original: 'Hello, how are you today?',
      translated: response.data.translatedText
    });
  } catch (error) {
    logResult('翻譯服務', false, null, error.message);
  }
}

/**
 * 測試代碼解釋
 */
async function testCodeExplanation() {
  try {
    const code = `
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
    `.trim();

    const response = await axios.post(`${BASE_URL}/explain-code`, {
      code: code,
      language: 'javascript',
      action: 'explain',
      options: {
        detailLevel: 'brief'
      }
    });

    logResult('代碼解釋', response.data.success, {
      explanationPreview: response.data.explanation?.substring(0, 200) + '...'
    });
  } catch (error) {
    logResult('代碼解釋', false, null, error.message);
  }
}

/**
 * 測試內容審核
 */
async function testContentModeration() {
  try {
    const response = await axios.post(`${BASE_URL}/content-moderation`, {
      text: '這是一個正常的測試內容，用於檢測內容審核功能是否正常運作。',
      mode: 'basic'
    });

    logResult('內容審核', response.data.success, {
      flagged: response.data.flagged,
      safetyScore: response.data.safetyScore,
      recommendation: response.data.recommendation
    });
  } catch (error) {
    logResult('內容審核', false, null, error.message);
  }
}

/**
 * 執行所有測試
 */
async function runAllTests() {
  console.log('\n🚀 開始測試 AI 助手服務...\n');
  console.log(`測試 API: ${BASE_URL}\n`);

  const tests = [
    { name: 'AI 聊天助手', fn: testAIChat },
    { name: '文本生成', fn: testTextGeneration },
    { name: '圖片識別', fn: testImageRecognition },
    { name: '情感分析', fn: testSentimentAnalysis },
    { name: '文本摘要', fn: testSummarization },
    { name: '翻譯服務', fn: testTranslation },
    { name: '代碼解釋', fn: testCodeExplanation },
    { name: '內容審核', fn: testContentModeration }
  ];

  for (const test of tests) {
    try {
      await test.fn();
      // 延遲以避免 API 速率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`測試 ${test.name} 時發生錯誤:`, error.message);
    }
  }

  // 顯示測試摘要
  console.log('\n' + '='.repeat(60));
  console.log('📊 測試摘要');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`總測試數: ${results.length}`);
  console.log(`✅ 成功: ${successful}`);
  console.log(`❌ 失敗: ${failed}`);
  console.log(`成功率: ${((successful / results.length) * 100).toFixed(2)}%`);

  if (failed > 0) {
    console.log('\n失敗的測試:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.test}: ${r.error}`);
    });
  }

  console.log('\n測試完成！\n');
}

// 執行測試
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('測試執行錯誤:', error);
    process.exit(1);
  });
}

module.exports = {
  testAIChat,
  testTextGeneration,
  testImageRecognition,
  testSentimentAnalysis,
  testSummarization,
  testTranslation,
  testCodeExplanation,
  testContentModeration,
  runAllTests
};
