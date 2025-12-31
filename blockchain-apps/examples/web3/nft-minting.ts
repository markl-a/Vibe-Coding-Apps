/**
 * NFT Minting Examples
 *
 * This file demonstrates how to:
 * - Mint ERC721 NFTs
 * - Mint ERC1155 NFTs (multi-token standard)
 * - Upload metadata to IPFS
 * - Set royalties
 * - Batch minting
 * - Lazy minting patterns
 *
 * @requires ethers ^6.0.0
 * @requires ipfs-http-client (for IPFS uploads)
 */

import { ethers, BrowserProvider, Contract } from 'ethers';

// ============================================================================
// ERC721 (NFT) ABI
// ============================================================================

const ERC721_ABI = [
  // Read functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',

  // Minting functions
  'function mint(address to) returns (uint256)',
  'function safeMint(address to, string memory uri) returns (uint256)',
  'function mintBatch(address to, uint256 quantity) returns (uint256[])',

  // Transfer functions
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
];

// ============================================================================
// ERC1155 (MULTI-TOKEN) ABI
// ============================================================================

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)',

  'function mint(address to, uint256 id, uint256 amount, bytes data)',
  'function mintBatch(address to, uint256[] ids, uint256[] amounts, bytes data)',

  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',

  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
];

// ============================================================================
// NFT METADATA INTERFACE
// ============================================================================

interface NFTMetadata {
  name: string;
  description: string;
  image: string; // URL to image (IPFS, HTTP, etc.)
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  background_color?: string;
  animation_url?: string;
  youtube_url?: string;
}

// ============================================================================
// IPFS INTEGRATION
// ============================================================================

/**
 * Upload image to IPFS using Pinata or NFT.Storage
 * Note: You'll need to use their API directly or use ipfs-http-client
 */
export async function uploadImageToIPFS(
  imageFile: File
): Promise<{ ipfsHash: string; url: string }> {
  // This is a placeholder - integrate with your preferred IPFS service
  // Options: Pinata, NFT.Storage, Infura IPFS, Web3.Storage

  console.log(`📤 Uploading image to IPFS: ${imageFile.name}`);

  // Example using NFT.Storage API
  const NFTSTORAGE_API_KEY = 'YOUR_NFT_STORAGE_API_KEY';

  const formData = new FormData();
  formData.append('file', imageFile);

  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NFTSTORAGE_API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();
  const ipfsHash = data.value.cid;
  const url = `ipfs://${ipfsHash}`;

  console.log(`✅ Image uploaded to IPFS: ${url}`);

  return { ipfsHash, url };
}

/**
 * Upload metadata JSON to IPFS
 */
export async function uploadMetadataToIPFS(
  metadata: NFTMetadata
): Promise<{ ipfsHash: string; url: string }> {
  console.log(`📤 Uploading metadata to IPFS...`);

  const NFTSTORAGE_API_KEY = 'YOUR_NFT_STORAGE_API_KEY';

  const blob = new Blob([JSON.stringify(metadata)], {
    type: 'application/json',
  });

  const formData = new FormData();
  formData.append('file', blob, 'metadata.json');

  const response = await fetch('https://api.nft.storage/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NFTSTORAGE_API_KEY}`,
    },
    body: formData,
  });

  const data = await response.json();
  const ipfsHash = data.value.cid;
  const url = `ipfs://${ipfsHash}`;

  console.log(`✅ Metadata uploaded to IPFS: ${url}`);

  return { ipfsHash, url };
}

/**
 * Create complete NFT metadata and upload to IPFS
 */
export async function createAndUploadNFTMetadata(
  name: string,
  description: string,
  imageFile: File,
  attributes?: Array<{ trait_type: string; value: string | number }>
): Promise<string> {
  try {
    // 1. Upload image to IPFS
    const { url: imageUrl } = await uploadImageToIPFS(imageFile);

    // 2. Create metadata object
    const metadata: NFTMetadata = {
      name,
      description,
      image: imageUrl,
      attributes: attributes || [],
    };

    // 3. Upload metadata to IPFS
    const { url: metadataUrl } = await uploadMetadataToIPFS(metadata);

    return metadataUrl;
  } catch (error) {
    console.error('❌ Error creating NFT metadata:', error);
    throw error;
  }
}

// ============================================================================
// ERC721 NFT MINTING
// ============================================================================

/**
 * Mint a single ERC721 NFT
 */
