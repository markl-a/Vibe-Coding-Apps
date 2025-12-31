/**
 * Smart Contract Interaction Examples
 *
 * This file demonstrates how to interact with smart contracts using ethers.js:
 * - Reading contract data (view/pure functions)
 * - Writing to contracts (transactions)
 * - Estimating gas costs
 * - Handling events and logs
 * - Working with ABIs
 *
 * @requires ethers ^6.0.0
 */

import { ethers, BrowserProvider, Contract, Interface } from 'ethers';

// ============================================================================
// SAMPLE ERC20 ABI (for demonstration)
// ============================================================================

const ERC20_ABI = [
  // Read-Only Functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',

  // State-Changing Functions
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ============================================================================
// SAMPLE NFT (ERC721) ABI
// ============================================================================

const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'function approve(address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function mint(address to, string memory uri) returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

// ============================================================================
// CONTRACT INITIALIZATION
// ============================================================================

/**
 * Create a contract instance for reading data (no signer needed)
 */
export function getReadOnlyContract(
  contractAddress: string,
  abi: any[],
  provider: BrowserProvider
): Contract {
  return new Contract(contractAddress, abi, provider);
}

/**
 * Create a contract instance for writing data (requires signer)
 */
export async function getWritableContract(
  contractAddress: string,
  abi: any[],
  provider: BrowserProvider
): Promise<Contract> {
  const signer = await provider.getSigner();
  return new Contract(contractAddress, abi, signer);
}

// ============================================================================
// READING CONTRACT DATA
// ============================================================================

/**
 * Read ERC20 token information
 */
export async function readERC20Info(
  tokenAddress: string,
  provider: BrowserProvider
): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}> {
  try {
    const contract = getReadOnlyContract(tokenAddress, ERC20_ABI, provider);

    // Call multiple view functions in parallel
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
    ]);

    console.log('📊 Token Info:');
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)}`);

    return { name, symbol, decimals, totalSupply };
  } catch (error) {
    console.error('❌ Error reading token info:', error);
    throw error;
  }
}

/**
 * Get ERC20 token balance for an address
 */
export async function getTokenBalance(
  tokenAddress: string,
  ownerAddress: string,
  provider: BrowserProvider
): Promise<{ balance: bigint; formatted: string }> {
  try {
    const contract = getReadOnlyContract(tokenAddress, ERC20_ABI, provider);

    const balance = await contract.balanceOf(ownerAddress);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(balance, decimals);

    console.log(`💰 Token Balance: ${formatted}`);

    return { balance, formatted };
  } catch (error) {
    console.error('❌ Error getting token balance:', error);
    throw error;
  }
}

/**
 * Check ERC20 allowance
 */
export async function checkAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  provider: BrowserProvider
): Promise<{ allowance: bigint; formatted: string }> {
  try {
    const contract = getReadOnlyContract(tokenAddress, ERC20_ABI, provider);

    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    const decimals = await contract.decimals();
    const formatted = ethers.formatUnits(allowance, decimals);

    console.log(`✅ Allowance: ${formatted}`);

    return { allowance, formatted };
  } catch (error) {
    console.error('❌ Error checking allowance:', error);
    throw error;
  }
}

// ============================================================================
// WRITING TO CONTRACTS (TRANSACTIONS)
// ============================================================================

/**
 * Transfer ERC20 tokens
 */
export async function transferTokens(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  provider: BrowserProvider
): Promise<ethers.ContractTransactionReceipt | null> {
  try {
    const contract = await getWritableContract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();

    // Convert amount to token units (considering decimals)
    const amountInUnits = ethers.parseUnits(amount, decimals);

    console.log(`📤 Transferring ${amount} tokens to ${recipientAddress}...`);

    // Send transaction
    const tx = await contract.transfer(recipientAddress, amountInUnits);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}`);

    return receipt;
  } catch (error) {
    console.error('❌ Error transferring tokens:', error);
    throw error;
  }
}

