# 💾 Decentralized Storage - 去中心化存儲

基於 IPFS 和 Filecoin 的去中心化文件存儲應用，結合 AI 實現智能文件管理和搜索。

## ✨ 核心特性

### 🔐 去中心化存儲功能
- **IPFS 存儲** - 快速的分布式文件存儲
- **Filecoin 備份** - 長期持久化存儲
- **加密文件共享** - 基於 Lit Protocol 的訪問控制
- **版本控制** - 文件版本管理和回滾
- **文件市場** - 去中心化文件交易市場

### 🤖 AI 智能功能
- **智能分類** - AI 自動識別文件類型和內容
- **內容提取** - 從圖片、PDF 等提取文本
- **語義搜索** - 基於內容的智能搜索
- **自動標籤** - AI 生成文件標籤
- **相似文件推薦** - 找到相關文件
- **智能壓縮** - AI 優化文件大小

## 🏗️ 技術架構

### 存儲層
```
Decentralized Storage
├── IPFS - 內容尋址存儲
│   ├── 快速上傳/下載
│   └── 內容去重
├── Filecoin - 持久化存儲
│   ├── 存儲交易
│   └── 檢索交易
└── Arweave - 永久存儲（可選）
```

### 智能合約
```
Smart Contracts
├── FileStorage.sol - 文件元數據管理
├── AccessControl.sol - 訪問權限控制
├── FileMarket.sol - 文件交易市場
└── StorageToken.sol - 存儲支付代幣
```

### AI 服務
```
AI Integration
├── 文件識別 - GPT-4 Vision
├── 內容提取 - OCR + NLP
├── 語義搜索 - Embeddings
└── 智能標籤 - Auto-tagging
```

## 📁 專案結構

```
decentralized-storage/
├── src/
│   ├── components/         # React 組件
│   │   ├── FileUpload.tsx
│   │   ├── FileList.tsx
│   │   ├── FileViewer.tsx
│   │   ├── ShareDialog.tsx
│   │   └── SearchBar.tsx
│   ├── hooks/             # 自定義 Hooks
│   │   ├── useStorage.ts
│   │   ├── useEncryption.ts
│   │   └── useAISearch.ts
│   ├── contracts/         # 智能合約
│   │   ├── FileStorage.sol
│   │   ├── AccessControl.sol
│   │   ├── FileMarket.sol
│   │   └── StorageToken.sol
│   ├── ai/               # AI 模組
│   │   ├── fileClassifier.ts
│   │   ├── contentExtractor.ts
│   │   ├── semanticSearch.ts
│   │   └── autoTagging.ts
│   ├── utils/            # 工具函數
│   │   ├── ipfs.ts
│   │   ├── filecoin.ts
│   │   └── encryption.ts
│   └── App.tsx
├── tests/
├── scripts/
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

# IPFS
VITE_WEB3_STORAGE_TOKEN=your_token
VITE_IPFS_API_URL=https://ipfs.infura.io:5001
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Filecoin
VITE_FILECOIN_API_URL=https://api.node.glif.io

# Lit Protocol
VITE_LIT_NETWORK=serrano

# AI
VITE_OPENAI_API_KEY=your_key

# Contracts
VITE_FILE_STORAGE_CONTRACT=0x...
VITE_ACCESS_CONTROL_CONTRACT=0x...
```

### 3. 部署合約

```bash
npm run compile
npm run deploy
```

### 4. 啟動應用

```bash
npm run dev
```

## 💡 核心功能實現

### 1. 上傳文件到 IPFS

```typescript
import { useStorage } from '@/hooks/useStorage';

function FileUpload() {
  const { uploadFile, isUploading } = useStorage();

  const handleUpload = async (file: File) => {
    // AI 分析文件
    const analysis = await analyzeFile(file);

    // 上傳到 IPFS
    const cid = await uploadFile(file, {
      encrypt: true,
      tags: analysis.tags,
      category: analysis.category,
    });

    console.log('Uploaded:', cid);
  };

  return (
    <input
      type="file"
      onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      disabled={isUploading}
    />
  );
}
```

### 2. 加密文件共享

```typescript
import { useEncryption } from '@/hooks/useEncryption';

function ShareFile({ fileId }: { fileId: string }) {
  const { shareFile } = useEncryption();

  const handleShare = async (recipientAddress: string) => {
    // 使用 Lit Protocol 加密並授權
    await shareFile(fileId, [recipientAddress], {
      expiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7天
      canDownload: true,
      canReshare: false,
    });
  };

  return <ShareDialog onShare={handleShare} />;
}
```

### 3. AI 語義搜索

