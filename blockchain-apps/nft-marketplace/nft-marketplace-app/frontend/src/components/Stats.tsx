'use client';

import { useContractRead } from 'wagmi';
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from '@/lib/contracts';
import { formatETH } from '@/utils/format';

export function Stats() {
  const { data: totalSupply } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'totalSupply',
  });

  const { data: maxSupply } = useContractRead({
    address: NFT_CONTRACT_ADDRESS,
    abi: NFT_ABI,
    functionName: 'maxSupply',
  });

  const stats = [
    {
      label: 'Total Volume',
      value: '1,234 ETH',
    },
    {
      label: 'NFTs Minted',
      value: totalSupply ? totalSupply.toString() : '0',
    },
    {
      label: 'Total Supply',
      value: maxSupply ? maxSupply.toString() : '10,000',
    },
    {
      label: 'Active Users',
      value: '5,678',
    },
  ];

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
