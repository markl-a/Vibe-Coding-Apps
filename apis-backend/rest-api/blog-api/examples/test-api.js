/**
 * Blog API 測試腳本 (Node.js)
 * 這個腳本使用 Node.js 演示 Blog API 的主要功能
 *
 * 使用方式: node examples/test-api.js
 */

const BASE_URL = 'http://localhost:3000/api/v1';

let token = '';
let userId = '';
let articleId = '';
let categoryId = '';
let tagIds = [];

// 簡單的 HTTP 請求函數
async function request(method, path, data = null, authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const json = await response.json();
    return { status: response.status, data: json };
  } catch (error) {
    console.error('請求失敗:', error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// 測試步驟
async function runTests() {
  console.log('🚀 開始測試 Blog API\n');

  try {
    // 1. 用戶註冊
    console.log('📝 1. 用戶註冊');
    const registerResult = await request('POST', '/auth/register', {
      username: `user_${Date.now()}`,
      email: `user${Date.now()}@example.com`,
      password: 'TestPass123',
      displayName: 'Test User',
    });
    console.log('✅ 註冊結果:', registerResult.data);
    userId = registerResult.data.id;
    console.log('');

    // 2. 用戶登入
    console.log('🔐 2. 用戶登入');
    const loginResult = await request('POST', '/auth/login', {
      username: registerResult.data.username,
      password: 'TestPass123',
    });
    console.log('✅ 登入成功');
    token = loginResult.data.access_token;
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('');

    // 3. 創建分類
    console.log('📁 3. 創建分類');
    const categoryResult = await request('POST', '/categories', {
      name: '程式設計',
      slug: 'programming',
      description: '程式設計相關文章',
    }, token);
    console.log('✅ 分類已創建:', categoryResult.data);
    categoryId = categoryResult.data.id;
    console.log('');

    // 4. 創建標籤
    console.log('🏷️  4. 創建標籤');
    const tag1Result = await request('POST', '/tags', {
      name: 'JavaScript',
      slug: 'javascript',
    }, token);
    const tag2Result = await request('POST', '/tags', {
      name: 'Node.js',
      slug: 'nodejs',
    }, token);
    tagIds = [tag1Result.data.id, tag2Result.data.id];
    console.log('✅ 標籤已創建:', [tag1Result.data, tag2Result.data]);
    console.log('');

    // 5. 創建文章
    console.log('📄 5. 創建文章');
    const articleResult = await request('POST', '/articles', {
      title: 'JavaScript 異步編程完全指南',
      slug: 'javascript-async-guide',
      content: `
# JavaScript 異步編程完全指南

JavaScript 的異步編程是現代 Web 開發的核心。本文將深入探討異步編程的各種模式。

## 回調函數 (Callbacks)

最早的異步處理方式：

\`\`\`javascript
function fetchData(callback) {
  setTimeout(() => {
    callback(null, { data: 'Hello' });
  }, 1000);
}
\`\`\`

## Promise

更優雅的異步處理：

\`\`\`javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve({ data: 'Hello' });
  }, 1000);
});
\`\`\`

## Async/Await

最現代化的寫法：

\`\`\`javascript
async function getData() {
  const result = await fetch('/api/data');
  return await result.json();
}
\`\`\`

這些模式各有優缺點，選擇最適合你項目的方式！
      `.trim(),
      excerpt: '深入理解 JavaScript 中的回調、Promise 和 Async/Await',
      status: 'published',
      categoryIds: [categoryId],
      tagIds: tagIds,
    }, token);
    console.log('✅ 文章已創建:', {
      id: articleResult.data.id,
      title: articleResult.data.title,
    });
    articleId = articleResult.data.id;
    console.log('');

    // 6. 獲取文章列表
    console.log('📚 6. 獲取文章列表');
    const articlesResult = await request('GET', '/articles?page=1&limit=5');
    console.log('✅ 找到', articlesResult.data.data?.length || 0, '篇文章');
    console.log('');

    // 7. 獲取單一文章
    console.log('📖 7. 獲取單一文章');
    const singleArticleResult = await request('GET', `/articles/${articleId}`);
    console.log('✅ 文章詳情:', {
      title: singleArticleResult.data.title,
      viewCount: singleArticleResult.data.viewCount,
      likeCount: singleArticleResult.data.likeCount,
    });
    console.log('');

    // 8. 點讚文章
    console.log('❤️  8. 點讚文章');
    await request('POST', `/articles/${articleId}/like`);
    const likedArticle = await request('GET', `/articles/${articleId}`);
    console.log('✅ 點讚後的數量:', likedArticle.data.likeCount);
    console.log('');

    // 9. 添加評論
    console.log('💬 9. 添加評論');
    const commentResult = await request('POST', '/comments', {
      content: '這篇文章寫得太好了！對異步編程有了更深的理解。',
      articleId: articleId,
    }, token);
    console.log('✅ 評論已添加:', commentResult.data);
    console.log('');

    // 10. 獲取評論列表
    console.log('📝 10. 獲取文章評論');
    const commentsResult = await request('GET', `/comments?articleId=${articleId}`);
    console.log('✅ 找到', commentsResult.data.length || 0, '條評論');
    console.log('');

    // 11. 更新文章
    console.log('✏️  11. 更新文章');
    const updateResult = await request('PUT', `/articles/${articleId}`, {
      title: 'JavaScript 異步編程完全指南 - 2024 更新版',
    }, token);
    console.log('✅ 文章已更新:', updateResult.data.title);
    console.log('');

    // 12. 獲取所有分類
    console.log('📁 12. 獲取所有分類');
    const categoriesResult = await request('GET', '/categories');
    console.log('✅ 找到', categoriesResult.data.length || 0, '個分類');
    console.log('');

    // 13. 獲取所有標籤
    console.log('🏷️  13. 獲取所有標籤');
    const tagsResult = await request('GET', '/tags');
    console.log('✅ 找到', tagsResult.data.length || 0, '個標籤');
    console.log('');

    console.log('🎉 所有測試完成！');
    console.log('\n📊 測試摘要:');
    console.log('  - 用戶 ID:', userId);
    console.log('  - 文章 ID:', articleId);
    console.log('  - 分類 ID:', categoryId);
    console.log('  - 標籤數量:', tagIds.length);
    console.log('\n💡 提示: 訪問 http://localhost:3000/api/docs 查看完整 API 文檔');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 執行測試
runTests();
