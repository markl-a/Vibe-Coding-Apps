# 🔐 MultiSig Wallet - 多簽錢包

企業級多重簽名錢包智能合約，適合團隊資金管理和DAO金庫。

## ✨ 功能

- ✅ **多簽驗證** - 需要多個owner批准才能執行交易
- ✅ **交易管理** - 提交、批准、撤銷、執行交易
- ✅ **Owner管理** - 添加/移除owner，修改簽名要求
- ✅ **每日限額** - 小額交易自動通過（在限額內）
- ✅ **緊急凍結** - 緊急情況可凍結錢包
- ✅ **支持ETH和ERC20** - 管理各種資產
- ✅ **防重入攻擊** - ReentrancyGuard保護

## 🚀 快速開始

```bash
npm install
npm test
npm run deploy
```

## 📖 使用範例

### 提交交易
```javascript
await wallet.submitTransaction(recipientAddress, ethers.utils.parseEther("1"), "0x");
```

### 批准交易
```javascript
await wallet.approveTransaction(txIndex);
```

### 執行交易
```javascript
await wallet.executeTransaction(txIndex);
```

### 查看待處理交易
```javascript
const pending = await wallet.getPendingTransactions();
```

## 🔒 安全特性

- ✓ OpenZeppelin ReentrancyGuard
- ✓ 多重簽名驗證
- ✓ 緊急凍結機制
- ✓ 每日限額保護
- ✓ Owner權限管理

## 📊 測試

```bash
npm test
npm run test:coverage
```

測試涵蓋：
- 部署和配置
- 交易提交和執行
- 多簽驗證
- Owner管理
- 每日限額
- 緊急功能

## 🤖 AI工具

```bash
npm run analyze   # 代碼分析
npm run security  # 安全檢查
npm run optimize  # Gas優化
```

[返回 Smart Contracts](../README.md)
