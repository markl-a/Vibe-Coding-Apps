'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Palette } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold gradient-text">Vibe NFT</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/explore"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Explore
            </Link>
            <Link
              href="/create"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Create
            </Link>
            <Link
              href="/my-nfts"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              My NFTs
            </Link>
            <Link
              href="/auctions"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Auctions
            </Link>
          </nav>
        </div>

        <ConnectButton />
      </div>
    </header>
  );
}
