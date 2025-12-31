/**
 * Wallet Connection Examples
 *
 * This file demonstrates how to connect to various Web3 wallets including:
 * - MetaMask
 * - WalletConnect
 * - Coinbase Wallet
 * - Ethers.js integration
 *
 * @requires ethers ^6.0.0
 * @requires @metamask/sdk
 */

import { ethers, BrowserProvider } from 'ethers';

// ============================================================================
// METAMASK WALLET CONNECTION
// ============================================================================

/**
 * Connect to MetaMask wallet
 * @returns Provider and signer instances
 */
export async function connectMetaMask(): Promise<{
  provider: BrowserProvider;
  signer: ethers.Signer;
  address: string;
  chainId: number;
}> {
  try {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed. Please install it from https://metamask.io');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    // Create provider and signer
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = accounts[0];

    // Get network information
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    console.log('✅ Connected to MetaMask');
    console.log('Address:', address);
    console.log('Chain ID:', chainId);

    return { provider, signer, address, chainId };
  } catch (error) {
    console.error('❌ Error connecting to MetaMask:', error);
    throw error;
  }
}

/**
 * Check if wallet is already connected
 */
export async function checkConnection(): Promise<boolean> {
  try {
    if (typeof window.ethereum === 'undefined') {
      return false;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    return accounts.length > 0;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
}

/**
 * Switch to a specific network
 * @param chainId - Target chain ID (e.g., 1 for Ethereum Mainnet, 137 for Polygon)
 */
export async function switchNetwork(chainId: number): Promise<void> {
  try {
    const chainIdHex = `0x${chainId.toString(16)}`;

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });

    console.log(`✅ Switched to chain ${chainId}`);
  } catch (error: any) {
    // If the chain hasn't been added to MetaMask
    if (error.code === 4902) {
      console.error('Network not found. Please add it to MetaMask first.');
      // You can call addNetwork() here
    }
    throw error;
  }
}

/**
 * Add a custom network to MetaMask
 */
export async function addNetwork(config: {
  chainId: number;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}): Promise<void> {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${config.chainId.toString(16)}`,
          chainName: config.chainName,
          nativeCurrency: config.nativeCurrency,
          rpcUrls: config.rpcUrls,
          blockExplorerUrls: config.blockExplorerUrls,
        },
      ],
    });

    console.log(`✅ Added network: ${config.chainName}`);
  } catch (error) {
    console.error('❌ Error adding network:', error);
    throw error;
  }
}

// ============================================================================
// WALLET EVENT LISTENERS
// ============================================================================

/**
 * Listen for account changes
 */
export function onAccountsChanged(callback: (accounts: string[]) => void): void {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('👤 Account changed:', accounts[0]);
      callback(accounts);

      // Reload the page when account changes (recommended by MetaMask)
      if (accounts.length === 0) {
        console.log('🔒 Wallet disconnected');
      }
    });
  }
}

/**
 * Listen for chain changes
 */
export function onChainChanged(callback: (chainId: string) => void): void {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log('🔗 Chain changed:', parseInt(chainId, 16));
      callback(chainId);

      // Reload the page on chain change (recommended by MetaMask)
      window.location.reload();
    });
  }
}

/**
 * Listen for connection/disconnection events
 */
export function onConnect(callback: (connectInfo: { chainId: string }) => void): void {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('connect', (connectInfo: { chainId: string }) => {
      console.log('✅ Wallet connected to chain:', parseInt(connectInfo.chainId, 16));
      callback(connectInfo);
    });
  }
}

export function onDisconnect(callback: (error: { code: number; message: string }) => void): void {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('disconnect', (error: { code: number; message: string }) => {
      console.log('🔌 Wallet disconnected:', error.message);
      callback(error);
    });
  }
}

// ============================================================================
// WALLET INFORMATION
// ============================================================================

/**
 * Get wallet balance in native currency (ETH, MATIC, etc.)
 */
export async function getBalance(address: string, provider: BrowserProvider): Promise<{
  balance: bigint;
  formatted: string;
}> {
  try {
    const balance = await provider.getBalance(address);
    const formatted = ethers.formatEther(balance);

    console.log(`💰 Balance: ${formatted} ETH`);

    return { balance, formatted };
  } catch (error) {
    console.error('❌ Error getting balance:', error);
    throw error;
  }
}

/**
 * Get current gas price
 */
export async function getGasPrice(provider: BrowserProvider): Promise<{
  gasPrice: bigint;
  formatted: string;
}> {
  try {
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 0n;
    const formatted = ethers.formatUnits(gasPrice, 'gwei');

    console.log(`⛽ Gas Price: ${formatted} Gwei`);

    return { gasPrice, formatted };
  } catch (error) {
    console.error('❌ Error getting gas price:', error);
    throw error;
  }
}

/**
 * Sign a message with the wallet
 */
export async function signMessage(
  message: string,
  signer: ethers.Signer
): Promise<string> {
  try {
    const signature = await signer.signMessage(message);
    console.log('✍️ Message signed:', signature);
    return signature;
  } catch (error) {
    console.error('❌ Error signing message:', error);
    throw error;
  }
}

/**
 * Verify a signed message
 */
export function verifyMessage(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

    console.log(
      isValid ? '✅ Signature valid' : '❌ Signature invalid'
    );

    return isValid;
  } catch (error) {
    console.error('❌ Error verifying message:', error);
    return false;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example: Complete wallet connection flow
 */
export async function exampleWalletFlow(): Promise<void> {
  try {
    // 1. Check if already connected
    const isConnected = await checkConnection();
    console.log('Connection status:', isConnected);

    // 2. Connect wallet
    const { provider, signer, address, chainId } = await connectMetaMask();

    // 3. Get balance
    const { formatted } = await getBalance(address, provider);

    // 4. Get gas price
    await getGasPrice(provider);

    // 5. Sign a message
    const message = 'Welcome to our dApp!';
    const signature = await signMessage(message, signer);

    // 6. Verify the signature
    verifyMessage(message, signature, address);

    // 7. Set up event listeners
    onAccountsChanged((accounts) => {
      console.log('New account:', accounts[0]);
    });

    onChainChanged((chainId) => {
      console.log('New chain:', chainId);
    });

    console.log('🎉 Wallet flow completed successfully!');
  } catch (error) {
    console.error('❌ Wallet flow failed:', error);
  }
}

// ============================================================================
// NETWORK CONFIGURATIONS
// ============================================================================

export const NETWORKS = {
  ETHEREUM_MAINNET: {
    chainId: 1,
    chainName: 'Ethereum Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  POLYGON_MAINNET: {
    chainId: 137,
    chainName: 'Polygon Mainnet',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  ARBITRUM_ONE: {
    chainId: 42161,
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  SEPOLIA_TESTNET: {
    chainId: 11155111,
    chainName: 'Sepolia Testnet',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
};

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
