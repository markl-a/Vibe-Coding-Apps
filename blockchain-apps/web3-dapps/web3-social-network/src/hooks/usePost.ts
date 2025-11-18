/**
 * usePost Hook - 貼文相關操作
 */

import { useWriteContract, useReadContract, useWatchContractEvent } from 'wagmi';
import { useState, useEffect } from 'react';
import { uploadToIPFS } from '@/utils/ipfs';
import SocialPostABI from '@/contracts/SocialPost.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_SOCIAL_POST_CONTRACT as `0x${string}`;

export interface Post {
  id: bigint;
  author: string;
  ipfsHash: string;
  tags: string[];
  timestamp: bigint;
  likes: bigint;
  tips: bigint;
  isNFT: boolean;
  isDeleted: boolean;
}

export function usePost() {
  const { writeContractAsync } = useWriteContract();

  /**
   * 創建貼文
   */
  const createPost = async (content: string, tags: string[], image?: File) => {
    try {
      // 上傳到 IPFS
      const ipfsHash = await uploadToIPFS({ content, image });

      // 調用智能合約
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SocialPostABI.abi,
        functionName: 'createPost',
        args: [ipfsHash, tags],
      });

      return hash;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  };

  /**
   * 點讚貼文
   */
  const likePost = async (postId: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SocialPostABI.abi,
        functionName: 'likePost',
        args: [postId],
      });

      return hash;
    } catch (error) {
      console.error('Like post error:', error);
      throw error;
    }
  };

  /**
   * 取消點讚
   */
  const unlikePost = async (postId: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SocialPostABI.abi,
        functionName: 'unlikePost',
        args: [postId],
      });

      return hash;
    } catch (error) {
      console.error('Unlike post error:', error);
      throw error;
    }
  };

  /**
   * 添加評論
   */
  const addComment = async (postId: bigint, content: string) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SocialPostABI.abi,
        functionName: 'addComment',
        args: [postId, content],
      });

      return hash;
    } catch (error) {
      console.error('Add comment error:', error);
      throw error;
    }
  };

  /**
   * 刪除貼文
   */
  const deletePost = async (postId: bigint) => {
    try {
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: SocialPostABI.abi,
        functionName: 'deletePost',
        args: [postId],
      });

      return hash;
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  };

  return {
    createPost,
    likePost,
    unlikePost,
    addComment,
    deletePost,
  };
}

/**
 * 獲取單個貼文
 */
export function useGetPost(postId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SocialPostABI.abi,
    functionName: 'getPost',
    args: [postId],
  });

  return {
    post: data as Post | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 獲取用戶的所有貼文
 */
export function useGetUserPosts(userAddress: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SocialPostABI.abi,
    functionName: 'getUserPosts',
    args: [userAddress],
  });

  return {
    postIds: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 獲取貼文評論
 */
export function useGetComments(postId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SocialPostABI.abi,
    functionName: 'getComments',
    args: [postId],
  });

  return {
    comments: data as any[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * 監聽新貼文事件
 */
export function useWatchNewPosts(onNewPost: (post: any) => void) {
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: SocialPostABI.abi,
    eventName: 'PostCreated',
    onLogs(logs) {
      logs.forEach((log) => {
        onNewPost(log.args);
      });
    },
  });
}

/**
 * 獲取關注列表的貼文
 */
export function useGetFeedPosts(userAddress: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // TODO: 實現獲取關注用戶的貼文邏輯

  return {
    posts,
    isLoading,
  };
}
