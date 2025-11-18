const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("DEX Swap Protocol", function () {
  async function deployDEXFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    // 部署 ERC20 Mock 代幣
    const Token = await ethers.getContractFactory("ERC20Mock");
    const tokenA = await Token.deploy("Token A", "TKA");
    const tokenB = await Token.deploy("Token B", "TKB");
    const tokenC = await Token.deploy("Token C", "TKC");

    await tokenA.waitForDeployment();
    await tokenB.waitForDeployment();
    await tokenC.waitForDeployment();

    // 部署 Factory
    const Factory = await ethers.getContractFactory("DEXFactory");
    const factory = await Factory.deploy();
    await factory.waitForDeployment();

    // 部署 Router
    const Router = await ethers.getContractFactory("DEXRouter");
    const router = await Router.deploy(await factory.getAddress());
    await router.waitForDeployment();

    // 給測試用戶分配代幣
    const initialAmount = ethers.parseEther("10000");
    await tokenA.mint(addr1.address, initialAmount);
    await tokenB.mint(addr1.address, initialAmount);
    await tokenC.mint(addr1.address, initialAmount);

    return { factory, router, tokenA, tokenB, tokenC, owner, addr1, addr2 };
  }

  describe("Factory", function () {
    it("應該成功創建交易對", async function () {
      const { factory, tokenA, tokenB } = await loadFixture(deployDEXFixture);

      await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());

      const pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );

      expect(pairAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("不應該允許創建相同的交易對兩次", async function () {
      const { factory, tokenA, tokenB } = await loadFixture(deployDEXFixture);

      await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());

      await expect(
        factory.createPair(await tokenA.getAddress(), await tokenB.getAddress())
      ).to.be.revertedWith("DEXFactory: PAIR_EXISTS");
    });

    it("應該正確追蹤所有交易對", async function () {
      const { factory, tokenA, tokenB, tokenC } = await loadFixture(deployDEXFixture);

      await factory.createPair(await tokenA.getAddress(), await tokenB.getAddress());
      await factory.createPair(await tokenA.getAddress(), await tokenC.getAddress());

      expect(await factory.allPairsLength()).to.equal(2);
    });
  });

  describe("流動性管理", function () {
    it("應該成功添加流動性", async function () {
      const { router, factory, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("100");

      // 授權
      await tokenA.connect(addr1).approve(await router.getAddress(), amountA);
      await tokenB.connect(addr1).approve(await router.getAddress(), amountB);

      // 添加流動性
      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        addr1.address,
        deadline
      );

      // 檢查交易對是否創建
      const pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      expect(pairAddress).to.not.equal(ethers.ZeroAddress);

      // 檢查 LP 代幣餘額
      const Pair = await ethers.getContractFactory("DEXPair");
      const pair = Pair.attach(pairAddress);
      const lpBalance = await pair.balanceOf(addr1.address);
      expect(lpBalance).to.be.gt(0);
    });

    it("應該成功移除流動性", async function () {
      const { router, factory, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      const amountA = ethers.parseEther("100");
      const amountB = ethers.parseEther("100");

      // 添加流動性
      await tokenA.connect(addr1).approve(await router.getAddress(), amountA);
      await tokenB.connect(addr1).approve(await router.getAddress(), amountB);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        addr1.address,
        deadline
      );

      // 獲取 LP 代幣餘額
      const pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      const Pair = await ethers.getContractFactory("DEXPair");
      const pair = Pair.attach(pairAddress);
      const lpBalance = await pair.balanceOf(addr1.address);

      // 移除流動性
      await pair.connect(addr1).approve(await router.getAddress(), lpBalance);

      const balanceABefore = await tokenA.balanceOf(addr1.address);
      const balanceBBefore = await tokenB.balanceOf(addr1.address);

      await router.connect(addr1).removeLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        lpBalance,
        0,
        0,
        addr1.address,
        deadline
      );

      // 檢查代幣是否返回
      const balanceAAfter = await tokenA.balanceOf(addr1.address);
      const balanceBAfter = await tokenB.balanceOf(addr1.address);

      expect(balanceAAfter).to.be.gt(balanceABefore);
      expect(balanceBAfter).to.be.gt(balanceBBefore);
    });

    it("應該在不同比例下正確計算流動性", async function () {
      const { router, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      const amountA1 = ethers.parseEther("100");
      const amountB1 = ethers.parseEther("200");

      await tokenA.connect(addr1).approve(await router.getAddress(), amountA1);
      await tokenB.connect(addr1).approve(await router.getAddress(), amountB1);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA1,
        amountB1,
        0,
        0,
        addr1.address,
        deadline
      );

      // 添加更多流動性（相同比例）
      const amountA2 = ethers.parseEther("50");
      const amountB2 = ethers.parseEther("100");

      await tokenA.connect(addr1).approve(await router.getAddress(), amountA2);
      await tokenB.connect(addr1).approve(await router.getAddress(), amountB2);

      await router.connect(addr1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA2,
        amountB2,
        0,
        0,
        addr1.address,
        deadline
      );

      // 驗證流動性增加
      const pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      const Pair = await ethers.getContractFactory("DEXPair");
      const pair = Pair.attach(pairAddress);
      const reserves = await pair.getReserves();

      expect(reserves[0]).to.be.gt(amountA1);
      expect(reserves[1]).to.be.gt(amountB1);
    });
  });

  describe("代幣交換", function () {
    async function addInitialLiquidity(router, tokenA, tokenB, addr1) {
      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");

      await tokenA.connect(addr1).approve(await router.getAddress(), amountA);
      await tokenB.connect(addr1).approve(await router.getAddress(), amountB);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        addr1.address,
        deadline
      );
    }

    it("應該成功交換代幣", async function () {
      const { router, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      await addInitialLiquidity(router, tokenA, tokenB, addr1);

      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(addr1).approve(await router.getAddress(), swapAmount);

      const balanceBBefore = await tokenB.balanceOf(addr1.address);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).swapExactTokensForTokens(
        swapAmount,
        0,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        addr1.address,
        deadline
      );

      const balanceBAfter = await tokenB.balanceOf(addr1.address);
      expect(balanceBAfter).to.be.gt(balanceBBefore);
    });

    it("應該遵守恆定乘積公式 (x * y = k)", async function () {
      const { router, factory, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      await addInitialLiquidity(router, tokenA, tokenB, addr1);

      const pairAddress = await factory.getPair(
        await tokenA.getAddress(),
        await tokenB.getAddress()
      );
      const Pair = await ethers.getContractFactory("DEXPair");
      const pair = Pair.attach(pairAddress);

      const reservesBefore = await pair.getReserves();
      const kBefore = reservesBefore[0] * reservesBefore[1];

      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(addr1).approve(await router.getAddress(), swapAmount);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).swapExactTokensForTokens(
        swapAmount,
        0,
        [await tokenA.getAddress(), await tokenB.getAddress()],
        addr1.address,
        deadline
      );

      const reservesAfter = await pair.getReserves();
      const kAfter = reservesAfter[0] * reservesAfter[1];

      // K 值應該增加（因為有手續費）
      expect(kAfter).to.be.gte(kBefore);
    });

    it("應該正確計算交換數量", async function () {
      const { router, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      await addInitialLiquidity(router, tokenA, tokenB, addr1);

      const amountIn = ethers.parseEther("10");
      const amounts = await router.getAmountsOut(
        amountIn,
        [await tokenA.getAddress(), await tokenB.getAddress()]
      );

      expect(amounts[0]).to.equal(amountIn);
      expect(amounts[1]).to.be.gt(0);

      // 因為有 0.3% 手續費，輸出應該少於輸入
      expect(amounts[1]).to.be.lt(amountIn);
    });

    it("應該支持多跳交換", async function () {
      const { router, tokenA, tokenB, tokenC, addr1 } = await loadFixture(deployDEXFixture);

      // 添加 A-B 和 B-C 流動性
      await addInitialLiquidity(router, tokenA, tokenB, addr1);
      await addInitialLiquidity(router, tokenB, tokenC, addr1);

      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(addr1).approve(await router.getAddress(), swapAmount);

      const balanceCBefore = await tokenC.balanceOf(addr1.address);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).swapExactTokensForTokens(
        swapAmount,
        0,
        [await tokenA.getAddress(), await tokenB.getAddress(), await tokenC.getAddress()],
        addr1.address,
        deadline
      );

      const balanceCAfter = await tokenC.balanceOf(addr1.address);
      expect(balanceCAfter).to.be.gt(balanceCBefore);
    });

    it("應該在滑點過大時拒絕交易", async function () {
      const { router, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      await addInitialLiquidity(router, tokenA, tokenB, addr1);

      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(addr1).approve(await router.getAddress(), swapAmount);

      const deadline = (await time.latest()) + 60 * 20;

      // 設置一個不可能達到的最小輸出量
      await expect(
        router.connect(addr1).swapExactTokensForTokens(
          swapAmount,
          ethers.parseEther("100"), // 期望獲得比可能的更多
          [await tokenA.getAddress(), await tokenB.getAddress()],
          addr1.address,
          deadline
        )
      ).to.be.revertedWith("DEXRouter: INSUFFICIENT_OUTPUT_AMOUNT");
    });

    it("應該在過期時拒絕交易", async function () {
      const { router, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      await addInitialLiquidity(router, tokenA, tokenB, addr1);

      const swapAmount = ethers.parseEther("10");
      await tokenA.connect(addr1).approve(await router.getAddress(), swapAmount);

      // 使用過去的時間戳
      const deadline = (await time.latest()) - 1;

      await expect(
        router.connect(addr1).swapExactTokensForTokens(
          swapAmount,
          0,
          [await tokenA.getAddress(), await tokenB.getAddress()],
          addr1.address,
          deadline
        )
      ).to.be.revertedWith("DEXRouter: EXPIRED");
    });
  });

  describe("價格影響", function () {
    it("大額交易應該有更大的價格影響", async function () {
      const { router, tokenA, tokenB, addr1 } = await loadFixture(deployDEXFixture);

      const amountA = ethers.parseEther("1000");
      const amountB = ethers.parseEther("1000");

      await tokenA.connect(addr1).approve(await router.getAddress(), amountA);
      await tokenB.connect(addr1).approve(await router.getAddress(), amountB);

      const deadline = (await time.latest()) + 60 * 20;
      await router.connect(addr1).addLiquidity(
        await tokenA.getAddress(),
        await tokenB.getAddress(),
        amountA,
        amountB,
        0,
        0,
        addr1.address,
        deadline
      );

      // 小額交換
      const smallSwap = ethers.parseEther("1");
      const smallAmounts = await router.getAmountsOut(
        smallSwap,
        [await tokenA.getAddress(), await tokenB.getAddress()]
      );

      // 大額交換
      const largeSwap = ethers.parseEther("100");
      const largeAmounts = await router.getAmountsOut(
        largeSwap,
        [await tokenA.getAddress(), await tokenB.getAddress()]
      );

      // 計算價格影響
      const smallRate = (smallAmounts[1] * 100n) / smallAmounts[0];
      const largeRate = (largeAmounts[1] * 100n) / largeAmounts[0];

      // 大額交易應該有更低的兌換率（更大的價格影響）
      expect(largeRate).to.be.lt(smallRate);
    });
  });
});
