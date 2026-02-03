/**
 * Reputation Score & Points Calculation Engine
 * Calculates cumulative points based on blockchain activity and app interactions
 */

import { WalletBlockchainData, BlockchainTransaction, TokenHolding } from './blockchainDataFetcher';

export interface PointsBreakdown {
  mainnetScore: number; // 60% weight
  testnetScore: number; // 20% weight
  appPoints: number; // 20% weight (daily login, tasks, referrals)
  totalReputationScore: number; // Weighted total (0-100000)
  totalPoints: number; // Raw total for leaderboard
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  pointsDetails: {
    walletAgePoints: number;
    transactionQualityPoints: number;
    stakingPoints: number;
    tokenHoldingPoints: number;
    activityPoints: number;
    dexActivityPoints: number;
    offChainPenalty: number;
    totalBlockchainPoints: number;
    dailyLoginPoints: number;
    referralPoints: number;
    taskPoints: number;
    totalAppPoints: number;
  };
}

export interface UserPointsState {
  pioneerId: string;
  totalPoints: number;
  reputationScore: number;
  mainnetScore: number;
  testnetScore: number;
  appPoints: number;
  level: string;
  lastUpdated: Date;
  breakdown: PointsBreakdown;
}

export class ReputaPointsCalculator {
  // Scoring constants (0-100000 scale)
  private readonly BLOCKCHAIN_POINTS_MAX = 80000; // 60% of 100000 = 60000, adjusted to 80000 for blockchain
  private readonly APP_POINTS_MAX = 20000; // 20% of 100000
  private readonly MAX_REPUTATION_SCORE = 100000;

  // Blockchain scoring weights (total 80000)
  private readonly WALLET_AGE_MAX = 20000;
  private readonly TRANSACTION_MAX = 40000;
  private readonly STAKING_MAX = 30000;
  private readonly TOKEN_MAX = 10000;
  private readonly ACTIVITY_MAX = 10000;
  private readonly DEX_MAX = 10000;

  // Off-chain penalty
  private readonly OFF_CHAIN_PENALTY = 5000; // Points deducted per off-chain transfer

  // App points (total 20000)
  private readonly DAILY_LOGIN_BASE = 30;
  private readonly DAILY_LOGIN_WITH_ADS = 50;
  private readonly REFERRAL_POINTS = 100;
  private readonly TASK_POINTS = 50; // Per task (varies)

  /**
   * Calculate complete reputation score for a user
   */
  calculateUserReputation(
    mainnetData: WalletBlockchainData | null,
    testnetData: WalletBlockchainData | null,
    appActivityData: {
      totalDailyLogins: number;
      dailyLoginsWithAds: number;
      confirmedReferrals: number;
      completedTasks: number;
    }
  ): PointsBreakdown {
    // Calculate mainnet score (60% weight in final score)
    const mainnetScore = mainnetData
      ? this.calculateBlockchainScore(mainnetData)
      : 0;

    // Calculate testnet score (20% weight in final score)
    const testnetScore = testnetData
      ? this.calculateBlockchainScore(testnetData)
      : 0;

    // Calculate app points (20% weight in final score)
    const appPoints = this.calculateAppPoints(appActivityData);

    // Calculate detailed breakdown
    const pointsDetails = {
      walletAgePoints: mainnetData ? this.calculateWalletAgePoints(mainnetData) : 0,
      transactionQualityPoints: mainnetData
        ? this.calculateTransactionQualityPoints(mainnetData)
        : 0,
      stakingPoints: mainnetData ? this.calculateStakingPoints(mainnetData) : 0,
      tokenHoldingPoints: mainnetData ? this.calculateTokenHoldingPoints(mainnetData) : 0,
      activityPoints: mainnetData ? this.calculateActivityPoints(mainnetData) : 0,
      dexActivityPoints: mainnetData ? this.calculateDexActivityPoints(mainnetData) : 0,
      offChainPenalty: mainnetData ? this.calculateOffChainPenalty(mainnetData) : 0,
      totalBlockchainPoints: mainnetScore,
      dailyLoginPoints: appActivityData.totalDailyLogins * this.DAILY_LOGIN_BASE +
        appActivityData.dailyLoginsWithAds * (this.DAILY_LOGIN_WITH_ADS - this.DAILY_LOGIN_BASE),
      referralPoints: appActivityData.confirmedReferrals * this.REFERRAL_POINTS,
      taskPoints: appActivityData.completedTasks * this.TASK_POINTS,
      totalAppPoints: appPoints,
    };

    // Calculate weighted reputation score (out of 100000)
    // Mainnet: 60%, Testnet: 20%, App: 20%
    const totalReputationScore = Math.min(
      this.MAX_REPUTATION_SCORE,
      Math.round((mainnetScore * 0.6) + (testnetScore * 0.2) + (appPoints * 0.2))
    );

    // Calculate total points (raw, for leaderboard)
    const totalPoints = mainnetScore + testnetScore + appPoints;

    // Determine level based on reputation score
    const level = this.calculateLevel(totalReputationScore);

    return {
      mainnetScore,
      testnetScore,
      appPoints,
      totalReputationScore,
      totalPoints,
      level,
      pointsDetails,
    };
  }