/**
 * Approve token spending
 */
export async function approveTokenSpending(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  provider: BrowserProvider
): Promise<ethers.ContractTransactionReceipt | null> {
  try {
    const contract = await getWritableContract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();

    const amountInUnits = ethers.parseUnits(amount, decimals);

    console.log(`🔓 Approving ${amount} tokens for ${spenderAddress}...`);

    const tx = await contract.approve(spenderAddress, amountInUnits);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Approval confirmed in block ${receipt?.blockNumber}`);

    return receipt;
  } catch (error) {
    console.error('❌ Error approving tokens:', error);
    throw error;
  }
}

/**
 * Approve unlimited token spending (use with caution!)
 */
export async function approveUnlimited(
  tokenAddress: string,
  spenderAddress: string,
  provider: BrowserProvider
): Promise<ethers.ContractTransactionReceipt | null> {
  try {
    const contract = await getWritableContract(tokenAddress, ERC20_ABI, provider);

    // Max uint256 value for unlimited approval
    const maxApproval = ethers.MaxUint256;

    console.log(`⚠️  Approving UNLIMITED tokens for ${spenderAddress}...`);

    const tx = await contract.approve(spenderAddress, maxApproval);
    const receipt = await tx.wait();

    console.log(`✅ Unlimited approval confirmed`);

    return receipt;
  } catch (error) {
    console.error('❌ Error approving unlimited tokens:', error);
    throw error;
  }
}

// ============================================================================
// GAS ESTIMATION
// ============================================================================

/**
 * Estimate gas for a token transfer
 */
export async function estimateTransferGas(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  provider: BrowserProvider
): Promise<{
  estimatedGas: bigint;
  estimatedCost: string;
  gasPriceGwei: string;
}> {
  try {
    const contract = await getWritableContract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    // Estimate gas units
    const estimatedGas = await contract.transfer.estimateGas(
      recipientAddress,
      amountInUnits
    );

    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;

    // Calculate estimated cost in ETH
    const estimatedCost = ethers.formatEther(estimatedGas * gasPrice);
    const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');

    console.log(`⛽ Gas Estimation:`);
    console.log(`  Estimated Gas: ${estimatedGas.toString()} units`);
    console.log(`  Gas Price: ${gasPriceGwei} Gwei`);
    console.log(`  Estimated Cost: ${estimatedCost} ETH`);

    return { estimatedGas, estimatedCost, gasPriceGwei };
  } catch (error) {
    console.error('❌ Error estimating gas:', error);
    throw error;
  }
}

/**
 * Send transaction with custom gas parameters
 */
export async function transferWithCustomGas(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  gasLimit: bigint,
  maxFeePerGas: bigint,
  provider: BrowserProvider
): Promise<ethers.ContractTransactionReceipt | null> {
  try {
    const contract = await getWritableContract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    console.log(`📤 Transferring with custom gas settings...`);

    const tx = await contract.transfer(recipientAddress, amountInUnits, {
      gasLimit,
      maxFeePerGas,
    });

    console.log(`⏳ Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed`);
    console.log(`  Gas Used: ${receipt?.gasUsed.toString()}`);

    return receipt;
  } catch (error) {
    console.error('❌ Error transferring with custom gas:', error);
    throw error;
  }
}

// ============================================================================
// CUSTOM CONTRACT CALLS
// ============================================================================

/**
 * Call a custom contract function
 */
export async function callContractFunction(
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[],
  provider: BrowserProvider
): Promise<any> {
  try {
    const contract = getReadOnlyContract(contractAddress, abi, provider);

    console.log(`📞 Calling ${functionName}(${args.join(', ')})...`);

    const result = await contract[functionName](...args);

    console.log(`✅ Result:`, result);

    return result;
  } catch (error) {
    console.error(`❌ Error calling ${functionName}:`, error);
    throw error;
  }
}

/**
 * Send a transaction to a custom contract function
 */
export async function sendContractTransaction(
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[],
  provider: BrowserProvider,
  txOptions?: { value?: bigint; gasLimit?: bigint }
): Promise<ethers.ContractTransactionReceipt | null> {
  try {
    const contract = await getWritableContract(contractAddress, abi, provider);

    console.log(`📤 Sending transaction to ${functionName}(${args.join(', ')})...`);

    const tx = await contract[functionName](...args, txOptions || {});
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt?.blockNumber}`);

    return receipt;
  } catch (error) {
    console.error(`❌ Error sending transaction to ${functionName}:`, error);
    throw error;
  }
}

