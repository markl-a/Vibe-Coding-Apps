/**
 * useStorage Hook - 去中心化存儲操作
 */

import { useState, useCallback } from 'use';
import { uploadToWeb3Storage, fetchFromIPFS } from '@/utils/ipfs';
import { classifyFile } from '@/ai/fileClassifier';
import { useWriteContract, useReadContract } from 'wagmi';

const CONTRACT_ADDRESS = import.meta.env.VITE_FILE_STORAGE_CONTRACT as `0x${string}`;

export interface UploadOptions {
  encrypt?: boolean;
  tags?: string[];
  category?: string;
  isPublic?: boolean;
}

export function useStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { writeContractAsync } = useWriteContract();

  /**
   * 上傳文件
   */
  const uploadFile = useCallback(
    async (file: File, options: UploadOptions = {}) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // AI 分析文件
        setUploadProgress(10);
        const analysis = await classifyFile(file);

        // 上傳到 IPFS
        setUploadProgress(30);
        const cid = await uploadToWeb3Storage({
          content: '',
          image: file,
        });

        setUploadProgress(60);

        // 記錄到區塊鏈
        const tags = options.tags || analysis.tags;
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: [], // TODO: Add ABI
          functionName: 'uploadFile',
          args: [
            cid,
            file.name,
            BigInt(file.size),
            analysis.type,
            tags,
            options.encrypt || false,
            options.isPublic !== undefined ? options.isPublic : true,
          ],
        });

        setUploadProgress(100);

        return { cid, hash, analysis };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [writeContractAsync]
  );

  /**
   * 批量上傳
   */
  const uploadFiles = useCallback(
    async (files: File[], options: UploadOptions = {}) => {
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file, options);
        results.push(result);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      return results;
    },
    [uploadFile]
  );

  return {
    uploadFile,
    uploadFiles,
    isUploading,
    uploadProgress,
  };
}

/**
 * useFileList - 獲取文件列表
 */
export function useFileList(userAddress: string) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: [],
    functionName: 'getUserFiles',
    args: [userAddress],
  });

  return {
    files: data as bigint[] | undefined,
    isLoading,
    error,
    refetch,
  };
}
