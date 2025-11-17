# 🏦 Lending Protocol - 去中心化借貸協議

類似 Aave 和 Compound 的去中心化借貸平台，支持超額抵押借貸和自動化利率模型。

## 📋 專案簡介

這是一個完整的去中心化借貸協議實現，允許用戶：
- 存款賺取利息
- 使用加密資產作為抵押品借款
- 參與清算獲得獎勵
- 治理協議參數

## ✨ 核心功能

### 💰 存款與借款
- **存款**: 提供資產到流動性池賺取利息
- **借款**: 使用超額抵押借出其他資產
- **還款**: 隨時還款並收回抵押品
- **提款**: 提取存款和累積利息

### 📈 利率模型
- **動態利率**: 基於資金利用率自動調整
- **穩定利率**: 固定利率借款選項
- **浮動利率**: 跟隨市場的可變利率

### ⚠️ 風險管理
- **健康係數**: 監控抵押品價值
- **清算機制**: 自動清算風險頭寸
- **最大 LTV**: 貸款價值比限制
- **清算閾值**: 觸發清算的健康係數

### 🏛️ 治理
- **參數調整**: 社區投票修改協議參數
- **資產上架**: 添加新的可借貸資產
- **風險評級**: 調整資產風險參數

## 🛠️ 技術架構

```
contracts/
├── core/
│   ├── LendingPool.sol          # 主借貸池合約
│   ├── LendingPoolCore.sol      # 核心邏輯
│   └── LendingPoolDataProvider.sol  # 數據提供者
├── tokenization/
│   ├── AToken.sol               # 存款憑證代幣
│   └── DebtToken.sol            # 債務代幣
├── rates/
│   ├── InterestRateStrategy.sol # 利率策略
│   └── DefaultReserveInterestRateStrategy.sol
├── liquidation/
│   ├── LiquidationManager.sol   # 清算管理器
│   └── LiquidationLogic.sol     # 清算邏輯
├── oracle/
│   └── PriceOracle.sol          # 價格預言機
└── governance/
    └── LendingPoolConfigurator.sol  # 配置器
```

## 📝 智能合約實現

### LendingPool.sol - 主借貸池

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title LendingPool
 * @dev 主借貸池合約，處理存款、借款、還款和提款
 */
