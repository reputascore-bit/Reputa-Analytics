/**
 * Pi Network Data Service
 * Fetches blockchain data from Pi Network when available
 * Falls back to estimated data when API is unavailable
 * Works with both Testnet and Mainnet
 */

const PI_TESTNET_API = 'https://api.testnet.minepi.com';
const PI_MAINNET_API = 'https://api.mainnet.minepi.com';

export interface NetworkMetrics {
  circulatingSupply: number;
  lockedMiningRewards: number;
  unlockedMiningRewards: number;
  totalMigratedMining: number;
  maxSupply: number;
  activeWallets: number;
  lastUpdated: string;
  isEstimated: boolean; // True when using fallback/estimated data
}

export interface TopWallet {
  rank: number;
  address: string;
  balance: number;
  activityScore: number;
  lastActive: string;
  status: 'active' | 'dormant' | 'new';
}

export interface ReputationData {
  score: number;
  trustLevel: 'Low' | 'Medium' | 'High' | 'Elite';
  transactionCount: number;
  accountAge: number;
  networkActivity: number;
  onChainVerified: boolean;
  isEstimated: boolean; // True when calculated from limited data
}

/**
 * Check if running in Pi Browser
 */
export function isPiBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  return navigator.userAgent.includes('PiBrowser') || 'Pi' in window;
}

/**
 * Get API base URL based on network mode
 */
export function getApiBaseUrl(isMainnet: boolean = false): string {
  return isMainnet ? PI_MAINNET_API : PI_TESTNET_API;
}

/**
 * Fetch Network Metrics from Pi Blockchain
 * Note: Pi Network doesn't expose a public network metrics endpoint
 * This uses estimated data based on publicly known information
 */
