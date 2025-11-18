# 🌐 Web3 Social Network - 去中心化社交網絡

用戶完全掌控自己數據的社交平台，結合 AI 智能功能提升用戶體驗。

## ✨ 核心特性

### 🔐 去中心化特性
- **去中心化身份 (DID)** - 使用 Ceramic Network 實現自主身份
- **加密私信** - 基於 Lit Protocol 的端到端加密通信
- **內容 NFT 化** - 將優質內容鑄造為 NFT
- **代幣打賞** - 支持 ERC-20 代幣打賞創作者
- **社群治理** - DAO 投票決定平台規則

### 🤖 AI 輔助功能
- **智能內容審核** - AI 自動檢測不當內容
- **個性化推薦** - 基於用戶興趣的內容推薦
- **自動標籤生成** - AI 為貼文自動生成相關標籤
- **情感分析** - 分析內容情感傾向
- **智能摘要** - 為長文生成簡短摘要
- **翻譯助手** - 多語言即時翻譯

## 🏗️ 技術架構

### 前端技術棧
```
React 18 + TypeScript
├── wagmi - Web3 React Hooks
├── viem - TypeScript Ethereum Library
├── Web3Modal - 錢包連接
├── TanStack Query - 數據獲取
├── Zustand - 狀態管理
├── Framer Motion - 動畫
└── Tailwind CSS - 樣式
```

### 區塊鏈層
```
Ethereum/Polygon
├── Smart Contracts (Solidity)
│   ├── SocialPost.sol - 貼文管理
│   ├── UserProfile.sol - 用戶資料
│   ├── SocialToken.sol - 平台代幣
│   └── TipJar.sol - 打賞系統
└── Hardhat - 開發框架
```

### 去中心化存儲
```
IPFS + Ceramic
├── IPFS - 圖片/影片存儲
├── Ceramic Network - 用戶資料
└── Lit Protocol - 訪問控制
```

### AI 服務
```
AI Integration
├── OpenAI GPT-4 - 內容生成與分析
├── Anthropic Claude - 內容審核
├── Embeddings - 相似內容推薦
└── Sentiment Analysis - 情感分析
```

## 📁 專案結構

```
web3-social-network/
├── src/
│   ├── components/          # React 組件
│   │   ├── Feed.tsx        # 動態流
│   │   ├── PostCard.tsx    # 貼文卡片
│   │   ├── CreatePost.tsx  # 發文組件
│   │   ├── Profile.tsx     # 用戶資料
│   │   ├── WalletConnect.tsx
│   │   └── AIAssistant.tsx # AI 助手
│   ├── hooks/              # 自定義 Hooks
│   │   ├── usePost.ts      # 貼文操作
│   │   ├── useProfile.ts   # 資料管理
│   │   ├── useTip.ts       # 打賞功能
│   │   └── useAI.ts        # AI 功能
│   ├── contracts/          # 智能合約
│   │   ├── SocialPost.sol
│   │   ├── UserProfile.sol
│   │   ├── SocialToken.sol
│   │   └── TipJar.sol
│   ├── ai/                 # AI 模組
│   │   ├── contentModeration.ts
│   │   ├── recommendation.ts
│   │   ├── tagging.ts
│   │   └── translation.ts
│   ├── utils/              # 工具函數
│   │   ├── ipfs.ts
│   │   ├── ceramic.ts
│   │   └── encryption.ts
│   └── App.tsx             # 主應用
├── tests/                  # 測試文件
├── scripts/                # 部署腳本
├── hardhat.config.ts       # Hardhat 配置
├── vite.config.ts          # Vite 配置
└── package.json
```

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 環境配置

創建 `.env` 文件：

```env
# Web3
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_key

# IPFS
VITE_WEB3_STORAGE_TOKEN=your_web3storage_token
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# AI APIs
VITE_OPENAI_API_KEY=your_openai_key
VITE_ANTHROPIC_API_KEY=your_anthropic_key

# Ceramic
VITE_CERAMIC_API_URL=https://ceramic-clay.3boxlabs.com

# Contract Addresses (部署後填入)
VITE_SOCIAL_POST_CONTRACT=0x...
VITE_USER_PROFILE_CONTRACT=0x...
VITE_TIP_JAR_CONTRACT=0x...
```

### 3. 編譯合約

```bash
npm run compile
```

### 4. 部署合約 (本地測試)

```bash
# 啟動本地節點
npx hardhat node

# 在另一個終端部署
npm run deploy:local
```

### 5. 啟動開發服務器

```bash
npm run dev
```

訪問 `http://localhost:5173`

## 💡 核心功能實現

### 1. 連接錢包

