import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { format } from 'date-fns';

// Mock data
const mockPosts: Post[] = [
  {
    id: '1',
    userId: '2',
    user: {
      id: '2',
      name: 'Alice Chen',
      username: '@alice',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '今天天氣真好！☀️ 出門散步去～',
    likes: 24,
    comments: 5,
    timestamp: new Date(Date.now() - 3600000),
    liked: false,
  },
  {
    id: '2',
    userId: '3',
    user: {
      id: '3',
      name: 'Bob Wang',
      username: '@bob',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '剛完成了一個新專案！🎉 感謝團隊的努力',
    image: 'https://via.placeholder.com/400x300',
    likes: 56,
    comments: 12,
    timestamp: new Date(Date.now() - 7200000),
    liked: true,
  },
  {
    id: '3',
    userId: '4',
    user: {
      id: '4',
      name: 'Carol Lee',
      username: '@carol',
      avatar: 'https://via.placeholder.com/150',
    },
    content: '分享一個很棒的開發技巧... 使用 AI 輔助開發真的可以大幅提升效率！',
    likes: 89,
    comments: 23,
    timestamp: new Date(Date.now() - 10800000),
    liked: false,
  },
];

const FeedScreen = () => {
  const [posts, setPosts] = React.useState<Post[]>(mockPosts);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleLike = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.username}>{item.user.username}</Text>
        </View>
        <Text style={styles.timestamp}>
          {format(item.timestamp, 'HH:mm')}
        </Text>
      </View>

      <Text style={styles.content}>{item.content}</Text>

      {item.image && (
        <Image source={{ uri: item.image }} style={styles.postImage} />
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Ionicons
            name={item.liked ? 'heart' : 'heart-outline'}
            size={24}
            color={item.liked ? '#FF3B30' : '#666'}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  postCard: {
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  username: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
});

export default FeedScreen;
