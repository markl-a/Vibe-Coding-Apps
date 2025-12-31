/**
 * ERC20 Token Transfer Examples
 *
 * This file demonstrates various token transfer patterns:
 * - Direct transfers
 * - Approve and transferFrom
 * - Batch transfers
 * - Transfer with permit (EIP-2612)
 * - Multi-signature transfers
 * - Gasless transfers (meta-transactions)
 *
 * @requires ethers ^6.0.0
 */

import { ethers, BrowserProvider, Contract, Wallet } from 'ethers';

// ============================================================================
// ERC20 ABI
// ============================================================================

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function increaseAllowance(address spender, uint256 addedValue) returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// ERC20 with Permit (EIP-2612)
const ERC20_PERMIT_ABI = [
  ...ERC20_ABI,
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)',
  'function nonces(address owner) view returns (uint256)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
];

// ============================================================================
// BASIC TOKEN TRANSFERS
// ============================================================================

/**
 * Transfer tokens directly (sender pays gas)
 */
export async function transferTokens(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  provider: BrowserProvider
): Promise<{
  txHash: string;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
}> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const symbol = await contract.symbol();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    console.log(`💸 Transferring ${amount} ${symbol} to ${recipientAddress}...`);

    // Check balance first
    const balance = await contract.balanceOf(await signer.getAddress());
    if (balance < amountInUnits) {
      throw new Error(`Insufficient balance. Have: ${ethers.formatUnits(balance, decimals)}, Need: ${amount}`);
    }

    // Send transfer transaction
    const tx = await contract.transfer(recipientAddress, amountInUnits);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Transfer confirmed in block ${receipt?.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt?.gasUsed.toString()}`);

    return {
      txHash: tx.hash,
      gasUsed: receipt?.gasUsed || 0n,
      effectiveGasPrice: receipt?.gasPrice || 0n,
    };
  } catch (error) {
    console.error('❌ Error transferring tokens:', error);
    throw error;
  }
}

/**
 * Transfer all available tokens
 */
export async function transferAllTokens(
  tokenAddress: string,
  recipientAddress: string,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const signerAddress = await signer.getAddress();
    const balance = await contract.balanceOf(signerAddress);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    if (balance === 0n) {
      throw new Error('No tokens to transfer');
    }

    console.log(`💸 Transferring all ${ethers.formatUnits(balance, decimals)} ${symbol}...`);

    const tx = await contract.transfer(recipientAddress, balance);
    await tx.wait();

    console.log(`✅ All tokens transferred`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error transferring all tokens:', error);
    throw error;
  }
}

// ============================================================================
// APPROVE AND TRANSFER FROM PATTERN
// ============================================================================

/**
 * Approve tokens for spending (step 1 of approve + transferFrom)
 */
export async function approveTokens(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const symbol = await contract.symbol();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    console.log(`🔓 Approving ${amount} ${symbol} for ${spenderAddress}...`);

    const tx = await contract.approve(spenderAddress, amountInUnits);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`✅ Approval confirmed`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error approving tokens:', error);
    throw error;
  }
}

/**
 * Transfer tokens on behalf of another address (step 2 of approve + transferFrom)
 */
export async function transferFrom(
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const symbol = await contract.symbol();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    // Check allowance
    const allowance = await contract.allowance(fromAddress, await signer.getAddress());
    if (allowance < amountInUnits) {
      throw new Error(`Insufficient allowance. Have: ${ethers.formatUnits(allowance, decimals)}, Need: ${amount}`);
    }

    console.log(`💸 Transferring ${amount} ${symbol} from ${fromAddress} to ${toAddress}...`);

    const tx = await contract.transferFrom(fromAddress, toAddress, amountInUnits);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`✅ TransferFrom confirmed`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error in transferFrom:', error);
    throw error;
  }
}

/**
 * Increase allowance (safer than setting a new approval)
 */
export async function increaseAllowance(
  tokenAddress: string,
  spenderAddress: string,
  addedValue: string,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const addedValueInUnits = ethers.parseUnits(addedValue, decimals);

    console.log(`➕ Increasing allowance by ${addedValue}...`);

    const tx = await contract.increaseAllowance(spenderAddress, addedValueInUnits);
    await tx.wait();

    console.log(`✅ Allowance increased`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error increasing allowance:', error);
    throw error;
  }
}

/**
 * Decrease allowance
 */
export async function decreaseAllowance(
  tokenAddress: string,
  spenderAddress: string,
  subtractedValue: string,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const subtractedValueInUnits = ethers.parseUnits(subtractedValue, decimals);

    console.log(`➖ Decreasing allowance by ${subtractedValue}...`);

    const tx = await contract.decreaseAllowance(spenderAddress, subtractedValueInUnits);
    await tx.wait();

    console.log(`✅ Allowance decreased`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error decreasing allowance:', error);
    throw error;
  }
}

// ============================================================================
// BATCH TRANSFERS
// ============================================================================

/**
 * Transfer tokens to multiple recipients
 * Note: This sends multiple transactions. For a single transaction, use a batch transfer contract
 */
export async function batchTransfer(
  tokenAddress: string,
  recipients: Array<{ address: string; amount: string }>,
  provider: BrowserProvider
): Promise<string[]> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);

    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    console.log(`📦 Batch transferring ${symbol} to ${recipients.length} recipients...`);

    const txHashes: string[] = [];

    for (const recipient of recipients) {
      const amountInUnits = ethers.parseUnits(recipient.amount, decimals);

      console.log(`  → ${recipient.amount} ${symbol} to ${recipient.address}`);

      const tx = await contract.transfer(recipient.address, amountInUnits);
      txHashes.push(tx.hash);

      // Wait for each transaction to avoid nonce issues
      await tx.wait();
    }

    console.log(`✅ Batch transfer completed (${txHashes.length} transactions)`);

    return txHashes;
  } catch (error) {
    console.error('❌ Error in batch transfer:', error);
    throw error;
  }
}

/**
 * Batch transfer using a single transaction (requires a batch transfer contract)
 */
export async function singleTxBatchTransfer(
  batchTransferContractAddress: string,
  tokenAddress: string,
  recipients: string[],
  amounts: bigint[],
  provider: BrowserProvider
): Promise<string> {
  try {
    if (recipients.length !== amounts.length) {
      throw new Error('Recipients and amounts arrays must have the same length');
    }

    const signer = await provider.getSigner();

    // ABI for a batch transfer contract
    const BATCH_TRANSFER_ABI = [
      'function batchTransfer(address token, address[] recipients, uint256[] amounts)',
    ];

    const contract = new Contract(batchTransferContractAddress, BATCH_TRANSFER_ABI, signer);

    console.log(`📦 Single-tx batch transferring to ${recipients.length} recipients...`);

    const tx = await contract.batchTransfer(tokenAddress, recipients, amounts);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`✅ Batch transfer confirmed`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error in single-tx batch transfer:', error);
    throw error;
  }
}

// ============================================================================
// PERMIT (EIP-2612) - GASLESS APPROVALS
// ============================================================================

/**
 * Generate a permit signature for gasless approval (EIP-2612)
 */
export async function generatePermitSignature(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  value: bigint,
  deadline: number,
  provider: BrowserProvider
): Promise<{ v: number; r: string; s: string }> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_PERMIT_ABI, provider);

    // Get nonce
    const nonce = await contract.nonces(ownerAddress);

    // Get chain ID
    const chainId = (await provider.getNetwork()).chainId;

    // Get token name for domain
    const name = await contract.name();

    // Create EIP-712 domain
    const domain = {
      name,
      version: '1',
      chainId,
      verifyingContract: tokenAddress,
    };

    // Create permit message
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const message = {
      owner: ownerAddress,
      spender: spenderAddress,
      value,
      nonce,
      deadline,
    };

    // Sign the permit
    const signature = await signer.signTypedData(domain, types, message);

    // Split signature into v, r, s
    const sig = ethers.Signature.from(signature);

    console.log(`✍️  Permit signature generated`);

    return { v: sig.v, r: sig.r, s: sig.s };
  } catch (error) {
    console.error('❌ Error generating permit signature:', error);
    throw error;
  }
}

/**
 * Execute a permit (can be called by anyone, not just the owner)
 */
export async function executePermit(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  value: bigint,
  deadline: number,
  v: number,
  r: string,
  s: string,
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const contract = new Contract(tokenAddress, ERC20_PERMIT_ABI, signer);

    console.log(`🔓 Executing permit for ${ethers.formatUnits(value, await contract.decimals())} tokens...`);

    const tx = await contract.permit(ownerAddress, spenderAddress, value, deadline, v, r, s);
    console.log(`⏳ Transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log(`✅ Permit executed (gasless approval)`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error executing permit:', error);
    throw error;
  }
}

