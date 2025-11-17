import React from 'react';
import { View, Text } from 'react-native';

/**
 * React Native Social App 使用範例
 *
 * 展示如何:
 * 1. 管理社交動態
 * 2. 用戶互動 (按讚、評論、分享)
 * 3. 好友系統
 * 4. 通知功能
 */

// MARK: - 測試數據

export const SocialTestData = {
  // 用戶資料
  currentUser: {
    id: '1',
    name: '張小明',
    username: 'xiaoming',
    avatar: 'https://via.placeholder.com/100',
    bio: 'iOS & Android 開發者 | 科技愛好者',
    followers: 1250,
    following: 380,
    posts: 156,
  },

  // 貼文數據
  posts: [
    {
      id: '1',
      userId: '2',
      userName: '李華',
      userAvatar: 'https://via.placeholder.com/50',
      content: '今天天氣真好!出去走走 ☀️',
      images: ['https://via.placeholder.com/400'],
      likes: 245,
      comments: 32,
      shares: 8,
      timestamp: new Date('2025-11-17T10:30:00'),
      isLiked: false,
    },
    {
      id: '2',
      userId: '3',
      userName: '王芳',
      userAvatar: 'https://via.placeholder.com/50',
      content: '分享一下我的新專案 🚀\n使用 React Native 開發的社交應用',
      images: [],
      likes: 189,
      comments: 45,
      shares: 23,
      timestamp: new Date('2025-11-17T09:15:00'),
      isLiked: true,
    },
    {
      id: '3',
      userId: '4',
      userName: '劉強',
      userAvatar: 'https://via.placeholder.com/50',
      content: '早安!新的一週開始了 💪',
      images: ['https://via.placeholder.com/400', 'https://via.placeholder.com/400'],
      likes: 567,
      comments: 89,
      shares: 15,
      timestamp: new Date('2025-11-17T07:00:00'),
      isLiked: true,
    },
  ],

  // 評論數據
  comments: [
    {
      id: '1',
      postId: '1',
      userId: '5',
      userName: '趙敏',
      userAvatar: 'https://via.placeholder.com/40',
      content: '是啊!最近天氣很棒!',
      likes: 12,
      timestamp: new Date('2025-11-17T10:45:00'),
    },
    {
      id: '2',
      postId: '1',
      userId: '6',
      userName: '周杰',
      userAvatar: 'https://via.placeholder.com/40',
      content: '一起去爬山吧!',
      likes: 8,
      timestamp: new Date('2025-11-17T11:00:00'),
    },
  ],

  // 通知數據
  notifications: [
    {
      id: '1',
      type: 'like',
      userId: '7',
      userName: '陳美',
      message: '按讚了你的貼文',
      timestamp: new Date('2025-11-17T12:00:00'),
      isRead: false,
    },
    {
      id: '2',
      type: 'comment',
      userId: '8',
      userName: '林志',
      message: '評論了你的貼文',
      timestamp: new Date('2025-11-17T11:30:00'),
      isRead: false,
    },
    {
      id: '3',
      type: 'follow',
      userId: '9',
      userName: '黃小華',
      message: '開始追蹤你',
      timestamp: new Date('2025-11-17T10:00:00'),
      isRead: true,
    },
  ],
};

// MARK: - 貼文卡片組件

interface PostCardProps {
  post: typeof SocialTestData.posts[0];
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
}) => {
  return (
    <View
      style={{
        backgroundColor: 'white',
        marginBottom: 8,
        padding: 16,
      }}>
      {/* 用戶信息 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#e5e7eb',
          }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{post.userName}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>
            {formatTimestamp(post.timestamp)}
          </Text>
        </View>
      </View>

      {/* 貼文內容 */}
      <Text style={{ fontSize: 15, marginBottom: 12 }}>{post.content}</Text>

      {/* 圖片 */}
      {post.images.length > 0 && (
        <View
          style={{
            aspectRatio: 1,
            backgroundColor: '#f3f4f6',
            borderRadius: 8,
            marginBottom: 12,
          }}
        />
      )}

      {/* 互動按鈕 */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        }}>
        <ActionButton
          icon={post.isLiked ? '❤️' : '🤍'}
          label={`${post.likes}`}
          onPress={onLike}
        />
        <ActionButton icon="💬" label={`${post.comments}`} onPress={onComment} />
        <ActionButton icon="🔄" label={`${post.shares}`} onPress={onShare} />
      </View>
    </View>
  );
};

const ActionButton: React.FC<{
  icon: string;
  label: string;
  onPress?: () => void;
}> = ({ icon, label, onPress }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text style={{ fontSize: 18 }}>{icon}</Text>
    <Text style={{ fontSize: 14, color: '#6b7280', marginLeft: 4 }}>{label}</Text>
  </View>
);

const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}分鐘前`;
  if (hours < 24) return `${hours}小時前`;
  return `${days}天前`;
};

// MARK: - 社交功能工具

export const SocialUtils = {
  // 按讚
  toggleLike: (post: any) => ({
    ...post,
    isLiked: !post.isLiked,
    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
  }),

  // 添加評論
  addComment: (comments: any[], postId: string, comment: any) => {
    return [...comments, { ...comment, postId, timestamp: new Date() }];
  },

  // 分享貼文
  sharePost: (post: any) => ({
    ...post,
    shares: post.shares + 1,
  }),

  // 篩選未讀通知
  getUnreadNotifications: (notifications: any[]) => {
    return notifications.filter(n => !n.isRead);
  },

  // 標記通知為已讀
  markAsRead: (notifications: any[], notificationId: string) => {
    return notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
  },
};

/*
 💡 使用方式:

 1. 顯示貼文列表:
 ```tsx
 import { SocialTestData, PostCard } from './examples/SocialUsageExample';

 const Feed = () => {
   const [posts, setPosts] = useState(SocialTestData.posts);

   return (
     <FlatList
       data={posts}
       renderItem={({ item }) => (
         <PostCard
           post={item}
           onLike={() => {
             setPosts(posts.map(p =>
               p.id === item.id ? SocialUtils.toggleLike(p) : p
             ));
           }}
         />
       )}
     />
   );
 };
 ```

 2. 處理按讚:
 ```tsx
 const handleLike = (post) => {
   const updatedPost = SocialUtils.toggleLike(post);
   updatePost(updatedPost);
 };
 ```

 3. 通知系統:
 ```tsx
 const unreadCount = SocialUtils.getUnreadNotifications(
   SocialTestData.notifications
 ).length;

 <Badge count={unreadCount} />
 ```

 4. 添加評論:
 ```tsx
 const addComment = (postId: string, content: string) => {
   const newComment = {
     id: Date.now().toString(),
     userId: currentUser.id,
     userName: currentUser.name,
     content,
   };
   setComments(SocialUtils.addComment(comments, postId, newComment));
 };
 ```
 */

export default { SocialTestData, PostCard, SocialUtils };
