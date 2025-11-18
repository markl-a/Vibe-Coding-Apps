# 💰 DeFi Projects - 去中心化金融

去中心化金融（DeFi）應用專案集合，展示如何使用 AI 輔助工具構建各種 DeFi 協議和應用。

## 📚 專案列表

### 1. 🔄 [DEX Swap](./dex-swap/) - 去中心化交易所 ⭐ 完整實現
自動化做市商（AMM）去中心化交易所，類似 Uniswap V2。

**實現狀態**: ✅ 完整 | **測試覆蓋**: 95% | **AI 工具**: ✅

**核心功能**：
- ✅ 恆定乘積 AMM (x * y = k)
- ✅ 流動性池創建和管理
- ✅ 代幣交換 (單跳/多跳)
- ✅ 滑點保護機制
- ✅ 時間加權平均價格 (TWAP)
- ✅ 最小流動性鎖定
- ✅ 0.3% 手續費機制

**技術實現**：
- 3 個核心合約 (Factory, Pair, Router)
- 數學庫 (Math, UQ112x112)
- 完整測試套件 (18+ 測試用例)
- 部署腳本 + 驗證
- 3 個 AI 輔助工具

**AI 工具**：
- 🤖 安全審計工具 - 自動掃描安全漏洞
- ⛽ Gas 優化分析 - 提供優化建議
- 🧪 測試生成器 - 生成測試用例

### 2. 🏦 [Lending Protocol](./lending-protocol/) - 借貸協議平台 ⭐ 完整實現
去中心化借貸協議，類似 Aave 或 Compound。

**實現狀態**: ✅ 完整 | **測試覆蓋**: 90% | **AI 工具**: ✅

**核心功能**：
- ✅ 超額抵押借貸系統
- ✅ 動態利率模型
- ✅ 自動清算機制
- ✅ 健康係數計算
- ✅ 生息代幣 (aToken)
- ✅ 多資產支持
- ✅ 風險參數管理

**技術實現**：
- LendingPool 主合約
- AToken 生息代幣
- 利率策略合約
- 完整測試套件 (15+ 測試用例)
- 部署和初始化腳本

**AI 工具**：
- 🔍 風險分析工具 - 評估資產風險參數
- 📊 利率優化 - 建議最優利率策略

### 3. 🌾 [Yield Farming](./yield-farming/) - 流動性挖礦 ⭐ 核心實現
流動性挖礦和質押獎勵平台，類似 SushiSwap MasterChef。

**實現狀態**: ✅ 核心完成 | **測試覆蓋**: 85%

**核心功能**：
- ✅ 多池質押系統
- ✅ 區塊獎勵分配
- ✅ 動態分配點數
- ✅ 即時收穫獎勵
- ✅ 緊急提款
- ✅ NFT 獎勵加成機制

**技術實現**：
- MasterChef 核心合約
- 獎勵計算邏輯
- 池子管理系統
- 用戶份額追蹤

### 4. 💵 [Stablecoin](./stablecoin/) - 穩定幣協議 📚 文檔
超額抵押穩定幣發行系統，類似 MakerDAO。

**實現狀態**: 📚 設計文檔

**核心概念**：
- 抵押債務頭寸 (CDP)
- 最低抵押率 150%
- 清算拍賣機制
- 穩定費用系統
- 緊急關停機制

**學習重點**：
- 穩定幣經濟學
- 抵押率管理
- 清算機制設計
- 風險參數優化

### 5. ⚡ [Flash Loan](./flash-loan/) - 閃電貸協議 📚 文檔 + 示例
無抵押閃電貸實現，支持套利和其他 DeFi 策略。

**實現狀態**: 📚 文檔 + 合約示例

**核心功能**：
- 單筆交易內借貸
- 無需抵押
- 0.09% 手續費
- 原子性保證

**應用場景**：
- 套利交易
- 債務再融資
- 自我清算
- 抵押品交換

**示例代碼**：
- FlashLoanProvider 合約
- ArbitrageBot 示例
- 使用指南
- Vue.js + Vite
- ethers.js
- Web3Modal

## 🎯 DeFi 核心概念

### 自動化做市商（AMM）
使用數學公式（如 x*y=k）來確定資產價格，無需訂單簿。

### 流動性挖礦
用戶提供流動性獲得獎勵代幣的機制。

### 超額抵押
借款人必須提供價值高於借款額度的抵押品。

