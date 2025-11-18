/**
 * Pub/Sub 觸發函數
 * 處理 Pub/Sub 訊息
 */

const { PubSub } = require('@google-cloud/pubsub');

const pubsub = new PubSub();

/**
 * 處理訂單事件
 */
async function processOrder(order) {
  console.log('Processing order:', order.id);

  // 模擬訂單處理邏輯
  // 1. 驗證訂單
  // 2. 更新庫存
  // 3. 發送確認郵件
  // 4. 記錄日誌

  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Order processed:', order.id);
}

/**
 * 處理用戶事件
 */
async function processUserEvent(event) {
  console.log('Processing user event:', event.type);

  switch (event.type) {
    case 'user.created':
      console.log('New user created:', event.userId);
      // 發送歡迎郵件
      break;

    case 'user.updated':
      console.log('User updated:', event.userId);
      // 同步到其他系統
      break;

    case 'user.deleted':
      console.log('User deleted:', event.userId);
      // 清理用戶數據
      break;

    default:
      console.log('Unknown user event type:', event.type);
  }
}

/**
 * 處理通知
 */
async function sendNotification(notification) {
  console.log('Sending notification:', notification.type);

  const { type, recipient, title, message } = notification;

  // 根據類型發送不同的通知
  switch (type) {
    case 'email':
      console.log(`Sending email to ${recipient}`);
      // 調用郵件服務
      break;

    case 'sms':
      console.log(`Sending SMS to ${recipient}`);
      // 調用 SMS 服務
      break;

    case 'push':
      console.log(`Sending push notification to ${recipient}`);
      // 調用推送服務
      break;

    default:
      console.log('Unknown notification type:', type);
  }
}

/**
 * 批次處理數據
 */
async function batchProcessData(items) {
  console.log(`Processing batch of ${items.length} items`);

  // 並行處理多個項目
  const results = await Promise.all(
    items.map(async (item, index) => {
      try {
        // 模擬處理邏輯
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          index,
          id: item.id,
          status: 'success',
          processedAt: new Date().toISOString()
        };
      } catch (error) {
        return {
          index,
          id: item.id,
          status: 'failed',
          error: error.message
        };
      }
    })
  );

  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`Batch processing completed: ${successful} success, ${failed} failed`);

  return results;
}

/**
 * 發布訊息到另一個 Topic
 */
async function publishMessage(topicName, data) {
  try {
    const topic = pubsub.topic(topicName);
    const messageId = await topic.publishMessage({
      json: data
    });

    console.log(`Message published to ${topicName}:`, messageId);
    return messageId;
  } catch (error) {
    console.error('Error publishing message:', error);
    throw error;
  }
}

/**
 * 主函數 - Pub/Sub 觸發器
 */
exports.processPubSubMessage = async (message, context) => {
  console.log('Pub/Sub event:', {
    messageId: message.messageId,
    publishTime: message.publishTime,
    attributes: message.attributes
  });

  try {
    // 解析訊息數據
    const data = message.data
      ? JSON.parse(Buffer.from(message.data, 'base64').toString())
      : {};

    console.log('Message data:', data);

    // 獲取訊息類型（從屬性或數據中）
    const messageType = message.attributes?.type || data.type;

    if (!messageType) {
      console.error('Message type not specified');
      return;
    }

    // 根據訊息類型路由處理
    switch (messageType) {
      case 'order':
        await processOrder(data);
        break;

      case 'user-event':
        await processUserEvent(data);
        break;

      case 'notification':
        await sendNotification(data);
        break;

      case 'batch-process':
        const results = await batchProcessData(data.items || []);
        // 發布處理結果
        await publishMessage('batch-results', {
          batchId: data.batchId,
          results
        });
        break;

      default:
        console.log('Unknown message type:', messageType);
    }

    console.log('Message processed successfully');
  } catch (error) {
    console.error('Error processing message:', error);

    // 根據錯誤類型決定是否重試
    if (error.message.includes('temporary')) {
      // 暫時性錯誤，拋出以觸發重試
      throw error;
    } else {
      // 永久性錯誤，發送到死信隊列
      console.error('Permanent error, sending to DLQ');
      // 在生產環境中，這裡應該發送到死信隊列
    }
  }
};

/**
 * 示例：訂閱多個 Topics 的函數
 */
exports.multiTopicProcessor = async (message, context) => {
  const topic = context.resource.name.split('/').pop();

  console.log(`Processing message from topic: ${topic}`);

  // 根據來源 topic 進行不同處理
  switch (topic) {
    case 'orders':
      await processOrder(JSON.parse(Buffer.from(message.data, 'base64').toString()));
      break;

    case 'notifications':
      await sendNotification(JSON.parse(Buffer.from(message.data, 'base64').toString()));
      break;

    default:
      console.log('Unknown topic:', topic);
  }
};
