/**
 * IPFS 工具函數
 * 用於上傳和獲取內容
 */

import { create, IPFSHTTPClient } from 'ipfs-http-client';

// IPFS 客戶端配置
let ipfsClient: IPFSHTTPClient | null = null;

/**
 * 獲取或創建 IPFS 客戶端
 */
function getIPFSClient(): IPFSHTTPClient {
  if (!ipfsClient) {
    // 使用公共 IPFS 網關或自己的節點
    ipfsClient = create({
      url: 'https://ipfs.infura.io:5001/api/v0',
      // 或使用本地節點
      // url: 'http://localhost:5001'
    });
  }
  return ipfsClient;
}

/**
 * 上傳內容到 IPFS
 * @param data 要上傳的數據
 * @returns IPFS CID
 */
export async function uploadToIPFS(data: {
  content: string;
  image?: File;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    const client = getIPFSClient();

    // 準備數據
    const postData: any = {
      content: data.content,
      timestamp: Date.now(),
      metadata: data.metadata || {},
    };

    // 如果有圖片，先上傳圖片
    if (data.image) {
      const imageBuffer = await data.image.arrayBuffer();
      const imageResult = await client.add(Buffer.from(imageBuffer));
      postData.image = imageResult.path;
    }

    // 上傳主內容
    const contentString = JSON.stringify(postData);
    const result = await client.add(contentString);

    return result.path; // 返回 CID
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw new Error('Failed to upload to IPFS');
  }
}

/**
 * 從 IPFS 獲取內容
 * @param cid IPFS CID
 * @returns 內容數據
 */
export async function fetchFromIPFS(cid: string): Promise<any> {
  try {
    const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    const url = `${gateway}${cid}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('IPFS fetch error:', error);
    throw new Error('Failed to fetch from IPFS');
  }
}

/**
 * 使用 Web3.Storage 上傳（推薦方案）
 */
export async function uploadToWeb3Storage(data: {
  content: string;
  image?: File;
  metadata?: Record<string, any>;
}): Promise<string> {
  try {
    // 動態導入 Web3.Storage
    const { Web3Storage } = await import('web3.storage');

    const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN;
    if (!token) {
      throw new Error('Web3.Storage token not configured');
    }

    const client = new Web3Storage({ token });

    // 創建文件
    const postData = {
      content: data.content,
      timestamp: Date.now(),
      metadata: data.metadata || {},
      image: null as string | null,
    };

    const files: File[] = [];

    // 添加圖片
    if (data.image) {
      files.push(data.image);
      postData.image = data.image.name;
    }

    // 添加 JSON 文件
    const json = JSON.stringify(postData);
    const jsonBlob = new Blob([json], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], 'post.json', {
      type: 'application/json',
    });
    files.push(jsonFile);

    // 上傳
    const cid = await client.put(files, {
      name: `post-${Date.now()}`,
      wrapWithDirectory: true,
    });

    return `${cid}/post.json`;
  } catch (error) {
    console.error('Web3.Storage upload error:', error);
    // 降級到普通 IPFS
    return uploadToIPFS(data);
  }
}

/**
 * 上傳圖片到 IPFS
 * @param file 圖片文件
 * @returns IPFS CID
 */
export async function uploadImageToIPFS(file: File): Promise<string> {
  try {
    const client = getIPFSClient();
    const buffer = await file.arrayBuffer();
    const result = await client.add(Buffer.from(buffer));
    return result.path;
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Failed to upload image to IPFS');
  }
}

/**
 * 獲取 IPFS 網關 URL
 * @param cid IPFS CID
 * @returns 完整的 URL
 */
export function getIPFSUrl(cid: string): string {
  const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
  return `${gateway}${cid}`;
}

/**
 * 檢查 IPFS 內容是否存在
 * @param cid IPFS CID
 * @returns 是否存在
 */
export async function checkIPFSExists(cid: string): Promise<boolean> {
  try {
    const url = getIPFSUrl(cid);
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * 批量上傳到 IPFS
 * @param files 文件數組
 * @returns CID 數組
 */
export async function batchUploadToIPFS(files: File[]): Promise<string[]> {
  try {
    const client = getIPFSClient();
    const cids: string[] = [];

    for (const file of files) {
      const buffer = await file.arrayBuffer();
      const result = await client.add(Buffer.from(buffer));
      cids.push(result.path);
    }

    return cids;
  } catch (error) {
    console.error('Batch upload error:', error);
    throw new Error('Failed to batch upload to IPFS');
  }
}

/**
 * IPFS 釘選服務（保持內容可用）
 */
export async function pinToIPFS(cid: string): Promise<void> {
  try {
    const client = getIPFSClient();
    await client.pin.add(cid);
  } catch (error) {
    console.error('Pin error:', error);
    // 不拋出錯誤，因為釘選失敗不影響功能
  }
}

/**
 * 取消釘選
 */
export async function unpinFromIPFS(cid: string): Promise<void> {
  try {
    const client = getIPFSClient();
    await client.pin.rm(cid);
  } catch (error) {
    console.error('Unpin error:', error);
  }
}

/**
 * 獲取 IPFS 節點狀態
 */
export async function getIPFSStatus(): Promise<{
  online: boolean;
  peers: number;
}> {
  try {
    const client = getIPFSClient();
    const id = await client.id();
    const peers = await client.swarm.peers();

    return {
      online: true,
      peers: peers.length,
    };
  } catch (error) {
    return {
      online: false,
      peers: 0,
    };
  }
}
