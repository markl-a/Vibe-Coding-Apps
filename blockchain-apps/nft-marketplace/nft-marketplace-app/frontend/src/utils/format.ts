import { formatEther, parseEther } from 'viem';

/**
 * Format Ethereum address
 */
export function formatAddress(address: string | undefined): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format ETH amount
 */
export function formatETH(wei: bigint | string | number): string {
  try {
    const weiValue = typeof wei === 'bigint' ? wei : BigInt(wei);
    return formatEther(weiValue);
  } catch {
    return '0';
  }
}

/**
 * Parse ETH to Wei
 */
export function parseETH(eth: string): bigint {
  try {
    return parseEther(eth);
  } catch {
    return BigInt(0);
  }
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(endTime: number | bigint): string {
  const now = Math.floor(Date.now() / 1000);
  const end = Number(endTime);
  const diff = end - now;

  if (diff <= 0) return 'Ended';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format percentage
 */
export function formatPercentage(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

/**
 * Calculate platform fee
 */
export function calculateFee(amount: bigint, feeBasisPoints: number): bigint {
  return (amount * BigInt(feeBasisPoints)) / BigInt(10000);
}