export async function mintNFT(
  contractAddress: string,
  recipientAddress: string,
  tokenURI: string,
  provider: BrowserProvider
): Promise<{ tokenId: bigint; txHash: string }> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, ERC721_ABI, signer);

    console.log(`🎨 Minting NFT to ${recipientAddress}...`);
    console.log(`📝 Token URI: ${tokenURI}`);

    // Call the mint function
    const tx = await contract.safeMint(recipientAddress, tokenURI);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ NFT minted in block ${receipt?.blockNumber}`);

    // Extract tokenId from Transfer event
    const transferEvent = receipt?.logs.find(
      (log: any) => log.topics[0] === contract.interface.getEvent('Transfer')?.topicHash
    );

    let tokenId = 0n;
    if (transferEvent) {
      const parsedLog = contract.interface.parseLog({
        topics: transferEvent.topics as string[],
        data: transferEvent.data,
      });
      tokenId = parsedLog?.args.tokenId;
    }

    console.log(`🎉 Token ID: ${tokenId}`);

    return { tokenId, txHash: tx.hash };
  } catch (error) {
    console.error('❌ Error minting NFT:', error);
    throw error;
  }
}

/**
 * Mint multiple NFTs in a batch
 */
export async function batchMintNFTs(
  contractAddress: string,
  recipientAddress: string,
  quantity: number,
  provider: BrowserProvider
): Promise<{ tokenIds: bigint[]; txHash: string }> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, ERC721_ABI, signer);

    console.log(`🎨 Batch minting ${quantity} NFTs to ${recipientAddress}...`);

    const tx = await contract.mintBatch(recipientAddress, quantity);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ ${quantity} NFTs minted in block ${receipt?.blockNumber}`);

    // Extract all tokenIds from Transfer events
    const tokenIds: bigint[] = [];
    const transferEvents = receipt?.logs.filter(
      (log: any) => log.topics[0] === contract.interface.getEvent('Transfer')?.topicHash
    );

    transferEvents?.forEach((event: any) => {
      const parsedLog = contract.interface.parseLog({
        topics: event.topics as string[],
        data: event.data,
      });
      if (parsedLog?.args.tokenId) {
        tokenIds.push(parsedLog.args.tokenId);
      }
    });

    console.log(`🎉 Minted Token IDs: ${tokenIds.join(', ')}`);

    return { tokenIds, txHash: tx.hash };
  } catch (error) {
    console.error('❌ Error batch minting NFTs:', error);
    throw error;
  }
}

// ============================================================================
// ERC1155 MULTI-TOKEN MINTING
// ============================================================================

/**
 * Mint ERC1155 tokens (fungible or non-fungible)
 */
export async function mintERC1155(
  contractAddress: string,
  recipientAddress: string,
  tokenId: bigint,
  amount: bigint,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, ERC1155_ABI, signer);

    console.log(`🎨 Minting ${amount} of token ID ${tokenId}...`);

    // data parameter is typically empty ('0x')
    const tx = await contract.mint(recipientAddress, tokenId, amount, '0x');
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ ERC1155 tokens minted in block ${receipt?.blockNumber}`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error minting ERC1155:', error);
    throw error;
  }
}

/**
 * Batch mint multiple ERC1155 token types
 */
export async function batchMintERC1155(
  contractAddress: string,
  recipientAddress: string,
  tokenIds: bigint[],
  amounts: bigint[],
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, ERC1155_ABI, signer);

    console.log(`🎨 Batch minting ${tokenIds.length} token types...`);

    const tx = await contract.mintBatch(recipientAddress, tokenIds, amounts, '0x');
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Batch minted in block ${receipt?.blockNumber}`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error batch minting ERC1155:', error);
    throw error;
  }
}

// ============================================================================
// NFT QUERYING
// ============================================================================

/**
 * Get NFT metadata from token URI
 */
export async function getNFTMetadata(
  contractAddress: string,
  tokenId: bigint,
  provider: BrowserProvider
): Promise<NFTMetadata> {
  try {
    const contract = new Contract(contractAddress, ERC721_ABI, provider);

    // Get token URI
    const tokenURI = await contract.tokenURI(tokenId);
    console.log(`📝 Token URI: ${tokenURI}`);

    // Convert IPFS URI to HTTP gateway URL if needed
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Fetch metadata
    const response = await fetch(metadataUrl);
    const metadata = await response.json();

    console.log(`✅ Metadata retrieved:`, metadata);

    return metadata;
  } catch (error) {
    console.error('❌ Error getting NFT metadata:', error);
    throw error;
  }
}

/**
 * Get all NFTs owned by an address
 */
