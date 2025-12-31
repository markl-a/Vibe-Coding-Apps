/**
 * Blockchain Event Listening Examples
 *
 * This file demonstrates how to listen to and process blockchain events:
 * - Real-time event listening
 * - Historical event queries
 * - Event filtering and indexing
 * - Custom event parsing
 * - WebSocket connections
 * - Event-driven architectures
 *
 * @requires ethers ^6.0.0
 */

import { ethers, BrowserProvider, WebSocketProvider, Contract, EventLog } from 'ethers';

// ============================================================================
// CONTRACT ABIs WITH EVENTS
// ============================================================================

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
];

const UNISWAP_PAIR_ABI = [
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event Mint(address indexed sender, uint amount0, uint amount1)',
  'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',
];

// ============================================================================
// REAL-TIME EVENT LISTENING
// ============================================================================

/**
 * Listen to all Transfer events in real-time
 */
export function listenToTransfers(
  tokenAddress: string,
  provider: BrowserProvider,
  callback: (from: string, to: string, amount: bigint, event: any) => void
): () => void {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);

  console.log(`👂 Listening to Transfer events for ${tokenAddress}...`);

  // Set up event listener
  contract.on('Transfer', (from, to, amount, event) => {
    console.log(`📥 Transfer detected:`);
    console.log(`  From: ${from}`);
    console.log(`  To: ${to}`);
    console.log(`  Amount: ${amount.toString()}`);
    console.log(`  Block: ${event.log.blockNumber}`);
    console.log(`  Tx Hash: ${event.log.transactionHash}`);

    callback(from, to, amount, event);
  });

  // Return cleanup function
  return () => {
    contract.removeAllListeners('Transfer');
    console.log('👋 Stopped listening to Transfer events');
  };
}

/**
 * Listen to Transfer events for a specific address
 */
export function listenToTransfersForAddress(
  tokenAddress: string,
  watchAddress: string,
  provider: BrowserProvider,
  options: { incoming?: boolean; outgoing?: boolean } = { incoming: true, outgoing: true }
): () => void {
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);

  console.log(`👂 Listening to transfers for ${watchAddress}...`);

  const cleanupFunctions: Array<() => void> = [];

  // Listen to incoming transfers
  if (options.incoming) {
    const incomingFilter = contract.filters.Transfer(null, watchAddress);
    contract.on(incomingFilter, (from, to, amount, event) => {
      console.log(`📥 INCOMING: ${amount.toString()} from ${from}`);
    });
    cleanupFunctions.push(() => contract.off(incomingFilter));
  }

  // Listen to outgoing transfers
  if (options.outgoing) {
    const outgoingFilter = contract.filters.Transfer(watchAddress, null);
    contract.on(outgoingFilter, (from, to, amount, event) => {
      console.log(`📤 OUTGOING: ${amount.toString()} to ${to}`);
    });
    cleanupFunctions.push(() => contract.off(outgoingFilter));
  }

  // Return cleanup function
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    console.log('👋 Stopped listening to filtered transfers');
  };
}

/**
 * Listen to multiple event types
 */
export function listenToMultipleEvents(
  contractAddress: string,
  abi: any[],
  eventNames: string[],
  provider: BrowserProvider,
  callback: (eventName: string, ...args: any[]) => void
): () => void {
  const contract = new Contract(contractAddress, abi, provider);

  console.log(`👂 Listening to ${eventNames.length} event types...`);

  const cleanupFunctions: Array<() => void> = [];

  eventNames.forEach(eventName => {
    contract.on(eventName, (...args) => {
      console.log(`📡 Event: ${eventName}`, args);
      callback(eventName, ...args);
    });

    cleanupFunctions.push(() => contract.removeAllListeners(eventName));
  });

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
    console.log('👋 Stopped listening to all events');
  };
}

// ============================================================================
// HISTORICAL EVENT QUERIES
// ============================================================================

/**
 * Query all historical Transfer events
 */
