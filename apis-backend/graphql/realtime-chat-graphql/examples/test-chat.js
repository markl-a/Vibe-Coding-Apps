/**
 * Real-time Chat GraphQL API 測試範例
 * 演示即時聊天功能，包含 WebSocket 訂閱
 *
 * 使用方式: node examples/test-chat.js
 * 需要安裝: npm install ws graphql-ws
 */

const BASE_URL = 'http://localhost:4000/graphql';
const WS_URL = 'ws://localhost:4000/graphql';

let token = '';
let userId = '';
let channelId = '';
let messageIds = [];

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
  console.log('💬 Real-time Chat GraphQL API 測試\n');

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

    const timestamp = Date.now();
    const registerResult = await graphqlRequest(registerMutation, {
      input: {
        username: `user_${timestamp}`,
        email: `user${timestamp}@example.com`,
        password: 'ChatPass123',
        displayName: '聊天用戶'
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
          }
        }
      }
    `;

    const loginResult = await graphqlRequest(loginMutation, {
      username: `user_${timestamp}`,
      password: 'ChatPass123'
    });

    if (loginResult.errors) {
      console.log('⚠️  登入錯誤:', loginResult.errors[0].message);
    } else {
      console.log('✅ 登入成功');
      token = loginResult.data.login.token;
      console.log('Token:', token.substring(0, 30) + '...');
    }
    console.log('');

    // 3. 創建聊天頻道
    console.log('3️⃣  創建聊天頻道');
    const createChannelMutation = `
      mutation CreateChannel($input: CreateChannelInput!) {
        createChannel(input: $input) {
          id
          name
          description
          isPrivate
          createdBy {
            username
          }
          createdAt
        }
      }
    `;

    const channelResult = await graphqlRequest(createChannelMutation, {
      input: {
        name: 'Tech Talk',
        description: '討論技術相關話題',
        isPrivate: false
      }
    }, token);

    if (channelResult.errors) {
      console.log('⚠️  創建頻道錯誤:', channelResult.errors[0].message);
    } else {
      console.log('✅ 頻道已創建:', channelResult.data.createChannel);
      channelId = channelResult.data.createChannel.id;
    }
    console.log('');

    // 4. 獲取所有頻道
    console.log('4️⃣  獲取所有頻道');
    const channelsQuery = `
      query GetChannels {
        channels {
          id
          name
          description
          isPrivate
          membersCount
          createdAt
        }
      }
    `;

    const channelsResult = await graphqlRequest(channelsQuery);

    if (channelsResult.errors) {
      console.log('⚠️  查詢錯誤:', channelsResult.errors[0].message);
    } else {
      console.log('✅ 頻道列表:', {
        total: channelsResult.data.channels?.length || 0,
        channels: channelsResult.data.channels?.slice(0, 3)
      });
    }
    console.log('');

    // 5. 加入頻道
    console.log('5️⃣  加入頻道');
    const joinChannelMutation = `
      mutation JoinChannel($channelId: ID!) {
        joinChannel(channelId: $channelId) {
          id
          name
          members {
            username
          }
        }
      }
    `;

    const joinResult = await graphqlRequest(joinChannelMutation, {
      channelId: channelId
    }, token);

    if (joinResult.errors) {
      console.log('⚠️  加入頻道錯誤:', joinResult.errors[0].message);
    } else {
      console.log('✅ 已加入頻道:', {
        channel: joinResult.data.joinChannel?.name,
        members: joinResult.data.joinChannel?.members?.length
      });
    }
    console.log('');

    // 6. 發送消息
    console.log('6️⃣  發送消息');
    const sendMessageMutation = `
      mutation SendMessage($input: SendMessageInput!) {
        sendMessage(input: $input) {
          id
          content
          sender {
            username
            displayName
          }
          channel {
            name
          }
          createdAt
        }
      }
    `;

    const messages = [
      '大家好！我是新加入的成員 👋',
      '有人在討論 GraphQL 嗎？',
      '我最近在學習 WebSocket 訂閱功能'
    ];

    for (const content of messages) {
      const msgResult = await graphqlRequest(sendMessageMutation, {
        input: {
          channelId: channelId,
          content: content
        }
      }, token);

      if (msgResult.errors) {
        console.log('⚠️  發送消息錯誤:', msgResult.errors[0].message);
      } else {
        console.log('✅ 消息已發送:', msgResult.data.sendMessage?.content);
        messageIds.push(msgResult.data.sendMessage?.id);
      }

      // 模擬打字延遲
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('');

    // 7. 獲取頻道消息
    console.log('7️⃣  獲取頻道消息歷史');
    const messagesQuery = `
      query GetMessages($channelId: ID!, $limit: Int) {
        messages(channelId: $channelId, limit: $limit) {
          id
          content
          sender {
            username
            displayName
          }
          createdAt
        }
      }
    `;

    const messagesResult = await graphqlRequest(messagesQuery, {
      channelId: channelId,
      limit: 10
    });

    if (messagesResult.errors) {
      console.log('⚠️  查詢錯誤:', messagesResult.errors[0].message);
    } else {
      console.log('✅ 消息歷史:', {
        total: messagesResult.data.messages?.length || 0,
        messages: messagesResult.data.messages?.map(m => ({
          sender: m.sender.username,
          content: m.content
        }))
      });
    }
    console.log('');

    // 8. 發送直接消息（私訊）
    console.log('8️⃣  發送直接消息');
    const sendDirectMessageMutation = `
      mutation SendDirectMessage($recipientId: ID!, $content: String!) {
        sendDirectMessage(recipientId: $recipientId, content: $content) {
          id
          content
          sender {
            username
          }
          recipient {
            username
          }
          createdAt
        }
      }
    `;

    // 這裡假設有另一個用戶，實際使用時需要有效的用戶 ID
    console.log('⚠️  需要另一個有效的用戶 ID 才能發送私訊');
    console.log('');

    // 9. 搜尋消息
    console.log('9️⃣  搜尋消息');
    const searchMessagesQuery = `
      query SearchMessages($channelId: ID!, $keyword: String!) {
        searchMessages(channelId: $channelId, keyword: $keyword) {
          id
          content
          sender {
            username
          }
          createdAt
        }
      }
    `;

    const searchResult = await graphqlRequest(searchMessagesQuery, {
      channelId: channelId,
      keyword: 'GraphQL'
    });

    if (searchResult.errors) {
      console.log('⚠️  搜尋錯誤:', searchResult.errors[0].message);
    } else {
      console.log('✅ 搜尋結果:', {
        found: searchResult.data.searchMessages?.length || 0,
        messages: searchResult.data.searchMessages
      });
    }
    console.log('');

    // 10. 獲取線上用戶
    console.log('🔟 獲取線上用戶');
    const onlineUsersQuery = `
      query GetOnlineUsers($channelId: ID!) {
        onlineUsers(channelId: $channelId) {
          id
          username
          displayName
          status
        }
      }
    `;

    const onlineResult = await graphqlRequest(onlineUsersQuery, {
      channelId: channelId
    });

    if (onlineResult.errors) {
      console.log('⚠️  查詢錯誤:', onlineResult.errors[0].message);
    } else {
      console.log('✅ 線上用戶:', {
        count: onlineResult.data.onlineUsers?.length || 0,
        users: onlineResult.data.onlineUsers?.map(u => u.username)
      });
    }
    console.log('');

    // 11. WebSocket 訂閱範例（僅顯示代碼）
    console.log('1️⃣1️⃣  WebSocket 訂閱範例');
    console.log('要測試即時訂閱，請使用以下代碼：');
    console.log(`