```typescript
import { useAccount, useConnect } from 'wagmi';

function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  return (
    <div>
      {isConnected ? (
        <p>已連接: {address}</p>
      ) : (
        <button onClick={() => connect({ connector: connectors[0] })}>
          連接錢包
        </button>
      )}
    </div>
  );
}
```

### 2. 發布貼文 (上鏈 + IPFS)

```typescript
import { usePost } from './hooks/usePost';
import { useAI } from './hooks/useAI';

function CreatePost() {
  const { createPost } = usePost();
  const { moderateContent, generateTags } = useAI();

  const handleSubmit = async (content: string, image?: File) => {
    // AI 內容審核
    const moderation = await moderateContent(content);
    if (!moderation.safe) {
      alert('內容包含不當信息');
      return;
    }

    // AI 生成標籤
    const tags = await generateTags(content);

    // 上傳到 IPFS
    const ipfsHash = await uploadToIPFS({ content, image });

    // 上鏈
    await createPost(ipfsHash, tags);
  };

  return <PostForm onSubmit={handleSubmit} />;
}
```

### 3. AI 智能推薦

```typescript
import { useRecommendations } from './hooks/useAI';

function Feed() {
  const { address } = useAccount();
  const { data: posts } = useRecommendations(address);

  return (
    <div>
      {posts?.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
```

### 4. 代幣打賞

```typescript
import { useTip } from './hooks/useTip';
import { parseEther } from 'viem';

function TipButton({ postId, author }: { postId: bigint; author: string }) {
  const { sendTip, isLoading } = useTip();

  const handleTip = async () => {
    await sendTip({
      postId,
      recipient: author,
      amount: parseEther('0.01'), // 0.01 ETH
    });
  };

  return (
    <button onClick={handleTip} disabled={isLoading}>
      💰 打賞 0.01 ETH
    </button>
  );
}
```

### 5. 加密私信

```typescript
import { encryptMessage, decryptMessage } from './utils/encryption';
import * as LitJsSdk from 'lit-js-sdk';

async function sendPrivateMessage(recipient: string, message: string) {
  const client = new LitJsSdk.LitNodeClient();
  await client.connect();

  // 加密消息
  const { encryptedString, encryptedSymmetricKey } = await encryptMessage(
    message,
    recipient
  );

  // 存儲到 IPFS
  const ipfsHash = await uploadToIPFS({
    encrypted: encryptedString,
    key: encryptedSymmetricKey,
  });

  // 發送通知
  await sendNotification(recipient, ipfsHash);
}
```

## 🧪 測試

```bash
# 運行所有測試
npm test

# 測試 UI 界面
npm run test:ui

# 測試合約
npx hardhat test
```

## 📊 智能合約接口

### SocialPost.sol

```solidity
// 創建貼文
function createPost(string memory ipfsHash, string[] memory tags)
    external returns (uint256);

// 點讚
function likePost(uint256 postId) external;

// 獲取貼文
function getPost(uint256 postId)
    external view returns (Post memory);
```

### TipJar.sol

```solidity
// 打賞
function tip(uint256 postId, address recipient)
    external payable;

// 查詢打賞總額
function getTotalTips(uint256 postId)
    external view returns (uint256);
```

## 🤖 AI 功能 API

### 內容審核

```typescript
const result = await moderateContent(text);
// {
//   safe: true,
//   categories: {
//     hate: 0.001,
//     violence: 0.002,
//     sexual: 0.001
//   }
// }
```

### 智能標籤

```typescript
const tags = await generateTags(content);
// ['區塊鏈', 'DeFi', '以太坊']
```

### 內容摘要

```typescript
const summary = await summarizeContent(longText);
// "這篇文章討論了去中心化金融的未來發展..."
```

## 🔧 配置文件

### hardhat.config.ts

詳見 `hardhat.config.ts`

### vite.config.ts

詳見 `vite.config.ts`

## 📈 性能優化

- ✅ IPFS 內容緩存
- ✅ 使用 TanStack Query 進行數據緩存
- ✅ 虛擬滾動加載大量貼文
- ✅ 圖片懶加載
- ✅ Web3 請求批處理
- ✅ AI 結果緩存

## 🔐 安全考量

- ✅ 智能合約已審計（Slither + Mythril）
- ✅ 前端輸入驗證
- ✅ XSS 防護
- ✅ CSRF 保護
- ✅ 私鑰永不離開用戶設備
- ✅ 加密通信使用 Lit Protocol

## 📚 學習資源

- [wagmi 文檔](https://wagmi.sh/)
- [viem 文檔](https://viem.sh/)
- [IPFS 文檔](https://docs.ipfs.tech/)
- [Ceramic Network](https://developers.ceramic.network/)
- [Lit Protocol](https://developer.litprotocol.com/)
- [OpenAI API](https://platform.openai.com/docs)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

**使用 AI 驅動的 Web3 社交體驗** 🚀