export async function queryAllTransfers(
  tokenAddress: string,
  provider: BrowserProvider,
  fromBlock: number = 0,
  toBlock: number | string = 'latest'
): Promise<Array<{
  from: string;
  to: string;
  amount: bigint;
  blockNumber: number;
  transactionHash: string;
  timestamp?: number;
}>> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    console.log(`🔍 Querying Transfer events from block ${fromBlock} to ${toBlock}...`);

    const filter = contract.filters.Transfer();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    console.log(`✅ Found ${events.length} Transfer events`);

    // Parse and format events
    const transfers = await Promise.all(
      events.map(async (event) => {
        const block = await event.getBlock();

        return {
          from: event.args?.from,
          to: event.args?.to,
          amount: event.args?.value,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash,
          timestamp: block.timestamp,
        };
      })
    );

    return transfers;
  } catch (error) {
    console.error('❌ Error querying transfers:', error);
    throw error;
  }
}

/**
 * Query events with pagination (for large result sets)
 */
export async function queryEventsWithPagination(
  tokenAddress: string,
  provider: BrowserProvider,
  startBlock: number,
  endBlock: number,
  chunkSize: number = 10000
): Promise<any[]> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const filter = contract.filters.Transfer();

    console.log(`🔍 Querying events in chunks of ${chunkSize} blocks...`);

    const allEvents: any[] = [];
    let currentBlock = startBlock;

    while (currentBlock <= endBlock) {
      const toBlock = Math.min(currentBlock + chunkSize - 1, endBlock);

      console.log(`  Querying blocks ${currentBlock} to ${toBlock}...`);

      const events = await contract.queryFilter(filter, currentBlock, toBlock);
      allEvents.push(...events);

      console.log(`    Found ${events.length} events`);

      currentBlock = toBlock + 1;
    }

    console.log(`✅ Total events found: ${allEvents.length}`);

    return allEvents;
  } catch (error) {
    console.error('❌ Error querying events with pagination:', error);
    throw error;
  }
}

/**
 * Query events between specific timestamps
 */
export async function queryEventsByTimestamp(
  tokenAddress: string,
  provider: BrowserProvider,
  startTimestamp: number,
  endTimestamp: number
): Promise<any[]> {
  try {
    console.log(`🔍 Finding events between timestamps ${startTimestamp} and ${endTimestamp}...`);

    // Binary search to find approximate block numbers
    const startBlock = await findBlockByTimestamp(provider, startTimestamp);
    const endBlock = await findBlockByTimestamp(provider, endTimestamp);

    console.log(`  Approximate blocks: ${startBlock} to ${endBlock}`);

    // Query events in that block range
    const events = await queryAllTransfers(tokenAddress, provider, startBlock, endBlock);

    // Filter by exact timestamp
    const filteredEvents = events.filter(
      e => e.timestamp && e.timestamp >= startTimestamp && e.timestamp <= endTimestamp
    );

    console.log(`✅ Found ${filteredEvents.length} events in timestamp range`);

    return filteredEvents;
  } catch (error) {
    console.error('❌ Error querying events by timestamp:', error);
    throw error;
  }
}

/**
 * Helper: Find block number by timestamp using binary search
 */
