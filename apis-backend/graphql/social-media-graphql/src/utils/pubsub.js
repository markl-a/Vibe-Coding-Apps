const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

// 事件類型常量
const EVENTS = {
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
  NEW_POST_FROM_FOLLOWING: 'NEW_POST_FROM_FOLLOWING',
  POST_LIKED: 'POST_LIKED',
  COMMENT_ADDED: 'COMMENT_ADDED'
};

module.exports = { pubsub, EVENTS };