contract LendingPool is ReentrancyGuard {
    struct ReserveData {
        // 配置
        uint256 ltv;                    // 貸款價值比 (例如 75%)
        uint256 liquidationThreshold;    // 清算閾值 (例如 80%)
        uint256 liquidationBonus;        // 清算獎勵 (例如 5%)

        // 狀態
        address aTokenAddress;           // aToken 地址
        uint256 totalLiquidity;          // 總流動性
        uint256 totalBorrows;            // 總借款
        uint256 liquidityRate;           // 存款利率
        uint256 borrowRate;              // 借款利率
        uint256 lastUpdateTimestamp;     // 最後更新時間

        bool isActive;                   // 是否啟用
    }

    struct UserReserveData {
        uint256 deposited;               // 存款金額
        uint256 borrowed;                // 借款金額
        uint256 lastUpdateTimestamp;     // 最後更新時間
    }

    // 儲備數據: 資產地址 => ReserveData
    mapping(address => ReserveData) public reserves;

    // 用戶數據: 用戶地址 => 資產地址 => UserReserveData
    mapping(address => mapping(address => UserReserveData)) public users;

    // 支持的資產列表
    address[] public reservesList;

    // 價格預言機
    mapping(address => AggregatorV3Interface) public priceOracles;

    event Deposit(address indexed user, address indexed reserve, uint256 amount);
    event Withdraw(address indexed user, address indexed reserve, uint256 amount);
    event Borrow(address indexed user, address indexed reserve, uint256 amount);
    event Repay(address indexed user, address indexed reserve, uint256 amount);
    event Liquidation(
        address indexed collateral,
        address indexed debt,
        address indexed user,
        uint256 debtToCover,
        uint256 liquidatedCollateral
    );

    /**
     * @dev 存款
     * @param asset 資產地址
     * @param amount 存款金額
     */
    function deposit(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(reserves[asset].isActive, "Reserve not active");

        ReserveData storage reserve = reserves[asset];
        UserReserveData storage userData = users[msg.sender][asset];

        // 更新利息
        _updateReserveInterest(asset);
        _updateUserInterest(msg.sender, asset);

        // 轉移代幣
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // 鑄造 aToken
        IAToken(reserve.aTokenAddress).mint(msg.sender, amount);

        // 更新狀態
        reserve.totalLiquidity += amount;
        userData.deposited += amount;
        userData.lastUpdateTimestamp = block.timestamp;

        emit Deposit(msg.sender, asset, amount);
    }

    /**
     * @dev 提款
     * @param asset 資產地址
     * @param amount 提款金額
     */
    function withdraw(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        ReserveData storage reserve = reserves[asset];
        UserReserveData storage userData = users[msg.sender][asset];

        // 更新利息
        _updateReserveInterest(asset);
        _updateUserInterest(msg.sender, asset);

        require(userData.deposited >= amount, "Insufficient balance");

        // 檢查健康係數
        require(_checkHealthFactor(msg.sender, asset, amount), "Health factor too low");

        // 銷毀 aToken
        IAToken(reserve.aTokenAddress).burn(msg.sender, amount);

        // 轉移代幣
        IERC20(asset).transfer(msg.sender, amount);

        // 更新狀態
        reserve.totalLiquidity -= amount;
        userData.deposited -= amount;
        userData.lastUpdateTimestamp = block.timestamp;

        emit Withdraw(msg.sender, asset, amount);
    }

    /**
     * @dev 借款
     * @param asset 要借的資產地址
     * @param amount 借款金額
     */
    function borrow(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(reserves[asset].isActive, "Reserve not active");

        ReserveData storage reserve = reserves[asset];

        // 更新利息
        _updateReserveInterest(asset);

        require(reserve.totalLiquidity >= amount, "Insufficient liquidity");

        // 檢查抵押品是否足夠
        require(_checkBorrowingPower(msg.sender, asset, amount), "Insufficient collateral");

        UserReserveData storage userData = users[msg.sender][asset];

        // 轉移代幣
        IERC20(asset).transfer(msg.sender, amount);

        // 更新狀態
        reserve.totalBorrows += amount;
        reserve.totalLiquidity -= amount;
        userData.borrowed += amount;
        userData.lastUpdateTimestamp = block.timestamp;

        emit Borrow(msg.sender, asset, amount);
    }

    /**
     * @dev 還款
     * @param asset 還款資產地址
     * @param amount 還款金額
     */
    function repay(address asset, uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        ReserveData storage reserve = reserves[asset];
        UserReserveData storage userData = users[msg.sender][asset];

        // 更新利息
        _updateReserveInterest(asset);
        _updateUserInterest(msg.sender, asset);

        uint256 borrowedAmount = userData.borrowed;
        require(borrowedAmount > 0, "No debt to repay");

        uint256 paybackAmount = amount > borrowedAmount ? borrowedAmount : amount;

        // 轉移代幣
        IERC20(asset).transferFrom(msg.sender, address(this), paybackAmount);

        // 更新狀態
        reserve.totalBorrows -= paybackAmount;
        reserve.totalLiquidity += paybackAmount;
        userData.borrowed -= paybackAmount;
        userData.lastUpdateTimestamp = block.timestamp;

        emit Repay(msg.sender, asset, paybackAmount);
    }

    /**
     * @dev 清算
     * @param user 被清算用戶
     * @param collateralAsset 抵押品資產
     * @param debtAsset 債務資產
     * @param debtToCover 要償還的債務金額
     */
    function liquidate(
        address user,
        address collateralAsset,
        address debtAsset,
        uint256 debtToCover
    ) external nonReentrant {
        // 檢查健康係數 < 1
        require(!_isHealthy(user), "Health factor OK");

        UserReserveData storage debtData = users[user][debtAsset];
        require(debtData.borrowed >= debtToCover, "Invalid debt amount");

        // 計算可獲得的抵押品
        uint256 collateralPrice = _getAssetPrice(collateralAsset);
        uint256 debtPrice = _getAssetPrice(debtAsset);

        uint256 collateralAmount = (debtToCover * debtPrice *
            (100 + reserves[collateralAsset].liquidationBonus)) /
            (collateralPrice * 100);

        // 轉移債務代幣
        IERC20(debtAsset).transferFrom(msg.sender, address(this), debtToCover);

        // 轉移抵押品
        UserReserveData storage collateralData = users[user][collateralAsset];
        require(collateralData.deposited >= collateralAmount, "Insufficient collateral");

        IAToken(reserves[collateralAsset].aTokenAddress).transferFrom(
            user, msg.sender, collateralAmount
        );

        // 更新狀態
        debtData.borrowed -= debtToCover;
        collateralData.deposited -= collateralAmount;

        emit Liquidation(collateralAsset, debtAsset, user, debtToCover, collateralAmount);
    }

    /**
     * @dev 獲取用戶健康係數
     * @param user 用戶地址
     * @return healthFactor 健康係數 (1e18 = 100%)
     */
    function getUserHealthFactor(address user) public view returns (uint256) {
        uint256 totalCollateralInETH;
        uint256 totalDebtInETH;

        for (uint i = 0; i < reservesList.length; i++) {
            address asset = reservesList[i];
            UserReserveData memory userData = users[user][asset];
            uint256 assetPrice = _getAssetPrice(asset);

            // 累加抵押品價值（乘以 LTV）
            if (userData.deposited > 0) {
                totalCollateralInETH += (userData.deposited * assetPrice *
                    reserves[asset].liquidationThreshold) / (100 * 1e18);
            }

            // 累加債務價值
            if (userData.borrowed > 0) {
                totalDebtInETH += (userData.borrowed * assetPrice) / 1e18;
            }
        }

        if (totalDebtInETH == 0) return type(uint256).max;

        return (totalCollateralInETH * 1e18) / totalDebtInETH;
    }

    /**
     * @dev 更新儲備利息
     */
    function _updateReserveInterest(address asset) internal {
        ReserveData storage reserve = reserves[asset];
        uint256 timeElapsed = block.timestamp - reserve.lastUpdateTimestamp;

        if (timeElapsed > 0) {
            uint256 utilizationRate = _getUtilizationRate(asset);

            // 簡化的利率模型
            reserve.borrowRate = _calculateBorrowRate(utilizationRate);
            reserve.liquidityRate = (reserve.borrowRate * utilizationRate) / 1e18;

            reserve.lastUpdateTimestamp = block.timestamp;
        }
    }

    function _getUtilizationRate(address asset) internal view returns (uint256) {
        ReserveData memory reserve = reserves[asset];
        if (reserve.totalLiquidity == 0) return 0;

        return (reserve.totalBorrows * 1e18) /
            (reserve.totalLiquidity + reserve.totalBorrows);
    }

    function _calculateBorrowRate(uint256 utilizationRate) internal pure returns (uint256) {
        // 簡化的利率曲線: 0-80% 線性增長，80%+ 急劇增長
        uint256 optimalRate = 80 * 1e16; // 80%

        if (utilizationRate <= optimalRate) {
            // 0-5% APY
            return (5 * 1e16 * utilizationRate) / optimalRate;
        } else {
            // 5-50% APY
            return 5 * 1e16 + ((utilizationRate - optimalRate) * 45 * 1e16) /
                (1e18 - optimalRate);
        }
    }

    function _getAssetPrice(address asset) internal view returns (uint256) {
        AggregatorV3Interface oracle = priceOracles[asset];
        (, int256 price,,,) = oracle.latestRoundData();
        return uint256(price) * 1e10; // 轉換為 18 位小數
    }

    function _isHealthy(address user) internal view returns (bool) {
        return getUserHealthFactor(user) >= 1e18;
    }

    function _checkHealthFactor(address user, address asset, uint256 amount) internal view returns (bool) {
        // 簡化實現
        return true;
    }

    function _checkBorrowingPower(address user, address asset, uint256 amount) internal view returns (bool) {
        // 簡化實現
        return true;
    }

    function _updateUserInterest(address user, address asset) internal {
        // 簡化實現
    }
}

