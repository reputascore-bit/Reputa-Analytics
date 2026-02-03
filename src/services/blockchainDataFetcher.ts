/**
 * Blockchain Data Fetching System
 * Automatically syncs wallet data, transactions, tokens, and staking information
 */

import axios, { AxiosInstance } from 'axios';

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  type: 'sent' | 'received' | 'stake' | 'dex' | 'mint';
  gasUsed?: number;
  status: 'confirmed' | 'pending' | 'failed';
  blockNumber: number;
  isOffChain?: boolean;
  details?: Record<string, any>;
}

export interface TokenHolding {
  tokenAddress: string;
  tokenName: string;
  symbol: string;
  balance: number;
  decimals: number;
  value?: number;
  lastUpdated: Date;
}

export interface StakeInfo {
  amount: number;
  startDate: Date;
  lockupPeriod?: number;
  rewards?: number;
  status: 'active' | 'inactive' | 'locked';
}

export interface WalletBlockchainData {
  address: string;
  network: 'mainnet' | 'testnet';
  currentBalance: number;
  totalTransactions: number;
  lastTransaction?: BlockchainTransaction;
  allTransactions: BlockchainTransaction[];
  tokenHoldings: TokenHolding[];
  stakeInfo?: StakeInfo;
  walletAge: number; // in days
  walletCreationDate: Date;
  activity3Months: number; // transaction count in last 3 months
  lastActivityDate?: Date;
  offChainTransfers: number;
  dexTradingVolume: number;
  lastSyncTime: Date;
  status: 'synced' | 'syncing' | 'error';
}

export class BlockchainDataFetcher {
  private mainnetApi: AxiosInstance;
  private testnetApi: AxiosInstance;
  private isDemoMode: boolean;

