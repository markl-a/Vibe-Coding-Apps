/**
 * Blog GraphQL API 測試查詢範例
 * 演示如何使用 GraphQL 查詢和變更操作
 *
 * 使用方式: node examples/test-queries.js
 */

const BASE_URL = 'http://localhost:4000/graphql';

let token = '';
let userId = '';
let postId = '';
let commentId = '';

async function graphqlRequest(query, variables = {}, authToken = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('請求失敗:', error.message);
    return { errors: [{ message: error.message }] };
  }
}

async function runTests() {
  console.log('🚀 Blog GraphQL API 測試\n');

  try {
    // 1. 用戶註冊
    console.log('1️⃣  用戶註冊');
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          id
          username
          email
          displayName
          createdAt
        }
      }
    `;

    const registerResult = await graphqlRequest(registerMutation, {
      input: {
        username: `blogger_${Date.now()}`,
        email: `blogger${Date.now()}@example.com`,
        password: 'BlogPass123',
        displayName: '部落格作者'
      }
    });

    if (registerResult.errors) {
      console.log('⚠️  註冊錯誤:', registerResult.errors[0].message);
    } else {
      console.log('✅ 註冊成功:', registerResult.data.register);
      userId = registerResult.data.register.id;
    }
    console.log('');

    // 2. 用戶登入
    console.log('2️⃣  用戶登入');
    const loginMutation = `
      mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          token
          user {
            id
            username
            email
          }
        }
      }
    `;

    const loginResult = await graphqlRequest(loginMutation, {
      username: registerResult.data?.register?.username || 'demo_user',
      password: 'BlogPass123'
    });

    if (loginResult.errors) {
      console.log('⚠️  登入錯誤:', loginResult.errors[0].message);
    } else {
      console.log('✅ 登入成功');
      token = loginResult.data.login.token;
      console.log('Token:', token.substring(0, 30) + '...');
    }
    console.log('');

    // 3. 創建文章
    console.log('3️⃣  創建文章');
    const createPostMutation = `
      mutation CreatePost($input: CreatePostInput!) {
        createPost(input: $input) {
          id
          title
          content
          author {
            username
            displayName
          }
          createdAt
        }
      }
    `;

    const createPostResult = await graphqlRequest(createPostMutation, {
      input: {
        title: 'GraphQL 完整指南',
        content: `
# GraphQL 完整指南

GraphQL 是一個用於 API 的查詢語言，也是一個用於執行查詢的服務端運行時。

## 核心概念

### 1. 查詢 (Queries)
查詢用於獲取資料，類似於 REST API 的 GET 請求。

### 2. 變更 (Mutations)
變更用於修改資料，類似於 REST API 的 POST/PUT/DELETE 請求。

### 3. 訂閱 (Subscriptions)
訂閱用於實時資料更新，透過 WebSocket 實現。

### 4. Schema
Schema 定義了 API 的類型系統和可用的操作。

## 優勢

1. **按需獲取**: 只請求需要的字段
2. **強類型**: Schema 提供類型安全
3. **單一端點**: 不需要多個 REST 端點
4. **實時更新**: 內建訂閱支援