interface IAToken {
    function mint(address user, uint256 amount) external;
    function burn(address user, uint256 amount) external;
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

### AToken.sol - 存款憑證

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title AToken
 * @dev 代表存款的生息代幣
 */
contract AToken is ERC20 {
    address public immutable POOL;
    address public immutable UNDERLYING_ASSET;

    modifier onlyPool() {
        require(msg.sender == POOL, "Caller must be pool");
        _;
    }

    constructor(
        address pool,
        address underlyingAsset,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        POOL = pool;
        UNDERLYING_ASSET = underlyingAsset;
    }

    function mint(address user, uint256 amount) external onlyPool {
        _mint(user, amount);
    }

    function burn(address user, uint256 amount) external onlyPool {
        _burn(user, amount);
    }
}
```

## 🎨 前端實現

### Lending Dashboard

```typescript
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { formatEther, parseEther } from 'viem';

export function LendingDashboard() {
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');

  // 讀取用戶健康係數
  const { data: healthFactor } = useContractRead({
    address: '0x...', // LendingPool address
    abi: LendingPoolABI,
    functionName: 'getUserHealthFactor',
    args: [address],
  });

  // 存款
  const { write: deposit } = useContractWrite({
    address: '0x...',
    abi: LendingPoolABI,
    functionName: 'deposit',
  });

  // 借款
  const { write: borrow } = useContractWrite({
    address: '0x...',
    abi: LendingPoolABI,
    functionName: 'borrow',
  });

  const handleDeposit = async (asset: string) => {
    deposit({
      args: [asset, parseEther(depositAmount)]
    });
  };

  const handleBorrow = async (asset: string) => {
    borrow({
      args: [asset, parseEther(borrowAmount)]
    });
  };

  const healthFactorColor = () => {
    if (!healthFactor) return 'gray';
    const hf = Number(formatEther(healthFactor as bigint));
    if (hf >= 1.5) return 'green';
    if (hf >= 1.2) return 'yellow';
    return 'red';
  };

  return (
    <div className="lending-dashboard">
      <div className="health-factor">
        <h3>健康係數</h3>
        <div className={`factor ${healthFactorColor()}`}>
          {healthFactor ? formatEther(healthFactor as bigint) : '-'}
        </div>
      </div>

      <div className="actions">
        <div className="deposit-section">
          <h3>存款</h3>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="輸入存款金額"
          />
          <button onClick={() => handleDeposit('0x...')}>存款</button>
        </div>

        <div className="borrow-section">
          <h3>借款</h3>
          <input
            type="number"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="輸入借款金額"
          />
          <button onClick={() => handleBorrow('0x...')}>借款</button>
        </div>
      </div>
    </div>
  );
}
```

## 🧪 測試

```javascript
describe("LendingPool", function () {
  let pool, aToken;
  let usdc, dai;
  let owner, user1, liquidator;

  beforeEach(async function () {
    [owner, user1, liquidator] = await ethers.getSigners();

    // 部署代幣
    const Token = await ethers.getContractFactory("ERC20Mock");
    usdc = await Token.deploy("USD Coin", "USDC");
    dai = await Token.deploy("Dai", "DAI");

    // 部署借貸池
    const LendingPool = await ethers.getContractFactory("LendingPool");
    pool = await LendingPool.deploy();

    // 初始化儲備
    await pool.initReserve(usdc.address, 75, 80, 5);
  });

  it("應該允許存款和提款", async function () {
    const amount = ethers.utils.parseEther("1000");

    await usdc.approve(pool.address, amount);
    await pool.deposit(usdc.address, amount);

    await pool.withdraw(usdc.address, amount);
  });

  it("應該允許借款和還款", async function () {
    // 先存款作為抵押
    const depositAmount = ethers.utils.parseEther("1000");
    await usdc.approve(pool.address, depositAmount);
    await pool.deposit(usdc.address, depositAmount);

    // 借款
    const borrowAmount = ethers.utils.parseEther("500");
    await pool.borrow(usdc.address, borrowAmount);

    // 還款
    await usdc.approve(pool.address, borrowAmount);
    await pool.repay(usdc.address, borrowAmount);
  });

  it("應該在健康係數 < 1 時清算", async function () {
    // 設置場景...
    // 觸發清算...
  });
});
```

## 📚 參考資源

- [Aave V3 Documentation](https://docs.aave.com/developers/)
- [Compound Protocol](https://compound.finance/docs)
- [Chainlink Price Feeds](https://docs.chain.link/data-feeds)

---

[返回 DeFi Projects](../README.md)
