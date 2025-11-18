# ⚡ Flash Loan - 閃電貸協議

## 📋 專案簡介

閃電貸允許用戶在單筆交易內借入大量資金而無需抵押,前提是在交易結束前歸還。

## ✨ 核心功能

### 1. 閃電貸借款
- 單筆交易內借入資金
- 無需抵押
- 必須在同一交易內還款

### 2. 閃電貸提供者
- 提供流動性賺取手續費
- 自動複利
- 風險隔離

### 3. 應用場景
- 套利交易
- 債務再融資
- 自我清算
- 抵押品交換

## 🛠️ 智能合約實現

### FlashLoanProvider.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external returns (bool);
}

contract FlashLoanProvider {
    uint256 public constant FLASH_LOAN_FEE = 9; // 0.09%

    mapping(address => uint256) public poolBalance;

    event FlashLoan(
        address indexed receiver,
        address indexed asset,
        uint256 amount,
        uint256 fee
    );

    function flashLoan(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params
    ) external {
        uint256 availableBalance = poolBalance[asset];
        require(amount <= availableBalance, "Insufficient liquidity");

        uint256 fee = (amount * FLASH_LOAN_FEE) / 10000;

        // 轉移資金給接收者
        IERC20(asset).transfer(receiverAddress, amount);

        // 調用接收者的回調函數
        require(
            IFlashLoanReceiver(receiverAddress).executeOperation(
                asset,
                amount,
                fee,
                params
            ),
            "Flash loan failed"
        );

        // 驗證資金已歸還
        uint256 currentBalance = IERC20(asset).balanceOf(address(this));
        require(
            currentBalance >= availableBalance + fee,
            "Flash loan not repaid"
        );

        poolBalance[asset] = currentBalance;

        emit FlashLoan(receiverAddress, asset, amount, fee);
    }

    function deposit(address asset, uint256 amount) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        poolBalance[asset] += amount;
    }
}
```

## 📊 使用示例

### 套利機器人

```solidity
contract ArbitrageBot is IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 fee,
        bytes calldata params
    ) external override returns (bool) {
        // 1. 在 DEX A 買入
        // 2. 在 DEX B 賣出
        // 3. 歸還閃電貸 + 手續費

        uint256 profit = /* 計算利潤 */;
        require(profit > fee, "No profit");

        // 歸還資金
        IERC20(asset).transfer(msg.sender, amount + fee);
        return true;
    }
}
```

## 🎯 關鍵特性

### 原子性
- 整個操作在單筆交易內完成
- 要麼全部成功,要麼全部回滾

### 無需信任
- 不需要信任借款人
- 智能合約自動執行

### 高效資本利用
- 不需要鎖定抵押品
- 可以借入大額資金

## ⚠️ 風險

### 對協議的風險
1. **重入攻擊**: 必須使用 ReentrancyGuard
2. **價格操縱**: 避免在閃電貸交易內依賴即時價格
3. **合約漏洞**: 需要嚴格審計

### 對用戶的風險
1. **交易失敗**: Gas 費損失
2. **MEV攻擊**: 被搶先交易
3. **流動性風險**: 池子流動性不足

## 🤖 AI 應用

### 套利機會檢測
- 實時監控 DEX 價格差異
- 計算利潤是否覆蓋手續費和 Gas

### 風險評估
- 評估閃電貸交易的風險
- 預測交易成功率

### Gas 優化
- 優化閃電貸交易路徑
- 減少 Gas 消耗

## 📚 知名項目

- **Aave**: 最大的閃電貸提供者
- **dYdX**: 早期閃電貸實現
- **Uniswap V2**: Flash Swaps

## 🎓 學習資源

- [Aave Flash Loan文檔](https://docs.aave.com/developers/guides/flash-loans)
- [閃電貸攻擊案例分析](https://github.com/OffcierCia/DeFi-Developer-Road-Map)

## 💡 實戰技巧

1. **測試**: 在測試網充分測試
2. **模擬**: 使用 Hardhat 的 mainnet forking
3. **監控**: 實時監控套利機會
4. **優化**: 最小化 Gas 消耗