async function findBlockByTimestamp(
  provider: BrowserProvider,
  timestamp: number
): Promise<number> {
  const latestBlock = await provider.getBlock('latest');
  if (!latestBlock) throw new Error('Could not fetch latest block');

  let low = 0;
  let high = latestBlock.number;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const block = await provider.getBlock(mid);

    if (!block) {
      low = mid + 1;
      continue;
    }

    if (block.timestamp < timestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

// ============================================================================
// ADVANCED EVENT FILTERING
// ============================================================================

/**
 * Filter events by multiple criteria
 */
export async function advancedEventFilter(
  tokenAddress: string,
  provider: BrowserProvider,
  criteria: {
    fromAddresses?: string[];
    toAddresses?: string[];
    minAmount?: bigint;
    maxAmount?: bigint;
    fromBlock?: number;
    toBlock?: number | string;
  }
): Promise<any[]> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    console.log(`🔍 Applying advanced filters...`);

    // Build filter based on criteria
    let filter;
    if (criteria.fromAddresses && criteria.toAddresses) {
      // Can't filter both from and to with indexed parameters
      filter = contract.filters.Transfer();
    } else if (criteria.fromAddresses) {
      filter = contract.filters.Transfer(criteria.fromAddresses);
    } else if (criteria.toAddresses) {
      filter = contract.filters.Transfer(null, criteria.toAddresses);
    } else {
      filter = contract.filters.Transfer();
    }

    // Query events
    const events = await contract.queryFilter(
      filter,
      criteria.fromBlock || 0,
      criteria.toBlock || 'latest'
    );

    // Apply additional filters
    let filteredEvents = events;

    if (criteria.fromAddresses && criteria.toAddresses) {
      filteredEvents = filteredEvents.filter(e =>
        criteria.fromAddresses!.includes(e.args?.from) ||
        criteria.toAddresses!.includes(e.args?.to)
      );
    }

    if (criteria.minAmount !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.args?.value >= criteria.minAmount!);
    }

    if (criteria.maxAmount !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.args?.value <= criteria.maxAmount!);
    }

    console.log(`✅ Found ${filteredEvents.length} events matching criteria`);

    return filteredEvents;
  } catch (error) {
    console.error('❌ Error with advanced filtering:', error);
    throw error;
  }
}

// ============================================================================
// WEBSOCKET CONNECTIONS (FOR REAL-TIME EVENTS)
// ============================================================================

/**
 * Connect via WebSocket for more reliable real-time events
 */
export async function connectWebSocket(
  wsUrl: string,
  tokenAddress: string,
  callback: (event: any) => void
): Promise<() => void> {
  try {
    console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);

    const wsProvider = new WebSocketProvider(wsUrl);
    const contract = new Contract(tokenAddress, ERC20_ABI, wsProvider);

    // Listen to Transfer events
    contract.on('Transfer', (from, to, amount, event) => {
      console.log(`📡 WebSocket Transfer: ${from} → ${to}: ${amount.toString()}`);
      callback(event);
    });

    console.log(`✅ WebSocket connected and listening`);

    // Return cleanup function
    return () => {
      contract.removeAllListeners();
      wsProvider.destroy();
      console.log('🔌 WebSocket disconnected');
    };
  } catch (error) {
    console.error('❌ Error connecting to WebSocket:', error);
    throw error;
  }
}

// ============================================================================
// EVENT AGGREGATION AND STATISTICS
// ============================================================================

/**
 * Calculate transfer statistics from events
 */
export async function calculateTransferStats(
  tokenAddress: string,
  provider: BrowserProvider,
  fromBlock: number = 0
): Promise<{
  totalTransfers: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  totalVolume: bigint;
  averageTransferSize: string;
  largestTransfer: bigint;
}> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();

    const events = await queryAllTransfers(tokenAddress, provider, fromBlock);

    const senders = new Set<string>();
    const receivers = new Set<string>();
    let totalVolume = 0n;
    let largestTransfer = 0n;

    events.forEach(event => {
      senders.add(event.from);
      receivers.add(event.to);
      totalVolume += event.amount;
      if (event.amount > largestTransfer) {
        largestTransfer = event.amount;
      }
    });

    const averageTransferSize = events.length > 0
      ? ethers.formatUnits(totalVolume / BigInt(events.length), decimals)
      : '0';

    const stats = {
      totalTransfers: events.length,
      uniqueSenders: senders.size,
      uniqueReceivers: receivers.size,
      totalVolume,
      averageTransferSize,
      largestTransfer,
    };

    console.log('📊 Transfer Statistics:');
    console.log(`  Total Transfers: ${stats.totalTransfers}`);
    console.log(`  Unique Senders: ${stats.uniqueSenders}`);
    console.log(`  Unique Receivers: ${stats.uniqueReceivers}`);
    console.log(`  Total Volume: ${ethers.formatUnits(stats.totalVolume, decimals)}`);
    console.log(`  Average Size: ${stats.averageTransferSize}`);
    console.log(`  Largest Transfer: ${ethers.formatUnits(stats.largestTransfer, decimals)}`);

    return stats;
  } catch (error) {
    console.error('❌ Error calculating stats:', error);
    throw error;
  }
}

