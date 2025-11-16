const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

// 事件類型常量
const EVENTS = {
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  USER_TYPING: 'USER_TYPING',
  ROOM_UPDATED: 'ROOM_UPDATED'
};

module.exports = { pubsub, EVENTS };
