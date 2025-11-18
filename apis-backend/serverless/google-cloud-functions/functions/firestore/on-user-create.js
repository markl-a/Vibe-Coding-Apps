/**
 * Firestore 觸發函數
 * 響應 Firestore 數據庫變更
 */

const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore();

/**
 * 用戶創建觸發器
 * 當新用戶在 Firestore 中創建時觸發
 */
exports.onUserCreate = async (change, context) => {
  console.log('User created event:', {
    userId: context.params.userId,
    eventId: context.eventId,
    timestamp: context.timestamp
  });

  try {
    const userData = change.after.data();
    const userId = context.params.userId;

    console.log('New user data:', userData);

    // 1. 創建用戶配置文檔
    await db.collection('userSettings').doc(userId).set({
      userId,
      theme: 'light',
      language: 'zh-TW',
      notifications: true,
      createdAt: new Date().toISOString()
    });

    // 2. 創建用戶統計文檔
    await db.collection('userStats').doc(userId).set({
      userId,
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      lastActiveAt: new Date().toISOString()
    });

    // 3. 添加到用戶索引（用於搜索）
    await db.collection('userIndex').doc(userId).set({
      userId,
      name: userData.name,
      email: userData.email,
      role: userData.role || 'user',
      searchTerms: generateSearchTerms(userData.name),
      createdAt: new Date().toISOString()
    });

    // 4. 發送歡迎郵件（發布到 Pub/Sub）
    const { PubSub } = require('@google-cloud/pubsub');
    const pubsub = new PubSub();

    await pubsub.topic('notifications').publishMessage({
      json: {
        type: 'email',
        recipient: userData.email,
        template: 'welcome',
        data: {
          name: userData.name
        }
      }
    });

    console.log('User setup completed successfully');
  } catch (error) {
    console.error('Error setting up new user:', error);
    // 記錄錯誤但不拋出，避免函數重試
  }
};

/**
 * 用戶更新觸發器
 * 當用戶數據更新時觸發
 */
exports.onUserUpdate = async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();
  const userId = context.params.userId;

  console.log('User updated:', userId);

  try {
    // 檢查哪些欄位被更新
    const updates = {};

    if (before.name !== after.name) {
      console.log('Name changed:', before.name, '->', after.name);

      // 更新用戶索引
      updates.name = after.name;
      updates.searchTerms = generateSearchTerms(after.name);

      // 更新所有相關的文章作者名稱
      const postsSnapshot = await db.collection('posts')
        .where('authorId', '==', userId)
        .get();

      const postUpdates = postsSnapshot.docs.map(doc =>
        doc.ref.update({ authorName: after.name })
      );

      await Promise.all(postUpdates);
      console.log(`Updated ${postsSnapshot.size} posts`);
    }

    if (before.email !== after.email) {
      console.log('Email changed:', before.email, '->', after.email);
      updates.email = after.email;

      // 發送確認郵件到新地址
    }

    if (before.role !== after.role) {
      console.log('Role changed:', before.role, '->', after.role);
      updates.role = after.role;

      // 記錄角色變更
      await db.collection('auditLogs').add({
        type: 'role_change',
        userId,
        oldRole: before.role,
        newRole: after.role,
        timestamp: new Date().toISOString()
      });
    }

    // 更新用戶索引
    if (Object.keys(updates).length > 0) {
      await db.collection('userIndex').doc(userId).update(updates);
    }

    // 更新最後修改時間
    await change.after.ref.update({
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error handling user update:', error);
  }
};

/**
 * 用戶刪除觸發器
 * 當用戶被刪除時觸發
 */
exports.onUserDelete = async (change, context) => {
  const userData = change.before.data();
  const userId = context.params.userId;

  console.log('User deleted:', userId);

  try {
    // 1. 刪除相關的配置和統計
    await Promise.all([
      db.collection('userSettings').doc(userId).delete(),
      db.collection('userStats').doc(userId).delete(),
      db.collection('userIndex').doc(userId).delete()
    ]);

    // 2. 處理用戶的內容
    // 選項 A: 刪除所有內容
    const postsSnapshot = await db.collection('posts')
      .where('authorId', '==', userId)
      .get();

    const deletePosts = postsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePosts);

    console.log(`Deleted ${postsSnapshot.size} posts`);

    // 選項 B: 保留內容但標記為已刪除用戶
    // await Promise.all(
    //   postsSnapshot.docs.map(doc =>
    //     doc.ref.update({
    //       authorId: null,
    //       authorName: '[已刪除的用戶]'
    //     })
    //   )
    // );

    // 3. 創建審計日誌
    await db.collection('auditLogs').add({
      type: 'user_deleted',
      userId,
      userName: userData.name,
      userEmail: userData.email,
      timestamp: new Date().toISOString()
    });

    // 4. 備份用戶數據
    await db.collection('deletedUsers').doc(userId).set({
      ...userData,
      deletedAt: new Date().toISOString()
    });

    console.log('User cleanup completed');
  } catch (error) {
    console.error('Error cleaning up deleted user:', error);
  }
};

/**
 * 文章創建觸發器
 * 當新文章創建時更新用戶統計
 */
exports.onPostCreate = async (change, context) => {
  try {
    const postData = change.after.data();
    const authorId = postData.authorId;

    // 增加用戶的文章計數
    await db.collection('userStats').doc(authorId).update({
      postsCount: Firestore.FieldValue.increment(1),
      lastActiveAt: new Date().toISOString()
    });

    console.log('User stats updated for new post');
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

/**
 * 輔助函數：生成搜索詞條
 */
function generateSearchTerms(name) {
  const terms = [];
  const normalized = name.toLowerCase();

  // 添加完整名稱
  terms.push(normalized);

  // 添加每個字的開頭
  const words = normalized.split(' ');
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j <= words.length; j++) {
      terms.push(words.slice(i, j).join(' '));
    }
  }

  // 添加首字母縮寫
  if (words.length > 1) {
    terms.push(words.map(w => w[0]).join(''));
  }

  return Array.from(new Set(terms));
}

/**
 * 批次寫入觸發器
 * 當批次操作完成時觸發
 */
exports.onBatchWrite = async (change, context) => {
  console.log('Batch write completed');

  try {
    const batchData = change.after.data();

    // 記錄批次操作
    await db.collection('batchLogs').add({
      batchId: context.params.batchId,
      operation: batchData.operation,
      itemCount: batchData.itemCount,
      status: 'completed',
      completedAt: new Date().toISOString()
    });

    // 發送通知
    if (batchData.notifyOnComplete) {
      const { PubSub } = require('@google-cloud/pubsub');
      const pubsub = new PubSub();

      await pubsub.topic('notifications').publishMessage({
        json: {
          type: 'email',
          recipient: batchData.userEmail,
          template: 'batch-complete',
          data: {
            operation: batchData.operation,
            itemCount: batchData.itemCount
          }
        }
      });
    }
  } catch (error) {
    console.error('Error handling batch write:', error);
  }
};