export async function getNFTsOwnedBy(
  contractAddress: string,
  ownerAddress: string,
  provider: BrowserProvider
): Promise<bigint[]> {
  try {
    const contract = new Contract(contractAddress, ERC721_ABI, provider);

    // Get balance
    const balance = await contract.balanceOf(ownerAddress);
    console.log(`👤 ${ownerAddress} owns ${balance} NFTs`);

    // Note: This requires the contract to have enumeration (ERC721Enumerable)
    // For non-enumerable contracts, you'll need to query Transfer events

    const tokenIds: bigint[] = [];

    // Query Transfer events to find all tokens owned
    const filter = contract.filters.Transfer(null, ownerAddress);
    const events = await contract.queryFilter(filter);

    for (const event of events) {
      const tokenId = event.args?.tokenId;
      if (tokenId) {
        // Verify current owner
        const currentOwner = await contract.ownerOf(tokenId);
        if (currentOwner.toLowerCase() === ownerAddress.toLowerCase()) {
          tokenIds.push(tokenId);
        }
      }
    }

    console.log(`✅ Found token IDs: ${tokenIds.join(', ')}`);

    return tokenIds;
  } catch (error) {
    console.error('❌ Error getting owned NFTs:', error);
    throw error;
  }
}

// ============================================================================
// LAZY MINTING (OFF-CHAIN SIGNATURES)
// ============================================================================

/**
 * Create a voucher for lazy minting (off-chain signature)
 * The NFT is only minted when someone claims it
 */
export async function createLazyMintVoucher(
  contractAddress: string,
  tokenId: bigint,
  tokenURI: string,
  minPrice: bigint,
  provider: BrowserProvider
): Promise<{
  tokenId: bigint;
  tokenURI: string;
  minPrice: bigint;
  signature: string;
}> {
  try {
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Create the voucher data
    const voucher = {
      tokenId,
      tokenURI,
      minPrice,
      creator: signerAddress,
    };

    // Create EIP-712 typed data for signing
    const domain = {
      name: 'LazyNFT',
      version: '1',
      chainId: (await provider.getNetwork()).chainId,
      verifyingContract: contractAddress,
    };

    const types = {
      NFTVoucher: [
        { name: 'tokenId', type: 'uint256' },
        { name: 'tokenURI', type: 'string' },
        { name: 'minPrice', type: 'uint256' },
        { name: 'creator', type: 'address' },
      ],
    };

    // Sign the voucher
    const signature = await signer.signTypedData(domain, types, voucher);

    console.log(`✅ Lazy mint voucher created`);
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Signature: ${signature}`);

    return { ...voucher, signature };
  } catch (error) {
    console.error('❌ Error creating lazy mint voucher:', error);
    throw error;
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Complete NFT minting flow with IPFS
 */
export async function exampleNFTMintingFlow(
  contractAddress: string,
  imageFile: File,
  provider: BrowserProvider
): Promise<void> {
  try {
    console.log('🚀 Starting NFT minting flow...\n');

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // 1. Create metadata and upload to IPFS
    const metadataURI = await createAndUploadNFTMetadata(
      'My Awesome NFT',
      'This is a unique digital artwork',
      imageFile,
      [
        { trait_type: 'Rarity', value: 'Legendary' },
        { trait_type: 'Power', value: 100 },
      ]
    );

    // 2. Mint the NFT
    const { tokenId, txHash } = await mintNFT(
      contractAddress,
      signerAddress,
      metadataURI,
      provider
    );

    // 3. Verify the NFT was minted
    const metadata = await getNFTMetadata(contractAddress, tokenId, provider);

    console.log('\n✅ NFT minting flow completed!');
    console.log(`  Token ID: ${tokenId}`);
    console.log(`  Transaction: ${txHash}`);
    console.log(`  Metadata:`, metadata);
  } catch (error) {
    console.error('❌ NFT minting flow failed:', error);
  }
}

/**
 * Example: Batch mint NFTs for a collection launch
 */
export async function exampleBatchMinting(
  contractAddress: string,
  provider: BrowserProvider
): Promise<void> {
  try {
    console.log('🚀 Starting batch minting flow...\n');

    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();

    // Mint 10 NFTs in one transaction
    const { tokenIds } = await batchMintNFTs(
      contractAddress,
      signerAddress,
      10,
      provider
    );

    console.log(`\n✅ Batch minting completed!`);
    console.log(`  Minted ${tokenIds.length} NFTs`);
  } catch (error) {
    console.error('❌ Batch minting failed:', error);
  }
}
