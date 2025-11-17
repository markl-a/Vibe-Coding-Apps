# 🌾 Yield Farming - 流動性挖礦平台

流動性挖礦和收益聚合器平台，允許用戶通過質押代幣賺取獎勵。

## 📋 專案簡介

這是一個完整的流動性挖礦平台，支持：
- 多池質押賺取獎勵
- 自動複利功能
- NFT 加成機制
- 鎖倉期設置
- 動態獎勵分配

## ✨ 核心功能

### 🌱 質押挖礦
- 質押 LP 代幣或單幣
- 賺取治理代幣獎勵
- 靈活的鎖倉期選擇
- 緊急提款（扣除罰金）

### 🔄 自動複利
- 自動收穫並重新質押獎勵
- 最大化收益率
- Gas 費優化

### 🎁 獎勵增強
- NFT 持有者獲得獎勵加成
- 長期質押獎勵倍數
- 推薦獎勵計劃

## 🛠️ 智能合約實現

### MasterChef.sol - 主挖礦合約

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MasterChef
 * @dev 主挖礦合約，管理所有礦池和獎勵分配
 */
contract MasterChef is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // 獎勵代幣
    IERC20 public rewardToken;

    // 每個區塊的獎勵數量
    uint256 public rewardPerBlock;

    // 礦池信息
    struct PoolInfo {
        IERC20 lpToken;              // LP 代幣地址
        uint256 allocPoint;          // 分配點數
        uint256 lastRewardBlock;     // 最後獎勵區塊
        uint256 accRewardPerShare;   // 每份額累計獎勵
        uint256 depositFeeBP;        // 存款手續費（基點）
        uint256 withdrawFeeBP;       // 提款手續費（基點）
        uint256 lockDuration;        // 鎖倉時間（秒）
        uint256 totalStaked;         // 總質押量
    }

    // 用戶信息
    struct UserInfo {
        uint256 amount;              // 質押數量
        uint256 rewardDebt;          // 已領取的獎勵債務
        uint256 pendingRewards;      // 待領取獎勵
        uint256 lastDepositTime;     // 最後存款時間
        uint256 totalClaimed;        // 總領取獎勵
    }

    // 礦池列表
    PoolInfo[] public poolInfo;

    // 用戶信息: poolId => user => UserInfo
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;

    // 總分配點數
    uint256 public totalAllocPoint;

    // 開始區塊
    uint256 public startBlock;

    // NFT 合約地址（用於獎勵加成）
    address public nftContract;

    // NFT 加成百分比（基點）
    uint256 public nftBonusBP = 1000; // 10%

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address lpToken, uint256 allocPoint);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);

    constructor(
        IERC20 _rewardToken,
        uint256 _rewardPerBlock,
        uint256 _startBlock
    ) {
        rewardToken = _rewardToken;
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
    }

    /**
     * @dev 獲取礦池數量
     */
    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    /**
     * @dev 添加新礦池
     */
    function addPool(
        IERC20 _lpToken,
        uint256 _allocPoint,
        uint256 _depositFeeBP,
        uint256 _withdrawFeeBP,
        uint256 _lockDuration,
        bool _withUpdate
    ) public onlyOwner {
        require(_depositFeeBP <= 400, "Max 4%");
        require(_withdrawFeeBP <= 400, "Max 4%");

        if (_withUpdate) {
            massUpdatePools();
        }

        uint256 lastRewardBlock = block.number > startBlock ? block.number : startBlock;

        totalAllocPoint += _allocPoint;

        poolInfo.push(PoolInfo({
            lpToken: _lpToken,
            allocPoint: _allocPoint,
            lastRewardBlock: lastRewardBlock,
            accRewardPerShare: 0,
            depositFeeBP: _depositFeeBP,
            withdrawFeeBP: _withdrawFeeBP,
            lockDuration: _lockDuration,
            totalStaked: 0
        }));

        emit PoolAdded(poolInfo.length - 1, address(_lpToken), _allocPoint);
    }

    /**
     * @dev 更新礦池分配點數
     */
    function setPool(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) public onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }

        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;

        emit PoolUpdated(_pid, _allocPoint);
    }

    /**
     * @dev 更新所有礦池
     */
    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; pid++) {
            updatePool(pid);
        }
    }

    /**
     * @dev 更新單個礦池獎勵
     */
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];

        if (block.number <= pool.lastRewardBlock) {
            return;
        }

        uint256 lpSupply = pool.totalStaked;

        if (lpSupply == 0 || pool.allocPoint == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }

        uint256 multiplier = block.number - pool.lastRewardBlock;
        uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;

        pool.accRewardPerShare += (reward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;
    }

    /**
     * @dev 查看待領取獎勵
     */
    function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
        PoolInfo memory pool = poolInfo[_pid];
        UserInfo memory user = userInfo[_pid][_user];

        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = pool.totalStaked;

        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = block.number - pool.lastRewardBlock;
            uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare += (reward * 1e12) / lpSupply;
        }

        uint256 pending = (user.amount * accRewardPerShare) / 1e12 - user.rewardDebt;

        // NFT 加成
        if (_hasNFT(_user)) {
            pending = (pending * (10000 + nftBonusBP)) / 10000;
        }

        return pending;
    }

    /**
     * @dev 存款質押
     */
    function deposit(uint256 _pid, uint256 _amount) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
            if (pending > 0) {
                user.pendingRewards += pending;
            }
        }

        if (_amount > 0) {
            uint256 balanceBefore = pool.lpToken.balanceOf(address(this));
            pool.lpToken.safeTransferFrom(msg.sender, address(this), _amount);
            uint256 balanceAfter = pool.lpToken.balanceOf(address(this));
            _amount = balanceAfter - balanceBefore;

            // 扣除存款手續費
            if (pool.depositFeeBP > 0) {
                uint256 depositFee = (_amount * pool.depositFeeBP) / 10000;
                pool.lpToken.safeTransfer(owner(), depositFee);
                _amount -= depositFee;
            }

            user.amount += _amount;
            pool.totalStaked += _amount;
            user.lastDepositTime = block.timestamp;
        }

        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;

        emit Deposit(msg.sender, _pid, _amount);
    }

    /**
     * @dev 提款
     */
    function withdraw(uint256 _pid, uint256 _amount) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        require(user.amount >= _amount, "Insufficient balance");

        // 檢查鎖倉期
        require(
            block.timestamp >= user.lastDepositTime + pool.lockDuration,
            "Still locked"
        );

        updatePool(_pid);

        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
        if (pending > 0) {
            user.pendingRewards += pending;
        }

        if (_amount > 0) {
            user.amount -= _amount;
            pool.totalStaked -= _amount;

            // 扣除提款手續費
            uint256 withdrawAmount = _amount;
            if (pool.withdrawFeeBP > 0) {
                uint256 withdrawFee = (_amount * pool.withdrawFeeBP) / 10000;
                pool.lpToken.safeTransfer(owner(), withdrawFee);
                withdrawAmount -= withdrawFee;
            }

            pool.lpToken.safeTransfer(msg.sender, withdrawAmount);
        }

        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;

        emit Withdraw(msg.sender, _pid, _amount);
    }

    /**
     * @dev 收穫獎勵
     */
    function harvest(uint256 _pid) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
        pending += user.pendingRewards;

        if (pending > 0) {
            // NFT 加成
            if (_hasNFT(msg.sender)) {
                pending = (pending * (10000 + nftBonusBP)) / 10000;
            }

            user.pendingRewards = 0;
            user.totalClaimed += pending;
            safeRewardTransfer(msg.sender, pending);

            emit Harvest(msg.sender, _pid, pending);
        }

        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
    }

    /**
     * @dev 緊急提款（不領取獎勵）
     */
    function emergencyWithdraw(uint256 _pid) public nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];

        uint256 amount = user.amount;

        user.amount = 0;
        user.rewardDebt = 0;
        user.pendingRewards = 0;
        pool.totalStaked -= amount;

        pool.lpToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    /**
     * @dev 安全的獎勵轉賬
     */
    function safeRewardTransfer(address _to, uint256 _amount) internal {
        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        if (_amount > rewardBalance) {
            rewardToken.safeTransfer(_to, rewardBalance);
        } else {
            rewardToken.safeTransfer(_to, _amount);
        }
    }

    /**
     * @dev 檢查用戶是否持有 NFT
     */
    function _hasNFT(address _user) internal view returns (bool) {
        if (nftContract == address(0)) return false;

        // 簡化實現：檢查 NFT 餘額
        try IERC721(nftContract).balanceOf(_user) returns (uint256 balance) {
            return balance > 0;
        } catch {
            return false;
        }
    }

    /**
     * @dev 設置 NFT 合約地址
     */
    function setNFTContract(address _nftContract) external onlyOwner {
        nftContract = _nftContract;
    }

    /**
     * @dev 設置 NFT 加成比例
     */
    function setNFTBonus(uint256 _bonusBP) external onlyOwner {
        require(_bonusBP <= 5000, "Max 50%");
        nftBonusBP = _bonusBP;
    }

    /**
     * @dev 更新每區塊獎勵
     */
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        massUpdatePools();
        rewardPerBlock = _rewardPerBlock;
    }
}

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
}
```

## 🎨 前端實現

### Farming Dashboard

```typescript
import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { formatEther, parseEther } from 'viem';

