# 🎨 ERC721 NFT Collection

完整的 ERC721 NFT 合約實現，包含白名單、版稅、reveal 機制等進階功能。

## ✨ 功能特性

### 核心功能
- ✅ **ERC721 標準** - 完整的 NFT 標準實現
- ✅ **ERC721Enumerable** - 可枚舉的 token 列表
- ✅ **ERC721URIStorage** - 靈活的 metadata 存儲
- ✅ **ERC2981 版稅** - NFT 版稅標準支持

### 進階功能
- ✅ **白名單鑄造** - 使用 Merkle Tree 驗證
- ✅ **公開鑄造** - 支持公開銷售
- ✅ **批量鑄造** - 一次鑄造多個 NFT
- ✅ **Reveal 機制** - 延遲揭示 metadata
- ✅ **可暫停** - 緊急情況可暫停交易
- ✅ **可銷毀** - 允許 holder 銷毀 NFT

### 安全特性
- ✅ **ReentrancyGuard** - 防重入攻擊
- ✅ **Ownable** - 所有權管理
- ✅ **Pausable** - 可暫停機制
- ✅ **Custom Errors** - Gas 優化的錯誤處理

## 📋 合約參數

```solidity
MAX_SUPPLY = 10,000        // 最大供應量
MAX_PER_WALLET = 5         // 每個錢包最多鑄造數量
WHITELIST_PRICE = 0.05 ETH // 白名單價格
PUBLIC_PRICE = 0.08 ETH    // 公開售價
DEFAULT_ROYALTY = 5%       // 預設版稅 (500/10000)
```

## 🚀 快速開始

### 安裝依賴

```bash
cd blockchain-apps/smart-contracts/erc721-nft
npm install
```

### 編譯合約

```bash
npm run compile
```

### 運行測試

```bash
npm test

# 測試覆蓋率
npm run test:coverage
```

### 部署合約

```bash
# 本地網絡
npm run node  # 在另一個終端
npm run deploy

# Sepolia 測試網
npm run deploy:sepolia

# 主網 (請謹慎!)
npm run deploy:mainnet
```

## 📝 使用指南

### 1. 設置白名單

首先，準備白名單地址列表：

```javascript
// 創建 whitelist.json
{
  "addresses": [
    "0x1234...",
    "0x5678...",
    "0x9abc..."
  ]
}
```

生成 Merkle Root：

```bash
npm run merkle
```

在合約中設置 Merkle Root：

```javascript
await nft.setMerkleRoot("0x...");
```

### 2. 啟用鑄造

```javascript
// 啟用白名單鑄造
await nft.toggleWhitelistMint();

// 啟用公開鑄造
await nft.togglePublicMint();
```

### 3. 白名單鑄造

```javascript
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

// 獲取 proof
const leaf = keccak256(userAddress);
const proof = merkleTree.getHexProof(leaf);

// 鑄造
await nft.whitelistMint(quantity, proof, {
  value: ethers.utils.parseEther("0.05").mul(quantity)
});
```

### 4. 公開鑄造

```javascript
await nft.publicMint(quantity, {
  value: ethers.utils.parseEther("0.08").mul(quantity)
});
```

### 5. Reveal NFTs

```javascript
// 上傳 metadata 到 IPFS
// 更新 baseURI
await nft.setBaseURI("ipfs://QmYourCID/");

// Reveal
await nft.reveal();
```

### 6. 設置版稅

```javascript
// 設置預設版稅 (5%)
await nft.setDefaultRoyalty(receiverAddress, 500);

// 設置特定 token 版稅 (10%)
await nft.setTokenRoyalty(tokenId, receiverAddress, 1000);
```

## 🧪 測試

測試覆蓋所有主要功能：

- ✅ 部署和初始化
- ✅ 白名單鑄造（有效/無效 proof）
- ✅ 公開鑄造
- ✅ Owner 鑄造
- ✅ Token URI 和 Reveal
- ✅ 版稅 (ERC2981)
- ✅ 枚舉功能
- ✅ 銷毀功能
- ✅ 暫停機制
- ✅ 提款功能
- ✅ 管理員功能

運行測試：

```bash
npm test
```

測試輸出範例：
```
  MyNFT
    Deployment
      ✓ Should set the right owner
      ✓ Should have correct name and symbol
      ✓ Should have correct initial state
    Whitelist Minting
      ✓ Should mint with valid proof
      ✓ Should fail with invalid proof
      ✓ Should enforce max per wallet
    ...

  100 passing (5s)
```

