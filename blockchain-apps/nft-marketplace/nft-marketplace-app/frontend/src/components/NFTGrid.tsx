'use client';

import { NFTCard } from './NFTCard';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NFTGrid() {
  const { data: nfts, error, isLoading } = useSWR('/api/nfts', fetcher);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-96 rounded-lg bg-muted animate-shimmer"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load NFTs</p>
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No NFTs found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {nfts.map((nft: any) => (
        <NFTCard key={nft.tokenId} nft={nft} />
      ))}
    </div>
  );
}