  /**
   * Calculate blockchain reputation score (0-80000)
   */
  private calculateBlockchainScore(walletData: WalletBlockchainData): number {
    const walletAgePoints = this.calculateWalletAgePoints(walletData);
    const txQualityPoints = this.calculateTransactionQualityPoints(walletData);
    const stakingPoints = this.calculateStakingPoints(walletData);
    const tokenPoints = this.calculateTokenHoldingPoints(walletData);
    const activityPoints = this.calculateActivityPoints(walletData);
    const dexPoints = this.calculateDexActivityPoints(walletData);
    const offChainPenalty = this.calculateOffChainPenalty(walletData);

    const totalScore =
      walletAgePoints +
      txQualityPoints +
      stakingPoints +
      tokenPoints +
      activityPoints +
      dexPoints -
      offChainPenalty;

    return Math.max(0, Math.min(this.BLOCKCHAIN_POINTS_MAX, totalScore));
  }

  /**
   * Wallet Age Score (0-20000 points)
   * Older wallets = higher trust
   */
  private calculateWalletAgePoints(walletData: WalletBlockchainData): number {
    const days = walletData.walletAge;

    // Scoring: 50 points per day, max 20000 at 400+ days
    const points = Math.min(this.WALLET_AGE_MAX, Math.floor(days * 50));
    return points;
  }

  /**
   * Transaction Quality Score (0-40000 points)
   * Based on number, frequency, and type of transactions
   */
  private calculateTransactionQualityPoints(walletData: WalletBlockchainData): number {
    const txCount = walletData.totalTransactions;
    const hasBalance = walletData.currentBalance > 0;

    // Base score: 100 points per transaction, max 20000
    const txCountPoints = Math.min(20000, txCount * 100);

    // Balance score: 10000 points if has significant balance (>10 Pi)
    const balancePoints = hasBalance && walletData.currentBalance > 10 ? 10000 : 0;

    // Transaction variety score: bonus for different tx types
    const txTypes = new Set(walletData.allTransactions.map((tx) => tx.type));
    const varietyBonus = Math.min(10000, txTypes.size * 2500);

    return txCountPoints + balancePoints + varietyBonus;
  }

