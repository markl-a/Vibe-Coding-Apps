const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("VibeNFT", function () {
  async function deployVibeNFTFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const VibeNFT = await ethers.getContractFactory("VibeNFT");
    const vibeNFT = await VibeNFT.deploy(
      "Vibe NFT",
      "VIBE",
      1000, // maxSupply
      ethers.parseEther("0.01"), // mintPrice
      500, // 5% royalty
      3 // maxMintPerAddress
    );

    return { vibeNFT, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { vibeNFT } = await loadFixture(deployVibeNFTFixture);
      expect(await vibeNFT.name()).to.equal("Vibe NFT");
      expect(await vibeNFT.symbol()).to.equal("VIBE");
    });

    it("Should set the correct max supply", async function () {
      const { vibeNFT } = await loadFixture(deployVibeNFTFixture);
      expect(await vibeNFT.maxSupply()).to.equal(1000);
    });

    it("Should set the correct mint price", async function () {
      const { vibeNFT } = await loadFixture(deployVibeNFTFixture);
      expect(await vibeNFT.mintPrice()).to.equal(ethers.parseEther("0.01"));
    });

    it("Should set the correct royalty", async function () {
      const { vibeNFT } = await loadFixture(deployVibeNFTFixture);
      expect(await vibeNFT.royaltyBasisPoints()).to.equal(500);
    });

    it("Should set the correct owner", async function () {
      const { vibeNFT, owner } = await loadFixture(deployVibeNFTFixture);
      expect(await vibeNFT.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT with correct payment", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      await expect(
        vibeNFT
          .connect(addr1)
          .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") })
      )
        .to.emit(vibeNFT, "NFTMinted")
        .withArgs(addr1.address, 0, "ipfs://test");

      expect(await vibeNFT.ownerOf(0)).to.equal(addr1.address);
      expect(await vibeNFT.tokenURI(0)).to.equal("ipfs://test");
    });

    it("Should fail to mint without sufficient payment", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      await expect(
        vibeNFT
          .connect(addr1)
          .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should respect max mint per address", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      // Mint 3 NFTs (max)
      for (let i = 0; i < 3; i++) {
        await vibeNFT
          .connect(addr1)
          .mint(addr1.address, `ipfs://test${i}`, {
            value: ethers.parseEther("0.01"),
          });
      }

      // Try to mint 4th NFT
      await expect(
        vibeNFT
          .connect(addr1)
          .mint(addr1.address, "ipfs://test3", { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Max mint per address reached");
    });

    it("Should fail to mint when paused", async function () {
      const { vibeNFT, owner, addr1 } = await loadFixture(deployVibeNFTFixture);

      await vibeNFT.connect(owner).pause();

      await expect(
        vibeNFT
          .connect(addr1)
          .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") })
      ).to.be.revertedWithCustomError(vibeNFT, "EnforcedPause");
    });

    it("Should track total supply correctly", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      expect(await vibeNFT.totalSupply()).to.equal(0);

      await vibeNFT
        .connect(addr1)
        .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") });

      expect(await vibeNFT.totalSupply()).to.equal(1);
    });
  });

  describe("Batch Minting", function () {
    it("Should batch mint NFTs (owner only)", async function () {
      const { vibeNFT, owner, addr1 } = await loadFixture(deployVibeNFTFixture);

      const uris = ["ipfs://1", "ipfs://2", "ipfs://3"];
      await vibeNFT.connect(owner).batchMint(addr1.address, uris);

      expect(await vibeNFT.balanceOf(addr1.address)).to.equal(3);
      expect(await vibeNFT.tokenURI(0)).to.equal("ipfs://1");
      expect(await vibeNFT.tokenURI(1)).to.equal("ipfs://2");
      expect(await vibeNFT.tokenURI(2)).to.equal("ipfs://3");
    });

    it("Should fail batch mint if not owner", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      await expect(
        vibeNFT.connect(addr1).batchMint(addr1.address, ["ipfs://1"])
      ).to.be.revertedWithCustomError(vibeNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Whitelist", function () {
    it("Should respect whitelist when active", async function () {
      const { vibeNFT, owner, addr1, addr2 } = await loadFixture(
        deployVibeNFTFixture
      );

      // Activate whitelist
      await vibeNFT.connect(owner).setWhitelistActive(true);

      // Add addr1 to whitelist
      await vibeNFT.connect(owner).updateWhitelist([addr1.address], true);

      // addr1 should be able to mint
      await expect(
        vibeNFT
          .connect(addr1)
          .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") })
      ).to.not.be.reverted;

      // addr2 should not be able to mint
      await expect(
        vibeNFT
          .connect(addr2)
          .mint(addr2.address, "ipfs://test", { value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("Not whitelisted");
    });
  });

  describe("Royalties", function () {
    it("Should return correct royalty info", async function () {
      const { vibeNFT, owner, addr1 } = await loadFixture(deployVibeNFTFixture);

      // Mint an NFT
      await vibeNFT
        .connect(addr1)
        .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") });

      // Check royalty info
      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await vibeNFT.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(owner.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.05")); // 5% of 1 ETH
    });

    it("Should allow owner to update royalty", async function () {
      const { vibeNFT, owner, addr1 } = await loadFixture(deployVibeNFTFixture);

      await vibeNFT.connect(owner).setDefaultRoyalty(addr1.address, 1000); // 10%

      expect(await vibeNFT.royaltyBasisPoints()).to.equal(1000);

      // Mint an NFT
      await vibeNFT
        .connect(addr1)
        .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") });

      const salePrice = ethers.parseEther("1");
      const [receiver, royaltyAmount] = await vibeNFT.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(addr1.address);
      expect(royaltyAmount).to.equal(ethers.parseEther("0.1")); // 10% of 1 ETH
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update mint price", async function () {
      const { vibeNFT, owner } = await loadFixture(deployVibeNFTFixture);

      await vibeNFT.connect(owner).updateMintPrice(ethers.parseEther("0.02"));
      expect(await vibeNFT.mintPrice()).to.equal(ethers.parseEther("0.02"));
    });

    it("Should allow owner to decrease max supply", async function () {
      const { vibeNFT, owner } = await loadFixture(deployVibeNFTFixture);

      await vibeNFT.connect(owner).updateMaxSupply(500);
      expect(await vibeNFT.maxSupply()).to.equal(500);
    });

    it("Should not allow increasing max supply", async function () {
      const { vibeNFT, owner } = await loadFixture(deployVibeNFTFixture);

      await expect(
        vibeNFT.connect(owner).updateMaxSupply(2000)
      ).to.be.revertedWith("Can only decrease max supply");
    });

    it("Should allow owner to withdraw funds", async function () {
      const { vibeNFT, owner, addr1 } = await loadFixture(deployVibeNFTFixture);

      // Mint an NFT
      await vibeNFT
        .connect(addr1)
        .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await vibeNFT.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter - balanceBefore + gasCost).to.equal(
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Utility Functions", function () {
    it("Should correctly check if address can mint", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      expect(await vibeNFT.canMint(addr1.address)).to.be.true;

      // Mint max amount
      for (let i = 0; i < 3; i++) {
        await vibeNFT
          .connect(addr1)
          .mint(addr1.address, `ipfs://test${i}`, {
            value: ethers.parseEther("0.01"),
          });
      }

      expect(await vibeNFT.canMint(addr1.address)).to.be.false;
    });
  });

  describe("ERC721 Standard", function () {
    it("Should support ERC721 interface", async function () {
      const { vibeNFT } = await loadFixture(deployVibeNFTFixture);

      // ERC721 interface ID
      expect(await vibeNFT.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC2981 interface", async function () {
      const { vibeNFT } = await loadFixture(deployVibeNFTFixture);

      // ERC2981 interface ID
      expect(await vibeNFT.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("Should allow burning tokens", async function () {
      const { vibeNFT, addr1 } = await loadFixture(deployVibeNFTFixture);

      await vibeNFT
        .connect(addr1)
        .mint(addr1.address, "ipfs://test", { value: ethers.parseEther("0.01") });

      await vibeNFT.connect(addr1).burn(0);

      await expect(vibeNFT.ownerOf(0)).to.be.revertedWithCustomError(
        vibeNFT,
        "ERC721NonexistentToken"
      );
    });
  });
});