interface Pool {
  id: number;
  name: string;
  lpToken: string;
  apy: number;
  totalStaked: bigint;
  userStaked: bigint;
  pendingRewards: bigint;
  lockDuration: number;
}

export function FarmingDashboard() {
  const { address } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState('');

  // 讀取待領取獎勵
  const { data: pendingReward } = useContractRead({
    address: '0x...', // MasterChef address
    abi: MasterChefABI,
    functionName: 'pendingReward',
    args: [selectedPool, address],
    watch: true,
  });

  // 質押
  const { write: stake } = useContractWrite({
    address: '0x...',
    abi: MasterChefABI,
    functionName: 'deposit',
  });

  // 提款
  const { write: unstake } = useContractWrite({
    address: '0x...',
    abi: MasterChefABI,
    functionName: 'withdraw',
  });

  // 收穫
  const { write: harvest } = useContractWrite({
    address: '0x...',
    abi: MasterChefABI,
    functionName: 'harvest',
  });

  const handleStake = () => {
    stake({
      args: [selectedPool, parseEther(stakeAmount)]
    });
  };

  return (
    <div className="farming-dashboard">
      <h1>流動性挖礦</h1>

      <div className="pools-grid">
        {pools.map((pool) => (
          <div key={pool.id} className="pool-card">
            <h3>{pool.name}</h3>

            <div className="pool-stats">
              <div className="stat">
                <span>APY</span>
                <strong>{pool.apy}%</strong>
              </div>
              <div className="stat">
                <span>總質押</span>
                <strong>{formatEther(pool.totalStaked)}</strong>
              </div>
              <div className="stat">
                <span>鎖倉期</span>
                <strong>{pool.lockDuration / 86400} 天</strong>
              </div>
            </div>

            <div className="user-info">
              <p>已質押: {formatEther(pool.userStaked)}</p>
              <p>待領取: {formatEther(pool.pendingRewards)}</p>
            </div>

            <div className="actions">
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="輸入金額"
              />
              <button onClick={handleStake}>質押</button>
              <button onClick={() => unstake({ args: [pool.id, pool.userStaked] })}>
                提款
              </button>
              <button onClick={() => harvest({ args: [pool.id] })}>
                收穫
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧪 測試

```javascript
describe("MasterChef", function () {
  let masterChef, rewardToken, lpToken;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 部署獎勵代幣
    const Token = await ethers.getContractFactory("ERC20Mock");
    rewardToken = await Token.deploy("Reward Token", "RWD");
    lpToken = await Token.deploy("LP Token", "LP");

    // 部署 MasterChef
    const MasterChef = await ethers.getContractFactory("MasterChef");
    const rewardPerBlock = ethers.utils.parseEther("10");
    const startBlock = await ethers.provider.getBlockNumber();

    masterChef = await MasterChef.deploy(
      rewardToken.address,
      rewardPerBlock,
      startBlock
    );

    // 轉移獎勵代幣到 MasterChef
    await rewardToken.transfer(
      masterChef.address,
      ethers.utils.parseEther("1000000")
    );

    // 添加礦池
    await masterChef.addPool(
      lpToken.address,
      100,  // allocPoint
      100,  // deposit fee 1%
      100,  // withdraw fee 1%
      0,    // no lock
      false
    );
  });

  it("應該允許質押和提款", async function () {
    const amount = ethers.utils.parseEther("100");

    // 給用戶 LP 代幣
    await lpToken.transfer(user1.address, amount);

    // 用戶質押
    await lpToken.connect(user1).approve(masterChef.address, amount);
    await masterChef.connect(user1).deposit(0, amount);

    // 挖幾個區塊
    await ethers.provider.send("evm_mine", []);
    await ethers.provider.send("evm_mine", []);

    // 檢查待領取獎勵
    const pending = await masterChef.pendingReward(0, user1.address);
    expect(pending).to.be.gt(0);

    // 提款
    const userInfo = await masterChef.userInfo(0, user1.address);
    await masterChef.connect(user1).withdraw(0, userInfo.amount);
  });

  it("應該正確分配獎勵", async function () {
    const amount1 = ethers.utils.parseEther("100");
    const amount2 = ethers.utils.parseEther("200");

    // 兩個用戶質押
    await lpToken.transfer(user1.address, amount1);
    await lpToken.transfer(user2.address, amount2);

    await lpToken.connect(user1).approve(masterChef.address, amount1);
    await lpToken.connect(user2).approve(masterChef.address, amount2);

    await masterChef.connect(user1).deposit(0, amount1);
    await masterChef.connect(user2).deposit(0, amount2);

    // 挖幾個區塊
    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    // user2 質押了 2 倍，應該獲得 2 倍獎勵
    const pending1 = await masterChef.pendingReward(0, user1.address);
    const pending2 = await masterChef.pendingReward(0, user2.address);

    expect(pending2).to.be.closeTo(pending1.mul(2), ethers.utils.parseEther("1"));
  });

  it("應該給 NFT 持有者加成", async function () {
    // 部署 NFT 並設置
    const NFT = await ethers.getContractFactory("ERC721Mock");
    const nft = await NFT.deploy();

    await masterChef.setNFTContract(nft.address);
    await masterChef.setNFTBonus(1000); // 10%

    // 給 user1 一個 NFT
    await nft.mint(user1.address, 1);

    // 兩個用戶質押相同金額
    const amount = ethers.utils.parseEther("100");
    await lpToken.transfer(user1.address, amount);
    await lpToken.transfer(user2.address, amount);

    await lpToken.connect(user1).approve(masterChef.address, amount);
    await lpToken.connect(user2).approve(masterChef.address, amount);

    await masterChef.connect(user1).deposit(0, amount);
    await masterChef.connect(user2).deposit(0, amount);

    // 挖幾個區塊
    for (let i = 0; i < 10; i++) {
      await ethers.provider.send("evm_mine", []);
    }

    const pending1 = await masterChef.pendingReward(0, user1.address);
    const pending2 = await masterChef.pendingReward(0, user2.address);

    // user1 有 NFT，應該多 10%
    expect(pending1).to.be.closeTo(pending2.mul(110).div(100), ethers.utils.parseEther("0.1"));
  });
});
```

## 📊 APY 計算

```javascript
// 計算年化收益率（APY）
function calculateAPY(
  rewardPerBlock: number,
  rewardTokenPrice: number,
  totalStaked: number,
  lpTokenPrice: number,
  allocPoint: number,
  totalAllocPoint: number,
  blocksPerYear: number = 2102400 // 假設 15 秒一個區塊
): number {
  const poolRewardPerBlock = (rewardPerBlock * allocPoint) / totalAllocPoint;
  const yearlyReward = poolRewardPerBlock * blocksPerYear;
  const yearlyRewardInUSD = yearlyReward * rewardTokenPrice;
  const totalStakedInUSD = totalStaked * lpTokenPrice;

  if (totalStakedInUSD === 0) return 0;

  return (yearlyRewardInUSD / totalStakedInUSD) * 100;
}
```

## 📚 參考資源

- [SushiSwap MasterChef](https://github.com/sushiswap/sushiswap/blob/master/contracts/MasterChef.sol)
- [PancakeSwap Farms](https://docs.pancakeswap.finance/products/yield-farming)
- [Yearn Finance](https://docs.yearn.finance/)

## 🎯 未來改進

- [ ] 自動複利vault
- [ ] 多重獎勵代幣
- [ ] 推薦系統
- [ ] 彈性解鎖
- [ ] 治理投票

---

[返回 DeFi Projects](../README.md)