  /**
   * Staking Score (0-30000 points)
   * Rewards long-term commitment
   */
  private calculateStakingPoints(walletData: WalletBlockchainData): number {
    if (!walletData.stakeInfo || walletData.stakeInfo.amount === 0) {
      return 0;
    }

    const stake = walletData.stakeInfo;
    const stakingDays = Math.floor(
      (new Date().getTime() - stake.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Base: 100 points per 1 Pi staked, max 10000
    const amountPoints = Math.min(10000, stake.amount * 100);

    // Duration: 100 points per 5 days staked, max 10000
    const durationPoints = Math.min(10000, Math.floor(stakingDays / 5) * 100);

    // Active status bonus: 10000 points
    const statusBonus = stake.status === 'active' ? 10000 : 0;

    return amountPoints + durationPoints + statusBonus;
  }

  /**
   * Token Holding Score (0-10000 points)
   * Rewards diversified holdings
   */
  private calculateTokenHoldingPoints(walletData: WalletBlockchainData): number {
    const tokens = walletData.tokenHoldings;

    // 1000 points per token held, max 10000
    return Math.min(this.TOKEN_MAX, tokens.length * 1000);
  }

  /**
   * Activity Score (0-10000 points)
   * Based on recent activity in last 3 months
   */
  private calculateActivityPoints(walletData: WalletBlockchainData): number {
    const recentTxCount = walletData.activity3Months;

    // 100 points per transaction in last 3 months, max 10000
    return Math.min(this.ACTIVITY_MAX, recentTxCount * 100);
  }

  /**
   * DEX Activity Score (0-10000 points)
   * Rewards trading activity
   */
  private calculateDexActivityPoints(walletData: WalletBlockchainData): number {
    const volume = walletData.dexTradingVolume;

    // 1000 points per 10 Pi in trading volume, max 10000
    const points = Math.min(this.DEX_MAX, Math.floor(volume / 10) * 1000);
    return points;
  }

  /**
   * Off-Chain Transfer Penalty
   * Deducts points for transfers outside the network
   */
  private calculateOffChainPenalty(walletData: WalletBlockchainData): number {
    return walletData.offChainTransfers * this.OFF_CHAIN_PENALTY;
  }

  /**
   * Calculate app-specific points (0-20000)
   * From daily login, tasks, and referrals
   */
  private calculateAppPoints(appActivityData: {
    totalDailyLogins: number;
    dailyLoginsWithAds: number;
    confirmedReferrals: number;
    completedTasks: number;
  }): number {
    const dailyLoginPoints =
      (appActivityData.totalDailyLogins - appActivityData.dailyLoginsWithAds) *
      this.DAILY_LOGIN_BASE +
      appActivityData.dailyLoginsWithAds * this.DAILY_LOGIN_WITH_ADS;

    const referralPoints = appActivityData.confirmedReferrals * this.REFERRAL_POINTS;
    const taskPoints = appActivityData.completedTasks * this.TASK_POINTS;

    const totalAppPoints = dailyLoginPoints + referralPoints + taskPoints;

    return Math.max(0, Math.min(this.APP_POINTS_MAX, totalAppPoints));
  }

  /**
   * Determine user level based on reputation score
   */
  private calculateLevel(reputationScore: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' {
    if (reputationScore >= 90000) return 'Diamond';
    if (reputationScore >= 70000) return 'Platinum';
    if (reputationScore >= 50000) return 'Gold';
    if (reputationScore >= 30000) return 'Silver';
    return 'Bronze';
  }

  /**
   * Recalculate and update all user points (weekly task)
   */
  async updateAllUserPoints(
    getAllUsers: () => Promise<any[]>,
    getMainnetData: (pioneerId: string) => Promise<WalletBlockchainData | null>,
    getTestnetData: (pioneerId: string) => Promise<WalletBlockchainData | null>,
    getAppActivity: (pioneerId: string) => Promise<any>,
    saveUserPoints: (pioneerId: string, breakdown: PointsBreakdown) => Promise<void>
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    console.log('🔄 Starting weekly points update...');

    const users = await getAllUsers();
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of users) {
      try {
        const mainnetData = await getMainnetData(user.pioneerId);
        const testnetData = await getTestnetData(user.pioneerId);
        const appActivity = await getAppActivity(user.pioneerId);

        const breakdown = this.calculateUserReputation(mainnetData, testnetData, appActivity);
        await saveUserPoints(user.pioneerId, breakdown);

        updated++;
      } catch (error) {
        failed++;
        errors.push(`${user.pioneerId}: ${error}`);
      }
    }

    console.log(
      `✅ Points update complete. Updated: ${updated}, Failed: ${failed}`
    );

    return { updated, failed, errors };
  }

  /**
   * Get leaderboard with top users by points
   */
  getLeaderboard(
    users: UserPointsState[],
    limit: number = 100
  ): UserPointsState[] {
    return users
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  }

  /**
   * Get user rank
   */
  getUserRank(users: UserPointsState[], pioneerId: string): number {
    const leaderboard = this.getLeaderboard(users, users.length);
    const rank = leaderboard.findIndex((u) => u.pioneerId === pioneerId) + 1;
    return rank || -1; // -1 if not found
  }

  /**
   * Calculate points until next level
   */
  calculatePointsToNextLevel(currentScore: number): number {
    const nextLevelThreshold = this.getNextLevelThreshold(currentScore);
    return Math.max(0, nextLevelThreshold - currentScore);
  }

  private getNextLevelThreshold(currentScore: number): number {
    if (currentScore < 30000) return 30000; // Bronze -> Silver
    if (currentScore < 50000) return 50000; // Silver -> Gold
    if (currentScore < 70000) return 70000; // Gold -> Platinum
    if (currentScore < 90000) return 90000; // Platinum -> Diamond
    return 100000; // Already Diamond
  }
}

export default { ReputaPointsCalculator };
