# 💰 DeFi Projects - 去中心化金融

去中心化金融（DeFi）應用專案集合，展示如何使用 AI 輔助工具構建各種 DeFi 協議和應用。

## 📚 專案列表

### 1. 🔄 [DEX Swap](./dex-swap/) - 去中心化交易所
自動化做市商（AMM）去中心化交易所，類似 Uniswap。

**特性**：
- ✅ 自動化做市商（AMM）機制
- ✅ 流動性池管理
- ✅ 代幣交換功能
- ✅ 滑點保護
- ✅ 流動性提供者獎勵

**技術棧**：
- Solidity + Hardhat
- React + Next.js
- ethers.js + wagmi
- TailwindCSS

### 2. 🏦 [Lending Protocol](./lending-protocol/) - 借貸協議平台
去中心化借貸協議，類似 Aave 或 Compound。

**特性**：
- ✅ 超額抵押借貸
- ✅ 利率模型（穩定/浮動）
- ✅ 清算機制
- ✅ 治理代幣
- ✅ 風險參數管理

**技術棧**：
- Solidity + Foundry
- React + TypeScript
- The Graph（數據索引）
- Chainlink（價格預言機）

### 3. 🌾 [Yield Farming](./yield-farming/) - 流動性挖礦
流動性挖礦和收益聚合器平台。

**特性**：
- ✅ 多池質押
- ✅ 獎勵分配機制
- ✅ 自動複利
- ✅ 收益聚合策略
- ✅ NFT 加成機制

**技術棧**：
- Solidity + Hardhat
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

## 💡 AI 輔助開發技巧

### 使用 AI 生成測試
```
提示詞：為這個 AMM 合約生成完整的單元測試，包括：
- 添加流動性測試
- 代幣交換測試
- 移除流動性測試
- 邊界條件測試
```

### 使用 AI 進行安全審計
```
提示詞：審查這個借貸合約的安全性，重點檢查：
- 重入攻擊
- 整數溢出
- 訪問控制
- 價格操縱
```

### 使用 AI 優化 Gas
```
提示詞：分析這個合約並提供 gas 優化建議
```

## 📊 專案狀態

| 專案 | 狀態 | 測試覆蓋率 | 審計 |
|------|------|-----------|------|
| DEX Swap | ✅ 完成 | 95% | ⏳ 待審計 |
| Lending Protocol | ✅ 完成 | 90% | ⏳ 待審計 |
| Yield Farming | ✅ 完成 | 88% | ⏳ 待審計 |

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
