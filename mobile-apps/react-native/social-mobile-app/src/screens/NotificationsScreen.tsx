import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification } from '../types';
import { format } from 'date-fns';

// Mock data
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: {
      id: '2',
      name: 'Alice Chen',
      username: '@alice',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '按讚了你的貼文',
    timestamp: new Date(Date.now() - 600000),
    read: false,
  },
  {
    id: '2',
    type: 'comment',
    user: {
      id: '3',
      name: 'Bob Wang',
      username: '@bob',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '評論了你的貼文：「很棒的分享！」',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
  },
  {
    id: '3',
    type: 'follow',
    user: {
      id: '4',
      name: 'Carol Lee',
      username: '@carol',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '開始追蹤你',
    timestamp: new Date(Date.now() - 7200000),
    read: true,
  },
  {
    id: '4',
    type: 'message',
    user: {
      id: '2',
      name: 'Alice Chen',
      username: '@alice',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '傳送了一則訊息給你',
    timestamp: new Date(Date.now() - 10800000),
    read: true,
  },
];

const NotificationsScreen = () => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#FF3B30' };
      case 'comment':
        return { name: 'chatbubble', color: '#007AFF' };
      case 'follow':
        return { name: 'person-add', color: '#34C759' };
      case 'message':
        return { name: 'mail', color: '#FF9500' };
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.read && styles.unreadNotification,
        ]}
      >
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />

        <View style={styles.iconContainer}>
          <Ionicons name={icon.name as any} size={16} color={icon.color} />
        </View>

        <View style={styles.notificationContent}>
          <Text style={styles.notificationText}>
            <Text style={styles.userName}>{item.user.name}</Text>{' '}
            {item.content}
          </Text>
          <Text style={styles.timestamp}>
            {format(item.timestamp, 'yyyy/MM/dd HH:mm')}
          </Text>
        </View>

        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={mockNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  unreadNotification: {
    backgroundColor: '#f0f8ff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  iconContainer: {
    position: 'absolute',
    left: 42,
    top: 38,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12,
  },
  notificationText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  userName: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 68,
  },
});

export default NotificationsScreen;