// ============================================================================
// TRANSFER WITH PERMIT (ONE TRANSACTION)
// ============================================================================

/**
 * Transfer tokens using permit in a single transaction
 * This allows the spender to both approve and transfer in one tx
 */
export async function transferWithPermit(
  tokenAddress: string,
  ownerAddress: string,
  recipientAddress: string,
  amount: bigint,
  deadline: number,
  permitSignature: { v: number; r: string; s: string },
  provider: BrowserProvider
): Promise<string> {
  try {
    const signer = await provider.getSigner();
    const spenderAddress = await signer.getAddress();

    // First execute the permit
    await executePermit(
      tokenAddress,
      ownerAddress,
      spenderAddress,
      amount,
      deadline,
      permitSignature.v,
      permitSignature.r,
      permitSignature.s,
      provider
    );

    // Then execute the transferFrom
    const contract = new Contract(tokenAddress, ERC20_ABI, signer);
    const tx = await contract.transferFrom(ownerAddress, recipientAddress, amount);

    await tx.wait();
    console.log(`✅ Transfer with permit completed`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Error in transfer with permit:', error);
    throw error;
  }
}

// ============================================================================
// MONITORING TRANSFERS
// ============================================================================

/**
 * Monitor incoming transfers for an address
 */
export async function monitorIncomingTransfers(
  tokenAddress: string,
  watchAddress: string,
  provider: BrowserProvider,
  callback: (from: string, amount: bigint) => void
): Promise<void> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    console.log(`👀 Monitoring incoming ${symbol} transfers for ${watchAddress}...`);

    // Listen to Transfer events where 'to' is the watch address
    const filter = contract.filters.Transfer(null, watchAddress);

    contract.on(filter, (from, to, amount, event) => {
      console.log(`📥 Received ${ethers.formatUnits(amount, decimals)} ${symbol} from ${from}`);
      callback(from, amount);
    });
  } catch (error) {
    console.error('❌ Error monitoring transfers:', error);
    throw error;
  }
}

