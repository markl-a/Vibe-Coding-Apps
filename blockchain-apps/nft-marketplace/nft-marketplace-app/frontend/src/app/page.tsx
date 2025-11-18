import { Header } from '@/components/Header';
import { NFTGrid } from '@/components/NFTGrid';
import { Hero } from '@/components/Hero';
import { Stats } from '@/components/Stats';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Stats />
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Featured NFTs</h2>
          <NFTGrid />
        </section>
      </main>
    </div>
  );
}