const { createClient } = require('graphql-ws');
const WebSocket = require('ws');

const client = createClient({
  url: '${WS_URL}',
  webSocketImpl: WebSocket,
  connectionParams: {
    authorization: 'Bearer ${token.substring(0, 20)}...'
  }
});

// 訂閱新消息
const subscription = \`
  subscription OnNewMessage($channelId: ID!) {
    messageAdded(channelId: $channelId) {
      id
      content
      sender {
        username
        displayName
      }
      createdAt
    }
  }
\`;

client.subscribe(
  {
    query: subscription,
    variables: { channelId: '${channelId}' }
  },
  {
    next: (data) => {
      console.log('📨 新消息:', data.data.messageAdded);
    },
    error: (err) => {
      console.error('❌ 訂閱錯誤:', err);
    },
    complete: () => {
      console.log('✅ 訂閱完成');
    }
  }
);
    `);
    console.log('');

    console.log('🎉 測試完成！');
    console.log('\n📊 測試摘要:');
    console.log('  - 用戶 ID:', userId);
    console.log('  - 頻道 ID:', channelId);
    console.log('  - 發送的消息數:', messageIds.length);
    console.log('\n💡 提示:');
    console.log('  - 訪問 http://localhost:4000 使用 GraphQL Playground');
    console.log('  - 使用 WebSocket 訂閱實現即時聊天');
    console.log('  - 支援頻道聊天和直接私訊');

  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
}

// 執行測試
runTests();
