const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Lending Protocol", function () {
  const PRECISION = ethers.parseEther("1");

  async function deployFixture() {
    const [owner, user1, user2, liquidator] = await ethers.getSigners();

    // 部署測試代幣
    const Token = await ethers.getContractFactory("ERC20Mock");
    const dai = await Token.deploy("DAI", "DAI");
    const usdc = await Token.deploy("USDC", "USDC");

    await dai.waitForDeployment();
    await usdc.waitForDeployment();

    // 部署借貸池
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const pool = await LendingPool.deploy();
    await pool.waitForDeployment();

    // 初始化資產
    await pool.initReserve(
      await dai.getAddress(),
      7500,  // 75% LTV
      8000,  // 80% liquidation threshold
      500,   // 5% liquidation bonus
      "Aave DAI",
      "aDAI"
    );

    await pool.initReserve(
      await usdc.getAddress(),
      8000,  // 80% LTV
      8500,  // 85% liquidation threshold
      500,   // 5% liquidation bonus
      "Aave USDC",
      "aUSDC"
    );

    // 設置價格 (1 DAI = 1 USD, 1 USDC = 1 USD)
    await pool.setAssetPrice(await dai.getAddress(), PRECISION);
    await pool.setAssetPrice(await usdc.getAddress(), PRECISION);

    // 給用戶分配代幣
    const amount = ethers.parseEther("10000");
    await dai.mint(user1.address, amount);
    await usdc.mint(user1.address, amount);
    await dai.mint(user2.address, amount);
    await usdc.mint(user2.address, amount);
    await dai.mint(liquidator.address, amount);

    return { pool, dai, usdc, owner, user1, user2, liquidator };
  }

  describe("存款功能", function () {
    it("應該允許用戶存款", async function () {
      const { pool, dai, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await dai.connect(user1).approve(await pool.getAddress(), amount);
      await expect(pool.connect(user1).deposit(await dai.getAddress(), amount))
        .to.emit(pool, "Deposit")
        .withArgs(user1.address, await dai.getAddress(), amount);

      const reserve = await pool.reserves(await dai.getAddress());
      expect(reserve.totalDeposits).to.equal(amount);
    });

    it("應該鑄造 aToken 給存款人", async function () {
      const { pool, dai, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await dai.connect(user1).approve(await pool.getAddress(), amount);
      await pool.connect(user1).deposit(await dai.getAddress(), amount);

      const reserve = await pool.reserves(await dai.getAddress());
      const AToken = await ethers.getContractFactory("AToken");
      const aToken = AToken.attach(reserve.aTokenAddress);

      expect(await aToken.balanceOf(user1.address)).to.equal(amount);
    });
  });

  describe("提款功能", function () {
    it("應該允許用戶提款", async function () {
      const { pool, dai, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      // 先存款
      await dai.connect(user1).approve(await pool.getAddress(), amount);
      await pool.connect(user1).deposit(await dai.getAddress(), amount);

      // 提款
      const balanceBefore = await dai.balanceOf(user1.address);
      await pool.connect(user1).withdraw(await dai.getAddress(), amount);
      const balanceAfter = await dai.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.equal(amount);
    });

    it("應該在餘額不足時拒絕提款", async function () {
      const { pool, dai, user1 } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("1000");

      await expect(
        pool.connect(user1).withdraw(await dai.getAddress(), amount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("借款功能", function () {
    it("應該允許超額抵押借款", async function () {
      const { pool, dai, usdc, user1 } = await loadFixture(deployFixture);

      // 存入 1000 DAI 作為抵押
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      // 借出 500 USDC (LTV 75%, 可借 750)
      const borrowAmount = ethers.parseEther("500");
      await expect(pool.connect(user1).borrow(await usdc.getAddress(), borrowAmount))
        .to.emit(pool, "Borrow")
        .withArgs(user1.address, await usdc.getAddress(), borrowAmount);

      const userData = await pool.userData(user1.address, await usdc.getAddress());
      expect(userData.borrowed).to.equal(borrowAmount);
    });

    it("應該在抵押不足時拒絕借款", async function () {
      const { pool, dai, usdc, user1 } = await loadFixture(deployFixture);

      // 存入 1000 DAI
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      // 嘗試借出超過 LTV 的金額
      const borrowAmount = ethers.parseEther("800"); // 超過 75% LTV
      await expect(
        pool.connect(user1).borrow(await usdc.getAddress(), borrowAmount)
      ).to.be.revertedWith("Insufficient collateral");
    });
  });

  describe("還款功能", function () {
    it("應該允許用戶還款", async function () {
      const { pool, dai, usdc, user1 } = await loadFixture(deployFixture);

      // 存款並借款
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      const borrowAmount = ethers.parseEther("500");
      await pool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

      // 還款
      await usdc.connect(user1).approve(await pool.getAddress(), borrowAmount);
      await expect(pool.connect(user1).repay(await usdc.getAddress(), borrowAmount))
        .to.emit(pool, "Repay")
        .withArgs(user1.address, await usdc.getAddress(), borrowAmount);

      const userData = await pool.userData(user1.address, await usdc.getAddress());
      expect(userData.borrowed).to.equal(0);
    });
  });

  describe("健康係數", function () {
    it("應該正確計算健康係數", async function () {
      const { pool, dai, usdc, user1 } = await loadFixture(deployFixture);

      // 存入 1000 DAI
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      // 借出 400 USDC
      const borrowAmount = ethers.parseEther("400");
      await pool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

      // 健康係數 = (1000 * 80%) / 400 = 2.0
      const healthFactor = await pool.getHealthFactor(user1.address);
      expect(healthFactor).to.be.closeTo(ethers.parseEther("2"), ethers.parseEther("0.01"));
    });

    it("沒有債務時健康係數應該是最大值", async function () {
      const { pool, dai, user1 } = await loadFixture(deployFixture);

      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      const healthFactor = await pool.getHealthFactor(user1.address);
      expect(healthFactor).to.equal(ethers.MaxUint256);
    });
  });

  describe("清算", function () {
    it("應該允許清算不健康的頭寸", async function () {
      const { pool, dai, usdc, user1, liquidator } = await loadFixture(deployFixture);

      // user1 存入 1000 DAI
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      // user1 借出 750 USDC (接近上限)
      const borrowAmount = ethers.parseEther("750");
      await pool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

      // DAI 價格下跌,導致健康係數 < 1
      await pool.setAssetPrice(await dai.getAddress(), ethers.parseEther("0.9"));

      // 清算
      const debtToCover = ethers.parseEther("375"); // 50%
      await usdc.connect(liquidator).approve(await pool.getAddress(), debtToCover);

      await expect(
        pool.connect(liquidator).liquidate(
          user1.address,
          await dai.getAddress(),
          await usdc.getAddress(),
          debtToCover
        )
      ).to.emit(pool, "Liquidation");

      // 驗證債務減少
      const userData = await pool.userData(user1.address, await usdc.getAddress());
      expect(userData.borrowed).to.equal(borrowAmount - debtToCover);
    });

    it("應該拒絕清算健康的頭寸", async function () {
      const { pool, dai, usdc, user1, liquidator } = await loadFixture(deployFixture);

      // user1 存入 1000 DAI
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      // user1 借出少量 USDC (健康的頭寸)
      const borrowAmount = ethers.parseEther("400");
      await pool.connect(user1).borrow(await usdc.getAddress(), borrowAmount);

      // 嘗試清算
      await usdc.connect(liquidator).approve(await pool.getAddress(), borrowAmount);

      await expect(
        pool.connect(liquidator).liquidate(
          user1.address,
          await dai.getAddress(),
          await usdc.getAddress(),
          borrowAmount
        )
      ).to.be.revertedWith("Health factor OK");
    });
  });

  describe("利率模型", function () {
    it("應該根據利用率更新利率", async function () {
      const { pool, dai, usdc, user1, user2 } = await loadFixture(deployFixture);

      // user1 存入流動性
      const depositAmount = ethers.parseEther("1000");
      await dai.connect(user1).approve(await pool.getAddress(), depositAmount);
      await pool.connect(user1).deposit(await dai.getAddress(), depositAmount);

      const reserveBefore = await pool.reserves(await dai.getAddress());
      const borrowRateBefore = reserveBefore.borrowRate;

      // user2 借款,增加利用率
      await usdc.connect(user2).approve(await pool.getAddress(), depositAmount);
      await usdc.connect(user2).deposit(await usdc.getAddress(), depositAmount);

      const borrowAmount = ethers.parseEther("500");
      await pool.connect(user2).borrow(await dai.getAddress(), borrowAmount);

      const reserveAfter = await pool.reserves(await dai.getAddress());
      const borrowRateAfter = reserveAfter.borrowRate;

      // 利用率提高,借款利率應該上升
      expect(borrowRateAfter).to.be.gt(borrowRateBefore);
    });
  });
});

// Mock ERC20 合約
const ERC20MockCode = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
`;
