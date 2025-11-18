const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MyNFT", function () {
  let nft;
  let owner, addr1, addr2, addr3, addr4;
  let merkleTree;
  let merkleRoot;

  const NAME = "MyNFT";
  const SYMBOL = "MNFT";
  const BASE_URI = "ipfs://QmBase/";
  const NOT_REVEALED_URI = "ipfs://QmNotRevealed";

  const MAX_SUPPLY = 10000;
  const MAX_PER_WALLET = 5;
  const WHITELIST_PRICE = ethers.utils.parseEther("0.05");
  const PUBLIC_PRICE = ethers.utils.parseEther("0.08");

  beforeEach(async function () {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    // Create Merkle tree for whitelist
    const whitelistAddresses = [addr1.address, addr2.address, addr3.address];
    const leaves = whitelistAddresses.map(addr => keccak256(addr));
    merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    const NFT = await ethers.getContractFactory("MyNFT");
    nft = await NFT.deploy(NAME, SYMBOL, BASE_URI, NOT_REVEALED_URI);
    await nft.deployed();

    // Set merkle root
    await nft.setMerkleRoot(merkleRoot);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nft.name()).to.equal(NAME);
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("Should have correct initial state", async function () {
      expect(await nft.whitelistMintEnabled()).to.be.false;
      expect(await nft.publicMintEnabled()).to.be.false;
      expect(await nft.revealed()).to.be.false;
    });

    it("Should have correct constants", async function () {
      expect(await nft.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await nft.MAX_PER_WALLET()).to.equal(MAX_PER_WALLET);
      expect(await nft.WHITELIST_PRICE()).to.equal(WHITELIST_PRICE);
      expect(await nft.PUBLIC_PRICE()).to.equal(PUBLIC_PRICE);
    });
  });

  describe("Whitelist Minting", function () {
    beforeEach(async function () {
      await nft.toggleWhitelistMint();
    });

    it("Should mint with valid proof", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).whitelistMint(1, proof, {
          value: WHITELIST_PRICE,
        })
      )
        .to.emit(nft, "Minted")
        .withArgs(addr1.address, 0);

      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(addr1.address);
    });

    it("Should fail with invalid proof", async function () {
      const leaf = keccak256(addr4.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr4).whitelistMint(1, proof, {
          value: WHITELIST_PRICE,
        })
      ).to.be.revertedWithCustomError(nft, "InvalidProof");
    });

    it("Should fail if whitelist mint not active", async function () {
      await nft.toggleWhitelistMint(); // Disable

      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).whitelistMint(1, proof, {
          value: WHITELIST_PRICE,
        })
      ).to.be.revertedWithCustomError(nft, "WhitelistMintNotActive");
    });

    it("Should fail with insufficient payment", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).whitelistMint(1, proof, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWithCustomError(nft, "InsufficientPayment");
    });

    it("Should mint multiple tokens", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await nft.connect(addr1).whitelistMint(3, proof, {
        value: WHITELIST_PRICE.mul(3),
      });

      expect(await nft.balanceOf(addr1.address)).to.equal(3);
    });

    it("Should enforce max per wallet", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await expect(
        nft.connect(addr1).whitelistMint(6, proof, {
          value: WHITELIST_PRICE.mul(6),
        })
      ).to.be.revertedWithCustomError(nft, "ExceedsMaxPerWallet");
    });

    it("Should track minted per wallet", async function () {
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await nft.connect(addr1).whitelistMint(2, proof, {
        value: WHITELIST_PRICE.mul(2),
      });

      expect(await nft.mintedPerWallet(addr1.address)).to.equal(2);

      await nft.connect(addr1).whitelistMint(2, proof, {
        value: WHITELIST_PRICE.mul(2),
      });

      expect(await nft.mintedPerWallet(addr1.address)).to.equal(4);
    });
  });

  describe("Public Minting", function () {
    beforeEach(async function () {
      await nft.togglePublicMint();
    });

    it("Should mint publicly", async function () {
      await expect(
        nft.connect(addr1).publicMint(1, {
          value: PUBLIC_PRICE,
        })
      )
        .to.emit(nft, "Minted")
        .withArgs(addr1.address, 0);

      expect(await nft.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should fail if public mint not active", async function () {
      await nft.togglePublicMint(); // Disable

      await expect(
        nft.connect(addr1).publicMint(1, {
          value: PUBLIC_PRICE,
        })
      ).to.be.revertedWithCustomError(nft, "PublicMintNotActive");
    });

    it("Should mint multiple tokens", async function () {
      await nft.connect(addr1).publicMint(5, {
        value: PUBLIC_PRICE.mul(5),
      });

      expect(await nft.balanceOf(addr1.address)).to.equal(5);
    });

    it("Should enforce max per wallet", async function () {
      await expect(
        nft.connect(addr1).publicMint(6, {
          value: PUBLIC_PRICE.mul(6),
        })
      ).to.be.revertedWithCustomError(nft, "ExceedsMaxPerWallet");
    });

    it("Should fail with insufficient payment", async function () {
      await expect(
        nft.connect(addr1).publicMint(1, {
          value: ethers.utils.parseEther("0.01"),
        })
      ).to.be.revertedWithCustomError(nft, "InsufficientPayment");
    });
  });

  describe("Owner Minting", function () {
    it("Should allow owner to mint for free", async function () {
      await nft.ownerMint(addr1.address, 5);
      expect(await nft.balanceOf(addr1.address)).to.equal(5);
    });

    it("Should fail if non-owner tries to mint", async function () {
      await expect(
        nft.connect(addr1).ownerMint(addr1.address, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should respect max supply", async function () {
      // This would take too long to actually test with 10000,
      // but we can verify the logic
      await expect(
        nft.ownerMint(addr1.address, MAX_SUPPLY + 1)
      ).to.be.revertedWithCustomError(nft, "ExceedsMaxSupply");
    });
  });

  describe("Token URI and Reveal", function () {
    beforeEach(async function () {
      await nft.ownerMint(addr1.address, 1);
    });

    it("Should return not revealed URI before reveal", async function () {
      expect(await nft.tokenURI(0)).to.equal(NOT_REVEALED_URI);
    });

    it("Should return base URI after reveal", async function () {
      await nft.reveal();
      expect(await nft.tokenURI(0)).to.equal(BASE_URI + "0");
    });

    it("Should update base URI", async function () {
      const newBaseURI = "ipfs://QmNewBase/";
      await nft.setBaseURI(newBaseURI);
      await nft.reveal();

      expect(await nft.tokenURI(0)).to.equal(newBaseURI + "0");
    });
  });

  describe("Royalties (ERC2981)", function () {
    it("Should have default royalty", async function () {
      await nft.ownerMint(addr1.address, 1);

      const salePrice = ethers.utils.parseEther("1");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(owner.address);
      expect(royaltyAmount).to.equal(salePrice.mul(500).div(10000)); // 5%
    });

    it("Should set token-specific royalty", async function () {
      await nft.ownerMint(addr1.address, 1);

      await nft.setTokenRoyalty(0, addr2.address, 1000); // 10%

      const salePrice = ethers.utils.parseEther("1");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(addr2.address);
      expect(royaltyAmount).to.equal(salePrice.mul(1000).div(10000)); // 10%
    });

    it("Should update default royalty", async function () {
      await nft.setDefaultRoyalty(addr2.address, 750); // 7.5%
      await nft.ownerMint(addr1.address, 1);

      const salePrice = ethers.utils.parseEther("1");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);

      expect(receiver).to.equal(addr2.address);
      expect(royaltyAmount).to.equal(salePrice.mul(750).div(10000)); // 7.5%
    });
  });

  describe("Enumeration", function () {
    it("Should track total supply", async function () {
      await nft.ownerMint(addr1.address, 3);
      expect(await nft.totalSupply()).to.equal(3);
    });

    it("Should get tokens of owner", async function () {
      await nft.ownerMint(addr1.address, 3);
      const tokens = await nft.tokensOfOwner(addr1.address);

      expect(tokens.length).to.equal(3);
      expect(tokens[0]).to.equal(0);
      expect(tokens[1]).to.equal(1);
      expect(tokens[2]).to.equal(2);
    });

    it("Should enumerate tokens by index", async function () {
      await nft.ownerMint(addr1.address, 2);

      expect(await nft.tokenByIndex(0)).to.equal(0);
      expect(await nft.tokenByIndex(1)).to.equal(1);
    });
  });

  describe("Burning", function () {
    it("Should burn token", async function () {
      await nft.ownerMint(addr1.address, 1);

      await nft.connect(addr1).burn(0);

      await expect(nft.ownerOf(0)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });

    it("Should reset royalty on burn", async function () {
      await nft.ownerMint(addr1.address, 1);
      await nft.setTokenRoyalty(0, addr2.address, 1000);

      await nft.connect(addr1).burn(0);

      // Minting new token with same ID should have default royalty
      await nft.ownerMint(addr1.address, 1);
      const [receiver] = await nft.royaltyInfo(0, ethers.utils.parseEther("1"));
      expect(receiver).to.equal(owner.address); // Default royalty receiver
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause", async function () {
      await nft.pause();
      expect(await nft.paused()).to.be.true;

      await nft.unpause();
      expect(await nft.paused()).to.be.false;
    });

    it("Should prevent transfers when paused", async function () {
      await nft.ownerMint(addr1.address, 1);
      await nft.pause();

      await expect(
        nft.connect(addr1).transferFrom(addr1.address, addr2.address, 0)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Withdrawal", function () {
    it("Should withdraw funds", async function () {
      await nft.togglePublicMint();

      // Mint to generate revenue
      await nft.connect(addr1).publicMint(2, {
        value: PUBLIC_PRICE.mul(2),
      });

      const contractBalance = await ethers.provider.getBalance(nft.address);
      expect(contractBalance).to.equal(PUBLIC_PRICE.mul(2));

      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await nft.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore.add(contractBalance).sub(gasUsed)
      );
    });

    it("Should fail if non-owner tries to withdraw", async function () {
      await expect(
        nft.connect(addr1).withdraw()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Admin Functions", function () {
    it("Should toggle whitelist mint", async function () {
      await expect(nft.toggleWhitelistMint())
        .to.emit(nft, "WhitelistMintToggled")
        .withArgs(true);

      expect(await nft.whitelistMintEnabled()).to.be.true;
    });

    it("Should toggle public mint", async function () {
      await expect(nft.togglePublicMint())
        .to.emit(nft, "PublicMintToggled")
        .withArgs(true);

      expect(await nft.publicMintEnabled()).to.be.true;
    });

    it("Should update merkle root", async function () {
      const newRoot = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("new"));

      await expect(nft.setMerkleRoot(newRoot))
        .to.emit(nft, "MerkleRootUpdated")
        .withArgs(newRoot);

      expect(await nft.merkleRoot()).to.equal(newRoot);
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle whitelist then public mint", async function () {
      // Whitelist mint
      await nft.toggleWhitelistMint();
      const leaf = keccak256(addr1.address);
      const proof = merkleTree.getHexProof(leaf);

      await nft.connect(addr1).whitelistMint(2, proof, {
        value: WHITELIST_PRICE.mul(2),
      });

      // Public mint
      await nft.togglePublicMint();
      await nft.connect(addr1).publicMint(3, {
        value: PUBLIC_PRICE.mul(3),
      });

      expect(await nft.balanceOf(addr1.address)).to.equal(5);
      expect(await nft.mintedPerWallet(addr1.address)).to.equal(5);
    });

    it("Should support interface IDs", async function () {
      // ERC721
      expect(await nft.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC2981
      expect(await nft.supportsInterface("0x2a55205a")).to.be.true;
    });
  });
});
