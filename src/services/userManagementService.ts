/**
 * User Management Service
 * Handles user creation, authentication, profile management, and wallet linking
 */

import { getMongoDb } from '../db/mongodb';
import { getPiSDKClient } from './piSdkAdvanced';
import { AutoSyncService } from './autoSyncService';

export interface UserProfile {
  pioneerId: string;
  username: string;
  email: string;
  primaryWallet: string;
  secondaryWallets?: string[];
  totalPoints: number;
  reputationScore: number;
  mainnetScore: number;
  testnetScore: number;
  appPoints: number;
  level: string;
  isVip: boolean;
  isDemoMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserManagementService {
  private autoSyncService: AutoSyncService;

  constructor() {
    this.autoSyncService = new AutoSyncService();
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    await this.autoSyncService.initialize();
    console.log('✅ UserManagement Service initialized');
  }

  /**
   * Register new user from Pi authentication
   */
  async registerUser(piUser: any): Promise<UserProfile> {
    const db = getMongoDb();

    // Check if user already exists
    let user = await db.users.findOne({ pioneerId: piUser.uid });

    if (user) {
      console.log(`👤 User ${piUser.uid} already registered`);
      return this.getUserProfile(piUser.uid);
    }

    // Create new user
    const newUser = {
      pioneerId: piUser.uid,
      username: piUser.username || piUser.firstName || 'Pioneer',
      email: piUser.email || `${piUser.uid}@example.com`,
      primaryWallet: '', // Will be set when wallet is linked
      secondaryWallets: [],
      totalPoints: 0,
      reputationScore: 0,
      mainnetScore: 0,
      testnetScore: 0,
      appPoints: 0,
      level: 'Bronze',
      isVip: false,
      isDemoMode: false,
      lastSyncTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.users.insertOne(newUser as any);

    console.log(`✅ New user registered: ${piUser.username} (${piUser.uid})`);

    return newUser as unknown as UserProfile;
  }

  /**
   * Link wallet to user
   */
  async linkWallet(pioneerId: string, walletAddress: string, network: 'mainnet' | 'testnet'): Promise<void> {
    const db = getMongoDb();

    // Update user with primary wallet if not set
    const user = await db.users.findOne({ pioneerId });

    if (!user?.primaryWallet) {
      await db.users.updateOne(
        { pioneerId },
        { $set: { primaryWallet: walletAddress } }
      );
    } else if (user.primaryWallet !== walletAddress) {
      // Add to secondary wallets
      await db.users.updateOne(
        { pioneerId },
        { $addToSet: { secondaryWallets: walletAddress } }
      );
    }

    // Create wallet entry
    const walletEntry = {
      pioneerId,
      walletAddress,
      network,
      currentBalance: 0,
      tokenHoldings: [],
      stakeAmount: 0,
      walletAge: 0,
      walletCreationDate: new Date(),
      totalTransactions: 0,
      activity3Months: 0,
      offChainTransfers: 0,
      dexTradingVolume: 0,
      isActive: true,
      lastBlockchainSync: null,
      blockchainData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.wallets.updateOne(
      { pioneerId, network },
      { $set: walletEntry },
      { upsert: true }
    );

    // Start auto-sync
    await this.autoSyncService.startUserSync(pioneerId, 300000); // 5 minutes

    console.log(`✅ Wallet linked: ${pioneerId} -> ${walletAddress} (${network})`);
  }

  /**
   * Get user profile
   */
  async getUserProfile(pioneerId: string): Promise<UserProfile> {
    const db = getMongoDb();

    const user = await db.users.findOne({ pioneerId });

    if (!user) {
      throw new Error('User not found');
    }

    return user as unknown as UserProfile;
  }

  /**
   * Get user stats with detailed breakdown
   */
  async getUserStats(pioneerId: string): Promise<any> {
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

    // Get points log
    const recentPoints = await db.pointsLog
      .find({ pioneerId })
      .sort({ timestamp: -1 })
      .limit(20)
      .toArray();

    // Get referrals
    const referralsGiven = await db.referrals.countDocuments({
      referrerId: pioneerId,
      status: 'confirmed',
    });

    const referralsPending = await db.referrals.countDocuments({
      referrerId: pioneerId,
      status: 'pending',
    });

    // Get daily logins
    const totalDailyLogins = await db.dailyCheckin.countDocuments({ pioneerId });
    const currentStreak = await this.calculateStreak(pioneerId);

    return {
      user,
      mainnet: {
        balance: mainnetWallet?.currentBalance || 0,
        transactions: mainnetWallet?.totalTransactions || 0,
        walletAge: mainnetWallet?.walletAge || 0,
        stakeAmount: mainnetWallet?.stakeAmount || 0,
        tokenHoldings: mainnetWallet?.tokenHoldings || [],
        lastSync: mainnetWallet?.lastBlockchainSync,
      },
      testnet: {
        balance: testnetWallet?.currentBalance || 0,
        transactions: testnetWallet?.totalTransactions || 0,
        walletAge: testnetWallet?.walletAge || 0,
        stakeAmount: testnetWallet?.stakeAmount || 0,
        tokenHoldings: testnetWallet?.tokenHoldings || [],
        lastSync: testnetWallet?.lastBlockchainSync,
      },
      activity: {
        totalDailyLogins,
        currentStreak,
        referralsGiven,
        referralsPending,
        recentPointsLog: recentPoints,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(pioneerId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const db = getMongoDb();

    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    // Remove fields that shouldn't be updated directly
    delete (updateData as any).pioneerId;
    delete (updateData as any).createdAt;

    await db.users.updateOne(
      { pioneerId },
      { $set: updateData as any }
    );

    return this.getUserProfile(pioneerId);
  }

  /**
   * Daily login check-in
   */
  async dailyCheckIn(pioneerId: string, withAds: boolean = false): Promise<number> {
    const db = getMongoDb();

    // Check if user already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingCheckin = await db.dailyCheckin.findOne({
      pioneerId,
      date: { $gte: today },
    });

    if (existingCheckin) {
      console.log(`⚠️  User ${pioneerId} already checked in today`);
      return 0;
    }

    // Points: 3 base, 5 with ads
    const pointsEarned = withAds ? 5 : 3;

    // Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastCheckin = await db.dailyCheckin.findOne({
      pioneerId,
      date: { $gte: yesterday, $lt: today },
    });

    const streak = lastCheckin ? (lastCheckin.streak || 1) + 1 : 1;

    // Insert check-in record
    const checkinRecord = {
      pioneerId,
      date: today,
      pointsEarned,
      withAds,
      streak,
      isDemoMode: false,
      timestamp: new Date(),
      createdAt: new Date(),
    };

    await db.dailyCheckin.insertOne(checkinRecord as any);

    // Add points to user
    await db.users.updateOne(
      { pioneerId },
      {
        $inc: { appPoints: pointsEarned, totalPoints: pointsEarned },
        $set: { updatedAt: new Date() },
      }
    );

    // Log the action
    const user = await db.users.findOne({ pioneerId });
    await db.pointsLog.insertOne({
      pioneerId,
      action: withAds ? 'daily_login_with_ads' : 'daily_login',
      pointsChange: pointsEarned,
      previousTotal: (user?.totalPoints || 0) - pointsEarned,
      newTotal: user?.totalPoints || pointsEarned,
      metadata: { streak, withAds },
      isDemoMode: false,
      timestamp: new Date(),
      createdAt: new Date(),
    } as any);

    console.log(`✅ Daily check-in: ${pioneerId} earned ${pointsEarned} points (streak: ${streak})`);

    return pointsEarned;
  }

  /**
   * Add referral
   */
  async addReferral(
    referrerId: string,
    referredEmail: string,
    referredPioneerId?: string
  ): Promise<void> {
    const db = getMongoDb();

    const referral = {
      referrerId,
      referredPioneerId: referredPioneerId || referredEmail,
      referredEmail,
      status: 'pending', // pending -> confirmed when they register
      pointsAwarded: 0,
      isDemoMode: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.referrals.insertOne(referral as any);

    console.log(`📧 Referral added: ${referrerId} -> ${referredEmail}`);
  }

  /**
   * Confirm referral (when referred user registers)
   */
  async confirmReferral(referrerId: string, referredPioneerId: string): Promise<void> {
    const db = getMongoDb();

    const referral = await db.referrals.findOne({
      referrerId,
      referredPioneerId,
    });

    if (!referral) {
      console.warn(`⚠️  Referral not found: ${referrerId} -> ${referredPioneerId}`);
      return;
    }

    if (referral.status === 'confirmed') {
      console.warn(`⚠️  Referral already confirmed`);
      return;
    }

    const pointsAwarded = 10;

    // Update referral status
    await db.referrals.updateOne(
      { _id: referral._id },
      {
        $set: {
          status: 'confirmed',
          pointsAwarded,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Add points to referrer
    const referrerUser = await db.users.findOne({ pioneerId: referrerId });
    await db.users.updateOne(
      { pioneerId: referrerId },
      {
        $inc: { appPoints: pointsAwarded, totalPoints: pointsAwarded },
        $set: { updatedAt: new Date() },
      }
    );

    // Log the action
    await db.pointsLog.insertOne({
      pioneerId: referrerId,
      action: 'referral_confirmed',
      pointsChange: pointsAwarded,
      previousTotal: (referrerUser?.totalPoints || 0) - pointsAwarded,
      newTotal: (referrerUser?.totalPoints || 0),
      metadata: { referredPioneerId, referredEmail: referral.referredEmail },
      isDemoMode: false,
      timestamp: new Date(),
      createdAt: new Date(),
    } as any);

    console.log(`✅ Referral confirmed: ${referrerId} earned ${pointsAwarded} points`);
  }

  /**
   * Delete user (admin)
   */
  async deleteUser(pioneerId: string): Promise<void> {
    const db = getMongoDb();

    // Stop auto-sync
    this.autoSyncService.stopUserSync(pioneerId);

    // Delete all user data
    await Promise.all([
      db.users.deleteOne({ pioneerId }),
      db.wallets.deleteMany({ pioneerId }),
      db.pointsLog.deleteMany({ pioneerId }),
      db.dailyCheckin.deleteMany({ pioneerId }),
      db.referrals.deleteMany({ $or: [{ referrerId: pioneerId }, { referredPioneerId: pioneerId }] }),
      db.transactions.deleteMany({ pioneerId }),
      db.blockchainSync.deleteMany({ pioneerId }),
      db.demoMode.deleteOne({ pioneerId }),
    ]);

    console.log(`🗑️  User ${pioneerId} and all associated data deleted`);
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    const db = getMongoDb();

    return await db.users
      .find({})
      .sort({ reputationScore: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get user rank
   */
  async getUserRank(pioneerId: string): Promise<number> {
    const leaderboard = await this.getLeaderboard(10000);
    const rank = leaderboard.findIndex((u) => u.pioneerId === pioneerId) + 1;
    return rank || -1;
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Calculate daily login streak
   */
  private async calculateStreak(pioneerId: string): Promise<number> {
    const db = getMongoDb();

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const checkin = await db.dailyCheckin.findOne({
        pioneerId,
        date: {
          $gte: currentDate,
          $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      if (!checkin) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }
}

export default { UserManagementService };