## 🤖 AI 工具

### 1. 合約分析

```bash
npm run analyze
```

分析合約結構、文檔和最佳實踐。

### 2. 安全檢查

```bash
npm run security
```

檢查常見安全漏洞。

### 3. Gas 優化

```bash
npm run optimize
```

識別 gas 優化機會。

### 4. Metadata 生成器

```bash
npm run metadata
```

使用 AI 工具生成 NFT metadata，包括：
- 批量生成 metadata
- 稀有度計算
- 屬性分配
- OpenSea 格式驗證

## 📊 Gas 報告

啟用 gas 報告：

```bash
REPORT_GAS=true npm test
```

典型 gas 消耗：

| 操作 | Gas 消耗 |
|------|----------|
| 部署合約 | ~3,500,000 |
| 白名單鑄造 (1個) | ~150,000 |
| 公開鑄造 (1個) | ~120,000 |
| 批量鑄造 (5個) | ~450,000 |
| Transfer | ~80,000 |
| Reveal | ~45,000 |

## 🔐 安全考慮

### 審計建議

在主網部署前：

1. ✅ 完整的單元測試
2. ✅ Gas 優化審查
3. ✅ 安全工具掃描（Slither, Mythril）
4. ✅ 專業審計（推薦）
5. ✅ 測試網充分測試

### 常見陷阱

- ⚠️ 確保 Merkle Root 正確設置
- ⚠️ 在啟用鑄造前測試白名單
- ⚠️ Reveal 前確保 metadata 已上傳
- ⚠️ 謹慎管理 Owner 權限
- ⚠️ 設置合理的 gas limit

## 📚 智能合約架構

```
MyNFT.sol
├── ERC721 (基礎 NFT 功能)
├── ERC721URIStorage (Metadata 存儲)
├── ERC721Enumerable (Token 枚舉)
├── ERC721Burnable (可銷毀)
├── ERC2981 (版稅標準)
├── Ownable (所有權管理)
├── Pausable (暫停機制)
└── ReentrancyGuard (防重入)
```

## 🌐 IPFS 集成

### 上傳 Metadata

使用 Pinata 或其他 IPFS 服務：

```javascript
// 1. 生成 metadata
npm run metadata

// 2. 上傳到 IPFS
// 使用 Pinata API 或手動上傳

// 3. 獲取 CID
const CID = "QmYourCID";

// 4. 更新合約
await nft.setBaseURI(`ipfs://${CID}/`);
```

### Metadata 格式

```json
{
  "name": "My NFT #1",
  "description": "An awesome NFT",
  "image": "ipfs://QmImage/1.png",
  "external_url": "https://mynft.com/1",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    },
    {
      "trait_type": "Character",
      "value": "Robot"
    }
  ],
  "properties": {
    "rarity_score": 15.5
  }
}
```

## 🎯 部署檢查清單

- [ ] 合約編譯成功
- [ ] 所有測試通過
- [ ] Gas 優化審查完成
- [ ] 安全掃描無嚴重問題
- [ ] Metadata 準備完成並上傳 IPFS
- [ ] 白名單準備並生成 Merkle Root
- [ ] 部署腳本參數確認
- [ ] 測試網部署並測試
- [ ] 準備充足的 ETH 用於 gas
- [ ] Owner 錢包安全
- [ ] 驗證合約源碼
- [ ] 更新前端配置

## 🔧 常見問題

### Q: 如何修改供應量？
A: 修改合約中的 `MAX_SUPPLY` 常量後重新部署。

### Q: 可以在部署後修改價格嗎？
A: 當前版本價格是常量。如需動態價格，需修改合約。

### Q: 如何處理 gas 過高？
A: 運行 `npm run optimize` 查看優化建議。

### Q: Reveal 後可以改回去嗎？
A: 不可以，reveal 是單向操作。

### Q: 支持哪些市場？
A: 支持 OpenSea、Rarible 等所有支持 ERC721 和 ERC2981 的市場。

## 📖 相關資源

- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC2981 Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/4.x/erc721)
- [OpenSea Metadata Standards](https://docs.opensea.io/docs/metadata-standards)
- [Merkle Tree Whitelist Guide](https://medium.com/@ItsCuzzo/using-merkle-trees-for-nft-whitelists-523b58ada3f9)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

---

**⚠️ 重要提醒：這是教育和演示用途的代碼。主網部署前請進行專業審計！**

[返回 Smart Contracts](../README.md)
