'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatETH, formatAddress } from '@/utils/format';
import { ipfsToHttp } from '@/utils/ipfs';
import { Heart, ShoppingCart } from 'lucide-react';

interface NFTCardProps {
  nft: {
    tokenId: string;
    name: string;
    description: string;
    image: string;
    price?: string;
    seller?: string;
    listingId?: string;
  };
}

export function NFTCard({ nft }: NFTCardProps) {
  const imageUrl = ipfsToHttp(nft.image);

  return (
    <Link
      href={`/nft/${nft.tokenId}`}
      className="group nft-card block rounded-lg border bg-card overflow-hidden"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={nft.name}
          fill
          className="object-cover transition-transform group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>

      <div className="p-4">
        <h3 className="font-semibold truncate mb-1">{nft.name}</h3>
        <p className="text-sm text-muted-foreground truncate mb-3">
          {nft.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            {nft.price && (
              <>
                <div className="text-xs text-muted-foreground">Price</div>
                <div className="font-bold text-primary">
                  {formatETH(nft.price)} ETH
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="p-2 rounded-full hover:bg-muted transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // Handle favorite
              }}
            >
              <Heart className="h-4 w-4" />
            </button>
            {nft.price && (
              <button
                className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  // Handle buy
                }}
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {nft.seller && (
          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            Seller: {formatAddress(nft.seller)}
          </div>
        )}
      </div>
    </Link>
  );
}
