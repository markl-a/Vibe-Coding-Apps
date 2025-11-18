# 🚀 DEX Swap 快速開始指南

## 📦 安裝依賴

```bash
# 進入專案目錄
cd blockchain-apps/defi-projects/dex-swap

# 安裝依賴
npm install
```

## 🔧 環境配置

```bash
# 複製環境變量模板
cp .env.example .env

# 編輯 .env 文件，添加你的配置
```

## 🧪 運行測試

### 運行所有測試
```bash
npm test
```

### 運行測試並查看覆蓋率
```bash
npm run test:coverage
```

### 預期輸出
所有測試應該通過，覆蓋率應該 > 90%

## 📝 編譯合約

```bash
npm run compile
```

## 🚀 部署

### 部署到本地網絡

1. 啟動本地節點:
```bash
npm run node
```

2. 在新終端部署:
```bash
npm run deploy:local
```

### 部署到測試網 (Sepolia)

```bash
# 確保 .env 已配置 SEPOLIA_RPC_URL 和 PRIVATE_KEY
npm run deploy:sepolia
```

## 🤖 AI 輔助工具

### 安全審計
```bash
npm run ai:audit
```

這個工具會:
- 掃描所有智能合約
- 檢查常見安全漏洞
- 提供安全評分和改進建議

### Gas 優化分析
```bash
npm run ai:optimize
```

這個工具會:
- 分析 Gas 使用情況
- 提供優化建議
- 給出優先級排序

### 測試用例生成
```bash
npm run ai:test
```

這個工具會:
- 分析合約函數
- 生成測試用例建議
- 創建測試模板

## 💻 與合約交互

### 使用 Hardhat Console

```bash
npx hardhat console --network localhost
```

```javascript
// 獲取已部署的合約
const factory = await ethers.getContractAt("DEXFactory", "FACTORY_ADDRESS");
const router = await ethers.getContractAt("DEXRouter", "ROUTER_ADDRESS");

// 創建交易對
await factory.createPair(tokenA, tokenB);

// 添加流動性
await router.addLiquidity(
  tokenA,
  tokenB,
  amountA,
  amountB,
  minAmountA,
  minAmountB,
  to,
  deadline
);

// 交換代幣
await router.swapExactTokensForTokens(
  amountIn,
  amountOutMin,
  [tokenA, tokenB],
  to,
  deadline
);
```

## 📊 項目結構

```
dex-swap/
├── contracts/           # 智能合約
│   ├── core/           # 核心合約
│   ├── libraries/      # 庫文件
│   ├── interfaces/     # 接口定義
│   └── mocks/          # 測試用 Mock
├── scripts/            # 部署腳本
├── test/              # 測試文件
├── ai-tools/          # AI 輔助工具
├── deployments/       # 部署記錄
└── artifacts/         # 編譯產物
```

## 🎯 核心功能

### 1. 創建交易對
通過 Factory 合約創建新的代幣交易對

### 2. 添加流動性
提供兩種代幣作為流動性，獲得 LP 代幣

### 3. 移除流動性
燒毀 LP 代幣，取回提供的流動性

### 4. 代幣交換
使用 AMM 機制交換代幣，支持多跳路由

### 5. 價格查詢
查詢代幣對的實時價格和儲備量

## 🔐 安全檢查清單

- [x] 重入攻擊防護 (ReentrancyGuard)
- [x] 整數溢出保護 (Solidity 0.8+)
- [x] 訪問控制
- [x] 滑點保護
- [x] 截止時間檢查
- [x] K 值驗證

## 📈 Gas 優化特性

- [x] 使用 immutable 變量
- [x] 緊湊的變量打包
- [x] 優化的數學運算
- [x] 最小化存儲操作

## 🤝 貢獻指南

1. Fork 本專案
2. 創建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📚 學習資源

- [Uniswap V2 文檔](https://docs.uniswap.org/protocol/V2/introduction)
- [AMM 原理解析](https://ethereum.org/en/developers/docs/defi/)
- [Solidity 最佳實踐](https://consensys.github.io/smart-contract-best-practices/)

## ⚠️ 免責聲明

此專案僅供學習和測試用途，未經專業安全審計，請勿在主網上使用真實資金。

## 📝 授權

MIT License