GraphQL 正在改變 API 開發的方式！
        `.trim(),
        excerpt: '學習 GraphQL 的核心概念和優勢',
        published: true
      }
    }, token);

    if (createPostResult.errors) {
      console.log('⚠️  創建文章錯誤:', createPostResult.errors[0].message);
    } else {
      console.log('✅ 文章已創建:', createPostResult.data.createPost);
      postId = createPostResult.data.createPost.id;
    }
    console.log('');

    // 4. 查詢所有文章
    console.log('4️⃣  查詢所有文章');
    const postsQuery = `
      query GetPosts($limit: Int) {
        posts(limit: $limit) {
          id
          title
          excerpt
          author {
            username
            displayName
          }
          createdAt
        }
      }
    `;

    const postsResult = await graphqlRequest(postsQuery, { limit: 5 });

    if (postsResult.errors) {
      console.log('⚠️  查詢錯誤:', postsResult.errors[0].message);
    } else {
      console.log('✅ 文章列表:', {
        total: postsResult.data.posts.length,
        posts: postsResult.data.posts.slice(0, 2)
      });
    }
    console.log('');

    // 5. 查詢單一文章（包含評論）
    console.log('5️⃣  查詢文章詳情（包含評論）');
    const postQuery = `
      query GetPost($id: ID!) {
        post(id: $id) {
          id
          title
          content
          author {
            username
            displayName
          }
          comments {
            id
            content
            author {
              username
            }
          }
          createdAt
          updatedAt
        }
      }
    `;

    const postResult = await graphqlRequest(postQuery, { id: postId });

    if (postResult.errors) {
      console.log('⚠️  查詢錯誤:', postResult.errors[0].message);
    } else {
      console.log('✅ 文章詳情:', {
        title: postResult.data.post?.title,
        author: postResult.data.post?.author?.username,
        commentsCount: postResult.data.post?.comments?.length || 0
      });
    }
    console.log('');

    // 6. 添加評論
    console.log('6️⃣  添加評論');
    const createCommentMutation = `
      mutation CreateComment($postId: ID!, $content: String!) {
        createComment(postId: $postId, content: $content) {
          id
          content
          author {
            username
            displayName
          }
          createdAt
        }
      }
    `;

    const commentResult = await graphqlRequest(createCommentMutation, {
      postId: postId,
      content: '這篇 GraphQL 文章寫得太棒了！解釋得很清楚。'
    }, token);

    if (commentResult.errors) {
      console.log('⚠️  添加評論錯誤:', commentResult.errors[0].message);
    } else {
      console.log('✅ 評論已添加:', commentResult.data.createComment);
      commentId = commentResult.data.createComment.id;
    }
    console.log('');

    // 7. 更新文章
    console.log('7️⃣  更新文章');
    const updatePostMutation = `
      mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
        updatePost(id: $id, input: $input) {
          id
          title
          content
          updatedAt
        }
      }
    `;

    const updateResult = await graphqlRequest(updatePostMutation, {
      id: postId,
      input: {
        title: 'GraphQL 完整指南 - 2024 更新版'
      }
    }, token);

    if (updateResult.errors) {
      console.log('⚠️  更新錯誤:', updateResult.errors[0].message);
    } else {
      console.log('✅ 文章已更新:', {
        title: updateResult.data.updatePost?.title
      });
    }
    console.log('');

    // 8. 查詢用戶資料（包含文章）
    console.log('8️⃣  查詢用戶資料');
    const userQuery = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          username
          displayName
          email
          posts {
            id
            title
            createdAt
          }
          createdAt
        }
      }
    `;

    const userResult = await graphqlRequest(userQuery, { id: userId });

    if (userResult.errors) {
      console.log('⚠️  查詢錯誤:', userResult.errors[0].message);
    } else {
      console.log('✅ 用戶資料:', {
        username: userResult.data.user?.username,
        postsCount: userResult.data.user?.posts?.length || 0
      });
    }
    console.log('');

    // 9. 搜尋文章
    console.log('9️⃣  搜尋文章');
    const searchQuery = `
      query SearchPosts($keyword: String!) {
        searchPosts(keyword: $keyword) {
          id
          title
          excerpt
          author {
            username
          }
        }
      }
    `;

    const searchResult = await graphqlRequest(searchQuery, {
      keyword: 'GraphQL'
    });

    if (searchResult.errors) {
      console.log('⚠️  搜尋錯誤:', searchResult.errors[0].message);
    } else {
      console.log('✅ 搜尋結果:', {
        found: searchResult.data.searchPosts?.length || 0,
        posts: searchResult.data.searchPosts?.slice(0, 2)
      });
    }
    console.log('');

    // 10. 批量查詢（使用 DataLoader 優化）
    console.log('🔟 批量查詢多個文章作者');
    const batchQuery = `
      query GetPosts {
        posts(limit: 3) {
          id
          title
          author {
            id
            username
            displayName
          }
        }
      }
    `;

    const batchResult = await graphqlRequest(batchQuery);

    if (batchResult.errors) {
      console.log('⚠️  批量查詢錯誤:', batchResult.errors[0].message);
    } else {
      console.log('✅ 批量查詢成功（DataLoader 優化了 N+1 查詢問題）');
      console.log('文章數:', batchResult.data.posts?.length);
    }
    console.log('');

    console.log('🎉 測試完成！');
    console.log('\n📊 測試摘要:');
    console.log('  - 用戶 ID:', userId);
    console.log('  - 文章 ID:', postId);
    console.log('  - 評論 ID:', commentId);
    console.log('\n💡 提示:');
    console.log('  - 訪問 http://localhost:4000 使用 GraphQL Playground');
    console.log('  - GraphQL 支援靈活的查詢和精確的資料獲取');
    console.log('  - 使用 DataLoader 優化了 N+1 查詢問題');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 執行測試
runTests();