  constructor(isDemoMode: boolean = false) {
    this.isDemoMode = isDemoMode;

    // Initialize Pi Network blockchain APIs
    // Mainnet
    this.mainnetApi = axios.create({
      baseURL: process.env.PI_MAINNET_API || 'https://api.mainnet.pi',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PI_API_KEY || ''}`,
      },
    });

    // Testnet
    this.testnetApi = axios.create({
      baseURL: process.env.PI_TESTNET_API || 'https://api.testnet.pi',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PI_API_KEY || ''}`,
      },
    });
  }

  /**
   * Fetch complete wallet data including balance, transactions, tokens, and staking
   */
  async fetchWalletData(
    walletAddress: string,
    network: 'mainnet' | 'testnet' = 'mainnet'
  ): Promise<WalletBlockchainData> {
    if (this.isDemoMode) {
      return this.generateDemoWalletData(walletAddress, network);
    }

    try {
      const api = network === 'mainnet' ? this.mainnetApi : this.testnetApi;

      console.log(`🔄 Fetching ${network} wallet data for ${walletAddress.slice(0, 10)}...`);

      // Fetch all data in parallel
      const [
        balance,
        transactions,
        tokens,
        stake,
        creationDate,
        activity3Months,
      ] = await Promise.all([
        this.fetchBalance(walletAddress, api),
        this.fetchAllTransactions(walletAddress, api),
        this.fetchTokenHoldings(walletAddress, api),
        this.fetchStakingInfo(walletAddress, api),
        this.fetchWalletCreationDate(walletAddress, api),
        this.fetchActivity3Months(walletAddress, api),
      ]);

      const now = new Date();
      const walletAge = Math.floor(
        (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate DEX trading volume
      const dexVolume = this.calculateDexVolume(transactions);

      // Count off-chain transfers
      const offChainCount = transactions.filter((tx) => tx.isOffChain).length;

      const lastTx = transactions[0];

      const walletData: WalletBlockchainData = {
        address: walletAddress,
        network,
        currentBalance: balance,
        totalTransactions: transactions.length,
        lastTransaction: lastTx,
        allTransactions: transactions,
        tokenHoldings: tokens,
        stakeInfo: stake || undefined,
        walletAge,
        walletCreationDate: creationDate,
        activity3Months,
        lastActivityDate: lastTx?.timestamp ? new Date(lastTx.timestamp * 1000) : undefined,
        offChainTransfers: offChainCount,
        dexTradingVolume: dexVolume,
        lastSyncTime: now,
        status: 'synced',
      };

      console.log(`✅ Successfully fetched ${network} wallet data`);
      return walletData;
    } catch (error) {
      console.error(`❌ Error fetching ${network} wallet data:`, error);

      return {
        address: walletAddress,
        network,
        currentBalance: 0,
        totalTransactions: 0,
        allTransactions: [],
        tokenHoldings: [],
        walletAge: 0,
        walletCreationDate: new Date(),
        activity3Months: 0,
        offChainTransfers: 0,
        dexTradingVolume: 0,
        lastSyncTime: new Date(),
        status: 'error',
      };
    }
  }

  /**
   * Fetch wallet balance
   */
  private async fetchBalance(walletAddress: string, api: AxiosInstance): Promise<number> {
    try {
      const response = await api.get(`/wallet/${walletAddress}/balance`);
      return parseFloat(response.data.balance) || 0;
    } catch (error) {
      console.warn(`⚠️  Error fetching balance for ${walletAddress}:`, error);
      return 0;
    }
  }

  /**
   * Fetch ALL historical transactions
   */
  private async fetchAllTransactions(
    walletAddress: string,
    api: AxiosInstance,
    limit: number = 1000
  ): Promise<BlockchainTransaction[]> {
    try {
      const response = await api.get(`/wallet/${walletAddress}/transactions`, {
        params: { limit },
      });

      const txs = response.data.transactions || [];

      return txs.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        amount: parseFloat(tx.amount) || 0,
        timestamp: tx.timestamp || 0,
        type: this.inferTransactionType(tx),
        gasUsed: parseFloat(tx.gasUsed) || undefined,
        status: tx.status || 'confirmed',
        blockNumber: tx.blockNumber || 0,
        isOffChain: this.isOffChainTransfer(tx),
        details: {
          nonce: tx.nonce,
          input: tx.input,
          contractAddress: tx.contractAddress,
        },
      }));
    } catch (error) {
      console.warn(`⚠️  Error fetching transactions for ${walletAddress}:`, error);
      return [];
    }
  }

  /**
   * Fetch token holdings
   */
  private async fetchTokenHoldings(
    walletAddress: string,
    api: AxiosInstance
  ): Promise<TokenHolding[]> {
    try {
      const response = await api.get(`/wallet/${walletAddress}/tokens`);

      const tokens = response.data.tokens || [];

      return tokens.map((token: any) => ({
        tokenAddress: token.address,
        tokenName: token.name,
        symbol: token.symbol,
        balance: parseFloat(token.balance) || 0,
        decimals: token.decimals || 18,
        value: parseFloat(token.value) || 0,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.warn(`⚠️  Error fetching tokens for ${walletAddress}:`, error);
      return [];
    }
  }

  /**
   * Fetch staking information
   */
  private async fetchStakingInfo(
    walletAddress: string,
    api: AxiosInstance
  ): Promise<StakeInfo | null> {
    try {
      const response = await api.get(`/wallet/${walletAddress}/stake`);

      if (!response.data.stake) return null;

      const stake = response.data.stake;

      return {
        amount: parseFloat(stake.amount) || 0,
        startDate: new Date(stake.startDate),
        lockupPeriod: stake.lockupPeriod,
        rewards: parseFloat(stake.rewards) || 0,
        status: stake.status || 'active',
      };
    } catch (error) {
      console.warn(`⚠️  Error fetching staking info for ${walletAddress}:`, error);
      return null;
    }
  }

  /**
   * Fetch wallet creation date
   */
  private async fetchWalletCreationDate(
    walletAddress: string,
    api: AxiosInstance
  ): Promise<Date> {
    try {
      const response = await api.get(`/wallet/${walletAddress}/created`);
      return new Date(response.data.createdAt || new Date());
    } catch (error) {
      console.warn(`⚠️  Error fetching wallet creation date:`, error);
      return new Date();
    }
  }

  /**
   * Fetch transaction activity in last 3 months
   */
  private async fetchActivity3Months(walletAddress: string, api: AxiosInstance): Promise<number> {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const response = await api.get(`/wallet/${walletAddress}/transactions`, {
        params: { from: Math.floor(threeMonthsAgo.getTime() / 1000) },
      });

      return response.data.transactions?.length || 0;
    } catch (error) {
      console.warn(`⚠️  Error fetching 3-month activity:`, error);
      return 0;
    }
  }

  /**
   * Calculate DEX trading volume from transactions
   */
  private calculateDexVolume(transactions: BlockchainTransaction[]): number {
    return transactions
      .filter((tx) => tx.type === 'dex')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }

  /**
   * Infer transaction type from data
   */
  private inferTransactionType(tx: any): BlockchainTransaction['type'] {
    if (tx.type === 'stake') return 'stake';
    if (tx.isDex) return 'dex';
    if (tx.isMint) return 'mint';
    if (tx.isReceive) return 'received';
    return 'sent';
  }

  /**
   * Check if transaction is off-chain (penalty)
   */
  private isOffChainTransfer(tx: any): boolean {
    // Off-chain transfers have specific markers
    return tx.isOffChain === true || tx.type === 'off_chain';
  }

  /**
   * Generate demo wallet data for testing
   */
  private generateDemoWalletData(
    walletAddress: string,
    network: 'mainnet' | 'testnet'
  ): WalletBlockchainData {
    const creationDate = new Date();
    creationDate.setFullYear(creationDate.getFullYear() - 2); // 2 years old

    const now = new Date();
    const walletAge = Math.floor(
      (now.getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate demo transactions
    const transactions: BlockchainTransaction[] = [];
    const txTypes: BlockchainTransaction['type'][] = ['sent', 'received', 'stake', 'dex'];

    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 365);
      transactions.push({
        hash: '0x' + Math.random().toString(16).substr(2),
        from: i % 3 === 0 ? walletAddress : '0x' + 'a'.repeat(40),
        to: i % 3 === 0 ? '0x' + 'b'.repeat(40) : walletAddress,
        amount: Math.random() * 100,
        timestamp: Math.floor((now.getTime() - daysAgo * 24 * 60 * 60 * 1000) / 1000),
        type: txTypes[Math.floor(Math.random() * txTypes.length)],
        gasUsed: Math.random() * 0.001,
        status: 'confirmed',
        blockNumber: Math.floor(Math.random() * 18000000),
        isOffChain: Math.random() < 0.05,
      });
    }

    transactions.sort((a, b) => b.timestamp - a.timestamp);

    // Generate demo tokens
    const tokenNames = ['Pi', 'USDT', 'ETH', 'BTC'];
    const tokens: TokenHolding[] = tokenNames.map((name, idx) => ({
      tokenAddress: '0x' + Math.random().toString(16).substr(2),
      tokenName: name,
      symbol: name,
      balance: (idx === 0 ? 100 : Math.random() * 10),
      decimals: 18,
      value: (idx === 0 ? 100 : Math.random() * 10000),
      lastUpdated: now,
    }));

    // Demo stake info
    const stakeInfo: StakeInfo =
      network === 'mainnet'
        ? {
            amount: 100,
            startDate: new Date('2024-01-01'),
            lockupPeriod: 365,
            rewards: 12.5,
            status: 'active',
          }
        : {
            amount: 0,
            startDate: new Date(),
            status: 'inactive',
          };

    const activity3Months = transactions.filter((tx) => {
      const txDate = new Date(tx.timestamp * 1000);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return txDate >= threeMonthsAgo;
    }).length;

    return {
      address: walletAddress,
      network,
      currentBalance: network === 'mainnet' ? 200 + Math.random() * 500 : 50 + Math.random() * 200,
      totalTransactions: transactions.length,
      lastTransaction: transactions[0],
      allTransactions: transactions,
      tokenHoldings: tokens,
      stakeInfo: stakeInfo.amount > 0 ? stakeInfo : undefined,
      walletAge,
      walletCreationDate: creationDate,
      activity3Months,
      lastActivityDate: transactions[0]?.timestamp ? new Date(transactions[0].timestamp * 1000) : undefined,
      offChainTransfers: transactions.filter((tx) => tx.isOffChain).length,
      dexTradingVolume: this.calculateDexVolume(transactions),
      lastSyncTime: now,
      status: 'synced',
    };
  }

  /**
   * Start automatic sync interval
   */
  startAutoSync(walletAddress: string, network: 'mainnet' | 'testnet', intervalMs: number = 300000): NodeJS.Timeout {
    console.log(`🔄 Starting auto-sync for ${walletAddress} on ${network} (every ${intervalMs}ms)`);

    const syncInterval = setInterval(async () => {
      try {
        await this.fetchWalletData(walletAddress, network);
      } catch (error) {
        console.error('❌ Auto-sync error:', error);
      }
    }, intervalMs);

    return syncInterval;
  }
}

export default { BlockchainDataFetcher };
