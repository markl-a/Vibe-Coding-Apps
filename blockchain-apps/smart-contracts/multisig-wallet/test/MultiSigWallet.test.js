const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  let wallet;
  let owners, addr1, addr2;

  beforeEach(async function () {
    [owner1, owner2, owner3, addr1, addr2] = await ethers.getSigners();

    const MultiSig = await ethers.getContractFactory("MultiSigWallet");
    wallet = await MultiSig.deploy(
      [owner1.address, owner2.address, owner3.address],
      2, // require 2 approvals
      ethers.utils.parseEther("1") // daily limit: 1 ETH
    );
    await wallet.deployed();

    // Fund the wallet
    await owner1.sendTransaction({
      to: wallet.address,
      value: ethers.utils.parseEther("10"),
    });
  });

  describe("Deployment", function () {
    it("Should set correct owners", async function () {
      const owners = await wallet.getOwners();
      expect(owners).to.include(owner1.address);
      expect(owners).to.include(owner2.address);
      expect(owners).to.include(owner3.address);
    });

    it("Should set correct requirement", async function () {
      expect(await wallet.required()).to.equal(2);
    });

    it("Should have correct balance", async function () {
      expect(await wallet.getBalance()).to.equal(ethers.utils.parseEther("10"));
    });
  });

  describe("Transactions", function () {
    it("Should submit transaction", async function () {
      await expect(
        wallet.submitTransaction(
          addr1.address,
          ethers.utils.parseEther("0.5"),
          "0x"
        )
      )
        .to.emit(wallet, "SubmitTransaction")
        .withArgs(owner1.address, 0, addr1.address, ethers.utils.parseEther("0.5"), "0x");
    });

    it("Should approve and execute transaction", async function () {
      await wallet.submitTransaction(addr1.address, ethers.utils.parseEther("0.5"), "0x");

      await wallet.connect(owner1).approveTransaction(0);
      await wallet.connect(owner2).approveTransaction(0);

      const balanceBefore = await addr1.getBalance();
      await wallet.connect(owner1).executeTransaction(0);
      const balanceAfter = await addr1.getBalance();

      expect(balanceAfter.sub(balanceBefore)).to.equal(ethers.utils.parseEther("0.5"));
    });

    it("Should fail without enough approvals", async function () {
      await wallet.submitTransaction(addr1.address, ethers.utils.parseEther("0.5"), "0x");
      await wallet.connect(owner1).approveTransaction(0);

      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("Not enough approvals");
    });

    it("Should revoke approval", async function () {
      await wallet.submitTransaction(addr1.address, ethers.utils.parseEther("0.5"), "0x");
      await wallet.connect(owner1).approveTransaction(0);

      await expect(wallet.connect(owner1).revokeApproval(0))
        .to.emit(wallet, "RevokeApproval");

      const tx = await wallet.getTransaction(0);
      expect(tx.numApprovals).to.equal(0);
    });

    it("Should respect daily limit", async function () {
      await wallet.submitTransaction(addr1.address, ethers.utils.parseEther("2"), "0x");
      await wallet.connect(owner1).approveTransaction(0);
      await wallet.connect(owner2).approveTransaction(0);

      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("Exceeds daily limit");
    });
  });

  describe("Owner Management", function () {
    it("Should add owner", async function () {
      await expect(wallet.addOwner(addr1.address))
        .to.emit(wallet, "OwnerAdded")
        .withArgs(addr1.address);

      expect(await wallet.isOwner(addr1.address)).to.be.true;
    });

    it("Should remove owner", async function () {
      await expect(wallet.removeOwner(owner3.address))
        .to.emit(wallet, "OwnerRemoved");

      expect(await wallet.isOwner(owner3.address)).to.be.false;
    });

    it("Should change requirement", async function () {
      await wallet.changeRequirement(3);
      expect(await wallet.required()).to.equal(3);
    });
  });

  describe("Emergency Functions", function () {
    it("Should freeze wallet", async function () {
      await wallet.toggleFreeze();
      expect(await wallet.frozen()).to.be.true;

      await wallet.submitTransaction(addr1.address, ethers.utils.parseEther("0.5"), "0x");
      await wallet.connect(owner1).approveTransaction(0);
      await wallet.connect(owner2).approveTransaction(0);

      await expect(
        wallet.connect(owner1).executeTransaction(0)
      ).to.be.revertedWith("Wallet is frozen");
    });
  });
});