/**
 * Track token velocity (transfers per day)
 */
export async function calculateTokenVelocity(
  tokenAddress: string,
  provider: BrowserProvider,
  days: number = 7
): Promise<Array<{ date: string; transferCount: number; volume: bigint }>> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    const now = Math.floor(Date.now() / 1000);
    const startTime = now - (days * 24 * 60 * 60);

    const events = await queryEventsByTimestamp(tokenAddress, provider, startTime, now);

    // Group by day
    const dailyStats = new Map<string, { count: number; volume: bigint }>();

    events.forEach(event => {
      const date = new Date(event.timestamp! * 1000).toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { count: 0, volume: 0n };
      dailyStats.set(date, {
        count: existing.count + 1,
        volume: existing.volume + event.amount,
      });
    });

    const velocity = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      transferCount: stats.count,
      volume: stats.volume,
    }));

    console.log('📈 Token Velocity (last 7 days):');
    velocity.forEach(day => {
      console.log(`  ${day.date}: ${day.transferCount} transfers`);
    });

    return velocity;
  } catch (error) {
    console.error('❌ Error calculating velocity:', error);
    throw error;
  }
}

// ============================================================================
// CUSTOM EVENT PROCESSING
// ============================================================================

/**
 * Process Uniswap swap events
 */
export async function processSwapEvents(
  pairAddress: string,
  provider: BrowserProvider,
  fromBlock: number = 0
): Promise<any[]> {
  try {
    const contract = new Contract(pairAddress, UNISWAP_PAIR_ABI, provider);

    console.log(`🔍 Querying Uniswap Swap events...`);

    const filter = contract.filters.Swap();
    const events = await contract.queryFilter(filter, fromBlock);

    const swaps = events.map(event => ({
      sender: event.args?.sender,
      amount0In: event.args?.amount0In,
      amount1In: event.args?.amount1In,
      amount0Out: event.args?.amount0Out,
      amount1Out: event.args?.amount1Out,
      to: event.args?.to,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }));

    console.log(`✅ Found ${swaps.length} swap events`);

    return swaps;
  } catch (error) {
    console.error('❌ Error processing swap events:', error);
    throw error;
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Real-time event monitoring dashboard
 */
export async function exampleEventDashboard(
  tokenAddress: string,
  provider: BrowserProvider
): Promise<() => void> {
  console.log('🚀 Starting event monitoring dashboard...\n');

  // 1. Listen to all transfers
  const stopListening = listenToTransfers(
    tokenAddress,
    provider,
    (from, to, amount) => {
      // Custom processing logic
      if (amount > ethers.parseUnits('1000', 18)) {
        console.log('🐋 WHALE ALERT: Large transfer detected!');
      }
    }
  );

  // 2. Calculate statistics
  await calculateTransferStats(tokenAddress, provider);

  // 3. Calculate velocity
  await calculateTokenVelocity(tokenAddress, provider, 7);

  console.log('\n✅ Dashboard running. Call the returned function to stop.');

  return stopListening;
}

/**
 * Example: Historical analysis
 */
export async function exampleHistoricalAnalysis(
  tokenAddress: string,
  provider: BrowserProvider
): Promise<void> {
  try {
    console.log('🚀 Starting historical analysis...\n');

    // Get current block
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = currentBlock - 10000; // Last ~10k blocks

    // Query all transfers
    const transfers = await queryAllTransfers(tokenAddress, provider, fromBlock);

    // Find top senders
    const senderVolumes = new Map<string, bigint>();
    transfers.forEach(t => {
      const current = senderVolumes.get(t.from) || 0n;
      senderVolumes.set(t.from, current + t.amount);
    });

    const topSenders = Array.from(senderVolumes.entries())
      .sort((a, b) => (a[1] > b[1] ? -1 : 1))
      .slice(0, 5);

    console.log('📊 Top 5 Senders:');
    topSenders.forEach(([address, volume], i) => {
      console.log(`  ${i + 1}. ${address}: ${ethers.formatEther(volume)}`);
    });

    console.log('\n✅ Historical analysis completed!');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}