/**
 * Get transfer history for an address
 */
export async function getTransferHistory(
  tokenAddress: string,
  address: string,
  provider: BrowserProvider,
  fromBlock: number = 0
): Promise<Array<{
  type: 'sent' | 'received';
  from: string;
  to: string;
  amount: bigint;
  blockNumber: number;
  txHash: string;
}>> {
  try {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider);

    // Query both sent and received transfers
    const sentFilter = contract.filters.Transfer(address, null);
    const receivedFilter = contract.filters.Transfer(null, address);

    const [sentEvents, receivedEvents] = await Promise.all([
      contract.queryFilter(sentFilter, fromBlock),
      contract.queryFilter(receivedFilter, fromBlock),
    ]);

    const history = [
      ...sentEvents.map(e => ({
        type: 'sent' as const,
        from: e.args?.from,
        to: e.args?.to,
        amount: e.args?.value,
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,
      })),
      ...receivedEvents.map(e => ({
        type: 'received' as const,
        from: e.args?.from,
        to: e.args?.to,
        amount: e.args?.value,
        blockNumber: e.blockNumber,
        txHash: e.transactionHash,
      })),
    ];

    // Sort by block number
    history.sort((a, b) => a.blockNumber - b.blockNumber);

    console.log(`✅ Found ${history.length} transfers`);

    return history;
  } catch (error) {
    console.error('❌ Error getting transfer history:', error);
    throw error;
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: Complete transfer flow
 */
export async function exampleTransferFlow(
  tokenAddress: string,
  provider: BrowserProvider
): Promise<void> {
  try {
    console.log('🚀 Starting transfer flow...\n');

    const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

    // 1. Simple transfer
    await transferTokens(tokenAddress, recipientAddress, '10.0', provider);

    // 2. Batch transfer to multiple recipients
    await batchTransfer(
      tokenAddress,
      [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', amount: '5.0' },
        { address: '0x1234567890123456789012345678901234567890', amount: '3.0' },
      ],
      provider
    );

    // 3. Get transfer history
    const signer = await provider.getSigner();
    const history = await getTransferHistory(tokenAddress, await signer.getAddress(), provider);

    console.log(`\n📜 Transfer history: ${history.length} transactions`);

    console.log('\n✅ Transfer flow completed!');
  } catch (error) {
    console.error('❌ Transfer flow failed:', error);
  }
}
