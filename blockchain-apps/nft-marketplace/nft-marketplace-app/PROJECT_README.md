# 🎨 Vibe NFT Marketplace - Complete Implementation

A feature-rich, production-ready NFT marketplace with AI-powered assistance, multiple auction types, and comprehensive trading features.

## 🌟 Features

### Smart Contracts
- **VibeNFT (ERC721)**
  - ERC721 standard with URI storage
  - ERC2981 royalty support (automatic creator royalties)
  - Pausable minting
  - Whitelist functionality
  - Batch minting (owner only)
  - Burnable tokens
  - Configurable max supply and mint price
  - Per-address mint limits

- **VibeMarketplace**
  - **Fixed Price Listings**: Traditional buy-now listings
  - **English Auctions**: Highest bidder wins with reserve price
  - **Dutch Auctions**: Price decreases over time
  - **Offers**: Make offers on any NFT
  - Automatic royalty distribution (ERC2981)
  - Platform fee management
  - Re-entrancy protection
  - Emergency pause functionality

### Frontend Application
- **Modern Stack**
  - Next.js 14 (App Router)
  - TypeScript
  - TailwindCSS
  - Wagmi + RainbowKit
  - ethers.js v6

- **AI-Powered Features** ✨
  - AI-generated NFT descriptions (OpenAI GPT)
  - Smart pricing suggestions based on attributes
  - Market insights and analytics

- **User Features**
  - Wallet connection (multiple wallets via RainbowKit)
  - Create and mint NFTs with drag-and-drop
  - Browse and search NFTs
  - Buy, sell, and trade
  - Create and participate in auctions
  - Make and accept offers
  - View owned NFTs
  - Transaction history

- **IPFS Integration**
  - Pinata integration for file and metadata storage
  - Automatic IPFS gateway resolution
  - Permanent storage for NFT assets

## 📁 Project Structure

```
nft-marketplace-app/
├── contracts/                 # Smart contracts
│   ├── VibeNFT.sol           # ERC721 + ERC2981 NFT contract
│   └── VibeMarketplace.sol   # Marketplace with auctions
├── scripts/                   # Deployment scripts
│   └── deploy.js
├── test/                      # Contract tests
│   ├── VibeNFT.test.js
│   └── VibeMarketplace.test.js
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # App router pages
│   │   │   ├── api/          # API routes
│   │   │   │   ├── ai/       # AI features
│   │   │   │   └── nfts/     # NFT data
│   │   │   ├── create/       # Create NFT page
│   │   │   └── page.tsx      # Homepage
│   │   ├── components/        # React components
│   │   ├── lib/              # Configuration
│   │   │   ├── wagmi.ts      # Web3 config
│   │   │   └── contracts.ts  # Contract ABIs
│   │   └── utils/            # Utility functions
│   │       ├── ipfs.ts       # IPFS helpers
│   │       └── format.ts     # Formatters
│   └── package.json
├── hardhat.config.js
├── package.json
└── .env.example
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or another Web3 wallet

### 1. Install Dependencies

```bash
# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
# Root .env (for contract deployment)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key

# frontend/.env.local (for frontend)
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_SECRET_KEY=your_pinata_secret
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

Expected output:
```
  VibeNFT
    ✓ Should deploy correctly
    ✓ Should mint NFT with payment
    ✓ Should enforce whitelist
    ✓ Should calculate royalties correctly
    ... 30+ tests passing

  VibeMarketplace
    ✓ Should create listings
    ✓ Should handle purchases with royalties
    ✓ Should run English auctions
    ✓ Should handle Dutch auctions
    ... 40+ tests passing
```

### 5. Deploy Contracts

#### Local Development
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy
npm run deploy:local
```

#### Sepolia Testnet
```bash
npm run deploy:sepolia
```

After deployment, note the contract addresses and update `frontend/.env.local`:
```
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS=0x...
```

### 6. Start Frontend

```bash
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Creating an NFT

1. Navigate to `/create`
2. Upload an image (drag & drop or click)
3. Enter NFT name
4. Click the AI button (✨) to generate a description
5. Optionally add attributes (Color, Rarity, etc.)
6. Click "Mint NFT"
7. Approve the transaction in your wallet
8. Wait for confirmation

### Listing an NFT for Sale

#### Fixed Price
```typescript
// Approve marketplace
await nftContract.setApprovalForAll(marketplaceAddress, true);

// List item
await marketplace.listItem(nftAddress, tokenId, price);
```

#### English Auction
```typescript
// Create auction: 24 hours, 0.5 ETH start, 1 ETH reserve
await marketplace.createEnglishAuction(
  nftAddress,
  tokenId,
  ethers.parseEther("0.5"),  // Start price
  ethers.parseEther("1"),    // Reserve price
  86400                       // 24 hours
);
```

