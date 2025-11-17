# 🛍️ NFT Marketplace App - NFT 交易市場

完整的 NFT 交易市場，支持固定價格銷售、拍賣和版稅功能。

## ✨ 核心功能

- 🏷️ **固定價格銷售** - 立即購買
- ⚖️ **英式拍賣** - 最高出價者獲勝
- 📉 **荷蘭式拍賣** - 價格遞減拍賣
- 💰 **創作者版稅** - 二次銷售分成
- 🎨 **集合管理** - 創建和管理 NFT 集合

## 🛠️ 技術棧

- Solidity 0.8.19
- Hardhat
- React + TypeScript
- ethers.js v6
- IPFS (Pinata)
- TailwindCSS

## 📝 智能合約

### NFTMarketplace.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract NFTMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    struct Auction {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 startPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool active;
    }

    mapping(bytes32 => Listing) public listings;
    mapping(bytes32 => Auction) public auctions;

    uint256 public platformFee = 250; // 2.5%
    address public feeRecipient;

    event Listed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event Sold(address indexed buyer, address indexed nftContract, uint256 indexed tokenId, uint256 price);
    event AuctionCreated(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 startPrice, uint256 endTime);
    event BidPlaced(address indexed bidder, bytes32 indexed auctionId, uint256 amount);

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");

        bytes32 listingId = keccak256(abi.encodePacked(nftContract, tokenId));

        listings[listingId] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });

        emit Listed(msg.sender, nftContract, tokenId, price);
    }

    function buyItem(address nftContract, uint256 tokenId) external payable nonReentrant {
        bytes32 listingId = keccak256(abi.encodePacked(nftContract, tokenId));
        Listing storage listing = listings[listingId];

        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        listing.active = false;

        // 計算版稅
        (address royaltyRecipient, uint256 royaltyAmount) = _getRoyalty(nftContract, tokenId, listing.price);

        // 計算平台費用
        uint256 fee = (listing.price * platformFee) / 10000;

        // 轉賬
        uint256 sellerProceeds = listing.price - fee - royaltyAmount;
        payable(listing.seller).transfer(sellerProceeds);
        payable(feeRecipient).transfer(fee);

        if (royaltyAmount > 0) {
            payable(royaltyRecipient).transfer(royaltyAmount);
        }

        // 轉移 NFT
        IERC721(nftContract).safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit Sold(msg.sender, nftContract, tokenId, listing.price);
    }

    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) external {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");

        bytes32 auctionId = keccak256(abi.encodePacked(nftContract, tokenId, block.timestamp));

        auctions[auctionId] = Auction({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            startPrice: startPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            active: true
        });

        emit AuctionCreated(msg.sender, nftContract, tokenId, startPrice, block.timestamp + duration);
    }

    function placeBid(bytes32 auctionId) external payable {
        Auction storage auction = auctions[auctionId];

        require(auction.active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");
        require(msg.value >= auction.startPrice, "Below start price");

        // 退還上一個出價
        if (auction.highestBidder != address(0)) {
            payable(auction.highestBidder).transfer(auction.highestBid);
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(msg.sender, auctionId, msg.value);
    }

    function _getRoyalty(address nftContract, uint256 tokenId, uint256 price)
        internal
        view
        returns (address, uint256)
    {
        try IERC2981(nftContract).royaltyInfo(tokenId, price) returns (
            address receiver,
            uint256 royaltyAmount
        ) {
            return (receiver, royaltyAmount);
        } catch {
            return (address(0), 0);
        }
    }
}
```

## 🎨 前端實現

```typescript
import { useState } from 'react';
import { useContractWrite, useContractRead } from 'wagmi';
import { parseEther } from 'viem';

export function NFTCard({ nft }: { nft: NFT }) {
  const { write: buyNFT } = useContractWrite({
    address: MARKETPLACE_ADDRESS,
    abi: MarketplaceABI,
    functionName: 'buyItem',
  });

  return (
    <div className="nft-card">
      <img src={nft.image} alt={nft.name} />
      <h3>{nft.name}</h3>
      <p>{nft.price} ETH</p>
      <button onClick={() => buyNFT({
        args: [nft.contract, nft.tokenId],
        value: parseEther(nft.price)
      })}>
        購買
      </button>
    </div>
  );
}
```

## 📚 API 路由

```typescript
// pages/api/nfts/[address]/[tokenId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { Alchemy } from 'alchemy-sdk';

export default async function handler(req: NextApiRequest, NextApiResponse) {
  const { address, tokenId } = req.query;

  const alchemy = new Alchemy({ apiKey: process.env.ALCHEMY_API_KEY });

  const nft = await alchemy.nft.getNftMetadata(address as string, tokenId as string);

  res.status(200).json(nft);
}
```

[返回 NFT Marketplace](../README.md)