```typescript
import { useAISearch } from '@/hooks/useAISearch';

function SmartSearch() {
  const { search, results } = useAISearch();

  const handleSearch = async (query: string) => {
    // AI 理解查詢意圖
    const results = await search(query);
    // 返回語義相關的文件
  };

  return (
    <div>
      <input
        type="text"
        placeholder="搜索文件..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {results.map((file) => (
        <FileCard key={file.id} file={file} />
      ))}
    </div>
  );
}
```

### 4. 版本控制

```typescript
import { useStorage } from '@/hooks/useStorage';

function FileVersions({ fileId }: { fileId: string }) {
  const { getVersions, revertToVersion } = useStorage();

  const versions = await getVersions(fileId);

  return (
    <div>
      {versions.map((version) => (
        <div key={version.cid}>
          <span>{version.timestamp}</span>
          <button onClick={() => revertToVersion(fileId, version.cid)}>
            恢復此版本
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 5. 文件市場

```typescript
import { useMarket } from '@/hooks/useMarket';

function FileMarket() {
  const { listFile, buyFile } = useMarket();

  const handleList = async (fileId: string, price: bigint) => {
    await listFile(fileId, price, {
      license: 'personal',
      duration: 'lifetime',
    });
  };

  const handleBuy = async (listingId: bigint) => {
    const receipt = await buyFile(listingId);
    // 獲得文件訪問權限
  };

  return <Marketplace onList={handleList} onBuy={handleBuy} />;
}
```

## 🧪 測試

```bash
# 運行所有測試
npm test

# 測試 UI
npm run test:ui

# 測試合約
npx hardhat test
```

## 📊 智能合約接口

### FileStorage.sol

```solidity
// 上傳文件元數據
function uploadFile(
    string memory cid,
    string memory name,
    uint256 size,
    string[] memory tags
) external returns (uint256);

// 更新文件
function updateFile(uint256 fileId, string memory newCid) external;

// 獲取文件信息
function getFile(uint256 fileId) external view returns (File memory);

// 分享文件
function shareFile(uint256 fileId, address recipient) external;
```

### AccessControl.sol

```solidity
// 授予訪問權限
function grantAccess(
    uint256 fileId,
    address user,
    uint256 expiry
) external;

// 撤銷權限
function revokeAccess(uint256 fileId, address user) external;

// 檢查權限
function hasAccess(uint256 fileId, address user)
    external view returns (bool);
```

## 🤖 AI 功能 API

### 文件分類

```typescript
const analysis = await classifyFile(file);
// {
//   category: 'document',
//   type: 'pdf',
//   confidence: 0.95,
//   tags: ['技術', '區塊鏈', 'Web3']
// }
```

### 內容提取

```typescript
const content = await extractContent(file);
// {
//   text: '文件內容...',
//   images: ['data:...'],
//   metadata: { author: '...', created: '...' }
// }
```

### 語義搜索

```typescript
const results = await semanticSearch('區塊鏈相關文檔');
// 返回語義相關的文件，即使不包含關鍵詞
```

## 🔧 進階功能

### 1. 自動備份到 Filecoin

```typescript
// 配置自動備份策略
await configureBackup({
  provider: 'filecoin',
  schedule: 'daily',
  retention: '1 year',
  replication: 3,
});
```

### 2. CDN 加速

```typescript
// 使用 Cloudflare IPFS Gateway
const url = getIPFSUrl(cid, {
  gateway: 'cloudflare',
  cache: true,
});
```

### 3. 文件加密選項

```typescript
await uploadFile(file, {
  encryption: {
    algorithm: 'AES-256-GCM',
    accessControl: 'lit-protocol',
    conditions: [
      { type: 'wallet', address: '0x...' },
      { type: 'nft', contract: '0x...', tokenId: '1' },
    ],
  },
});
```

## 📈 性能優化

- ✅ 分片上傳大文件
- ✅ 斷點續傳
- ✅ 並行上傳多個文件
- ✅ 圖片自動壓縮
- ✅ 漸進式加載
- ✅ 智能緩存策略

## 🔐 安全特性

- ✅ 端到端加密
- ✅ 零知識證明訪問控制
- ✅ 文件完整性驗證
- ✅ 惡意文件掃描
- ✅ DDoS 防護
- ✅ 隱私保護

## 📚 學習資源

- [IPFS 文檔](https://docs.ipfs.tech/)
- [Filecoin 文檔](https://docs.filecoin.io/)
- [Web3.Storage](https://web3.storage/docs/)
- [Lit Protocol](https://developer.litprotocol.com/)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 授權

MIT License

---

**去中心化存儲的未來** 🚀