// ============================================================================
// WORKING WITH CONTRACT EVENTS
// ============================================================================

/**
 * Query past Transfer events
 */
export async function queryPastTransfers(
  tokenAddress: string,
  provider: BrowserProvider,
  fromBlock: number = 0,
  toBlock: number | string = 'latest'
): Promise<any[]> {
  try {
    const contract = getReadOnlyContract(tokenAddress, ERC20_ABI, provider);

    console.log(`🔍 Querying Transfer events from block ${fromBlock} to ${toBlock}...`);

    // Create event filter
    const filter = contract.filters.Transfer();

    // Query events
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    console.log(`✅ Found ${events.length} Transfer events`);

    // Parse event data
    const parsedEvents = events.map((event) => ({
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      from: event.args?.from,
      to: event.args?.to,
      value: event.args?.value,
    }));

    return parsedEvents;
  } catch (error) {
    console.error('❌ Error querying events:', error);
    throw error;
  }
}

/**
 * Query Transfer events for a specific address
 */
export async function queryTransfersForAddress(
  tokenAddress: string,
  address: string,
  provider: BrowserProvider
): Promise<any[]> {
  try {
    const contract = getReadOnlyContract(tokenAddress, ERC20_ABI, provider);

    // Create filters for both incoming and outgoing transfers
    const sentFilter = contract.filters.Transfer(address, null);
    const receivedFilter = contract.filters.Transfer(null, address);

    // Query both types of events
    const [sentEvents, receivedEvents] = await Promise.all([
      contract.queryFilter(sentFilter),
      contract.queryFilter(receivedFilter),
    ]);

    console.log(`✅ Found ${sentEvents.length} sent and ${receivedEvents.length} received transfers`);

    return [...sentEvents, ...receivedEvents];
  } catch (error) {
    console.error('❌ Error querying transfers for address:', error);
    throw error;
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Complete ERC20 interaction flow
 */
export async function exampleERC20Flow(
  tokenAddress: string,
  provider: BrowserProvider
): Promise<void> {
  try {
    console.log('🚀 Starting ERC20 interaction flow...\n');

    // 1. Read token info
    const tokenInfo = await readERC20Info(tokenAddress, provider);

    // 2. Get user's balance
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    const balance = await getTokenBalance(tokenAddress, userAddress, provider);

    // 3. Estimate gas for a transfer
    const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    await estimateTransferGas(tokenAddress, recipientAddress, '1.0', provider);

    // 4. Query past transfers
    await queryTransfersForAddress(tokenAddress, userAddress, provider);

    console.log('\n✅ ERC20 flow completed successfully!');
  } catch (error) {
    console.error('❌ ERC20 flow failed:', error);
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parse and handle contract errors
 */
export function parseContractError(error: any): string {
  if (error.code === 'CALL_EXCEPTION') {
    return 'Contract call failed. The function may have reverted.';
  }

  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds to complete the transaction.';
  }

  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    return 'Cannot estimate gas. The transaction may fail.';
  }

  if (error.code === 'ACTION_REJECTED') {
    return 'User rejected the transaction.';
  }

  if (error.reason) {
    return `Contract error: ${error.reason}`;
  }

  return error.message || 'Unknown error occurred';
}
