const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VibeMarketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, feeRecipient] = await ethers.getSigners();

    // Deploy NFT contract
    const VibeNFT = await ethers.getContractFactory("VibeNFT");
    const vibeNFT = await VibeNFT.deploy(
      "Vibe NFT",
      "VIBE",
      1000,
      ethers.parseEther("0.01"),
      500, // 5% royalty
      10
    );

    // Deploy Marketplace
    const VibeMarketplace = await ethers.getContractFactory("VibeMarketplace");
    const marketplace = await VibeMarketplace.deploy(feeRecipient.address);

    // Mint NFTs for testing
    await vibeNFT
      .connect(seller)
      .mint(seller.address, "ipfs://token1", { value: ethers.parseEther("0.01") });
    await vibeNFT
      .connect(seller)
      .mint(seller.address, "ipfs://token2", { value: ethers.parseEther("0.01") });

    // Approve marketplace
    await vibeNFT.connect(seller).setApprovalForAll(marketplace.target, true);

    return {
      marketplace,
      vibeNFT,
      owner,
      seller,
      buyer,
      feeRecipient,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct fee recipient", async function () {
      const { marketplace, feeRecipient } = await loadFixture(
        deployMarketplaceFixture
      );
      expect(await marketplace.feeRecipient()).to.equal(feeRecipient.address);
    });

    it("Should set the correct platform fee", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.platformFee()).to.equal(250); // 2.5%
    });
  });

  describe("Fixed Price Listings", function () {
    it("Should create a listing", async function () {
      const { marketplace, vibeNFT, seller } = await loadFixture(
        deployMarketplaceFixture
      );

      const price = ethers.parseEther("1");

      await expect(
        marketplace.connect(seller).listItem(vibeNFT.target, 0, price)
      ).to.emit(marketplace, "ItemListed");
    });

    it("Should fail to list without ownership", async function () {
      const { marketplace, vibeNFT, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(
        marketplace
          .connect(buyer)
          .listItem(vibeNFT.target, 0, ethers.parseEther("1"))
      ).to.be.revertedWith("Not token owner");
    });

    it("Should buy a listed item", async function () {
      const { marketplace, vibeNFT, seller, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const price = ethers.parseEther("1");
      const tx = await marketplace.connect(seller).listItem(vibeNFT.target, 0, price);
      const receipt = await tx.wait();

      // Extract listingId from event
      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log)?.name === "ItemListed";
        } catch {
          return false;
        }
      });
      const listingId = marketplace.interface.parseLog(event).args[0];

      await expect(
        marketplace.connect(buyer).buyItem(listingId, { value: price })
      ).to.emit(marketplace, "ItemSold");

      expect(await vibeNFT.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should distribute payment correctly with royalties", async function () {
      const { marketplace, vibeNFT, seller, buyer, owner, feeRecipient } =
        await loadFixture(deployMarketplaceFixture);

      const price = ethers.parseEther("1");
      const tx = await marketplace.connect(seller).listItem(vibeNFT.target, 0, price);
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log)?.name === "ItemListed";
        } catch {
          return false;
        }
      });
      const listingId = marketplace.interface.parseLog(event).args[0];

      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );
      const royaltyRecipientBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      await marketplace.connect(buyer).buyItem(listingId, { value: price });

      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const feeRecipientBalanceAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );
      const royaltyRecipientBalanceAfter = await ethers.provider.getBalance(
        owner.address
      );

      // Platform fee: 2.5% of 1 ETH = 0.025 ETH
      expect(feeRecipientBalanceAfter - feeRecipientBalanceBefore).to.equal(
        ethers.parseEther("0.025")
      );

      // Royalty: 5% of 1 ETH = 0.05 ETH
      expect(royaltyRecipientBalanceAfter - royaltyRecipientBalanceBefore).to.equal(
        ethers.parseEther("0.05")
      );

      // Seller: 1 - 0.025 - 0.05 = 0.925 ETH
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(
        ethers.parseEther("0.925")
      );
    });

    it("Should cancel a listing", async function () {
      const { marketplace, vibeNFT, seller } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .listItem(vibeNFT.target, 0, ethers.parseEther("1"));
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log)?.name === "ItemListed";
        } catch {
          return false;
        }
      });
      const listingId = marketplace.interface.parseLog(event).args[0];

      await expect(
        marketplace.connect(seller).cancelListing(listingId)
      ).to.emit(marketplace, "ListingCancelled");
    });

    it("Should update listing price", async function () {
      const { marketplace, vibeNFT, seller } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .listItem(vibeNFT.target, 0, ethers.parseEther("1"));
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log)?.name === "ItemListed";
        } catch {
          return false;
        }
      });
      const listingId = marketplace.interface.parseLog(event).args[0];

      await marketplace
        .connect(seller)
        .updateListingPrice(listingId, ethers.parseEther("2"));

      const listing = await marketplace.listings(listingId);
      expect(listing.price).to.equal(ethers.parseEther("2"));
    });
  });

  describe("English Auctions", function () {
    it("Should create an English auction", async function () {
      const { marketplace, vibeNFT, seller } = await loadFixture(
        deployMarketplaceFixture
      );

      const startPrice = ethers.parseEther("0.5");
      const reservePrice = ethers.parseEther("1");
      const duration = 24 * 60 * 60; // 24 hours

      await expect(
        marketplace
          .connect(seller)
          .createEnglishAuction(
            vibeNFT.target,
            0,
            startPrice,
            reservePrice,
            duration
          )
      ).to.emit(marketplace, "EnglishAuctionCreated");
    });

    it("Should place bids", async function () {
      const { marketplace, vibeNFT, seller, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .createEnglishAuction(
          vibeNFT.target,
          0,
          ethers.parseEther("0.5"),
          ethers.parseEther("1"),
          24 * 60 * 60
        );
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return (
            marketplace.interface.parseLog(log)?.name === "EnglishAuctionCreated"
          );
        } catch {
          return false;
        }
      });
      const auctionId = marketplace.interface.parseLog(event).args[0];

      await expect(
        marketplace.connect(buyer).placeBid(auctionId, {
          value: ethers.parseEther("0.6"),
        })
      ).to.emit(marketplace, "BidPlaced");
    });

    it("Should settle auction when reserve met", async function () {
      const { marketplace, vibeNFT, seller, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .createEnglishAuction(
          vibeNFT.target,
          0,
          ethers.parseEther("0.5"),
          ethers.parseEther("1"),
          24 * 60 * 60
        );
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return (
            marketplace.interface.parseLog(log)?.name === "EnglishAuctionCreated"
          );
        } catch {
          return false;
        }
      });
      const auctionId = marketplace.interface.parseLog(event).args[0];

      // Place bid meeting reserve
      await marketplace.connect(buyer).placeBid(auctionId, {
        value: ethers.parseEther("1"),
      });

      // Fast forward time
      await time.increase(25 * 60 * 60); // 25 hours

      // Settle auction
      await expect(marketplace.settleEnglishAuction(auctionId)).to.emit(
        marketplace,
        "AuctionSettled"
      );

      expect(await vibeNFT.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should refund when reserve not met", async function () {
      const { marketplace, vibeNFT, seller, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .createEnglishAuction(
          vibeNFT.target,
          0,
          ethers.parseEther("0.5"),
          ethers.parseEther("2"),
          24 * 60 * 60
        );
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return (
            marketplace.interface.parseLog(log)?.name === "EnglishAuctionCreated"
          );
        } catch {
          return false;
        }
      });
      const auctionId = marketplace.interface.parseLog(event).args[0];

      // Place bid below reserve
      await marketplace.connect(buyer).placeBid(auctionId, {
        value: ethers.parseEther("1"),
      });

      const balanceBefore = await ethers.provider.getBalance(buyer.address);

      // Fast forward time
      await time.increase(25 * 60 * 60);

      // Settle auction
      await marketplace.settleEnglishAuction(auctionId);

      const balanceAfter = await ethers.provider.getBalance(buyer.address);

      // Buyer should get refund
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));

      // NFT should still belong to seller
      expect(await vibeNFT.ownerOf(0)).to.equal(seller.address);
    });
  });

  describe("Dutch Auctions", function () {
    it("Should create a Dutch auction", async function () {
      const { marketplace, vibeNFT, seller } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(
        marketplace
          .connect(seller)
          .createDutchAuction(
            vibeNFT.target,
            0,
            ethers.parseEther("2"),
            ethers.parseEther("0.5"),
            24 * 60 * 60
          )
      ).to.emit(marketplace, "DutchAuctionCreated");
    });

    it("Should calculate decreasing price correctly", async function () {
      const { marketplace, vibeNFT, seller } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .createDutchAuction(
          vibeNFT.target,
          0,
          ethers.parseEther("2"),
          ethers.parseEther("1"),
          3600 // 1 hour
        );
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return (
            marketplace.interface.parseLog(log)?.name === "DutchAuctionCreated"
          );
        } catch {
          return false;
        }
      });
      const auctionId = marketplace.interface.parseLog(event).args[0];

      const initialPrice = await marketplace.getCurrentDutchPrice(auctionId);
      expect(initialPrice).to.equal(ethers.parseEther("2"));

      // Half way through
      await time.increase(1800); // 30 minutes

      const midPrice = await marketplace.getCurrentDutchPrice(auctionId);
      expect(midPrice).to.equal(ethers.parseEther("1.5"));

      // End of auction
      await time.increase(1800); // Another 30 minutes

      const endPrice = await marketplace.getCurrentDutchPrice(auctionId);
      expect(endPrice).to.equal(ethers.parseEther("1"));
    });

    it("Should buy from Dutch auction", async function () {
      const { marketplace, vibeNFT, seller, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const tx = await marketplace
        .connect(seller)
        .createDutchAuction(
          vibeNFT.target,
          0,
          ethers.parseEther("2"),
          ethers.parseEther("1"),
          3600
        );
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return (
            marketplace.interface.parseLog(log)?.name === "DutchAuctionCreated"
          );
        } catch {
          return false;
        }
      });
      const auctionId = marketplace.interface.parseLog(event).args[0];

      const currentPrice = await marketplace.getCurrentDutchPrice(auctionId);

      await expect(
        marketplace.connect(buyer).buyDutchAuction(auctionId, {
          value: currentPrice,
        })
      ).to.emit(marketplace, "DutchAuctionFilled");

      expect(await vibeNFT.ownerOf(0)).to.equal(buyer.address);
    });
  });

  describe("Offers", function () {
    it("Should make an offer", async function () {
      const { marketplace, vibeNFT, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const expiration = (await time.latest()) + 24 * 60 * 60;

      await expect(
        marketplace
          .connect(buyer)
          .makeOffer(vibeNFT.target, 0, expiration, {
            value: ethers.parseEther("0.5"),
          })
      ).to.emit(marketplace, "OfferMade");
    });

    it("Should accept an offer", async function () {
      const { marketplace, vibeNFT, seller, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const expiration = (await time.latest()) + 24 * 60 * 60;

      const tx = await marketplace
        .connect(buyer)
        .makeOffer(vibeNFT.target, 0, expiration, {
          value: ethers.parseEther("0.5"),
        });
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log)?.name === "OfferMade";
        } catch {
          return false;
        }
      });
      const offerId = marketplace.interface.parseLog(event).args[0];

      await expect(
        marketplace.connect(seller).acceptOffer(offerId)
      ).to.emit(marketplace, "OfferAccepted");

      expect(await vibeNFT.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should cancel an offer", async function () {
      const { marketplace, vibeNFT, buyer } = await loadFixture(
        deployMarketplaceFixture
      );

      const expiration = (await time.latest()) + 24 * 60 * 60;

      const tx = await marketplace
        .connect(buyer)
        .makeOffer(vibeNFT.target, 0, expiration, {
          value: ethers.parseEther("0.5"),
        });
      const receipt = await tx.wait();

      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log)?.name === "OfferMade";
        } catch {
          return false;
        }
      });
      const offerId = marketplace.interface.parseLog(event).args[0];

      const balanceBefore = await ethers.provider.getBalance(buyer.address);

      const cancelTx = await marketplace.connect(buyer).cancelOffer(offerId);
      const cancelReceipt = await cancelTx.wait();
      const gasCost = cancelReceipt.gasUsed * cancelReceipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(buyer.address);

      // Should get refund minus gas
      expect(balanceAfter - balanceBefore + gasCost).to.equal(
        ethers.parseEther("0.5")
      );
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await marketplace.connect(owner).updatePlatformFee(500); // 5%
      expect(await marketplace.platformFee()).to.equal(500);
    });

    it("Should not allow fee above maximum", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      await expect(
        marketplace.connect(owner).updatePlatformFee(1100)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should pause and unpause marketplace", async function () {
      const { marketplace, owner, seller, vibeNFT } = await loadFixture(
        deployMarketplaceFixture
      );

      await marketplace.connect(owner).pause();

      await expect(
        marketplace
          .connect(seller)
          .listItem(vibeNFT.target, 0, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(marketplace, "EnforcedPause");

      await marketplace.connect(owner).unpause();

      await expect(
        marketplace
          .connect(seller)
          .listItem(vibeNFT.target, 0, ethers.parseEther("1"))
      ).to.not.be.reverted;
    });
  });
});
