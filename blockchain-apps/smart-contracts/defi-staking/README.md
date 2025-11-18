# 💰 DeFi Staking - 代幣質押合約

完整的DeFi質押解決方案，支持靈活鎖定期和獎勵倍數。

## ✨ 功能

- ✅ **靈活質押** - 支持無鎖定或30/90/180天鎖定
- ✅ **獎勵倍數** - 鎖定期越長，獎勵越高
  - 無鎖定: 100% APY
  - 30天: 110% APY
  - 90天: 125% APY
  - 180天: 150% APY
- ✅ **多重質押** - 用戶可以有多個獨立的質押
- ✅ **即時獎勵計算** - 實時查看獎勵
- ✅ **安全設計** - ReentrancyGuard + Pausable
- ✅ **ERC20支持** - 任何ERC20代幣

## 🚀 使用

### 質押代幣
```javascript
const amount = ethers.utils.parseEther("100");
const lockPeriod = 90 * 24 * 60 * 60; // 90 days
await stakingContract.stake(amount, lockPeriod);
```

### 提取質押和獎勵
```javascript
const stakeId = 0;
await stakingContract.withdraw(stakeId);
```

### 查看獎勵
```javascript
const reward = await stakingContract.calculateReward(userAddress, stakeId);
```

## 📊 獎勵計算

基礎公式：
```
獎勵 = (質押量 × 基礎APY × 倍數 × 時間) / (1年 × 100 × 100)
```

範例：
- 質押 1000 代幣
- 鎖定 90 天
- APY: 125%
- 90天後獎勵約: ~308 代幣

## 🔒 安全特性

- ✓ OpenZeppelin SafeERC20
- ✓ ReentrancyGuard
- ✓ Pausable機制
- ✓ 鎖定期保護
- ✓ Owner管理

## 📝 智能合約參數

```solidity
REWARD_RATE = 100      // 100% 基礎 APY
MIN_STAKE = 1e18       // 最小質押: 1 代幣
LOCK_PERIODS:
  - 0 days (無鎖定)    // 100% APY
  - 30 days            // 110% APY
  - 90 days            // 125% APY
  - 180 days           // 150% APY
```

## 🧪 測試

```bash
npm install
npm test
```

[返回 Smart Contracts](../README.md)