#### Dutch Auction
```typescript
// Create auction: Start at 2 ETH, end at 0.5 ETH over 24 hours
await marketplace.createDutchAuction(
  nftAddress,
  tokenId,
  ethers.parseEther("2"),
  ethers.parseEther("0.5"),
  86400
);
```

### Buying an NFT

```typescript
// Get listing
const listing = await marketplace.listings(listingId);

// Buy
await marketplace.buyItem(listingId, {
  value: listing.price
});
```

### Bidding on Auction

```typescript
// Place bid
await marketplace.placeBid(auctionId, {
  value: ethers.parseEther("1.5")
});

// Settle auction (after end time)
await marketplace.settleEnglishAuction(auctionId);
```

## 🤖 AI Features

### Generate NFT Description

The AI analyzes the NFT name and attributes to create engaging descriptions:

```typescript
const response = await fetch('/api/ai/generate-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Cosmic Dragon #42',
    attributes: [
      { trait_type: 'Rarity', value: 'Legendary' },
      { trait_type: 'Element', value: 'Fire' }
    ]
  })
});

const { description } = await response.json();
// "A legendary cosmic dragon breathing ethereal flames..."
```

### Price Suggestions

Get AI-powered price recommendations:

```typescript
const response = await fetch('/api/ai/suggest-price', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ metadata })
});

const { suggestedPrice } = await response.json();
// 0.25 (ETH)
```

## 🧪 Testing

### Running All Tests
```bash
npm test
```

### Running Specific Tests
```bash
npx hardhat test test/VibeNFT.test.js
npx hardhat test test/VibeMarketplace.test.js
```

### Test Coverage
```bash
npm run coverage
```

### Gas Reporting
```bash
REPORT_GAS=true npm test
```

## 🔐 Security Features

- ✅ ReentrancyGuard on all state-changing functions
- ✅ Pausable contracts for emergency stops
- ✅ Access control (Ownable)
- ✅ Input validation
- ✅ Safe math (Solidity 0.8+)
- ✅ Pull payment pattern for refunds
- ✅ Comprehensive test coverage
- ✅ Gas-optimized code

## 💡 Advanced Features

### Batch Minting (Owner Only)
```solidity
string[] memory uris = new string[](3);
uris[0] = "ipfs://Qm...1";
uris[1] = "ipfs://Qm...2";
uris[2] = "ipfs://Qm...3";

await nftContract.batchMint(recipientAddress, uris);
```

### Whitelist Management
```solidity
address[] memory addresses = [addr1, addr2, addr3];
await nftContract.updateWhitelist(addresses, true);
await nftContract.setWhitelistActive(true);
```

### Royalty Configuration
```solidity
// Set default royalty: 5% to creator
await nftContract.setDefaultRoyalty(creatorAddress, 500);

// Set token-specific royalty
await nftContract.setTokenRoyalty(tokenId, artistAddress, 1000); // 10%
```

## 📊 Contract Specifications

### VibeNFT
- **Standard**: ERC721 + ERC2981
- **Max Supply**: Configurable
- **Mint Price**: Configurable
- **Royalty**: Configurable (default 5%)
- **Gas Optimized**: ✅

### VibeMarketplace
- **Platform Fee**: 2.5% (configurable, max 10%)
- **Auction Types**: Fixed, English, Dutch
- **Min Auction Duration**: 1 hour
- **Max Auction Duration**: 30 days
- **Gas Optimized**: ✅

## 🌐 Deployment

### Verify Contracts on Etherscan

After deploying to a public network:

```bash
npx hardhat verify --network sepolia <NFT_ADDRESS> "Vibe NFT Collection" "VIBE" 10000 "10000000000000000" 500 5

npx hardhat verify --network sepolia <MARKETPLACE_ADDRESS> <FEE_RECIPIENT_ADDRESS>
```

## 🛠️ Tech Stack

**Blockchain**
- Solidity 0.8.20
- Hardhat
- OpenZeppelin Contracts
- ethers.js v6

**Frontend**
- Next.js 14
- TypeScript
- TailwindCSS
- Wagmi
- RainbowKit
- React Query

**Infrastructure**
- IPFS (Pinata)
- Alchemy
- OpenAI API
- WalletConnect

## 📚 Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ERC721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [ERC2981 Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Hardhat team for excellent development tools
- RainbowKit for beautiful wallet connections
- Pinata for IPFS infrastructure
- OpenAI for AI capabilities

---

Built with ❤️ for the Web3 community
