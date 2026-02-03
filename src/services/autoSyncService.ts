/**
 * Automatic Sync & Monitoring Service
 * Keeps blockchain data and reputation scores in sync
 */

import { initializeMongoDb, getMongoDb } from '../db/mongodb';
import { BlockchainDataFetcher, WalletBlockchainData } from './blockchainDataFetcher';
import { ReputaPointsCalculator, PointsBreakdown } from './reputaPointsCalculator';
import { getPiSDKClient } from './piSdkAdvanced';

export interface SyncStatusUpdate {
  pioneerId: string;
  status: 'syncing' | 'synced' | 'error';
  lastSync: Date;
  nextSync: Date;
  message: string;
}

export class AutoSyncService {
  private blockchainFetcher: BlockchainDataFetcher;
  private pointsCalculator: ReputaPointsCalculator;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(isDemoMode: boolean = false) {
    this.blockchainFetcher = new BlockchainDataFetcher(isDemoMode);
    this.pointsCalculator = new ReputaPointsCalculator();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    await initializeMongoDb();
    console.log('✅ AutoSync Service initialized');
  }

  /**
   * Start automatic syncing for a user
   */
  async startUserSync(
    pioneerId: string,
    syncIntervalMs: number = 300000 // 5 minutes default
  ): Promise<void> {
    if (this.syncIntervals.has(pioneerId)) {
      console.warn(`⚠️  Sync already running for ${pioneerId}`);
      return;
    }

    console.log(
      `🔄 Starting auto-sync for ${pioneerId} (interval: ${syncIntervalMs}ms)`
    );

    // Initial sync
    await this.syncUserData(pioneerId);

    // Setup interval
    const interval = setInterval(async () => {
      try {
        await this.syncUserData(pioneerId);
      } catch (error) {
        console.error(`❌ Sync error for ${pioneerId}:`, error);
      }
    }, syncIntervalMs);

    this.syncIntervals.set(pioneerId, interval);
  }

