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
import { Conversation } from '../types';
import { format } from 'date-fns';

// Mock data
const mockConversations: Conversation[] = [
  {
    id: '1',
    user: {
      id: '2',
      name: 'Alice Chen',
      username: '@alice',
      avatar: 'https://via.placeholder.com/150',
    },
    lastMessage: {
      id: 'm1',
      senderId: '2',
      receiverId: '1',
      content: '你好，有空嗎？',
      timestamp: new Date(Date.now() - 300000),
      read: false,
    },
    unreadCount: 2,
  },
  {
    id: '2',
    user: {
      id: '3',
      name: 'Bob Wang',
      username: '@bob',
      avatar: 'https://via.placeholder.com/150',
    },
    lastMessage: {
      id: 'm2',
      senderId: '1',
      receiverId: '3',
      content: '好的，沒問題！',
      timestamp: new Date(Date.now() - 1800000),
      read: true,
    },
    unreadCount: 0,
  },
  {
    id: '3',
    user: {
      id: '4',
      name: 'Carol Lee',
      username: '@carol',
      avatar: 'https://via.placeholder.com/150',
    },
    lastMessage: {
      id: 'm3',
      senderId: '4',
      receiverId: '1',
      content: '明天見！👋',
      timestamp: new Date(Date.now() - 7200000),
      read: true,
    },
    unreadCount: 0,
  },
];

const ChatScreen = () => {
  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity style={styles.conversationItem}>
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timestamp}>
            {format(item.lastMessage.timestamp, 'HH:mm')}
          </Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            !item.lastMessage.read && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage.content}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mockConversations}
        renderItem={renderConversation}
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
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 78,
  },
});

export default ChatScreen;