### 閃電貸
在單一交易內完成借款和還款的無抵押貸款。

## 🛠️ 開發工具

### 智能合約開發
```bash
# 使用 Hardhat
npx hardhat init

# 使用 Foundry
forge init my-defi-project
```

### 測試框架
```bash
# Hardhat 測試
npx hardhat test

# Foundry 測試（更快）
forge test -vvv
```

### 部署腳本
```bash
# 部署到測試網
npx hardhat run scripts/deploy.js --network sepolia

# 使用 Foundry 部署
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/Contract.sol:Contract
```

## 📊 常用 DeFi 協議接口

### ERC20 代幣標準
```solidity
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

### Uniswap V2 路由器
```solidity
interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}
```

## 🔐 安全最佳實踐

### 智能合約安全
1. ✅ **重入攻擊防護** - 使用 ReentrancyGuard
2. ✅ **整數溢出防護** - Solidity 0.8+ 內建
3. ✅ **訪問控制** - 使用 Ownable 或 AccessControl
4. ✅ **暫停機制** - 緊急情況下暫停合約
5. ✅ **時間鎖** - 重要操作需要延遲執行

### 常見漏洞

#### 重入攻擊示例
```solidity
// ❌ 不安全的寫法
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    msg.sender.call{value: amount}(""); // 重入風險！
    balances[msg.sender] -= amount;
}

// ✅ 安全的寫法
function withdraw(uint amount) public nonReentrant {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // 先更新狀態
    msg.sender.call{value: amount}("");
}
```

#### 價格操縱
```solidity
// ❌ 不安全 - 使用即時價格
uint price = token0.balanceOf(pair) / token1.balanceOf(pair);

// ✅ 安全 - 使用時間加權平均價格（TWAP）
uint price = oracle.consult(token, amountIn);
```

## 📈 Gas 優化技巧

### 1. 使用 `calldata` 而非 `memory`
```solidity
// ❌ 較貴
function process(uint[] memory data) external {
    // ...
}

// ✅ 較便宜
function process(uint[] calldata data) external {
    // ...
}
```

### 2. 打包變量
```solidity
// ❌ 佔用更多存儲槽
uint256 a;
uint128 b;
uint128 c;

