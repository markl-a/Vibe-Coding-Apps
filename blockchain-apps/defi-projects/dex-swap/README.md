# 🔄 DEX Swap - 去中心化交易所

基於自動化做市商（AMM）機制的去中心化交易所，類似 Uniswap V2。

## 📋 專案簡介

DEX Swap 是一個完整的去中心化交易所實現，使用恆定乘積公式 (x * y = k) 作為定價機制。用戶可以：
- 交換 ERC20 代幣
- 提供流動性賺取手續費
- 移除流動性

## ✨ 核心功能

### 🔄 代幣交換
- 支持任意 ERC20 代幣對交換
- 滑點保護機制
- 最優路由選擇
- 0.3% 交易手續費

### 💧 流動性管理
- 添加流動性獲得 LP 代幣
- 移除流動性贖回 LP 代幣
- 手續費自動分配給 LP 提供者

### 📊 價格預言機
- 時間加權平均價格（TWAP）
- 防止價格操縱

## 🛠️ 技術架構

### 智能合約層
```
contracts/
├── core/
│   ├── DEXFactory.sol      # 工廠合約，創建交易對
│   ├── DEXPair.sol         # 交易對合約，實現 AMM
│   └── DEXRouter.sol       # 路由合約，處理多跳交易
├── libraries/
│   ├── Math.sol            # 數學運算庫
│   └── UQ112x112.sol       # 定點數庫
└── interfaces/
    ├── IDEX.sol
    └── IERC20.sol
```

### 前端架構
```
frontend/
├── src/
│   ├── components/
│   │   ├── Swap/           # 交換界面
│   │   ├── Pool/           # 流動性池管理
│   │   └── Chart/          # 價格圖表
│   ├── hooks/
│   │   ├── useSwap.ts      # 交換邏輯
│   │   └── useLiquidity.ts # 流動性邏輯
│   └── contracts/          # 合約 ABI
└── package.json
```

## 📝 智能合約詳解

### DEXPair.sol - 核心 AMM 合約

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DEXPair
 * @dev 實現恆定乘積 AMM (x * y = k)
 */