  /**
   * Sync a single user's data
   */
  async syncUserData(pioneerId: string): Promise<SyncStatusUpdate> {
    const db = getMongoDb();
    const startTime = new Date();

    try {
      // Get user data
      const user = await db.users.findOne({ pioneerId });
      if (!user) {
        throw new Error('User not found');
      }

      // Fetch mainnet and testnet data in parallel
      const [mainnetData, testnetData] = await Promise.all([
        this.blockchainFetcher.fetchWalletData(user.primaryWallet, 'mainnet'),
        this.blockchainFetcher.fetchWalletData(user.primaryWallet, 'testnet'),
      ]);

      // Get app activity
      const appActivity = await this.getAppActivity(pioneerId);

      // Calculate new points
      const pointsBreakdown = this.pointsCalculator.calculateUserReputation(
        mainnetData,
        testnetData,
        appActivity
      );

      // Save wallet data
      await Promise.all([
        this.saveWalletData(pioneerId, mainnetData),
        this.saveWalletData(pioneerId, testnetData),
      ]);

      // Save points and reputation
      await this.savePointsAndReputation(pioneerId, pointsBreakdown, mainnetData, testnetData);

      // Save blockchain transactions
      if (mainnetData.status === 'synced') {
        await this.saveBlockchainTransactions(pioneerId, mainnetData);
      }
      if (testnetData.status === 'synced') {
        await this.saveBlockchainTransactions(pioneerId, testnetData);
      }

      const nextSync = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes

      console.log(`✅ Sync complete for ${pioneerId}`);

      return {
        pioneerId,
        status: 'synced',
        lastSync: startTime,
        nextSync,
        message: `Synced mainnet (${mainnetData.totalTransactions} tx) and testnet (${testnetData.totalTransactions} tx)`,
      };
    } catch (error) {
      console.error(`❌ Sync failed for ${pioneerId}:`, error);

      const nextSync = new Date(startTime.getTime() + 5 * 60 * 1000); // Retry in 5 minutes

      return {
        pioneerId,
        status: 'error',
        lastSync: startTime,
        nextSync,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Weekly reputation update (recalculate all users)
   */
  async runWeeklyUpdate(): Promise<{ updated: number; failed: number }> {
    const db = getMongoDb();

    console.log('📊 Starting weekly reputation update...');

    const users = await db.users.find({}).toArray();
    let updated = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await this.syncUserData(user.pioneerId);
        updated++;
      } catch (error) {
        failed++;
        console.error(`Failed to update ${user.pioneerId}:`, error);
      }
    }

    console.log(
      `📊 Weekly update complete: ${updated} updated, ${failed} failed`
    );

    return { updated, failed };
  }

  /**
   * Stop syncing for a user
   */
  stopUserSync(pioneerId: string): void {
    const interval = this.syncIntervals.get(pioneerId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(pioneerId);
      console.log(`⏹️  Sync stopped for ${pioneerId}`);
    }
  }

  /**
   * Stop all syncs
   */
  stopAllSync(): void {
    this.syncIntervals.forEach((interval) => clearInterval(interval));
    this.syncIntervals.clear();
    console.log('⏹️  All syncs stopped');
  }

  /**
   * Get sync status for user
   */
  async getSyncStatus(pioneerId: string): Promise<any> {
    const db = getMongoDb();

    const user = await db.users.findOne({ pioneerId });
    const mainnetWallet = await db.wallets.findOne({
      pioneerId,
      network: 'mainnet',
    });
    const testnetWallet = await db.wallets.findOne({
      pioneerId,
      network: 'testnet',
    });

    return {
      pioneerId,
      lastSyncTime: user?.lastSyncTime,
      mainnetLastSync: mainnetWallet?.lastBlockchainSync,
      mainnetBalance: mainnetWallet?.currentBalance,
      mainnetTransactions: mainnetWallet?.totalTransactions,
      testnetLastSync: testnetWallet?.lastBlockchainSync,
      testnetBalance: testnetWallet?.currentBalance,
      testnetTransactions: testnetWallet?.totalTransactions,
      reputationScore: user?.reputationScore,
      totalPoints: user?.totalPoints,
      level: user?.level,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Get user's app activity (daily logins, referrals, tasks)
   */
  private async getAppActivity(
    pioneerId: string
  ): Promise<{
    totalDailyLogins: number;
    dailyLoginsWithAds: number;
    confirmedReferrals: number;
    completedTasks: number;
  }> {
    const db = getMongoDb();

    // Count daily logins
    const dailyLogins = await db.dailyCheckin.countDocuments({ pioneerId });
    const loginsWithAds = await db.dailyCheckin.countDocuments({
      pioneerId,
      withAds: true,
    });

    // Count confirmed referrals
    const confirmedReferrals = await db.referrals.countDocuments({
      referrerId: pioneerId,
      status: 'confirmed',
    });

    // Count completed tasks (stored in points log as task_completed actions)
    const completedTasks = await db.pointsLog.countDocuments({
      pioneerId,
      action: 'task_completed',
    });

    return {
      totalDailyLogins: dailyLogins,
      dailyLoginsWithAds: loginsWithAds,
      confirmedReferrals,
      completedTasks,
    };
  }

  /**
   * Save wallet data to MongoDB
   */
  private async saveWalletData(
    pioneerId: string,
    walletData: WalletBlockchainData
  ): Promise<void> {
    const db = getMongoDb();

    await db.wallets.updateOne(
      {
        pioneerId,
        network: walletData.network,
      },
      {
        $set: {
          pioneerId,
          network: walletData.network,
          walletAddress: walletData.address,
          currentBalance: walletData.currentBalance,
          tokenHoldings: walletData.tokenHoldings,
          stakeAmount: walletData.stakeInfo?.amount || 0,
          stakeDate: walletData.stakeInfo?.startDate,
          walletAge: walletData.walletAge,
          walletCreationDate: walletData.walletCreationDate,
          totalTransactions: walletData.totalTransactions,
          activity3Months: walletData.activity3Months,
          lastTransactionDate: walletData.lastActivityDate,
          offChainTransfers: walletData.offChainTransfers,
          dexTradingVolume: walletData.dexTradingVolume,
          isActive: walletData.status === 'synced',
          lastBlockchainSync: walletData.lastSyncTime,
          blockchainData: walletData,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  /**
   * Save points and reputation scores
   */
  private async savePointsAndReputation(
    pioneerId: string,
    breakdown: PointsBreakdown,
    mainnetData: WalletBlockchainData,
    testnetData: WalletBlockchainData
  ): Promise<void> {
    const db = getMongoDb();

    await db.users.updateOne(
      { pioneerId },
      {
        $set: {
          totalPoints: breakdown.totalPoints,
          reputationScore: breakdown.totalReputationScore,
          mainnetScore: breakdown.mainnetScore,
          testnetScore: breakdown.testnetScore,
          appPoints: breakdown.appPoints,
          level: breakdown.level,
          lastSyncTime: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Also log this in points_log for audit trail
    const logEntry = {
      pioneerId,
      action: 'auto_sync_update',
      pointsChange: 0,
      previousTotal: 0,
      newTotal: breakdown.totalPoints,
      metadata: {
        mainnetScore: breakdown.mainnetScore,
        testnetScore: breakdown.testnetScore,
        appPoints: breakdown.appPoints,
        mainnetTx: mainnetData.totalTransactions,
        testnetTx: testnetData.totalTransactions,
      },
      isDemoMode: false,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    await db.pointsLog.insertOne(logEntry as any);
  }

  /**
   * Save blockchain transactions
   */
  private async saveBlockchainTransactions(
    pioneerId: string,
    walletData: WalletBlockchainData
  ): Promise<void> {
    const db = getMongoDb();

    for (const tx of walletData.allTransactions) {
      const existingTx = await db.transactions.findOne({ txHash: tx.hash });

      if (!existingTx) {
        await db.transactions.insertOne({
          pioneerId,
          txHash: tx.hash,
          walletAddress: walletData.address,
          network: walletData.network,
          type: tx.type,
          amount: tx.amount,
          from: tx.from,
          to: tx.to,
          timestamp: new Date(tx.timestamp * 1000),
          gasUsed: tx.gasUsed,
          status: tx.status,
          blockNumber: tx.blockNumber,
          details: tx.details,
          isOffChain: tx.isOffChain,
          pointsImpact: 0, // Calculated by points calculator
          syncedAt: new Date(),
          createdAt: new Date(),
        } as any);
      }
    }
  }

  /**
   * Start monitoring (runs background tasks)
   */
  async startMonitoring(weeklyUpdateTime: string = '00:00'): Promise<void> {
    if (this.isRunning) {
      console.warn('Monitor already running');
      return;
    }

    this.isRunning = true;
    console.log(`📊 AutoSync Monitoring started`);

    // Schedule weekly update
    this.scheduleWeeklyUpdate(weeklyUpdateTime);

    // Cleanup old demo sessions daily
    this.scheduleCleanup();
  }

  /**
   * Schedule weekly update
   */
  private scheduleWeeklyUpdate(updateTime: string): void {
    const [hours, minutes] = updateTime.split(':').map(Number);

    const runUpdate = async () => {
      const now = new Date();
      if (now.getHours() === hours && now.getMinutes() === minutes) {
        await this.runWeeklyUpdate();
      }

      // Schedule next check
      setTimeout(runUpdate, 60000); // Check every minute
    };

    runUpdate();
  }

  /**
   * Schedule daily cleanup
   */
  private scheduleCleanup(): void {
    const cleanup = async () => {
      // Cleanup old demo sessions
      console.log('🧹 Running daily cleanup...');
      // Could add more cleanup tasks here

      // Schedule next cleanup (daily)
      setTimeout(cleanup, 24 * 60 * 60 * 1000);
    };

    cleanup();
  }
}

export default { AutoSyncService };
