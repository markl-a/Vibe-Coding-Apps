'use client';

import Link from 'next/link';
import { Sparkles, TrendingUp, Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Discover, Create & Trade{' '}
            <span className="gradient-text">Extraordinary NFTs</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The most advanced NFT marketplace with AI-powered features, multiple
            auction types, and seamless trading experience.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link
              href="/explore"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Explore NFTs
            </Link>
            <Link
              href="/create"
              className="px-8 py-3 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
            >
              Create NFT
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex flex-col items-center p-6 rounded-lg bg-card">
              <Sparkles className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground text-center">
                Get AI assistance for descriptions, pricing, and market insights
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-lg bg-card">
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Multiple Auctions</h3>
              <p className="text-sm text-muted-foreground text-center">
                Choose from fixed price, English, or Dutch auction formats
              </p>
            </div>

            <div className="flex flex-col items-center p-6 rounded-lg bg-card">
              <Shield className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Royalty Support</h3>
              <p className="text-sm text-muted-foreground text-center">
                Built-in ERC2981 royalty standard for creator earnings
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