contract DEXPair is ERC20, ReentrancyGuard {
    address public token0;
    address public token1;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    uint public price0CumulativeLast;
    uint public price1CumulativeLast;

    uint private constant MINIMUM_LIQUIDITY = 10**3;

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    constructor() ERC20("DEX LP Token", "DEX-LP") {}

    function initialize(address _token0, address _token1) external {
        require(token0 == address(0), "Already initialized");
        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @dev 添加流動性
     * @return liquidity LP 代幣數量
     */
    function mint(address to) external nonReentrant returns (uint liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint amount0 = balance0 - _reserve0;
        uint amount1 = balance1 - _reserve1;

        uint _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(1), MINIMUM_LIQUIDITY); // 永久鎖定
        } else {
            liquidity = Math.min(
                amount0 * _totalSupply / _reserve0,
                amount1 * _totalSupply / _reserve1
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Mint(msg.sender, amount0, amount1);
    }

    /**
     * @dev 移除流動性
     * @return amount0 返回的 token0 數量
     * @return amount1 返回的 token1 數量
     */
    function burn(address to) external nonReentrant returns (uint amount0, uint amount1) {
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint liquidity = balanceOf(address(this));

        uint _totalSupply = totalSupply();
        amount0 = liquidity * balance0 / _totalSupply;
        amount1 = liquidity * balance1 / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "Insufficient liquidity burned");

        _burn(address(this), liquidity);
        IERC20(token0).transfer(to, amount0);
        IERC20(token1).transfer(to, amount1);

        balance0 = IERC20(token0).balanceOf(address(this));
        balance1 = IERC20(token1).balanceOf(address(this));

        _update(balance0, balance1, reserve0, reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /**
     * @dev 交換代幣
     * @param amount0Out 輸出的 token0 數量
     * @param amount1Out 輸出的 token1 數量
     * @param to 接收地址
     */
    function swap(uint amount0Out, uint amount1Out, address to) external nonReentrant {
        require(amount0Out > 0 || amount1Out > 0, "Insufficient output amount");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "Insufficient liquidity");

        if (amount0Out > 0) IERC20(token0).transfer(to, amount0Out);
        if (amount1Out > 0) IERC20(token1).transfer(to, amount1Out);

        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "Insufficient input amount");

        // 檢查 K 值（扣除 0.3% 手續費）
        uint balance0Adjusted = balance0 * 1000 - amount0In * 3;
        uint balance1Adjusted = balance1 * 1000 - amount1In * 3;
        require(
            balance0Adjusted * balance1Adjusted >= uint(_reserve0) * _reserve1 * (1000**2),
            "K"
        );

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function _update(uint balance0, uint balance1, uint112 _reserve0, uint112 _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "Overflow");

        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;

        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            price0CumulativeLast += uint(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
            price1CumulativeLast += uint(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
        }

        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }
}
```

### DEXRouter.sol - 路由合約

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./DEXFactory.sol";
import "./DEXPair.sol";

contract DEXRouter {
    address public immutable factory;

    constructor(address _factory) {
        factory = _factory;
    }

    /**
     * @dev 添加流動性
     */
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint amountA, uint amountB, uint liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = DEXFactory(factory).getPair(tokenA, tokenB);

        IERC20(tokenA).transferFrom(msg.sender, pair, amountA);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountB);
        liquidity = DEXPair(pair).mint(to);
    }

    /**
     * @dev 交換精確數量的輸入代幣
     */
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external ensure(deadline) returns (uint[] memory amounts) {
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output amount");

        IERC20(path[0]).transferFrom(msg.sender, DEXFactory(factory).getPair(path[0], path[1]), amounts[0]);
        _swap(amounts, path, to);
    }

    /**
     * @dev 計算輸出數量
     */
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint amountOut) {
        require(amountIn > 0, "Insufficient input amount");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");

        uint amountInWithFee = amountIn * 997;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin
    ) internal returns (uint amountA, uint amountB) {
        if (DEXFactory(factory).getPair(tokenA, tokenB) == address(0)) {
            DEXFactory(factory).createPair(tokenA, tokenB);
        }

        (uint reserveA, uint reserveB) = getReserves(tokenA, tokenB);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint amountBOptimal = quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint amountAOptimal = quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "Insufficient A amount");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    modifier ensure(uint deadline) {
        require(deadline >= block.timestamp, "Expired");
        _;
    }
}
```

## 🎨 前端實現

### Swap 組件（React + TypeScript）

```typescript
import { useState } from 'react';
import { useAccount, useContractWrite } from 'wagmi';
import { parseEther } from 'viem';
import DEXRouterABI from '../contracts/DEXRouter.json';

export function SwapComponent() {
  const { address } = useAccount();
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amountIn, setAmountIn] = useState('');
  const [amountOutMin, setAmountOutMin] = useState('');

  const { write: swap } = useContractWrite({
    address: '0x...', // Router address
    abi: DEXRouterABI,
    functionName: 'swapExactTokensForTokens',
  });

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn) return;

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 分鐘

    swap({
      args: [
        parseEther(amountIn),
        parseEther(amountOutMin),
        [tokenIn, tokenOut],
        address,
        deadline
      ]
    });
  };

  return (
    <div className="swap-container">
      <h2>交換代幣</h2>
      <div className="input-group">
        <input
          type="text"
          placeholder="輸入代幣地址"
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
        />
        <input
          type="number"
          placeholder="輸入數量"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
        />
      </div>

      <div className="swap-arrow">↓</div>

      <div className="input-group">
        <input
          type="text"
          placeholder="輸出代幣地址"
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
        />
        <input
          type="number"
          placeholder="最小輸出數量"
          value={amountOutMin}
          onChange={(e) => setAmountOutMin(e.target.value)}
          readOnly
        />
      </div>

      <button onClick={handleSwap} className="swap-button">
        交換
      </button>
    </div>
  );
}
```

## 🧪 測試

### 單元測試（Hardhat）

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DEX", function () {
  let factory, router, pair;
  let tokenA, tokenB;
  let owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    // 部署代幣
    const Token = await ethers.getContractFactory("ERC20Mock");
    tokenA = await Token.deploy("Token A", "TKA");
    tokenB = await Token.deploy("Token B", "TKB");

    // 部署 DEX
    const Factory = await ethers.getContractFactory("DEXFactory");
    factory = await Factory.deploy();

    const Router = await ethers.getContractFactory("DEXRouter");
    router = await Router.deploy(factory.address);

    // 創建交易對
    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    pair = await ethers.getContractAt("DEXPair", pairAddress);
  });

  describe("添加流動性", function () {
    it("應該成功添加流動性", async function () {
      const amountA = ethers.utils.parseEther("100");
      const amountB = ethers.utils.parseEther("100");

      await tokenA.approve(router.address, amountA);
      await tokenB.approve(router.address, amountB);

      await router.addLiquidity(
        tokenA.address,
        tokenB.address,
        amountA,
        amountB,
        0,
        0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20
      );

      expect(await pair.balanceOf(owner.address)).to.be.gt(0);
    });
  });

  describe("交換代幣", function () {
    beforeEach(async function () {
      // 先添加流動性
      const amountA = ethers.utils.parseEther("1000");
      const amountB = ethers.utils.parseEther("1000");

      await tokenA.approve(router.address, amountA);
      await tokenB.approve(router.address, amountB);

      await router.addLiquidity(
        tokenA.address, tokenB.address,
        amountA, amountB, 0, 0,
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20
      );
    });

    it("應該成功交換代幣", async function () {
      const swapAmount = ethers.utils.parseEther("10");
      await tokenA.approve(router.address, swapAmount);

      const balanceBefore = await tokenB.balanceOf(owner.address);

      await router.swapExactTokensForTokens(
        swapAmount,
        0,
        [tokenA.address, tokenB.address],
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20
      );

      const balanceAfter = await tokenB.balanceOf(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("應該遵守恆定乘積公式", async function () {
      const [reserve0Before, reserve1Before] = await pair.getReserves();
      const kBefore = reserve0Before.mul(reserve1Before);

      const swapAmount = ethers.utils.parseEther("10");
      await tokenA.approve(router.address, swapAmount);

      await router.swapExactTokensForTokens(
        swapAmount, 0,
        [tokenA.address, tokenB.address],
        owner.address,
        Math.floor(Date.now() / 1000) + 60 * 20
      );

      const [reserve0After, reserve1After] = await pair.getReserves();
      const kAfter = reserve0After.mul(reserve1After);

      // K 值應該增加（因為有手續費）
      expect(kAfter).to.be.gte(kBefore);
    });
  });
});
```

## 🚀 部署

### 部署腳本

```javascript
const hre = require("hardhat");

async function main() {
  // 部署 Factory
  const Factory = await hre.ethers.getContractFactory("DEXFactory");
  const factory = await Factory.deploy();
  await factory.deployed();
  console.log("Factory deployed to:", factory.address);

  // 部署 Router
  const Router = await hre.ethers.getContractFactory("DEXRouter");
  const router = await Router.deploy(factory.address);
  await router.deployed();
  console.log("Router deployed to:", router.address);

  // 驗證合約
  await hre.run("verify:verify", {
    address: factory.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: router.address,
    constructorArguments: [factory.address],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## 📊 專案文件

```
dex-swap/
├── contracts/
│   ├── core/
│   │   ├── DEXFactory.sol
│   │   ├── DEXPair.sol
│   │   └── DEXRouter.sol
│   ├── libraries/
│   │   ├── Math.sol
│   │   └── UQ112x112.sol
│   └── interfaces/
│       └── IDEX.sol
├── scripts/
│   └── deploy.js
├── test/
│   └── DEX.test.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
├── hardhat.config.js
├── package.json
└── README.md
```

## 📚 參考資源

- [Uniswap V2 白皮書](https://uniswap.org/whitepaper.pdf)
- [Uniswap V2 Core 源碼](https://github.com/Uniswap/v2-core)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)

## 🎯 未來改進

- [ ] 支持 ETH/WETH 交換
- [ ] 多跳路由優化
- [ ] Flash Swap 功能
- [ ] 價格影響警告
- [ ] 歷史數據圖表
- [ ] 移動端支持

---

[返回 DeFi Projects](../README.md)