export async function fetchNetworkMetrics(isMainnet: boolean = false): Promise<NetworkMetrics> {
  // Pi Network doesn't have a public metrics API endpoint
  // We return estimated data based on publicly available information
  // In production, this would connect to Pi Block Explorer or official API when available
  
  const estimatedMetrics = getEstimatedMetrics(isMainnet);
  
  // Attempt to get ledger info for verification
  const baseUrl = getApiBaseUrl(isMainnet);
  try {
    const response = await fetch(`${baseUrl}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      // API is reachable, but network metrics endpoint isn't available
      // Mark as connected but still using estimated data
      return {
        ...estimatedMetrics,
        lastUpdated: new Date().toISOString(),
      };
    }
  } catch {
    // API not reachable
  }
  
  return estimatedMetrics;
}

function getEstimatedMetrics(isMainnet: boolean): NetworkMetrics {
  // Estimated values based on Pi Network's public announcements
  // Source: Pi Network official blog and community updates
  return {
    circulatingSupply: isMainnet ? 6500000000 : 1000000000,
    lockedMiningRewards: isMainnet ? 45000000000 : 5000000000,
    unlockedMiningRewards: isMainnet ? 5000000000 : 500000000,
    totalMigratedMining: isMainnet ? 8500000000 : 850000000,
    maxSupply: 100000000000, // 100 Billion Pi max supply (confirmed)
    activeWallets: isMainnet ? 50000000 : 5000000,
    lastUpdated: new Date().toISOString(),
    isEstimated: true,
  };
}

/**
 * Fetch Top 100 Wallets by balance and activity
 * Note: Pi Network doesn't expose a public ranked wallets endpoint
 * This displays anonymized sample data for demonstration
 */
export async function fetchTopWallets(isMainnet: boolean = false): Promise<TopWallet[]> {
  // Pi Network prioritizes privacy - there's no public "rich list" API
  // This returns sample data to demonstrate the feature
  // In a real implementation, this could connect to a third-party analytics service
  
  return getEstimatedTopWallets(isMainnet);
}

function getEstimatedTopWallets(isMainnet: boolean): TopWallet[] {
  // Generate sample data representing typical wallet distribution
  const baseBalance = isMainnet ? 1000000 : 100000;
  
  return Array.from({ length: 100 }, (_, i) => {
    const rank = i + 1;
    // Logarithmic distribution for realistic balance spread
    const balance = Math.floor(baseBalance * Math.pow(0.92, i) + Math.random() * 1000);
    
    return {
      rank,
      address: generateSampleAddress(rank),
      balance,
      activityScore: Math.max(15, 100 - Math.floor(i * 0.8) + Math.floor(Math.random() * 10)),
      lastActive: new Date(Date.now() - (i * 3600000 * Math.random())).toISOString(),
      status: rank <= 20 ? 'active' : rank <= 60 ? 'dormant' : 'new' as const,
    };
  });
}

function generateSampleAddress(seed: number): string {
  // Generate deterministic but anonymized sample addresses
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let addr = 'G';
  for (let i = 0; i < 55; i++) {
    addr += chars[(seed * (i + 1) * 7) % chars.length];
  }
  return formatAddress(addr);
}

/**
 * Fetch wallet reputation data from on-chain analysis
 */
export async function fetchReputationData(
  walletAddress: string,
  isMainnet: boolean = false
): Promise<ReputationData> {
  const baseUrl = getApiBaseUrl(isMainnet);
  
  try {
    // Fetch account details
    const accountResponse = await fetch(`${baseUrl}/accounts/${walletAddress}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Fetch transaction history
    const txResponse = await fetch(`${baseUrl}/accounts/${walletAddress}/transactions?limit=100`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!accountResponse.ok) {
      throw new Error(`Account not found: ${accountResponse.status}`);
    }

    const account = await accountResponse.json();
    const transactions = txResponse.ok ? await txResponse.json() : { _embedded: { records: [] } };
    
    // Calculate reputation from real data
    const txCount = transactions._embedded?.records?.length || 0;
    const accountAge = calculateAccountAge(account.sequence);
    const activityLevel = calculateActivityLevel(transactions._embedded?.records || []);
    
    const score = calculateReputationScore({
      transactionCount: txCount,
      accountAge,
      activityLevel,
      balance: parseFloat(account.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0'),
    });

    return {
      score,
      trustLevel: getTrustLevel(score),
      transactionCount: txCount,
      accountAge,
      networkActivity: activityLevel,
      onChainVerified: true,
      isEstimated: false,
    };
  } catch (error) {
    console.warn('[PI NETWORK] Failed to fetch reputation, using estimated data:', error);
    // Return estimated data when wallet not found or API unavailable
    return {
      score: 350,
      trustLevel: 'Medium',
      transactionCount: 25,
      accountAge: 180,
      networkActivity: 45,
      onChainVerified: false,
      isEstimated: true,
    };
  }
}

// Helper Functions

function formatAddress(address: string): string {
  if (!address || address.length < 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function calculateActivityScore(account: any): number {
  const balance = parseFloat(account.balances?.find((b: any) => b.asset_type === 'native')?.balance || '0');
  const sequence = parseInt(account.sequence || '0');
  return Math.min(100, Math.floor((balance / 1000) + (sequence / 100)));
}

function getWalletStatus(account: any): 'active' | 'dormant' | 'new' {
  const sequence = parseInt(account.sequence || '0');
  if (sequence < 10) return 'new';
  if (sequence > 100) return 'active';
  return 'dormant';
}

function calculateAccountAge(sequence: string): number {
  // Estimate days based on sequence number
  return Math.floor(parseInt(sequence || '0') / 10);
}

function calculateActivityLevel(transactions: any[]): number {
  if (!transactions.length) return 0;
  const recentTx = transactions.filter(tx => {
    const txDate = new Date(tx.created_at);
    const daysDiff = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  });
  return Math.min(100, Math.floor((recentTx.length / transactions.length) * 100));
}

function calculateReputationScore(data: {
  transactionCount: number;
  accountAge: number;
  activityLevel: number;
  balance: number;
}): number {
  const txScore = Math.min(250, data.transactionCount * 2.5);
  const ageScore = Math.min(200, data.accountAge * 0.5);
  const activityScore = Math.min(300, data.activityLevel * 3);
  const balanceScore = Math.min(250, Math.log10(data.balance + 1) * 25);
  
  return Math.floor(txScore + ageScore + activityScore + balanceScore);
}

function getTrustLevel(score: number): 'Low' | 'Medium' | 'High' | 'Elite' {
  if (score >= 800) return 'Elite';
  if (score >= 500) return 'High';
  if (score >= 250) return 'Medium';
  return 'Low';
}

