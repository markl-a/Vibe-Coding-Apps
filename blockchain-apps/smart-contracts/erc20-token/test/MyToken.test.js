const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MyToken", function () {
  let token;
  let owner, addr1, addr2, addr3;

  const INITIAL_SUPPLY = ethers.utils.parseEther("100000000"); // 100 million
  const MAX_SUPPLY = ethers.utils.parseEther("1000000000"); // 1 billion

  beforeEach(async function () {
    [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should assign initial supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("MyToken");
      expect(await token.symbol()).to.equal("MTK");
    });

    it("Should have correct decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should have correct max supply", async function () {
      expect(await token.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.utils.parseEther("100");

      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);

      await token.connect(addr1).transfer(addr2.address, amount);
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);

      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await token.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await token.balanceOf(owner.address);
      const amount1 = ethers.utils.parseEther("100");
      const amount2 = ethers.utils.parseEther("50");

      await token.transfer(addr1.address, amount1);
      await token.transfer(addr2.address, amount2);

      const finalOwnerBalance = await token.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(amount1).sub(amount2));

      expect(await token.balanceOf(addr1.address)).to.equal(amount1);
      expect(await token.balanceOf(addr2.address)).to.equal(amount2);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens by owner", async function () {
      const amount = ethers.utils.parseEther("1000");
      await expect(token.mint(addr1.address, amount))
        .to.emit(token, "TokensMinted")
        .withArgs(addr1.address, amount);

      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const amount = ethers.utils.parseEther("1000");
      await expect(
        token.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should respect max supply", async function () {
      const currentSupply = await token.totalSupply();
      const overAmount = MAX_SUPPLY.sub(currentSupply).add(1);

      await expect(
        token.mint(addr1.address, overAmount)
      ).to.be.revertedWith("MyToken: Exceeds max supply");
    });

    it("Should allow minting up to max supply", async function () {
      const currentSupply = await token.totalSupply();
      const remainingSupply = MAX_SUPPLY.sub(currentSupply);

      await token.mint(addr1.address, remainingSupply);
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    });
  });

  describe("Burning", function () {
    it("Should burn tokens", async function () {
      const burnAmount = ethers.utils.parseEther("1000");
      const initialBalance = await token.balanceOf(owner.address);
      const initialSupply = await token.totalSupply();

      await token.burn(burnAmount);

      expect(await token.balanceOf(owner.address)).to.equal(
        initialBalance.sub(burnAmount)
      );
      expect(await token.totalSupply()).to.equal(
        initialSupply.sub(burnAmount)
      );
    });

    it("Should allow burning from approved address", async function () {
      const amount = ethers.utils.parseEther("1000");
      await token.transfer(addr1.address, amount);
      await token.connect(addr1).approve(addr2.address, amount);

      await token.connect(addr2).burnFrom(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should fail if trying to burn more than balance", async function () {
      const balance = await token.balanceOf(owner.address);
      await expect(
        token.burn(balance.add(1))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;

      await token.unpause();
      expect(await token.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      await token.pause();

      await expect(
        token.transfer(addr1.address, 100)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow transfers when unpaused", async function () {
      const amount = ethers.utils.parseEther("100");

      await token.pause();
      await token.unpause();

      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if non-owner tries to pause", async function () {
      await expect(
        token.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Snapshot", function () {
    it("Should create snapshot", async function () {
      await expect(token.snapshot())
        .to.emit(token, "SnapshotCreated")
        .withArgs(1);
    });

    it("Should record balance at snapshot", async function () {
      const amount = ethers.utils.parseEther("1000");
      await token.transfer(addr1.address, amount);

      await token.snapshot();

      await token.connect(addr1).transfer(addr2.address, amount);

      expect(await token.balanceOfAt(addr1.address, 1)).to.equal(amount);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should handle multiple snapshots", async function () {
      const amount = ethers.utils.parseEther("1000");

      await token.transfer(addr1.address, amount);
      await token.snapshot(); // Snapshot 1

      await token.connect(addr1).transfer(addr2.address, amount);
      await token.snapshot(); // Snapshot 2

      expect(await token.balanceOfAt(addr1.address, 1)).to.equal(amount);
      expect(await token.balanceOfAt(addr1.address, 2)).to.equal(0);
      expect(await token.balanceOfAt(addr2.address, 2)).to.equal(amount);
    });

    it("Should fail if non-owner tries to create snapshot", async function () {
      await expect(
        token.connect(addr1).snapshot()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Voting", function () {
    it("Should delegate votes", async function () {
      const amount = ethers.utils.parseEther("1000");
      await token.transfer(addr1.address, amount);

      await token.connect(addr1).delegate(addr2.address);

      expect(await token.getVotes(addr2.address)).to.equal(amount);
    });

    it("Should self-delegate to enable voting", async function () {
      await token.delegate(owner.address);

      expect(await token.getVotes(owner.address)).to.be.gt(0);
    });

    it("Should update votes after delegation", async function () {
      const amount = ethers.utils.parseEther("1000");

      await token.delegate(owner.address);
      const initialVotes = await token.getVotes(owner.address);

      await token.transfer(addr1.address, amount);
      await token.connect(addr1).delegate(owner.address);

      expect(await token.getVotes(owner.address)).to.equal(
        initialVotes.add(amount)
      );
    });

    it("Should get past votes at checkpoint", async function () {
      const amount = ethers.utils.parseEther("1000");

      await token.delegate(owner.address);
      await ethers.provider.send("evm_mine");
      const blockNumber = await ethers.provider.getBlockNumber();

      await token.transfer(addr1.address, amount);

      const pastVotes = await token.getPastVotes(owner.address, blockNumber);
      expect(pastVotes).to.be.gt(0);
    });
  });

  describe("Permit", function () {
    it("Should have correct domain separator", async function () {
      const domain = await token.DOMAIN_SEPARATOR();
      expect(domain).to.be.properHex(64);
    });

    it("Should return correct nonce", async function () {
      expect(await token.nonces(owner.address)).to.equal(0);
    });

    // Note: Full permit signature testing requires additional setup
    // This is a placeholder for the permit functionality verification
  });

  describe("Approval", function () {
    it("Should approve tokens for transfer", async function () {
      const amount = ethers.utils.parseEther("100");

      await token.approve(addr1.address, amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Should transfer from approved address", async function () {
      const amount = ethers.utils.parseEther("100");

      await token.approve(addr1.address, amount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should decrease allowance after transferFrom", async function () {
      const amount = ethers.utils.parseEther("100");
      const transferAmount = ethers.utils.parseEther("50");

      await token.approve(addr1.address, amount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(
        amount.sub(transferAmount)
      );
    });
  });

  describe("Complex scenarios", function () {
    it("Should handle pause during snapshot", async function () {
      const amount = ethers.utils.parseEther("1000");

      await token.transfer(addr1.address, amount);
      await token.snapshot();
      await token.pause();

      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWith("Pausable: paused");

      await token.unpause();
      await token.connect(addr1).transfer(addr2.address, amount);

      expect(await token.balanceOfAt(addr1.address, 1)).to.equal(amount);
      expect(await token.balanceOf(addr2.address)).to.equal(amount);
    });

    it("Should handle voting with snapshots", async function () {
      const amount = ethers.utils.parseEther("1000");

      await token.transfer(addr1.address, amount);
      await token.connect(addr1).delegate(addr1.address);

      await token.snapshot();
      const votes1 = await token.getVotes(addr1.address);

      await token.mint(addr1.address, amount);
      await token.snapshot();
      const votes2 = await token.getVotes(addr1.address);

      expect(votes2).to.equal(votes1.add(amount));
    });
  });
});