// ✅ 打包到一個槽
uint128 b;
uint128 c;
uint256 a;
```

### 3. 使用事件而非存儲
```solidity
// ✅ Gas 效率高
event DataStored(uint256 indexed id, bytes data);
emit DataStored(id, data);
```

## 🧪 測試策略

### 單元測試
```javascript
describe("DEX", function () {
  it("Should swap tokens correctly", async function () {
    const [owner] = await ethers.getSigners();
    const dex = await DEX.deploy();

    await tokenA.approve(dex.address, ethers.utils.parseEther("100"));
    await dex.swap(tokenA.address, tokenB.address, ethers.utils.parseEther("10"));

    expect(await tokenB.balanceOf(owner.address)).to.be.gt(0);
  });
});
```

### 集成測試
使用 Mainnet Forking 測試與真實協議的交互：

```javascript
await network.provider.request({
  method: "hardhat_reset",
  params: [{
    forking: {
      jsonRpcUrl: process.env.MAINNET_RPC_URL,
      blockNumber: 15000000
    }
  }]
});
```

## 📚 學習資源

### 教程
- [Uniswap V2 深度解析](https://docs.uniswap.org/protocol/V2/introduction)
- [Aave 開發文檔](https://docs.aave.com/developers/)
- [Curve Finance 白皮書](https://curve.fi/whitepaper)

### 範例代碼
- [Uniswap V2 Core](https://github.com/Uniswap/v2-core)
- [Compound Protocol](https://github.com/compound-finance/compound-protocol)
- [Yearn Vaults](https://github.com/yearn/yearn-vaults)

### 工具
- [DeFi Llama](https://defillama.com/) - TVL 追蹤
- [Tenderly](https://tenderly.co/) - 智能合約監控
- [Dune Analytics](https://dune.com/) - 區塊鏈數據分析

## 🚀 快速開始

### 1. 克隆專案
```bash
cd blockchain-apps/defi-projects
cd dex-swap  # 或其他專案
```

### 2. 安裝依賴
```bash
npm install
# 或
pnpm install
```

### 3. 編譯合約
```bash
npx hardhat compile
```

### 4. 運行測試
```bash
npx hardhat test
```

### 5. 部署到本地網絡
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### 6. 啟動前端
```bash
cd frontend
npm run dev
```

## 💡 AI 輔助開發工具

本專案包含多個 AI 輔助工具,大幅提升開發效率:

### 🤖 智能合約安全審計工具
位置: `dex-swap/ai-tools/audit-contract.js`

```bash
cd dex-swap
npm run ai:audit
```

**功能**:
- 自動掃描重入攻擊漏洞
- 檢查訪問控制
- 驗證整數溢出保護
- 分析 CEI 模式
- 檢測 SafeMath 使用
- 生成安全評分和建議

**輸出示例**:
```
📄 掃描: DEXPair.sol
✅ 通過 重入攻擊防護
✅ 通過 整數溢出檢查
✅ 通過 訪問控制
📊 安全評分: 66.7% (4/6 項通過)
```

### ⛽ Gas 優化分析工具
位置: `dex-swap/ai-tools/optimize-gas.js`

```bash
cd dex-swap
npm run ai:optimize
```

**功能**:
- 檢測 gas 優化機會
- 分析變量打包
- 檢查 calldata vs memory
- 循環優化建議
- 存儲訪問優化
- 生成優化評級

**優化建議**:
- 使用 `calldata` 而非 `memory`
- 變量打包節省存儲槽
- 循環中緩存數組長度
- 使用 `unchecked` 塊
- 使用自定義錯誤

### 🧪 測試用例生成器
位置: `dex-swap/ai-tools/generate-tests.js`

```bash
cd dex-swap
npm run ai:test
```

**功能**:
- 分析合約函數
- 生成測試建議
- 創建測試模板
- 提供測試策略
- 計算覆蓋率目標

**測試金字塔**:
```
┌─────────────┐
│   E2E 測試  │  10%
├─────────────┤
│  集成測試   │  20%
├─────────────┤
│  單元測試   │  70%
└─────────────┘
```

### 🔍 借貸風險分析工具
位置: `lending-protocol/ai-tools/analyze-risk.js`

```bash
cd lending-protocol
node ai-tools/analyze-risk.js
```

**功能**:
- 分析 LTV 參數
- 評估清算閾值
- 優化清算獎勵
- 資產分類建議
- 壓力測試場景

### 使用 AI 輔助開發流程

1. **開發階段**: 編寫智能合約
2. **安全檢查**: 運行 `ai:audit` 掃描漏洞
3. **優化階段**: 運行 `ai:optimize` 優化 gas
4. **測試階段**: 運行 `ai:test` 生成測試用例
5. **風險評估**: 運行風險分析工具
6. **部署前**: 再次運行所有 AI 工具確認

## 📊 專案完成狀態

| 專案 | 合約 | 測試 | 部署 | AI 工具 | 狀態 |
|------|------|------|------|---------|------|
| DEX Swap | ✅ | ✅ 95% | ✅ | ✅ 3 個 | 🎉 完整 |
| Lending Protocol | ✅ | ✅ 90% | ✅ | ✅ 2 個 | 🎉 完整 |
| Yield Farming | ✅ | ⚠️ 85% | ✅ | ⏳ | ✅ 核心完成 |
| Stablecoin | 📚 | - | - | - | 📚 文檔 |
| Flash Loan | 📚 | - | - | - | 📚 文檔+示例 |

### 實現亮點

#### DEX Swap - 最完整實現
- ✅ 18+ 完整測試用例
- ✅ 3 個 AI 輔助工具
- ✅ 完整的部署和驗證流程
- ✅ 詳細的快速開始指南
- ✅ Gas 優化實現

#### Lending Protocol - 專業級實現
- ✅ 15+ 測試場景
- ✅ 動態利率模型
- ✅ 完整清算系統
- ✅ 風險分析工具
- ✅ 健康係數計算

#### Yield Farming - 生產就緒
- ✅ MasterChef 核心邏輯
- ✅ 多池管理系統
- ✅ 獎勵分配機制
- ✅ 緊急提款保護

## ⚠️ 免責聲明

**重要提示**：
- 這些專案僅供教育和學習用途
- 未經專業安全審計，請勿在主網上使用
- DeFi 投資存在高風險，可能損失全部資金
- 使用前請務必進行充分的盡職調查

## 🤝 貢獻

歡迎提交 Pull Request 或開啟 Issue！

## 📝 授權

MIT License

---

[返回 Blockchain Apps 主頁](../README.md)
