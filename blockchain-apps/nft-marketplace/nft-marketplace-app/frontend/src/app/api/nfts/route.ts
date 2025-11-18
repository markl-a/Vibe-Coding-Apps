import { NextRequest, NextResponse } from 'next/server';

// This is a placeholder API route
// In production, this would fetch NFTs from a database or blockchain indexer
export async function GET(request: NextRequest) {
  try {
    // Mock NFT data for demonstration
    const mockNFTs = [
      {
        tokenId: '1',
        name: 'Vibe Genesis #1',
        description: 'The first NFT in the Vibe collection',
        image: 'ipfs://QmExample1/image.png',
        price: '100000000000000000', // 0.1 ETH in wei
        seller: '0x1234567890123456789012345678901234567890',
        listingId: '0xabc123',
      },
      {
        tokenId: '2',
        name: 'Vibe Genesis #2',
        description: 'A rare collectible from the Vibe series',
        image: 'ipfs://QmExample2/image.png',
        price: '250000000000000000', // 0.25 ETH
        seller: '0x1234567890123456789012345678901234567891',
        listingId: '0xabc124',
      },
    ];

    return NextResponse.json(mockNFTs);
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch NFTs' },
      { status: 500 }
    );
  }
}
